# Graph Report - Front-mobile  (2026-10-05)

## Corpus Check
- 76 files · ~99,561 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 3)

## Summary
- 341 nodes · 712 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20552ce6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react-native
- package.json
- ShipSupervisorScreen.tsx
- expo
- LoginScreen.tsx
- dependencies
- WorkzoneScreen.tsx
- ReemplazoEquipoModal.tsx
- react
- Front-mobile
- reset-project.js
- tsconfig.json
- global.d.ts
- SKILL.md

## God Nodes (most connected - your core abstractions)
1. `react-native` - 49 edges
2. `react` - 33 edges
3. `darkTheme` - 27 edges
4. `lightTheme` - 27 edges
5. `lucide-react-native` - 23 edges
6. `AppBottomSheetModal()` - 15 edges
7. `expo` - 14 edges
8. `ShipSupervisorScreen()` - 13 edges
9. `WorkzoneScreen()` - 11 edges
10. `LoginScreen()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `EstadoOperacional`  [EXTRACTED]
  src/components/workzone/StateChangeBanner.tsx → src/types/turno.ts
- `Props` --references--> `MaquinaFlota`  [EXTRACTED]
  src/components/supervisor/EditarEquipoModal.tsx → src/hooks/useFlotaResumen.ts
- `Props` --references--> `MaquinaFlota`  [EXTRACTED]
  src/components/supervisor/MachineFleetCard.tsx → src/hooks/useFlotaResumen.ts
- `Props` --references--> `TurnoActual`  [EXTRACTED]
  src/components/workzone/EndShiftModal.tsx → src/types/turno.ts
- `Props` --references--> `TurnoActual`  [EXTRACTED]
  src/components/workzone/MachineStatusCard.tsx → src/types/turno.ts

## Import Cycles
- None detected.

## Communities (14 total, 3 thin omitted)

### Community 0 - "react-native"
Cohesion: 0.09
Nodes (33): lucide-react-native, react-native, react-native-reanimated, AppBottomSheetModalProps, styles, styles, LoginFormProps, styles (+25 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (40): { defineConfig }, expoConfig, devDependencies, eslint, eslint-config-expo, @types/react, typescript, main (+32 more)

### Community 2 - "ShipSupervisorScreen.tsx"
Cohesion: 0.09
Nodes (26): AppBottomSheetModal(), EditarEquipoModal(), MOCK_OPERADORES, MOCK_ZONAS, Props, styles, EquipoDataForm(), FilterOption (+18 more)

### Community 3 - "expo"
Cohesion: 0.06
Nodes (32): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, projectId (+24 more)

### Community 4 - "LoginScreen.tsx"
Cohesion: 0.11
Nodes (24): expo-constants, expo-router, expo-secure-store, expo-splash-screen, @react-native-async-storage/async-storage, @react-native-community/netinfo, TabLayout(), LoginForm() (+16 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, expo, expo-constants, expo-device, expo-font, expo-glass-effect, expo-image, expo-linking (+22 more)

### Community 6 - "WorkzoneScreen.tsx"
Cohesion: 0.13
Nodes (21): ActionCard(), ChangeStateModal(), ChangeStateModalProps, getStateConfig(), styles, EndShiftModal(), StartShiftModal(), Props (+13 more)

### Community 7 - "ReemplazoEquipoModal.tsx"
Cohesion: 0.11
Nodes (17): EquipoFormState, FuenteDatos, PlantillaEquipo, Props, styles, INITIAL_EQUIPO_STATE, MOCK_PLANTILLAS, MOCK_ZONAS (+9 more)

### Community 8 - "react"
Cohesion: 0.12
Nodes (19): react, react-native-safe-area-context, CmpLogo(), styles, EvidenceCard(), EvidenceCardProps, styles, LoginFooter() (+11 more)

### Community 10 - "reset-project.js"
Cohesion: 0.17
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 11 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): expo/tsconfig.base, compilerOptions, paths, strict, extends, include, @/assets/*

## Knowledge Gaps
- **153 isolated node(s):** `New screen`, `graphify`, `AppBottomSheetModalProps`, `LoginFormProps`, `Props` (+148 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 168 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `react-native` to `package.json`, `ShipSupervisorScreen.tsx`, `LoginScreen.tsx`, `WorkzoneScreen.tsx`, `ReemplazoEquipoModal.tsx`, `react`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `react-native`, `package.json`, `ShipSupervisorScreen.tsx`, `LoginScreen.tsx`, `WorkzoneScreen.tsx`, `ReemplazoEquipoModal.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **What connects `New screen`, `graphify`, `AppBottomSheetModalProps` to the rest of the system?**
  _153 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react-native` be split into smaller, more focused modules?**
  _Cohesion score 0.08672699849170437 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `ShipSupervisorScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0931174089068826 - nodes in this community are weakly interconnected._