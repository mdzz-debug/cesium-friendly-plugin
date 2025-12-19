# 点位 (Point) API 使用说明

本说明文档覆盖点位创建、链式方法、事件、分组、临时点位（有效期）、批量添加以及拖拽能力。

## 快速开始

```javascript
// 初始化
cf.init(Cesium, viewer);

// 创建一个红色点位
const p = cf.point.add([116.3974, 39.9093])
  .setInfo({ name: '天安门' })
  .setColor('red')
  .setPixelSize(12)
  .setHeight(50) // 离地 50m
  .setDraggable(true) // 开启拖拽
  .on('click', (p) => p.setFlash(true));
```

## 创建与管理

### 单个创建 `cf.point.add(options | positionArray)`

- **数组简写**：`cf.point.add([lng, lat, height?])`
- **配置对象**：

| 属性 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `position` | Array | 是 | - | `[lng, lat, height?]` 经纬度及高度 |
| `color` | String | 否 | `'red'` | 点位颜色 (CSS 颜色字符串) |
| `pixelSize` | Number | 否 | `10` | 像素大小 |
| `outlineColor` | String | 否 | `'white'` | 外边框颜色 |
| `outlineWidth` | Number | 否 | `2` | 外边框宽度 |
| `imageUrl` | String | 否 | - | (可选) 设置图片 URL，若设置则渲染为图片点 |
| `width` | Number | 否 | - | 图片宽度 (仅当设置 imageUrl 时有效) |
| `height` | Number | 否 | - | 图片高度 (仅当设置 imageUrl 时有效) |
| `draggable` | Boolean | 否 | `false` | 是否允许拖拽 |
| `heightReference` | String | 否 | `clampToGround` | 高度模式 (`none`, `clampToGround`, `relativeToGround`)。若设置了 `heightOffset`，默认为 `relativeToGround`。 |
| `heightOffset` | Number | 否 | `0` | 相对地面的高度偏移量 |
| `group` | String | 否 | - | 分组名称 |
| `ttlMs` | Number | 否 | - | 生存时间(毫秒)，过期自动销毁 |
| `expiresAt` | Number | 否 | - | 过期时间戳（支持秒或毫秒），到达该时间点自动销毁 |
| `id` | String | 否 | 随机生成 | 指定唯一 ID |
| `name` | String | 否 | - | 名称 |
| `description` | String | 否 | - | 描述 |
| `on` | Object | 否 | - | 事件字典 `{ eventName: handler }` |
| `onClick` | Function | 否 | - | 点击事件快捷写法 |

### 批量创建 `cf.point.addMultiple(list, sharedOptions)`

高效创建大量点位。

```javascript
cf.point.addMultiple(
  [
    [116.3, 39.9],
    { position: [116.4, 39.9], color: 'blue' }
  ],
  {
    pixelSize: 8,
    group: 'Monitor',
    draggable: false,
    on: {
      hover: (p, isHover) => p.setPixelSize(isHover ? 15 : 8)
    }
  }
);
```

### 管理方法

仅操作**点位类型**的实体，不会影响广告牌等其他类型。

- `cf.point.get(id)`: 获取指定 ID 的点位（若该 ID 为广告牌则返回 null）。
- `cf.point.getAll()`: 获取所有点位实例。
- `cf.point.remove(idOrInstance)`: 移除单个点位。
- `cf.point.removeAll()`: 移除所有点位。
- `cf.point.removeGroup(groupName)`: 移除指定分组下的所有点位。

> **注意**：若需跨类型操作（如通过 ID 移除任意实体），请使用全局方法 `cf.remove(id)`。

## 实例方法 (链式)

- `setColor(color)`: 设置颜色。
- `setPixelSize(size)`: 设置点大小。
- `setOutline(enable, color, width)`: 设置外边框。
- `setDraggable(enable)`: **[新增]** 开启/关闭拖拽。
- `setHeight(height)`: 设置离地高度（自动转为相对高度模式）。
- `setClampToGround(bool)`: 设置是否贴地。
- `setTTL(ms)`: 设置生存时间（毫秒），过期自动销毁。
- `setExpiresAt(timestamp)`: 设置绝对过期时间点（时间戳）。
- `setFlash(enable, duration, options)`: 开启/关闭闪烁。
- `setInfo(info)`: 更新绑定的业务数据。
- `show() / hide()`: 显示/隐藏。
- `destroy()`: 销毁。

## 事件系统

### 绑定与解绑

- `on(type, handler)`: 绑定事件。
- `off(type, handler)`: 解绑事件。

### 事件类型

支持 `click`, `hover`, `select`, `unselect`, `dragstart`, `drag`, `dragend`。

- **Select/Unselect**: 
  - 选中时触发 `select`。
  - 点击空白或选中其他物体时触发 `unselect`。
  - **自动状态管理**：选中时修改的样式（如变色、放大），在 `unselect` 触发前会自动恢复原状。

- **Drag (拖拽)**:
  - 需设置 `.setDraggable(true)`。
  - 支持 `dragstart`, `drag`, `dragend`。
  - 拖拽过程中会自动维持高度（基于 `heightReference`）。

```javascript
p.on('dragend', (point) => {
  console.log('拖拽结束，新坐标:', point.position);
});
```

## 临时点位 (TTL)

支持设置有效期，到期自动移除：

```javascript
// 方式 1: 配置项
cf.point.add({
  position: [116.5, 39.5],
  ttlMs: 5000 // 5秒后自动消失
});

// 方式 2: 链式调用
cf.point.add([116.6, 39.6])
  .setColor('blue')
  .setTTL(3000); // 3秒后消失
```
