# 文本标签实体（LabelEntity）

文本标签实体用于在三维地球上展示文字信息，例如设备名称、告警文案、数值读数等。  
在 CesiumFriendlyPlugin 中，标签与点位/广告牌一样，提供统一入口、链式 API 和独立的数据源管理。

## 快速上手

```js
// 初始化插件（可以直接传 viewer，内部会自动推断 Cesium）
cf.init(viewer);

// 创建一个基础文本标签
const label = cf.label({
  position: [116.39, 39.9, 0],
  text: '摄像头 A',
  fontSize: 16
}).add();
```

典型链式用法：

```js
cf.label({
  position: [116.39, 39.9],
  text: '北京·在线',
  group: 'camera'
})
  .setFontSize(18)
  .setBold(true)
  .setBackgroundColor('rgba(0,0,0,0.6)')
  .setColor('#00FFCC')
  .setPixelOffset(0, -30)
  .setClampToGround(true)
  .add();
```

## 核心设计

- 独立数据源  
  所有标签统一挂载在名为 `cesium-friendly-labels` 的 DataSource 上，便于统一管理与批量操作。

- 文本与样式分离  
  文本内容、字体、描边、背景、缩放等配置在 `LabelEntity` 内部管理，而位置、高度、距离感知等通用属性由几何基类统一处理。

- 高度感知显示  
  支持通过 `setDisplayHeightRange` 控制标签在不同相机高度下的可见性，内部通过高度监听器自动更新。

- 统一链式 API  
  和 point/billboard 完全一致的链式风格：`cf.label().setXXX().on('click', handler).add()`。

- 状态可保存与恢复  
  支持 `saveState()/restoreState()` 保存/恢复当前样式，方便实现选中高亮、临时状态切换。

## 能力概览（不含动画）

- 文本与样式  
  支持文本内容、字体大小与粗细、描边与背景、缩放、对齐方式、屏幕偏移等。

- 位置与高度  
  支持 `[lng, lat, alt]` 位置、贴地/相对地表高度、`heightOffset` 抬升等。

- 距离与显示控制  
  支持基于相机高度/距离的显示控制、随距离缩放、随距离透明度变化、像素偏移随距离缩放等。

- 状态与分组  
  支持 `group` 分组管理、TTL/过期时间、显隐控制、删除等。

- 交互能力  
  支持点击、悬停、拖拽、选中/取消选中等事件，回调中可继续 `e.update()` 修改自身。

## 方法列表 (Label Entity Methods)

`LabelEntity` 支持的 `set` 方法及常用操作方法（本节只列非动画相关能力；动画效果单独在其它文档中说明）。

## 文本与样式 (Text & Style)

- `setText(text)`: 设置显示的文本内容。

```js
cf.label({
  position: [116.39, 39.9],
  text: '原始名称'
})
  .setText('更新后的名称')
  .add();
```

- `setFont(font)`: 设置完整 CSS 字体字符串（如 `"18px sans-serif"`）。

```js
cf.label({ position: [116.39, 39.9], text: '自定义字体' })
  .setFont('20px "Microsoft YaHei"')
  .add();
```

- `setFontSize(size)`: 设置字体大小（像素）。

```js
cf.label({ position: [116.39, 39.9], text: '字体大小' })
  .setFontSize(20)
  .add();
```

- `setBold(enable)`: 设置是否粗体。

```js
cf.label({ position: [116.39, 39.9], text: '状态：正常' })
  .setBold(true)
  .add();
```

- `setStyle(style)`: 设置填充样式（'FILL' | 'OUTLINE' | 'FILL_AND_OUTLINE'）。

```js
cf.label({ position: [116.39, 39.9], text: '描边文字' })
  .setStyle('FILL_AND_OUTLINE')
  .add();
```

- `setColor(color)`: 设置文本填充颜色。

```js
cf.label({ position: [116.39, 39.9], text: '在线' })
  .setColor('#00FF00')
  .add();
```

- `setOutlineColor(color)`: 设置描边颜色。

```js
cf.label({ position: [116.39, 39.9], text: '报警' })
  .setOutlineColor('#FF0000')
  .add();
```

- `setOutlineWidth(width)`: 设置描边宽度（像素）。

```js
cf.label({ position: [116.39, 39.9], text: '高亮文字' })
  .setOutlineWidth(3)
  .add();
```

- `setBackgroundColor(color)`: 设置背景颜色（自动打开背景显示）。

```js
cf.label({ position: [116.39, 39.9], text: '带背景的标签' })
  .setBackgroundColor('rgba(0,0,0,0.6)')
  .add();
```

- `setScale(scale)`: 设置整体缩放。

```js
cf.label({ position: [116.39, 39.9], text: '放大的标签' })
  .setScale(1.5)
  .add();
```

- `setPixelOffset(x, y)`: 设置屏幕像素偏移。

```js
cf.label({ position: [116.39, 39.9], text: '偏移标签' })
  .setPixelOffset(0, -40)
  .add();
```

- `setEyeOffset(x, y, z)`: 设置眼睛坐标偏移（用于微调深度排序）。

```js
cf.label({ position: [116.39, 39.9], text: '前置标签' })
  .setEyeOffset(0, 0, -10)
  .add();
```

- `setHorizontalOrigin(origin)`: 设置水平对齐 ('CENTER', 'LEFT', 'RIGHT')。

```js
cf.label({ position: [116.39, 39.9], text: '左对齐' })
  .setHorizontalOrigin('LEFT')
  .add();
```

- `setVerticalOrigin(origin)`: 设置垂直对齐 ('CENTER', 'BOTTOM', 'TOP', 'BASELINE')。

```js
cf.label({ position: [116.39, 39.9], text: '顶对齐' })
  .setVerticalOrigin('TOP')
  .add();
```

## 位置与几何 (Position & Geometry)

- `setPosition(position)`: 设置位置 `[lng, lat, alt]`。

```js
const label = cf.label({
  position: [116.39, 39.9],
  text: '初始位置'
}).add();

label.setPosition([121.47, 31.23, 50]);
```

- `setHeight(height)`: 设置高度偏移（米）。

```js
cf.label({
  position: [116.39, 39.9, 0],
  text: '离地 50 米'
})
  .setHeight(50)
  .add();
```

- `setHeightReference(reference)`: 设置高度参考（'none' | 'clampToGround' | 'relativeToGround'）。

```js
cf.label({
  position: [116.39, 39.9],
  text: '相对地表'
})
  .setHeightReference('relativeToGround')
  .setHeight(30)
  .add();
```

- `setClampToGround(enable)`: 开启/关闭贴地模式。

```js
cf.label({
  position: [116.39, 39.9, 0],
  text: '贴地标签'
})
  .setClampToGround(true)
  .add();
```

## 显示控制 (Display Control)

- `setDisplayCondition({ min, max })`: 设置基于相机高度的显示范围（米，继承自 BaseEntity）。

```js
cf.label({ position: [116.39, 39.9], text: '只在中视距可见' })
  .setDisplayCondition({ min: 1000, max: 100000 })
  .add();
```

- `setDisplayHeightRange(min, max)`: 使用高度监听器控制显示范围。

```js
cf.label({ position: [116.39, 39.9], text: '只在近距离显示' })
  .setDisplayHeightRange(0, 5000)
  .add();
```

- `setDistanceDisplayCondition({ near, far })`: 设置基于距离的显示条件。

```js
cf.label({ position: [116.39, 39.9], text: '远处隐藏' })
  .setDistanceDisplayCondition({ near: 1000, far: 800000 })
  .add();
```

- `setScaleByDistance({ near, nearValue, far, farValue })`: 设置随距离缩放。

```js
cf.label({ position: [116.39, 39.9], text: '近大远小' })
  .setScaleByDistance({
    near: 1000,
    nearValue: 2,
    far: 800000,
    farValue: 0.5
  })
  .add();
```

- `setTranslucencyByDistance({ near, nearValue, far, farValue })`: 设置随距离透明度变化。

```js
cf.label({ position: [116.39, 39.9], text: '远处渐隐' })
  .setTranslucencyByDistance({
    near: 1000,
    nearValue: 1,
    far: 800000,
    farValue: 0.1
  })
  .add();
```

- `setPixelOffsetScaleByDistance({ near, nearValue, far, farValue })`: 设置随距离像素偏移缩放。

```js
cf.label({ position: [116.39, 39.9], text: '带偏移提示' })
  .setPixelOffset(0, -30)
  .setPixelOffsetScaleByDistance({
    near: 1000,
    nearValue: 1.0,
    far: 800000,
    farValue: 0.3
  })
  .add();
```

- `setDisableDepthTestDistance(distance)`: 设置深度检测失效距离（防止被地形遮挡）。

```js
cf.label({ position: [116.39, 39.9], text: '不被地形遮挡' })
  .setDisableDepthTestDistance(1000000)
  .add();
```

## 状态与生命周期 (State & Lifecycle)

- `setGroup(groupName)`: 修改实体所属组。

```js
cf.label({ position: [116.39, 39.9], text: '告警标签' })
  .setGroup('alarm')
  .add();
```

- `setTTL(ms)`: 设置存活时间（毫秒），过期后自动删除。

```js
cf.label({ position: [116.39, 39.9], text: '临时提示 60 秒' })
  .setTTL(60000)
  .add();
```

- `setExpiresAt(timestamp)`: 设置过期时间戳。

```js
const expiresAt = Date.now() + 5 * 60 * 1000;

cf.label({ position: [116.39, 39.9], text: '5 分钟内有效' })
  .setExpiresAt(expiresAt)
  .add();
```

- `saveState()`: 保存当前状态。  
- `restoreState()`: 恢复保存的状态。

```js
const label = cf.label({
  position: [116.39, 39.9],
  text: '正常',
  color: '#00FF00'
})
  .saveState()
  .add();

label.setText('告警').setColor('#FF0000');
label.restoreState();
```

- `show()`: 显示实体。  
- `hide()`: 隐藏实体。

```js
const label = cf.label({ position: [116.39, 39.9], text: '可隐藏标签' }).add();

label.hide();
label.show();
```

- `select()`: 选中当前实体（触发选中事件）。  
- `deselect()`: 取消选中（如果当前选中是自己）。

```js
const label = cf.label({ position: [116.39, 39.9], text: '可选中标签' }).add();

label.select();
label.deselect();
```

- `delete()`: 删除实体（销毁）。

```js
const label = cf.label({ position: [116.39, 39.9], text: '待删除标签' }).add();

label.delete();
```

- `update(options)`: 批量更新属性。

```js
const label = cf.label({
  position: [116.39, 39.9],
  text: '初始化',
  color: '#FFFFFF'
}).add();

label.update({
  text: '更新后的文本',
  color: '#00FFFF',
  fontSize: 18
});
```

- `draggable(enable)`: 开启/关闭拖拽功能。

```js
cf.label({
  position: [116.39, 39.9],
  text: '可拖拽标签'
})
  .draggable(true)
  .add();
```

- `flash(enable, duration, options)`: 开启/关闭闪烁效果（动画能力，具体用法见动画相关文档）。

## 事件监听 (Event Listeners)

- `on(type, handler)`: 绑定事件（如 'click', 'hover', 'drag'）。  
- `off(type, handler)`: 解绑事件。

回调函数中第一个参数为实体实例本身 (`e`)，支持继续调用 `update` 等方法。

### 支持的事件类型

- `'click'`: 鼠标左键点击
- `'hover'`: 鼠标悬停（进入/离开）
- `'dragstart'`: 开始拖拽
- `'drag'`: 拖拽中
- `'dragend'`: 结束拖拽
- `'select'`: 被选中
- `'unselect'`: 取消选中

### 代码示例

#### 点击事件 (Click)

```js
const label = cf.label({
  position: [116.39, 39.9],
  text: '点击切换状态',
  color: '#00FF00'
})
  .on('click', (e) => {
    // 在回调里直接使用 e.update 继续链式更新
    e.update({
      text: '已点击',
      color: '#FF8800'
    });
  })
  .add();
```

#### 悬停事件 (Hover)

回调函数接收两个参数：`(e, isHover)`，`isHover` 为 `true` 表示移入，`false` 表示移出。

```js
cf.label({
  position: [116.39, 39.9],
  text: '悬停高亮'
})
  .on('hover', (e, isHover) => {
    if (isHover) {
      e.setScale(1.3);
      e.setBackgroundColor('rgba(0,0,0,0.8)');
    } else {
      e.setScale(1.0);
      e.setBackgroundColor('rgba(0,0,0,0.4)');
    }
  })
  .add();
```

#### 拖拽事件 (Drag)

需先开启 `.draggable(true)`。`drag` 事件回调接收两个参数：`(e, position)`，`position` 为当前拖拽到的 `[lng, lat]`。

```js
cf.label({
  position: [116.39, 39.9],
  text: '拖动我'
})
  .draggable(true)
  .on('dragstart', (e) => {
    e.setColor('#FFFF00');
  })
  .on('drag', (e, pos) => {
    console.log('Label dragging to:', pos);
  })
  .on('dragend', (e) => {
    e.setColor('#FFFFFF');
  })
  .add();
```

#### 选中与取消选中 (Select & Unselect)

当实体被点击并成为“当前选中项”时触发。

```js
cf.label({
  position: [116.39, 39.9],
  text: '可选中标签'
})
  .on('select', (e) => {
    e.setBackgroundColor('rgba(0,128,255,0.8)');
  })
  .on('unselect', (e) => {
    e.setBackgroundColor('rgba(0,0,0,0.5)');
  })
  .add();
```

#### 解绑事件 (Off)

```js
const label = cf.label({
  position: [116.39, 39.9],
  text: '解绑示例'
}).add();

const handler = (e) => {
  e.setColor('#FF0000');
};

label.on('click', handler);
label.off('click', handler);
```
