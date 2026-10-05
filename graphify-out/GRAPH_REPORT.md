# Graph Report - Front-mobile  (2026-10-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 336 nodes · 709 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c028be7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12

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

## Communities (13 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (34): lucide-react-native, react, AppBottomSheetModalProps, styles, styles, LoginFormProps, styles, styles (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (40): { defineConfig }, expoConfig, devDependencies, eslint, eslint-config-expo, @types/react, typescript, main (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (25): AppBottomSheetModal(), EditarEquipoModal(), MOCK_OPERADORES, MOCK_ZONAS, Props, styles, EquipoDataForm(), FilterOption (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (32): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, projectId (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (22): expo-constants, expo-secure-store, expo-splash-screen, @react-native-async-storage/async-storage, @react-native-community/netinfo, TabLayout(), LoginForm(), MicrosoftLoginButton() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (30): dependencies, expo, expo-constants, expo-device, expo-font, expo-glass-effect, expo-image, expo-linking (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (19): expo-router, react-native-reanimated, ProfileChip(), ProfileChipProps, styles, Props, MachineStatusCard(), Props (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): EquipoFormState, FuenteDatos, PlantillaEquipo, Props, styles, INITIAL_EQUIPO_STATE, MOCK_PLANTILLAS, MOCK_ZONAS (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (13): react-native-safe-area-context, EvidenceCard(), EvidenceCardProps, styles, LoginFooter(), EvidenciaHistorial, MOCK_EVIDENCIAS, useEvidenciasHistorial() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): react-native, CmpLogo(), styles, LoginHeader(), LoginHeaderProps, styles, MicrosoftLoginButtonProps, styles (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (7): expo/tsconfig.base, compilerOptions, paths, strict, extends, include, @/assets/*

## Knowledge Gaps
- **151 isolated node(s):** `AppBottomSheetModalProps`, `LoginFormProps`, `Props`, `Props`, `ThemeColors` (+146 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 164 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `Community 9` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `react` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **What connects `AppBottomSheetModalProps`, `LoginFormProps`, `Props` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09333333333333334 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09682539682539683 - nodes in this community are weakly interconnected._