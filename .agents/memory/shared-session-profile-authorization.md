---
name: Shared-session profile authorization
description: Security boundary for Parent privileges when multiple family members share one authenticated account session.
---

Treat a selected profile and every role stored in family-state JSON as attacker-controlled display state, not authorization. Parent operations require a short-lived server-side binding between the current Supabase session and an unambiguous canonical Parent profile, established only after server-side family-password verification.

**Why:** A shared authenticated account proves family membership but not which person is holding the device. Client-side profile selection or JSON role checks let any family member assume Parent controls or persist a role escalation.

**How to apply:** Route privileged writes through server-owned functions, revoke direct table writes, fail closed on duplicate/conflicting profile roles, rate-limit password checks atomically, expire Parent bindings, and reload authoritative state after authorization failures.