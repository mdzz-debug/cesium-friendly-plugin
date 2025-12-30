# 全局方法列表 (Global Methods)

`CesiumFriendlyPlugin` (通常别名为 `cf`) 提供的全局方法。

## 初始化与基础
- `init(cesium, viewer, options)`: 初始化插件。
- `getCesium()`: 获取 Cesium 核心对象。
- `getViewer()`: 获取 Viewer 实例。

## 实体管理
- `get(id)`: 获取指定 ID 的实体。
- `getAll()`: 获取所有实体（返回 EntityGroup，支持链式操作）。
- `query(criteria)`: 根据条件查询实体（返回 EntityGroup）。
  - `criteria` (Object):
    - `group` (String): 组名 (精确匹配)。
    - `name` (String): 名称 (包含匹配)。
    - `color` (String): 颜色 (精确匹配)。
    - `minHeight` (Number): 最小高度。
    - `maxHeight` (Number): 最大高度。
- `remove(idOrPoint)`: 移除指定实体。
- `delete(idOrPoint)`: 移除指定实体（`remove` 的别名）。
- `removeAll()`: 移除所有实体。
- `updatePosition(id, position)`: 更新指定实体的经纬度位置。

### 组操作 (Group Operations)
不再提供全局的 `showGroup`/`hideGroup` 方法，请使用链式调用：
```javascript
// 获取组并进行操作
cf.getGroup('myGroup').hide();
cf.getGroup('myGroup').show();
cf.getGroup('myGroup').delete(); // 移除组内所有实体
cf.getGroup('myGroup').setColor('red');
```

## 交互与选择
- `select(idOrPoint)`: 选中指定实体（触发选中事件）。
- `deselect()`: 取消当前选中。
- `getSelected()`: 获取当前选中的实体。

## 地球与相机控制
- `flyTo(position, orientation, duration)`: 相机飞向指定位置。
- `flyAndOrbit(position, orientation, duration, cycles)`: 飞向并环绕目标点旋转。
- `getCurrentCamera()`: 获取当前相机参数。
- `setSurfaceOpacity(opacity)`: 设置地表透明度。
- `setDepthTest(enabled)`: 开启/关闭深度检测。

## 实体组合与导出 (toCanvas)

支持将多个实体（点、图标、文字）组合并渲染为一张 Canvas 图片，常用于高性能聚合或复杂图标生成。此方法为链式调用中的终结操作之一（替代普通的 `add`）。

```javascript
// 链式组合：点 + 图标 + 文字 -> 图片
cf.point({ 
    color: 'red', 
    pixelSize: 10 
})
.billboard({
    imageUrl: '/icon.png',
    width: 32,
    height: 32
})
.label({
    text: '聚合点',
    font: '16px sans-serif',
    pixelOffset: [0, 30]
})
.toCanvas(2) // 传入倍率因子 (例如 2)，生成 2x 高清图片
.add(); // 添加到地球 (作为一个合并后的 BillboardEntity)
```

**说明**:
- `.toCanvas(scaleFactor)`: 启用 Canvas 渲染模式。
  - `scaleFactor` (可选): 图片渲染倍率，默认为 1。传入 2 或 3 可生成 Retina 级别的高清图。
- 在 `toCanvas` 模式下，`.setScale()` 可用于控制显示大小，而 `scaleFactor` 用于控制分辨率（清晰度）。
- 最终调用 `.add()` 时，会在地球上生成一个单独的 `BillboardEntity`，其图片内容为组合后的 Canvas。
