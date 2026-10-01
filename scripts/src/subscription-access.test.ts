import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createIdentityQueue, getAccountTrial, getSubscriptionGate, loadSubscriptionData } from '../../artifacts/sharenote-mobile/lib/subscription-access';

const created = '2026-10-01T12:00:00.000Z';
const start = Date.parse(created);
const day = 24 * 60 * 60 * 1000;

test('a plan-loading error does not discard a verified new-account trial', async () => {
  const result = await loadSubscriptionData(
    async () => ({ requestDate: created }),
    async () => { throw new Error('StoreKit products unavailable'); },
  );
  assert.equal(result.offerings.status, 'rejected');
  assert.equal(result.customerInfo.status, 'fulfilled');
  if (result.customerInfo.status !== 'fulfilled') throw new Error('Expected customer info.');
  const trial = getAccountTrial(created, Date.parse(result.customerInfo.value.requestDate));
  assert.equal(trial.active, true);
  assert.equal(trial.daysRemaining, 10);
});

test('a failed access check cannot grant a trial even if plans load', async () => {
  const result = await loadSubscriptionData(
    async () => { throw new Error('Customer access check failed'); },
    async () => ({ packages: ['monthly', 'annual'] }),
  );
  assert.equal(result.customerInfo.status, 'rejected');
  assert.equal(result.offerings.status, 'fulfilled');
  const trial = getAccountTrial(created, null);
  assert.equal(trial.active, false);
  assert.equal(trial.expired, false);
});

test('both failed requests produce independent errors', async () => {
  const result = await loadSubscriptionData(
    async () => { throw new Error('access'); },
    async () => { throw new Error('offerings'); },
  );
  assert.equal(result.customerInfo.status, 'rejected');
  assert.equal(result.offerings.status, 'rejected');
});

test('synchronous SDK failures are captured without discarding the other result', async () => {
  const result = await loadSubscriptionData(
    async () => ({ requestDate: created }),
    () => { throw new Error('not configured'); },
  );
  assert.equal(result.customerInfo.status, 'fulfilled');
  assert.equal(result.offerings.status, 'rejected');
});

test('trial is exactly ten days from account creation and expires at the boundary', () => {
  assert.equal(getAccountTrial(created, start).endsAt?.getTime(), start + 10 * day);
  assert.equal(getAccountTrial(created, start + 9 * day).daysRemaining, 1);
  assert.equal(getAccountTrial(created, start + 10 * day - 1).active, true);
  const expired = getAccountTrial(created, start + 10 * day);
  assert.equal(expired.active, false);
  assert.equal(expired.expired, true);
  assert.equal(expired.daysRemaining, 0);
});

test('missing or invalid account creation dates cannot grant access', () => {
  for (const createdAt of [undefined, '', 'not-a-date']) {
    assert.equal(getAccountTrial(createdAt, start).active, false);
    assert.equal(getAccountTrial(createdAt, start).expired, false);
  }
});

test('missing or invalid server clock cannot grant or falsely expire a trial', () => {
  for (const clock of [null, NaN, Infinity]) {
    const trial = getAccountTrial(created, clock);
    assert.equal(trial.active, false);
    assert.equal(trial.expired, false);
  }
});

test('an existing account does not receive a new ten-day period on sign-in', () => {
  assert.equal(getAccountTrial(created, start + 20 * day).expired, true);
});

test('verified trial is published before a slow product request finishes', async () => {
  let finishPlans!: (value: string[]) => void;
  const plans = new Promise<string[]>(resolve => { finishPlans = resolve; });
  let publishInfo!: () => void;
  const published = new Promise<void>(resolve => { publishInfo = resolve; });
  let trialActive = false;
  const pending = loadSubscriptionData(
    async () => ({ requestDate: created }),
    () => plans,
    result => {
      if (result.status === 'fulfilled') {
        trialActive = getAccountTrial(created, Date.parse(result.value.requestDate)).active;
      }
      publishInfo();
    },
  );
  await published;
  assert.equal(trialActive, true);
  finishPlans(['monthly', 'annual']);
  assert.equal((await pending).offerings.status, 'fulfilled');
});

test('a stalled offerings request does not block switching accounts or signing out', async () => {
  const identities = createIdentityQueue();
  let sdkUser: string | null = null;
  const checkedUsers: (string | null)[] = [];
  const startRefresh = () => {
    void loadSubscriptionData(
      async () => { checkedUsers.push(sdkUser); return { requestDate: created }; },
      () => new Promise<never>(() => {}),
    );
  };
  await identities.run(async () => { sdkUser = 'account-A'; }, startRefresh);
  await identities.run(async () => { sdkUser = 'account-B'; }, startRefresh);
  await identities.run(async () => { sdkUser = null; }, startRefresh);
  assert.deepEqual(checkedUsers, ['account-A', 'account-B', null]);
  assert.equal(sdkUser, null);
});

test('a failed identity mutation does not prevent a subsequent retry', async () => {
  const identities = createIdentityQueue();
  let ready = 0;
  await assert.rejects(identities.run(async () => { throw new Error('logIn failed'); }, () => { ready++; }));
  await identities.run(async () => {}, () => { ready++; });
  assert.equal(ready, 1);
});

test('protected screens wait without granting access during initial verification', () => {
  assert.equal(getSubscriptionGate(true, true, false, true, '/(tabs)'), 'checking');
});

test('an expired or unverifiable account is gated as soon as access settles, regardless of product loading', () => {
  assert.equal(getSubscriptionGate(true, true, false, false, '/(tabs)'), 'subscription');
  assert.equal(getSubscriptionGate(true, true, false, false, '/add-event'), 'subscription');
});

test('active trials and subscriptions can continue even while products load', () => {
  assert.equal(getSubscriptionGate(true, true, true, true, '/(tabs)'), 'allow');
});

test('verification and account-recovery routes remain available without premium access', () => {
  for (const pathname of ['/subscription', '/reset-password', '/family/settings', '/profile-select']) {
    assert.equal(getSubscriptionGate(true, true, false, false, pathname), 'allow');
  }
});