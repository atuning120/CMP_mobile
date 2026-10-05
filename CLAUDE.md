# Front-mobile

Expo SDK 57 · React Native 0.86 · React 19 · Expo Router · TypeScript · pnpm

- `src/app/`: routes only. Screens go in `src/screens/`, UI in `src/components/<feature>/`, data in `src/hooks/` and `src/services/`, shared types in `src/types/`.
- Styles live in a sibling `*.styles.ts`; tokens come from `src/constants/theme.ts`.
- Offline-first (operator): UI reads/writes local SQLite (`src/db/`); every action is written together with an outbox entry (`src/sync/colaSync.ts`) in one transaction and synced in background by `src/sync/syncEngine.ts` (triggers in `motorSync.ts`). Entities carry a client UUID (`idCliente`) so Backend endpoints are idempotent. Add new operator actions in `src/services/operacionesTurno.ts`, never call the API directly from screens.

@AGENTS.md

## graphify

- Find code with `graphify query "<q>"`, `graphify explain "<X>"` or `graphify path "<A>" "<B>"`; read `graphify-out/GRAPH_REPORT.md` only for an architecture overview.
- After code changes: `graphify update .`

# Claude Code Configuration

Responde siempre en español. Mantén en inglés (sin traducir) todos los términos técnicos, nombres de herramientas, tecnologías y librerías: API, REST, database, backend, framework, Git, Docker, Linux, Node.js, Python, JavaScript, JSON, etc.
