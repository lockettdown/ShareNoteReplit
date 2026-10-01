---
name: RevenueCat trial clock
description: Security rules for calculating the account-based free trial without trusting the device wall clock.
---

Free-trial access must use RevenueCat's server-issued CustomerInfo request time from a forced native refresh, then advance only with a monotonic runtime clock. Never use the device wall clock or a passive cached CustomerInfo update to grant trial time.

**Why:** Device wall-clock changes can move time before the trial expiration, and cached CustomerInfo timestamps can preserve an earlier point in the trial across relaunches.

**How to apply:** Fail trial access closed until a fresh native CustomerInfo request establishes the clock. Passive listeners and identity changes may update paid entitlement data but must not establish trial time. RevenueCat cache invalidation is unsupported on web and in Expo Go's `storeClient` browser mode, so guard that native-only call in both environments.

Keep account-access verification independent of StoreKit product availability, and serialize only SDK identity mutations—not catalogue or access requests.

**Why:** A failed product request can otherwise discard successful trial verification; a stalled product request can prevent account switching or postpone denial for an expired account. Checkout availability and account access are separate outcomes.

**How to apply:** Publish fresh CustomerInfo as soon as it arrives, enforce access without waiting for products, and never grant access while initial verification is still pending. Product-load failures must not be presented as proof that the account trial expired.