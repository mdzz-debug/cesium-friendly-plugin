---
name: cesium-friendly-dev-zh
description: 用于 cesium-friendly-plugin-new 的中文开发技能。覆盖实体/几何/材质/动画/数据加载（geojson、model）以及 test-demo-vue3 的按钮示例与联调。
---

# Cesium Friendly Dev (ZH)

## 何时使用

- 新增或修改 `src/entity`、`src/entity/geometry` 能力
- 新增或修改 `src/material` 与材质动画兼容
- 修复动画闪烁、渲染不更新、拖拽不实时
- 在 `test-demo-vue3/src/App.vue` 增加 demo 按钮
- 同步 README 的 API 与示例

## 关键目录

- `src/core/CesiumApp.js`
- `src/core/Chainable.js`
- `src/entity/BaseEntity.js`
- `src/entity/GeometryBase.js`
- `src/entity/geometry/*`
- `src/material/*`
- `test-demo-vue3/src/App.vue`

## 开发规则

1. 优先公共层实现，避免逻辑分散到单个实体。
2. 新增可视能力必须配 demo 按钮。
3. 动画改动必须兼容：
   - `.add().animate(...)`
   - `.on('click', e => e.animate(...))`
4. Cesium 原生限制要有中文提示，不要静默失败。
5. 交付前至少执行：
   - 根目录 `npm run build`
   - `test-demo-vue3` 下 `npm run build`
6. 改动能力边界时，同步更新 README 的“支持矩阵（可用/不支持/替代方案）”。

## 材质实现建议

1. 在 `MaterialRegistry` 注册类型，再由 `GeometryBase` 统一接入。
2. 需要动态参数时，使用“材质实例复用 + uniforms 增量更新”。
3. 动画支持 `material.uniforms` 插值（数字/颜色）。
4. 输出 `debug.material`（`create/update/dispose`）。
5. 对不支持能力必须给降级方案（例如“改用几何实体”或“相机距离模拟”）。

## 交付核对

- `setMaterial(...)` 可直接链式使用
- `animate({ to: { material: ... } })` 可用且稳定
- 删除实体/分组后无监听泄漏
- demo 中有可点击复现场景
- README 有最小可运行示例
- README 的支持矩阵已同步更新
