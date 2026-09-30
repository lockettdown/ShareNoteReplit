---
name: Family account deletion boundaries
description: Authorization and billing boundaries for deleting a shared family account.
---

Deleting the shared family account must require a server-authorized Parent profile, not merely a signed-in family login or a client-side role check. Explain clearly that App Store and Google Play subscriptions must be canceled separately, and do not imply deleting the login erases legally retained purchase records.

**Why:** Family credentials can be used by Child profiles, while account deletion removes data for the whole household. Store billing and purchase-history retention are outside the app's account lifecycle.

**How to apply:** Preserve the parent-session authorization when changing account lifecycle flows. When expanding data erasure, explicitly handle external purchase records and failure/retry behavior rather than assuming the auth-user cascade covers them.