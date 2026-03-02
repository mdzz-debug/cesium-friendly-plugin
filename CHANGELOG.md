# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-28

### Highlights

- Major version upgrade to `2.0.0`
- Release configuration aligned for production publishing
- New architecture focused on chainable API + geometry + materials + data loading

### Added

- Unified chainable API for:
  - `point`, `billboard`, `label`, `canvas`
  - `circle`, `rectangle`, `path`, `box`, `cylinder`, `cone`, `model`
- Geometry capabilities:
  - shape creation, style control, slice/rotation controls
  - animation compatibility across geometry types
- Material system:
  - built-in `solid`, `flow`, `water`, `pulse`, `radar`
  - material uniform updates and animation integration
  - material debug channel support (`debug.material`)
- Data source support:
  - `loadGeoJSON`
  - `loadData(type, input, options)`
  - provider extension entry: `registerDataProvider(type, loader)`
- Query and management APIs:
  - `get`, `getAll`, `getByGroup`
  - `queryInfo`, `removeByQuery`
  - `removeGroup`, `removeAll`
- Semantic utilities:
  - color token system (`cf.color`, `setColorPalette`)
  - angle helpers (`toRadians`, `toDegrees`, `normalizeAngle`)

### Changed

- Package release outputs standardized to:
  - `dist/index.js`
  - `dist/index.esm.js`
  - `dist/index.umd.js`
  - `dist/vue.js`
  - `dist/vue.esm.js`
- Export map standardized:
  - main entry: `cesium-friendly-plugin`
  - vue entry: `cesium-friendly-plugin/vue`
- Build pipeline updated:
  - prepublish build enabled (`prepublishOnly`)
  - dist cleanup before build
- Documentation rewritten for formal release format:
  - official website added: `http://cf.luohao.online/`

### Compatibility Notes

- This is a major release. Some APIs and internal behavior differ from `1.x`.
- Recommended migration approach:
  - verify import paths (`main` / `vue` entry)
  - run regression checks for event + animation behavior
  - validate geometry/material workflows in business scenes

### Upgrade Guide (Quick)

1. Upgrade dependency:

```bash
npm i cesium-friendly-plugin@^2.0.0
```

2. Rebuild project and verify:
   - entity creation and group management
   - geometry rendering and animation
   - material effects and debug logs
   - GeoJSON loading workflows

### Links

- Website: [http://cf.luohao.online/](http://cf.luohao.online/)

