---
name: RevenueCat product branding
description: RevenueCat product display names and client-visible product descriptions can come from different metadata sources.
---

Changing a RevenueCat product's `display_name` does not guarantee that `PurchasesPackage.product.description` changes immediately. The client description may remain cached or come from the underlying store metadata.

**Why:** After all RevenueCat product display names were renamed, the SDK still returned the previous brand in Test Store package descriptions.

**How to apply:** Update RevenueCat display names for catalog consistency, update App Store and Google Play localized metadata for production, and normalize legacy brand text at render time when the UI must never show stale wording.