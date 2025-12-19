# 更新日志 (Changelog)

本项目的所有重要变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.1] - 2025-12-19

### 新增 (Added)
- **广告牌 (Billboard) 系统升级**：
  - 全新的链式 API (`cf.billboard`)，支持图片、缩放、旋转、颜色混合等。
  - **拖拽支持**：新增 `draggable` 属性及 `dragstart`, `drag`, `dragend` 事件。
  - **交互增强**：支持 `click`, `hover`, `select` 事件，且选中状态自动管理（自动恢复）。
  - **状态保存**：内部实现 `saveState`/`restoreState`，确保交互后的样式自动复原。
- **点位 (Point) 系统增强**：
  - 新增 **拖拽支持** (`setDraggable`)，实现与广告牌一致的拖拽体验。
  - 优化 `select`/`unselect` 逻辑，支持点击空白处自动取消选中并恢复样式。
- **核心 (Core) 优化**：
  - 重构实体管理器 (`manager.js`) 至核心目录，统一管理所有实体的生命周期与交互。
  - 优化高度模式处理，支持 `clampToGround` 与 `relativeToGround` 的智能切换。
  - 修复拖拽时的高度维持问题，解决拖拽后高度丢失或贴地的 Bug。
  - **API 隔离与规范化**：
    - `cf.point.*` 方法（如 remove, getAll）现在仅对点位生效，不再影响广告牌。
    - `cf.billboard.*` 方法同理，仅对广告牌生效。
    - 引入 **全局 API** (`cf.get`, `cf.getAll`, `cf.remove`) 用于跨类型的混合操作。
  - **通用能力增强**：
    - 新增 `setTTL(ms)` 链式方法，支持动态设置点位或广告牌的生存时间。
    - 新增 `setExpiresAt(timestamp)` 链式方法及 `expiresAt` 配置项，支持设置绝对过期时间（过期自动销毁，若已过期则立即移除）。

### 修复 (Fixed)
- 修复拖拽过程中坐标包含多余 0 的问题。
- 修复选中同一坐标物体时可能发生的偏移问题。
- 修复 `setHeight` 在某些情况下未正确更新 `heightReference` 的问题。

## [1.0.0] - 2025-12-19

### 新增 (Added)
- **点位 (Point) 系统**：完整的点位管理系统 (`cf.point`)。
  - 链式 API：支持创建和修改点位（`add`, `setInfo`, `setColor` 等）。
  - 分组管理：支持按组管理 (`setGroup`, `removeGroup`)。
  - 事件系统：支持 `click`, `hover`, `select` 及事件委托。
  - 视觉特效：支持呼吸灯闪烁、自动贴地、像素大小控制。
  - 批量操作：`addMultiple` 支持共享配置和数组简写。
  - 临时点位：支持 TTL（有效期）自动清理。
- **Vue 集成**：
  - 兼容 Vue 2/3 的插件 (`VuePlugin`)。
  - 基础组件支持。

### 说明 (Notes)
- 初始版本主要聚焦于点位实体管理。后续版本将包含 Polygon、Billboard 和 Camera 模块。
