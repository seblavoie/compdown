# Compdown Roadmap

Tracking improvements and new features for the project.

## Active Milestone

### 1. Context Selectors (Phase 1)
**Status:** In progress (next)
**Goal:** Target existing AE context explicitly (not only new composition creation).

**Spec draft:** `docs/syntax-actions-v1.md`

**Scope (Phase 1):**
- Keep `_timeline` as the canonical selector for active comp timeline.
- Add one additional explicit selector for existing context.
- Ensure selector syntax is consistent and extensible for future `_selected`, named comp/layer selectors.
- Keep error messages user-friendly and migration-safe.

**Acceptance criteria:**
- Selector syntax is documented with examples.
- Parser/schema validates selector blocks consistently.
- Runtime applies operations to the intended context or fails with clear errors.
- Tests cover happy paths and invalid selector usage.

## Next Milestones

### 2. Layer Targeting + Effects on Existing Layers
**Status:** Planned
**Goal:** Apply effects/changes to existing layers without recreating everything.

**Scope:**
- Introduce explicit layer targeting primitives.
- Add effect application/update semantics on selected/targeted layers.
- Define conflict behavior (replace, merge, append).

### 3. Authoring UX (Editor Assistance)
**Status:** Planned
**Goal:** Make writing syntax accessible for non-dev users.

**Scope:**
- Context-aware autocomplete/snippets.
- Inline examples for common tasks.
- Human-readable validation errors with direct fixes.

### 4. Migration + Compatibility Tooling
**Status:** Planned
**Goal:** Keep syntax evolution clean while reducing friction.

**Scope:**
- Guided migration messages for deprecated patterns.
- Optional auto-rewrite helper for legacy docs/snippets.
- Clear changelog entries and docs diffs.

## Recently Completed

- `_timeline` top-level block syntax for adding layers to active timeline.
- `_selected` target support for selected-layer set/remove actions.
- Removal of legacy `destination/layers` top-level format.
- Parser/runtime/docs/test alignment for the new syntax.
