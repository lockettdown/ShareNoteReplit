---
name: expo-google-fonts useFonts conflict
description: Combining multiple @expo-google-fonts packages with useFonts from one of them causes a React null crash on web; fix by importing useFonts from expo-font directly.
---

## The Rule
When using more than one `@expo-google-fonts/*` package, import `useFonts` from `expo-font` — never from one of the font packages.

**Why:** Each font package re-exports `useFonts` from `expo-font`. When pnpm resolves two packages that each re-export the same hook, module deduplication can fail on web, leaving React as `null` when `useFonts` calls `useState`. The error looks like: `Cannot read properties of null (reading 'useState')`.

**How to apply:** In `app/_layout.tsx` (or any file using `useFonts`):

```tsx
// ✅ Correct
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';

// ❌ Wrong — causes React null crash on web when mixing packages
import { Inter_400Regular, useFonts } from '@expo-google-fonts/inter';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
```
