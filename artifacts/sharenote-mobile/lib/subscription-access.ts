export const TRIAL_DURATION_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

// Only SDK identity mutations belong in this queue, never network/product loads.
export function createIdentityQueue() {
  let pending = Promise.resolve();
  return {
    run(changeIdentity: () => Promise<void>, onReady: () => void) {
      const mutation = pending.catch(() => {}).then(changeIdentity);
      pending = mutation;
      return mutation.then(() => { onReady(); });
    },
  };
}

export function getSubscriptionGate(
  authenticated: boolean,
  hasFamily: boolean,
  hasAccess: boolean,
  accessLoading: boolean,
  pathname: string,
): 'allow' | 'checking' | 'subscription' {
  const exempt = ['/subscription', '/reset-password', '/family/settings', '/profile-select'];
  if (!authenticated || !hasFamily || hasAccess || exempt.includes(pathname)) return 'allow';
  return accessLoading ? 'checking' : 'subscription';
}

// StoreKit product availability must not discard a successful access check.
export async function loadSubscriptionData<Info, Offerings>(
  loadCustomerInfo: () => Promise<Info>,
  loadOfferings: () => Promise<Offerings>,
  onCustomerInfo?: (result: PromiseSettledResult<Info>) => void,
) {
  const info = Promise.resolve().then(loadCustomerInfo).then(
    value => ({ status: 'fulfilled' as const, value }),
    reason => ({ status: 'rejected' as const, reason }),
  ).then(result => {
    // Publish access without waiting for a slow or hung StoreKit product request.
    onCustomerInfo?.(result);
    return result;
  });
  const [customerInfo, [offerings]] = await Promise.all([
    info,
    Promise.allSettled([Promise.resolve().then(loadOfferings)]),
  ]);
  return { customerInfo, offerings };
}

// The caller supplies a verified server clock, never the device wall clock.
export function getAccountTrial(createdAt: string | undefined, trustedTime: number | null) {
  const start = createdAt ? new Date(createdAt).getTime() : NaN;
  const endsAt = Number.isFinite(start) ? new Date(start + TRIAL_DURATION_DAYS * DAY_MS) : null;
  const verified = Boolean(endsAt && trustedTime !== null && Number.isFinite(trustedTime));
  const remaining = verified ? endsAt!.getTime() - trustedTime! : 0;
  const active = verified && remaining > 0;
  return {
    endsAt,
    active,
    expired: verified && remaining <= 0,
    daysRemaining: active ? Math.max(1, Math.ceil(remaining / DAY_MS)) : 0,
  };
}