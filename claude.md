# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Compdown is an Adobe After Effects CEP extension that converts YAML into AE compositions (and vice versa). Built on Bolt CEP with React, TypeScript, CodeMirror 6, Zod, and js-yaml.

## Build Commands

```bash
npm run build      # Production build (tsc + vite)
npm run dev        # Dev mode with HMR (panel at localhost:3000)
npm run zxp        # Package as ZXP for distribution
npm run serve      # Preview built panel at localhost:5000
```

Type-checking the panel (JS) side only:
```bash
npx tsc -p tsconfig-build.json --noEmit
```

Note: `npx tsc --noEmit` (without `-p tsconfig-build.json`) will fail because the default tsconfig resolves `@esTypes` to real ExtendScript files which use AE-specific globals. The build config redirects `@esTypes` to stub types in `src/js/lib/cep/es-types/`.

## Architecture

The extension has two separate runtimes connected by Bolt CEP's typed bridge:

### Panel Side (modern JS/React)
- `src/js/main/` — React app, UI components, business logic
- `src/js/main/schema/types.ts` — Zod schemas defining the YAML structure
- `src/js/main/schema/validation.ts` — YAML parsing + Zod validation with line-number error mapping
- `src/js/main/lib/bridge.ts` — Typed wrappers around `evalTS()` for AE communication
- `src/js/main/components/` — React components (YamlEditor, Toolbar, ErrorPanel)
- `src/js/lib/` — Bolt CEP utilities (bolt.ts has `evalTS`, `evalES`, `listenTS`, etc.)

### ExtendScript Side (ES3, runs inside AE)
- `src/jsx/aeft/aeft.ts` — Main entry: exports `createFromDocument()` and `generateFromComp()`
- `src/jsx/aeft/creators/` — Functions that create AE objects (comp, layer, file, folder)
- `src/jsx/aeft/readers/` — Functions that read AE state into JSON (comp, layer)
- `src/jsx/aeft/aeft-utils.ts` — AE helper functions (iteration, getActiveComp, etc.)
- `src/jsx/utils/utils.ts` — ES3 polyfills (forEach, map, filter) and `dispatchTS()`

### Communication Pattern
Panel calls `evalTS("functionName", args)` which serializes args as JSON, executes in ExtendScript, and returns the result parsed back to typed JS. All YAML parsing and validation happens on the panel side; ExtendScript only receives clean JSON and executes AE API calls.

### Creation Order (critical)
When creating AE objects from YAML: **folders -> files -> compositions -> layers**. Each step's output feeds into the next (layers need comp references, file-based layers need footage references).

## YAML Schema (v1)

Four top-level keys: `folders`, `files`, `compositions` (with nested `layers`). Schemas defined in `src/js/main/schema/types.ts` using Zod. Key types:

- **Layer types**: `solid`, `null`, `adjustment`, `text`, plus file-based (via `file` key referencing a file `id`), plus comp-in-comp (via `comp` key referencing another comp's `name`)
- **Layer source keys**: exactly one of `type`, `file`, or `comp` must be set per layer
- **Layer properties**: name, type, file, comp, inPoint, outPoint, startTime, enabled, shy, locked, threeDLayer, parent, blendingMode, transform, effects
- **Transform**: anchorPoint, position, scale, rotation, opacity — each property accepts either a static value or an array of keyframes (`[{time, value}, ...]`, minimum 2 keyframes)
- **Keyframe types**: `TupleKeyframeSchema` (for anchorPoint/position/scale with `[n,n]` values), `ScalarKeyframeSchema` (for rotation), `OpacityKeyframeSchema` (for opacity, value clamped 0–100)
- **Effects**: optional array per layer — each effect has `name`, optional `matchName`, optional `enabled`, optional `properties` (Record of string to scalar/boolean/number array/keyframe array). Keyframe values support `number`, `boolean`, and `number[]`.
- **Comp defaults**: 1920x1080, 30fps, 10s duration

## ExtendScript Constraints

Code in `src/jsx/` compiles to ES3. Restrictions:
- No `const`/`let` in output (use `var`), though TypeScript source uses const/let and gets transpiled
- No `Array.prototype.map/filter/forEach` at runtime — use helpers from `src/jsx/utils/utils.ts`
- AE arrays are 1-indexed (layers, items)
- Always wrap mutations in `app.beginUndoGroup()` / `app.endUndoGroup()`
- Types come from `types-for-adobe` package (globals like `CompItem`, `Layer`, `BlendingMode`)

## Key Configuration

- `cep.config.ts` — Extension ID (`com.compdown.cep`), panel config, host apps (AEFT only)
- `vite.config.ts` — Vite + React plugin, ExtendScript ES3 rollup build
- `tsconfig-build.json` — Used for builds; remaps `@esTypes` to stub types
- `src/shared/shared.ts` — Namespace derived from `cep.config.ts` id
- `src/shared/universals.d.ts` — Event types for ExtendScript <-> panel events

## Testing

### Unit Tests

```bash
npm test             # Run all tests once (vitest run)
npm run test:watch   # Watch mode (vitest)
```

Tests live next to the source in `__tests__/` directories. Currently covering:
- `src/js/main/schema/__tests__/types.test.ts` — Zod schema validation (Transform, Transform keyframes, Layer, comp-in-comp, Comp, File, Folder, Document)
- `src/js/main/schema/__tests__/validation.test.ts` — YAML parsing, error mapping, line-number resolution, comp-in-comp YAML, keyframed transforms YAML

Convention: always write tests for new panel-side logic. ExtendScript code can't be unit-tested outside AE.

### Testing in AE

1. Enable PlayerDebugMode (aescripts ZXP Installer > Settings > Debug > Enable Debugging)
2. `npm run build` then restart AE, or `npm run dev` for HMR
3. Panel appears under Window > Extensions > Compdown
