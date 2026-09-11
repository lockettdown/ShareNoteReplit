import Constants from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { useAppState } from '@/context/AppState';

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = 'premium';
export const TRIAL_DURATION_DAYS = 10;
export const PREMIUM_BENEFITS = [
  {
    icon: 'users',
    title: 'Your complete family hub',
    description: 'Keep schedules, tasks, and groceries coordinated in one shared place.',
  },
  {
    icon: 'refresh-cw',
    title: 'Everything stays in sync',
    description: 'Family updates remain available across devices and sessions.',
  },
  {
    icon: 'heart',
    title: 'One plan for the family',
    description: 'A single subscription keeps Home Loopnest available for your household.',
  },
] as const;

type SubscriptionContextValue = {
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
  isSubscribed: boolean;
  hasAccess: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  trialEndsAt: Date | null;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
  isTestMode: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);
let configured = false;

type TrustedClockAnchor = {
  serverTime: number;
  monotonicTime: number;
};

function getMonotonicTime() {
  const monotonicTime = globalThis.performance?.now?.();
  return typeof monotonicTime === 'number' && Number.isFinite(monotonicTime) ? monotonicTime : null;
}

function getCustomerInfoRequestTime(customerInfo: CustomerInfo) {
  const requestTime = new Date(customerInfo.requestDate).getTime();
  return Number.isFinite(requestTime) ? requestTime : null;
}

function getApiKey() {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  const isTestMode = __DEV__ || Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient';

  if (isTestMode) return { apiKey: testKey, isTestMode };
  if (Platform.OS === 'ios') return { apiKey: iosKey, isTestMode };
  if (Platform.OS === 'android') return { apiKey: androidKey, isTestMode };
  return { apiKey: testKey, isTestMode: true };
}

function messageFromError(error: unknown) {
  if (error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled) {
    return 'Purchase cancelled.';
  }
  if (error instanceof Error) return error.message;
  return 'RevenueCat is temporarily unavailable.';
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { authUser, isAuthLoading } = useAppState();
  const [{ isTestMode }] = useState(getApiKey);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustedTime, setTrustedTime] = useState<number | null>(null);
  const trustedClockAnchorRef = useRef<TrustedClockAnchor | null>(null);
  const identifiedUserRef = useRef<string | null>(null);

  const applyCustomerInfo = useCallback((info: CustomerInfo, trustRequestTime = false) => {
    setCustomerInfo(info);
    if (!trustRequestTime) return;

    const requestTime = getCustomerInfoRequestTime(info);
    const monotonicTime = getMonotonicTime();
    if (requestTime === null || monotonicTime === null) {
      trustedClockAnchorRef.current = null;
      setTrustedTime(null);
      return;
    }

    const previousAnchor = trustedClockAnchorRef.current;
    const previousTrustedTime = previousAnchor
      ? previousAnchor.serverTime + Math.max(0, monotonicTime - previousAnchor.monotonicTime)
      : requestTime;
    const serverTime = Math.max(requestTime, previousTrustedTime);

    trustedClockAnchorRef.current = { serverTime, monotonicTime };
    setTrustedTime(serverTime);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const anchor = trustedClockAnchorRef.current;
      const monotonicTime = getMonotonicTime();
      if (!anchor || monotonicTime === null) {
        setTrustedTime(null);
        return;
      }
      setTrustedTime(anchor.serverTime + Math.max(0, monotonicTime - anchor.monotonicTime));
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      if (Platform.OS !== 'web') {
        await Purchases.invalidateCustomerInfoCache();
      }
      const [nextOfferings, nextCustomerInfo] = await Promise.all([
        Purchases.getOfferings(),
        Purchases.getCustomerInfo(),
      ]);
      setOfferings(nextOfferings);
      applyCustomerInfo(nextCustomerInfo, true);
    } catch (nextError) {
      setError(messageFromError(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo]);

  useEffect(() => {
    const { apiKey } = getApiKey();
    if (!apiKey) {
      setError('Subscription configuration is unavailable.');
      setIsLoading(false);
      return;
    }

    const initialize = async () => {
      try {
        if (!configured && !(await Purchases.isConfigured())) {
          Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
          Purchases.configure({ apiKey });
        }
        configured = true;
        await refresh();
      } catch (nextError) {
        setError(messageFromError(nextError));
        setIsLoading(false);
      }
    };

    void initialize();
  }, [refresh]);

  useEffect(() => {
    if (!configured) return;
    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [applyCustomerInfo]);

  useEffect(() => {
    if (!configured || isAuthLoading) return;
    const nextUserId = authUser?.id ?? null;
    if (nextUserId === identifiedUserRef.current) return;

    const syncIdentity = async () => {
      try {
        setError(null);
        const info = nextUserId
          ? (await Purchases.logIn(nextUserId)).customerInfo
          : identifiedUserRef.current
            ? await Purchases.logOut()
            : await Purchases.getCustomerInfo();
        identifiedUserRef.current = nextUserId;
        applyCustomerInfo(info);
      } catch (nextError) {
        setError(messageFromError(nextError));
      }
    };

    void syncIdentity();
  }, [applyCustomerInfo, authUser?.id, isAuthLoading]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    setError(null);
    try {
      const result = await Purchases.purchasePackage(pkg);
      applyCustomerInfo(result.customerInfo, true);
      return result.customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
    } catch (nextError) {
      setError(messageFromError(nextError));
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [applyCustomerInfo]);

  const restore = useCallback(async () => {
    setIsRestoring(true);
    setError(null);
    try {
      const info = await Purchases.restorePurchases();
      applyCustomerInfo(info, true);
      return info.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
    } catch (nextError) {
      setError(messageFromError(nextError));
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [applyCustomerInfo]);

  const packages = useMemo(() => {
    const available = offerings?.current?.availablePackages ?? [];
    const rank = (pkg: PurchasesPackage) => pkg.identifier === '$rc_monthly' ? 0 : pkg.identifier === '$rc_annual' ? 1 : 2;
    return [...available].sort((a, b) => rank(a) - rank(b));
  }, [offerings]);

  const trialEndsAt = useMemo(() => {
    if (!authUser?.created_at) return null;
    const createdAt = new Date(authUser.created_at);
    if (Number.isNaN(createdAt.getTime())) return null;
    return new Date(createdAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  }, [authUser?.created_at]);
  const isSubscribed = customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
  const trialMillisecondsRemaining = trialEndsAt && trustedTime !== null ? trialEndsAt.getTime() - trustedTime : 0;
  const isTrialActive = Boolean(authUser && trialEndsAt && trustedTime !== null && trialMillisecondsRemaining > 0);
  const trialDaysRemaining = isTrialActive
    ? Math.max(1, Math.ceil(trialMillisecondsRemaining / (24 * 60 * 60 * 1000)))
    : 0;

  const value = useMemo<SubscriptionContextValue>(() => ({
    packages,
    customerInfo,
    isSubscribed,
    hasAccess: isSubscribed || isTrialActive,
    isTrialActive,
    isTrialExpired: Boolean(authUser) && !isSubscribed && !isTrialActive,
    trialDaysRemaining,
    trialEndsAt,
    isLoading,
    isPurchasing,
    isRestoring,
    error,
    isTestMode,
    purchase,
    restore,
    refresh,
  }), [authUser, customerInfo, error, isLoading, isPurchasing, isRestoring, isSubscribed, isTestMode, isTrialActive, packages, purchase, refresh, restore, trialDaysRemaining, trialEndsAt]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const value = useContext(SubscriptionContext);
  if (!value) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return value;
}