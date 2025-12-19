# 广告牌 (Billboard) API 使用说明

广告牌（Billboard）用于在地图上展示图片图标，支持缩放、旋转、拖拽、闪烁、自动贴地等高级交互能力。

## 快速开始

```javascript
// 初始化
cf.init(Cesium, viewer);

// 添加一个可拖拽的广告牌
cf.billboard.add({
  position: [116.3974, 39.9093],
  imageUrl: '/icons/car.png',
  scale: 1.5,
  draggable: true,
  // 快捷事件绑定
  on: {
    click: (b) => console.log('点击:', b.id),
    dragend: (b) => console.log('新位置:', b.position)
  }
});
```

## 创建与管理

### 单个创建 `cf.billboard.add(options)`

创建并返回一个 `Billboard` 实例。

**参数 `options` 对象：**

| 属性 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `position` | Array | 是 | - | `[lng, lat, height?]` 经纬度及高度 |
| `imageUrl` | String | 是 | - | 图片 URL 地址 |
| `scale` | Number | 否 | `1.0` | 缩放比例 |
| `rotation` | Number | 否 | `0` | 旋转角度（度） |
| `draggable` | Boolean | 否 | `false` | 是否允许拖拽 |
| `color` | String | 否 | `#FFFFFF` | 混合颜色（白底图可染色） |
| `opacity` | Number | 否 | `1.0` | 透明度 (0-1) |
| `heightReference` | String | 否 | `clampToGround` | 高度模式 (`none`, `clampToGround`, `relativeToGround`)。若设置了 `heightOffset`，默认为 `relativeToGround`。 |
| `heightOffset` | Number | 否 | `0` | 相对地面的高度偏移量 |
| `group` | String | 否 | - | 分组名称 |
| `id` | String | 否 | 随机生成 | 指定唯一 ID |
| `name` | String | 否 | - | 名称 |
| `description` | String | 否 | - | 描述 |
| `on` | Object | 否 | - | 事件字典 `{ eventName: handler }` |
| `onClick` | Function | 否 | - | 点击事件快捷写法 |

**示例：**

```javascript
cf.billboard.add({
  position: [120.12, 30.24, 100], // 高度 100
  imageUrl: 'logo.png',
  heightReference: 'relativeToGround', // 相对地面高度
  on: {
    select: (b) => b.setScale(2.0), // 选中放大
    unselect: (b) => { /* 自动恢复，无需手动 reset */ }
  }
});
```

### 批量创建 `cf.billboard.addMultiple(list, sharedOptions)`

批量创建多个广告牌，性能更优。

- **`list`**: 数组，每项可以是位置数组 `[lng, lat]` 或配置对象 `{ position: [...], ... }`。
- **`sharedOptions`**: 共享配置对象（如统一的图片、事件、分组等）。

**示例：**

```javascript
cf.billboard.addMultiple(
  [
    [116.1, 39.1], // 简写位置
    { position: [116.2, 39.2], scale: 2.0 }, // 个性化配置
    { position: [116.3, 39.3], color: 'red' }
  ],
  {
    imageUrl: 'marker.png', // 共享图片
    group: 'MyGroup',
    draggable: true,
    on: {
      click: (b) => console.log('Clicked:', b.id)
    }
  }
);
```

### 管理方法

仅操作**广告牌类型**的实体，不会影响点位等其他类型。

- `cf.billboard.get(id)`: 获取指定 ID 的广告牌（若该 ID 为点位则返回 null）。
- `cf.billboard.getAll()`: 获取所有广告牌实例。
- `cf.billboard.remove(idOrInstance)`: 移除单个广告牌。
- `cf.billboard.removeAll()`: 移除所有广告牌。
- `cf.billboard.removeGroup(groupName)`: 移除指定分组下的所有广告牌。

> **注意**：若需跨类型操作（如通过 ID 移除任意实体），请使用全局方法 `cf.remove(id)`。

## 实例方法 (链式调用)

所有 `set` 开头的方法均返回 `this`，支持链式调用。

### 样式与属性

- `setImage(url)`: 切换图片。
- `setScale(scale)`: 设置缩放比例。
- `setRotation(degree)`: 设置旋转角度（0-360）。
- `setColor(color)`: 设置混合颜色（支持 CSS 颜色串）。
- `setOpacity(alpha)`: 设置透明度 (0-1)。
- `setDraggable(enable)`: 开启/关闭拖拽。
- `setClampToGround(enable)`: 设置是否贴地 (true: 贴地, false: 绝对高度)。
- `setHeight(height)`: 设置相对地面的高度（会自动切换为 `relativeToGround` 模式）。
- `setGroup(name)`: 修改分组。
- `setInfo(info)`: 更新元数据 (`name`, `description`, 自定义 `data`)。
- `show() / hide()`: 显示/隐藏。

### 高级交互

- **`setFlash(enable, duration?, options?)`**: 开启/关闭呼吸灯闪烁。
  - `duration`: 周期（毫秒），默认 1000。
  - `options`: `{ minOpacity: 0.0, maxOpacity: 1.0 }`。

### 事件绑定

- `on(type, handler)`: 绑定事件。
- `off(type, handler)`: 解绑事件。

## 事件系统

支持以下事件类型：

### 基础事件
- `click`: 单击时触发。
- `hover`: 鼠标悬停/移出时触发 `(instance, isHover) => {}`。
- `select`: 选中时触发。
- `unselect`: 取消选中时触发（**注：插件会自动恢复选中前的样式状态，无需手动重置**）。

### 拖拽事件 (需 `draggable: true`)
- `dragstart`: 开始拖拽。
- `drag`: 拖拽中，频率较高。回调参数 `(instance, newPosition)`。
- `dragend`: 拖拽结束。

**拖拽示例：**

```javascript
const b = cf.billboard.add({ ... });

b.setDraggable(true)
 .on('dragstart', () => console.log('开始拖拽'))
 .on('drag', (b, pos) => {
    // pos 为 [lng, lat, height]
    console.log('移动中:', pos); 
 })
 .on('dragend', (b) => {
    console.log('最终位置:', b.position);
 });
```
