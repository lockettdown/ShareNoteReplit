# Threat Model

## Project Overview

Loopnest is a workspace containing an Expo family organizer, a React web artifact, and an Express API. The mobile application handles family membership, profiles, shared household data, authentication through Supabase, and subscriptions through RevenueCat. Node static servers expose built web/mobile assets. PostgreSQL/Drizzle libraries exist, while the user-facing mobile data path primarily crosses directly from the client to Supabase.

## Assets

- **Accounts and sessions** — Supabase access/refresh tokens and account identities permit access to private household data.
- **Family and profile data** — family membership, member profiles, events, tasks, groceries, and assignments reveal or modify private household information.
- **Authorization state** — family roles and profile permissions determine who may administer a family or alter shared records.
- **Subscription state** — RevenueCat customer identity and entitlements control paid capabilities.
- **Application secrets** — database credentials and any server-side integration credentials must remain outside browser/mobile bundles. Supabase URLs and RevenueCat SDK keys are public identifiers and are not secrets by themselves.

## Trust Boundaries

- **Mobile/browser to Supabase** — clients are attacker-controlled. Database RLS and trusted server logic must scope every read and mutation to authenticated family membership and permitted roles.
- **Unauthenticated to authenticated user** — login, signup, reset, and session restoration establish identity; no local/client state may substitute for a validated Supabase session.
- **Family member to family administrator** — role changes, invitations, member removal, and family settings require server-enforced authorization.
- **Client to RevenueCat** — SDK keys are public; entitlement integrity must derive from validated store/RevenueCat state and identities must not be attacker-selectable.
- **Public HTTP to static servers/API** — request paths, URLs, and headers are untrusted. Filesystem paths and generated HTML must remain confined and injection-safe.

## Scan Anchors

- Production entry points: `artifacts/api-server/src/index.ts`, `artifacts/figma-design/server/index.ts`, `artifacts/sharenote-mobile/server/serve.js`, and mobile routes under `artifacts/sharenote-mobile/app/`.
- Highest-risk areas: `artifacts/sharenote-mobile/lib/supabase.ts`, `artifacts/sharenote-mobile/context/`, family/profile screens, and any Supabase SQL/RLS configuration.
- Public surfaces include static assets, health routes, and authentication screens. Family records and administration are authenticated/role-scoped surfaces.
- `artifacts/mockup-sandbox` is development-only unless production reachability is demonstrated.

## Threat Categories

### Spoofing
Supabase sessions establish user identity and RevenueCat maps purchases to users. Tokens must be validated by Supabase, reset flows must not leak or accept forged identity, and subscription identity must be derived from the authenticated account.

### Tampering
Clients can invoke Supabase directly and modify requests independently of UI restrictions. RLS/policies must enforce membership, ownership, role transitions, and allowed fields for every table and operation. Shared-item integrity cannot rely on React context or hidden controls.

### Information Disclosure
Family records must only be readable by current members of the same family. Static serving must remain confined to build roots, client bundles must not contain privileged credentials, and API errors/logs must not disclose tokens, PII, or internals.

### Elevation of Privilege
Administrative family actions and cross-family object access require server/database authorization for the exact subject, object, action, and family scope. Raw IDs supplied by the client must never be sufficient. Filesystem paths must be canonicalized and checked with boundary-safe containment before reads.

### Denial of Service
Public servers should bound request parsing and avoid attacker-controlled synchronous expensive work. Authentication and recovery endpoints should rely on provider rate controls and avoid application-level amplification.
