---
name: new-screen
description: Add a new screen/route to Front-mobile following the project's route → screen → styles pattern. Use when adding a screen, route, or feature view.
---

# New screen

1. **Route** `src/app/<route>.tsx` (or `src/app/<route>/index.tsx` for nested routes): a thin file that only renders the screen and reads params with `useLocalSearchParams`.
2. **Screen** `src/screens/<Name>Screen.tsx`, with styles in a sibling `<Name>Screen.styles.ts` (`StyleSheet.create`, tokens from `src/constants/theme.ts`).
3. **Components** `src/components/<feature>/<Comp>.tsx` + `<Comp>.styles.ts`.
4. **Data** `src/hooks/use<Thing>.ts` for fetching and state; storage and auth go in `src/services/`; types go in `src/types/`.
5. **Navigation** uses `Link` / `router` from `expo-router`. Update `src/app/_layout.tsx` if the navigator needs it.
6. **Icons** come from `lucide-react-native`. Add packages only with `npx expo install`.

Finish with `npx expo lint && npx tsc --noEmit`.
