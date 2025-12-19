# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-19

### Added
- **Point System**: Complete point management system (`cf.point`).
  - Chainable API for creating and modifying points (`add`, `setInfo`, `setColor`, etc.).
  - Group management (`setGroup`, `removeGroup`).
  - Event system (`click`, `hover`, `select`) with event delegation.
  - Visual effects: Flash (breathing), Clamp to ground, Pixel size control.
  - Batch operations: `addMultiple` with shared configuration and array support.
  - Temporary points support (TTL/ExpiresAt).
- **Vue Integration**:
  - Vue 2/3 compatible plugin (`VuePlugin`).
  - Basic component support.

### Notes
- Initial release focusing on Point entity management. Future versions will include Polygon, Billboard, and Camera modules.
