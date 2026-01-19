# 点位实体（PointEntity）

点位实体用于在三维地球上绘制轻量级的“点标记”，适合用来表达摄像头、告警点、设备状态等基础业务信息。  
在 CesiumFriendlyPlugin 中，点位提供统一的创建入口、链式 API，以及丰富的扩展能力。

## 快速上手

```js
// 初始化插件（可以直接传 viewer，内部会自动推断 Cesium）
cf.init(viewer);

// 创建一个基础点位
const p = cf.point({
  position: [116.39, 39.9, 0], // [经度, 纬度, 高度]
  color: '#FF0000',
  pixelSize: 12
}).add();
```

典型链式用法：

```js
cf.point({
  position: [116.39, 39.9],
  group: 'camera',
  name: '监控点 A'
})
  .setColor('#00FFFF')
  .setPixelSize(14)
  .setOutline(true, '#FFFFFF', 2)
  .setClampToGround(true)
  .add();
```

## 核心设计

- 独立数据源  
  所有点位统一挂载在名为 `cesium-friendly-points` 的 DataSource 上，便于统一管理与批量操作。

- 轻量配置对象  
  内部通过返回“干净的配置对象”交给 `viewer.entities.add` 创建原生 `Entity`，避免状态污染。

- 选项清洗  
  构造时会清理不属于点位的属性（如图标/文本专用字段），保证 PointEntity 状态单一、可控。

## 能力概览（不含动画）

- 位置与高度  
  支持 `[lng, lat, alt]` 位置、贴地/相对地表高度、`heightOffset` 抬升等。

- 视觉样式  
  支持颜色、像素大小、缩放、透明度、外轮廓颜色及宽度等基础样式。

- 距离感知  
  支持基于相机高度和相机距离的显示控制、随距离缩放、随距离透明度变化等。

- 状态与分组  
  支持 `group` 分组管理、状态保存/恢复、TTL/过期时间、显隐控制、删除等。

- 交互能力  
  支持拖拽、点击与悬停等事件绑定，可与全局选中状态联动。

## 方法列表 (Point Entity Methods)

`PointEntity` 支持的 `set` 方法及常用操作方法（本节只列非动画相关能力；动画效果单独在其它文档中说明）。

## 样式设置 (Style Setters)
- `setScale(scale)`: 设置缩放比例 (Number). 注意：原生 Point 不支持 scale，此处实现为乘以 pixelSize.

```js
cf.point({ position: [116.39, 39.9] })
  .setScale(1.5)
  .add();
```

- `setColor(color)`: 设置颜色 (CSS颜色字符串, 如 '#FF0000', 'rgba(255,0,0,0.5)').

```js
cf.point({ position: [116.39, 39.9] })
  .setColor('#00FF00')
  .add();
```

- `setPixelSize(size)`: 设置像素大小 (Number).

```js
cf.point({ position: [116.39, 39.9] })
  .setPixelSize(18)
  .add();
```

- `setOpacity(opacity)`: 设置透明度 (0.0 - 1.0).

```js
cf.point({ position: [116.39, 39.9] })
  .setOpacity(0.6)
  .add();
```

- `setOutline(enabled, color, width)`: 设置外边框.
  - `enabled`: Boolean
  - `color`: String (可选)
  - `width`: Number (可选)

```js
cf.point({ position: [116.39, 39.9] })
  .setOutline(true, '#FFFFFF', 3)
  .add();
```

## 位置与几何 (Position & Geometry)
- `setPosition(position)`: 设置位置 [lng, lat, alt].

```js
const p = cf.point({ position: [116.39, 39.9] }).add();

p.setPosition([121.47, 31.23, 50]);
```

- `setHeight(height)`: 设置高度偏移 (米).

```js
cf.point({ position: [116.39, 39.9, 0] })
  .setHeight(80)
  .add();
```

- `setHeightReference(reference)`: 设置高度参考 ('none', 'clampToGround', 'relativeToGround').

```js
cf.point({ position: [116.39, 39.9] })
  .setHeightReference('relativeToGround')
  .setHeight(30)
  .add();
```

- `setClampToGround(enable)`: 开启/关闭贴地模式.

```js
cf.point({ position: [116.39, 39.9, 0] })
  .setClampToGround(true)
  .add();
```

## 显示控制 (Display Control)
- `setDisplayCondition({ min, max })`: 设置基于相机高度的显示范围 (米).

```js
cf.point({ position: [116.39, 39.9] })
  .setDisplayCondition({ min: 1000, max: 100000 })
  .add();
```

- `setDistanceDisplayCondition({ near, far })`: 设置基于距离的显示条件.

```js
cf.point({ position: [116.39, 39.9] })
  .setDistanceDisplayCondition({ near: 1000, far: 800000 })
  .add();
```

- `setScaleByDistance({ near, nearValue, far, farValue })`: 设置随距离缩放.

```js
cf.point({ position: [116.39, 39.9] })
  .setScaleByDistance({
    near: 1000,
    nearValue: 2,
    far: 800000,
    farValue: 0.5
  })
  .add();
```

- `setTranslucencyByDistance({ near, nearValue, far, farValue })`: 设置随距离透明度变化.

```js
cf.point({ position: [116.39, 39.9] })
  .setTranslucencyByDistance({
    near: 1000,
    nearValue: 1,
    far: 800000,
    farValue: 0.1
  })
  .add();
```

- `setDisableDepthTestDistance(distance)`: 设置深度检测失效距离 (防止地形遮挡).

```js
cf.point({ position: [116.39, 39.9] })
  .setDisableDepthTestDistance(1000000)
  .add();
```

## 状态与生命周期 (State & Lifecycle)
- `setGroup(groupName)`: 修改实体所属组.

```js
cf.point({ position: [116.39, 39.9] })
  .setGroup('alarm')
  .add();
```

- `setTTL(ms)`: 设置存活时间 (毫秒)，过期后自动删除.

```js
cf.point({ position: [116.39, 39.9] })
  .setTTL(60000)
  .add();
```

- `setExpiresAt(timestamp)`: 设置过期时间戳.

```js
const expiresAt = Date.now() + 5 * 60 * 1000;

cf.point({ position: [116.39, 39.9] })
  .setExpiresAt(expiresAt)
  .add();
```

- `saveState()`: 保存当前状态 (用于撤销/重置).
- `restoreState()`: 恢复保存的状态.

```js
const p = cf.point({
  position: [116.39, 39.9],
  color: '#FF0000'
})
  .saveState()
  .add();

p.setColor('#00FF00');
p.restoreState();
```

- `show()`: 显示实体.
- `hide()`: 隐藏实体.

```js
const p = cf.point({ position: [116.39, 39.9] }).add();

p.hide();
p.show();
```

- `select()`: 选中当前实体 (触发选中事件).
- `deselect()`: 取消选中 (如果当前选中是自己).

```js
const p = cf.point({ position: [116.39, 39.9] }).add();

p.select();
p.deselect();
```

- `delete()`: 删除实体 (销毁).

```js
const p = cf.point({ position: [116.39, 39.9] }).add();

p.delete();
```

- `update(options)`: 批量更新属性.

```js
const p = cf.point({
  position: [116.39, 39.9],
  color: '#FF0000'
}).add();

p.update({
  color: '#00FFFF',
  pixelSize: 16
});
```

- `draggable(enable)`: 开启/关闭拖拽功能 (Boolean).

```js
cf.point({ position: [116.39, 39.9] })
  .draggable(true)
  .add();
```

- `flash(enable, duration, options)`: 开启/关闭闪烁效果（动画能力，具体用法见动画相关文档）.

## 事件监听 (Event Listeners)

支持链式绑定多种交互事件，回调函数中第一个参数为实体实例本身 (`e`)，支持继续调用 `update` 等方法。

### 支持的事件类型
- `'click'`: 鼠标左键点击
- `'hover'`: 鼠标悬停 (进入/离开)
- `'dragstart'`: 开始拖拽
- `'drag'`: 拖拽中
- `'dragend'`: 结束拖拽
- `'select'`: 被选中
- `'unselect'`: 取消选中

### 代码示例

#### 点击事件 (Click)
```js
const p = cf.point({
  position: [116.39, 39.9],
  color: '#FF0000'
})
  .on('click', (e) => {
    console.log('Clicked:', e.id);
    // 链式更新属性
    e.update({
      color: '#00FF00',
      pixelSize: 20
    });
  })
  .add();
```

#### 悬停事件 (Hover)
回调函数接收两个参数：`(e, isHover)`，`isHover` 为 `true` 表示移入，`false` 表示移出。

```js
cf.point({ position: [116.39, 39.9] })
  .on('hover', (e, isHover) => {
    if (isHover) {
      e.setScale(1.5); // 移入放大
    } else {
      e.setScale(1.0); // 移出恢复
    }
  })
  .add();
```

#### 拖拽事件 (Drag)
需先开启 `.draggable(true)`。`drag` 事件回调接收三个参数：`(e, position)`，`position` 为当前拖拽到的 `[lng, lat]`。

```js
cf.point({ position: [116.39, 39.9] })
  .draggable(true)
  .on('dragstart', (e) => {
    e.setColor('#FFFF00'); // 拖拽开始变黄
    console.log('Start dragging');
  })
  .on('drag', (e, pos) => {
    // pos 为 [lng, lat] 数组
    console.log('Dragging to:', pos);
  })
  .on('dragend', (e) => {
    e.setColor('#FF0000'); // 拖拽结束恢复红色
    console.log('End dragging at:', e.position);
  })
  .add();
```

#### 选中与取消选中 (Select & Unselect)
当实体被点击并成为“当前选中项”时触发。

```js
cf.point({ position: [116.39, 39.9] })
  .on('select', (e) => {
    e.setOutline(true, '#00FFFF', 4); // 选中显示高亮边框
  })
  .on('unselect', (e) => {
    e.setOutline(false); // 取消选中隐藏边框
  })
  .add();
```

#### 解绑事件 (Off)
```js
const handler = (e) => { console.log('Clicked'); };

// 绑定
p.on('click', handler);

// 解绑特定回调
p.off('click', handler);
```
