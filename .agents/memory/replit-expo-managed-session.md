---
name: Replit Expo managed session
description: How Replit's managed Expo Go account must be attached to Expo CLI for phone previews.
---

When Replit provides `REPLIT_EXPO_SESSION_SECRET`, install it as the `sessionSecret` in Expo CLI's protected `~/.expo/state.json` before starting Metro. Do not pass it as `EXPO_TOKEN`; it is a session secret rather than a bearer token.

**Why:** Expo Go 57 rejects the project when the phone is signed into Replit's managed private account but Expo CLI remains anonymous. The managed credential is valid for Expo CLI's session-state format and is rejected when treated as an access token.

**How to apply:** Keep the session setup in the mobile development startup path, preserve owner-only permissions on the state file, and verify identity with the read-only `expo whoami` command after workflow restarts.