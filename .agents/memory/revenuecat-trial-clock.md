---
name: RevenueCat trial clock
description: Security rules for calculating the account-based free trial without trusting the device wall clock.
---

Free-trial access must use RevenueCat's server-issued CustomerInfo request time from a forced native refresh, then advance only with a monotonic runtime clock. Never use the device wall clock or a passive cached CustomerInfo update to grant trial time.

**Why:** Device wall-clock changes can move time before the trial expiration, and cached CustomerInfo timestamps can preserve an earlier point in the trial across relaunches.

**How to apply:** Fail trial access closed until a fresh native CustomerInfo request establishes the clock. Passive listeners and identity changes may update paid entitlement data but must not establish trial time. RevenueCat cache invalidation is unsupported on web and in Expo Go's `storeClient` browser mode, so guard that native-only call in both environments.