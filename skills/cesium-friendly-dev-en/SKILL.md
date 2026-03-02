---
name: cesium-friendly-dev-en
description: English skill for cesium-friendly-plugin-new. Covers entity/geometry/material/animation/data-source work (geojson, model), plus demo button implementation in test-demo-vue3.
---

# Cesium Friendly Dev (EN)

## When to use

- Add or change features in `src/entity` or `src/entity/geometry`
- Add or refine `src/material` and material-animation compatibility
- Fix animation flicker, delayed rendering, or non-realtime drag updates
- Add clickable demo buttons in `test-demo-vue3/src/App.vue`
- Sync API and examples in README

## Core paths

- `src/core/CesiumApp.js`
- `src/core/Chainable.js`
- `src/entity/BaseEntity.js`
- `src/entity/GeometryBase.js`
- `src/entity/geometry/*`
- `src/material/*`
- `test-demo-vue3/src/App.vue`

## Rules

1. Implement in shared layers first; avoid one-off logic in a single entity.
2. Every visual feature needs a demo button.
3. Animation changes must support both:
   - `.add().animate(...)`
   - `.on('click', e => e.animate(...))`
4. Surface Cesium native limitations with explicit warnings.
5. Before handoff run:
   - root: `npm run build`
   - demo: `cd test-demo-vue3 && npm run build`
6. When capability boundaries change, update README support matrix (usable/unsupported/fallback).

## Material workflow

1. Register material type in `MaterialRegistry`, then wire once in `GeometryBase`.
2. For dynamic material params, use cached instances + incremental uniform updates.
3. Support animation input via `material.uniforms` interpolation.
4. Provide `debug.material` logs (`create/update/dispose`).
5. For unsupported features, always provide fallback guidance (switch entity type or distance-driven simulation).

## Delivery checklist

- `setMaterial(...)` works in chain calls
- `animate({ to: { material: ... } })` is stable
- no listener leaks after remove/group-remove
- demo button reproduces the feature
- README includes minimal runnable samples
- README support matrix is updated
