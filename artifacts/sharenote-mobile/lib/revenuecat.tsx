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
import { isRevenueCatBypassEnabled } from '@/lib/revenuecat-mode';
import { createIdentityQueue, getAccountTrial, loadSubscriptionData } from '@/lib/subscription-access';

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = 'premium';
export { TRIAL_DURATION_DAYS } from '@/lib/subscription-access';
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
    description: 'A single subscription keeps Loopnest available for your household.',
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
  isAccessLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
  isTestMode: boolean;
  isBypassMode: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);
let configured = false;
const usesRevenueCatBrowserMode =
  Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient';

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

function getRevenueCatConfiguration() {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  const isTestMode = __DEV__ || Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient';
  const isBypassMode = isRevenueCatBypassEnabled({
    isDevelopment: __DEV__,
    flag: process.env.EXPO_PUBLIC_REVENUECAT_BYPASS,
    platform: Platform.OS,
    executionEnvironment: Constants.executionEnvironment,
  });

  if (isTestMode) return { apiKey: testKey, isTestMode, isBypassMode };
  if (Platform.OS === 'ios') return { apiKey: iosKey, isTestMode, isBypassMode };
  if (Platform.OS === 'android') return { apiKey: androidKey, isTestMode, isBypassMode };
  return { apiKey: testKey, isTestMode: true, isBypassMode };
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
  const [{ isTestMode, isBypassMode }] = useState(getRevenueCatConfiguration);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [identityAttempt, setIdentityAttempt] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustedTime, setTrustedTime] = useState<number | null>(null);
  const trustedClockAnchorRef = useRef<TrustedClockAnchor | null>(null);
  const identifiedUserRef = useRef<string | null | undefined>(undefined);
  const identityEpochRef = useRef(0);
  const refreshSequenceRef = useRef(0);
  const identityQueueRef = useRef(createIdentityQueue());
  const identityReadyRef = useRef(false);

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
    if (isBypassMode) {
      setError(null);
      setIsLoading(false);
      setIsVerifyingAccess(false);
      return;
    }
    const expectedUser = authUser?.id ?? null;
    if (!sdkReady || isAuthLoading) return;
    if (!identityReadyRef.current || identifiedUserRef.current !== expectedUser) {
      setIdentityAttempt(attempt => attempt + 1);
      return;
    }
    const epoch = identityEpochRef.current;
    const sequence = ++refreshSequenceRef.current;
    setIsLoading(true);
    setIsVerifyingAccess(true);
    setError(null);
    const result = await loadSubscriptionData(
      async () => {
        if (!usesRevenueCatBrowserMode) await Purchases.invalidateCustomerInfoCache();
        return Purchases.getCustomerInfo();
      },
      () => Purchases.getOfferings(),
      info => {
        if (epoch !== identityEpochRef.current || sequence !== refreshSequenceRef.current ||
            identifiedUserRef.current !== expectedUser) return;
        setIsVerifyingAccess(false);
        if (info.status === 'fulfilled') {
          applyCustomerInfo(info.value, true);
        } else {
          trustedClockAnchorRef.current = null;
          setTrustedTime(null);
          setError(`Unable to verify account access. ${messageFromError(info.reason)}`);
        }
      },
    );
    if (epoch !== identityEpochRef.current || sequence !== refreshSequenceRef.current ||
        identifiedUserRef.current !== expectedUser) return;
    const messages: string[] = [];
    if (result.customerInfo.status === 'rejected') {
      // An unverified trial is not an expired trial, and must not grant access.
      trustedClockAnchorRef.current = null;
      setTrustedTime(null);
      messages.push(`Unable to verify account access. ${messageFromError(result.customerInfo.reason)}`);
    }
    if (result.offerings.status === 'fulfilled') {
      setOfferings(result.offerings.value);
    } else {
      setOfferings(null);
      messages.push(`Subscription plans could not be loaded. ${messageFromError(result.offerings.reason)}`);
    }
    setError(messages.length ? messages.join('\n') : null);
    setIsLoading(false);
  }, [applyCustomerInfo, authUser?.id, isAuthLoading, isBypassMode, sdkReady]);

  useEffect(() => {
    if (isBypassMode) {
      setIsLoading(false);
      setIsVerifyingAccess(false);
      return;
    }

    const { apiKey } = getRevenueCatConfiguration();
    if (!apiKey) {
      setError('Subscription configuration is unavailable.');
      setIsLoading(false);
      setIsVerifyingAccess(false);
      return;
    }

    let mounted = true;
    const initialize = async () => {
      try {
        if (!configured && !(await Purchases.isConfigured())) {
          Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
          Purchases.configure({ apiKey });
        }
        configured = true;
        if (mounted) setSdkReady(true);
      } catch (nextError) {
        if (!mounted) return;
        setError(messageFromError(nextError));
        setIsLoading(false);
        setIsVerifyingAccess(false);
      }
    };

    void initialize();
    return () => { mounted = false; };
  }, [isBypassMode]);

  useEffect(() => {
    if (isBypassMode || !sdkReady) return;
    let mounted = true;
    const expectedUser = authUser?.id ?? null;
    const listener = (info: CustomerInfo) => {
      const epoch = identityEpochRef.current;
      if (!identityReadyRef.current || identifiedUserRef.current !== expectedUser) return;
      void Purchases.getAppUserID().then(currentUser => {
        if (mounted && epoch === identityEpochRef.current &&
            identifiedUserRef.current === expectedUser &&
            (!expectedUser || currentUser === expectedUser)) {
          applyCustomerInfo(info);
        }
      }).catch(() => { /* A passive update cannot establish account access. */ });
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [applyCustomerInfo, authUser?.id, isBypassMode, sdkReady]);

  useEffect(() => {
    if (isBypassMode || !sdkReady || isAuthLoading) return;
    const nextUserId = authUser?.id ?? null;
    if (nextUserId === identifiedUserRef.current && identityReadyRef.current) return;

    const epoch = ++identityEpochRef.current;
    identityReadyRef.current = false;
    setIsLoading(true);
    setIsVerifyingAccess(true);
    setError(null);
    setCustomerInfo(null);
    setOfferings(null);
    trustedClockAnchorRef.current = null;
    setTrustedTime(null);
    // Serialize account changes so an earlier logIn cannot finish after a later one.
    const syncIdentity = async () => {
      if (epoch !== identityEpochRef.current) return;
      if (nextUserId) await Purchases.logIn(nextUserId);
      else if (identifiedUserRef.current) await Purchases.logOut();
      identifiedUserRef.current = nextUserId;
      if (epoch !== identityEpochRef.current) return;
      identityReadyRef.current = true;
    };

    void identityQueueRef.current.run(syncIdentity, () => {
      if (epoch !== identityEpochRef.current || !identityReadyRef.current) return;
      // logIn may return cached info; only a forced refresh sets the trial clock.
      // Do not hold the identity queue while loading access data or StoreKit products.
      void refresh();
    }).catch(nextError => {
      if (epoch !== identityEpochRef.current) return;
      setError(messageFromError(nextError));
      setIsLoading(false);
      setIsVerifyingAccess(false);
    });
    return () => {
      if (identityEpochRef.current === epoch) {
        identityEpochRef.current += 1;
        identityReadyRef.current = false;
      }
    };
  }, [authUser?.id, identityAttempt, isAuthLoading, isBypassMode, refresh, sdkReady]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    if (isBypassMode) return true;
    const epoch = identityEpochRef.current;
    if (!sdkReady || !identityReadyRef.current || identifiedUserRef.current !== (authUser?.id ?? null)) return false;
    setIsPurchasing(true);
    setError(null);
    try {
      const result = await Purchases.purchasePackage(pkg);
      if (epoch !== identityEpochRef.current) return false;
      applyCustomerInfo(result.customerInfo, true);
      return result.customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
    } catch (nextError) {
      setError(messageFromError(nextError));
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [applyCustomerInfo, authUser?.id, isBypassMode, sdkReady]);

  const restore = useCallback(async () => {
    if (isBypassMode) return true;
    const epoch = identityEpochRef.current;
    if (!sdkReady || !identityReadyRef.current || identifiedUserRef.current !== (authUser?.id ?? null)) return false;
    setIsRestoring(true);
    setError(null);
    try {
      const info = await Purchases.restorePurchases();
      if (epoch !== identityEpochRef.current) return false;
      applyCustomerInfo(info, true);
      return info.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
    } catch (nextError) {
      setError(messageFromError(nextError));
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [applyCustomerInfo, authUser?.id, isBypassMode, sdkReady]);

  const packages = useMemo(() => {
    const available = offerings?.current?.availablePackages ?? [];
    const rank = (pkg: PurchasesPackage) => pkg.identifier === '$rc_monthly' ? 0 : pkg.identifier === '$rc_annual' ? 1 : 2;
    return [...available].sort((a, b) => rank(a) - rank(b));
  }, [offerings]);

  const identityMatches = identityReadyRef.current && identifiedUserRef.current === (authUser?.id ?? null);
  const trial = getAccountTrial(authUser?.created_at, identityMatches ? trustedTime : null);
  const isSubscribed = identityMatches && customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
  const isTrialActive = !isBypassMode && Boolean(authUser && trial.active);
  const isTrialExpired = !isBypassMode && Boolean(authUser) && !isSubscribed && trial.expired;
  const trialDaysRemaining = isTrialActive ? trial.daysRemaining : 0;
  const trialEndsAt = trial.endsAt;
  const accessLoading = isVerifyingAccess || isAuthLoading || (sdkReady && !identityMatches && !error);

  const value = useMemo<SubscriptionContextValue>(() => ({
    packages,
    customerInfo,
    isSubscribed,
    hasAccess: isBypassMode || isSubscribed || isTrialActive,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    trialEndsAt,
    isLoading,
    isAccessLoading: accessLoading,
    isPurchasing,
    isRestoring,
    error,
    isTestMode,
    isBypassMode,
    purchase,
    restore,
    refresh,
  }), [accessLoading, customerInfo, error, isBypassMode, isLoading, isPurchasing, isRestoring, isSubscribed, isTestMode, isTrialActive, isTrialExpired, packages, purchase, refresh, restore, trialDaysRemaining, trialEndsAt]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const value = useContext(SubscriptionContext);
  if (!value) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return value;
}
