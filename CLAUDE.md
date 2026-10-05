# Front-mobile

Expo SDK 57 · React Native 0.86 · React 19 · Expo Router · TypeScript · pnpm

- `src/app/`: routes only. Screens go in `src/screens/`, UI in `src/components/<feature>/`, data in `src/hooks/` and `src/services/`, shared types in `src/types/`.
- Styles live in a sibling `*.styles.ts`; tokens come from `src/constants/theme.ts`.

@AGENTS.md

## graphify

- Find code with `graphify query "<q>"`, `graphify explain "<X>"` or `graphify path "<A>" "<B>"`; read `graphify-out/GRAPH_REPORT.md` only for an architecture overview.
- After code changes: `graphify update .`
