# 广告牌实体（BillboardEntity）

广告牌实体用于在三维地球上展示各种图片图标，例如摄像头图标、告警标识、设备状态图标等。  
在 CesiumFriendlyPlugin 中，广告牌与点位类似：提供统一的创建入口、链式 API，以及独立的数据源管理。

## 快速上手

```js
// 初始化插件（可以直接传 viewer，内部会自动推断 Cesium）
cf.init(viewer);

// 创建一个基础广告牌
const b = cf.billboard({
  position: [116.39, 39.9, 0],
  image: '/assets/camera.png',
  scale: 1.0
}).add();
```

典型链式用法：

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/alert.png',
  name: '告警点 A'
})
  .setScale(1.3)
  .setRotation(45)
  .setPixelOffset(0, -20)
  .setClampToGround(true)
  .add();
```

## 核心设计

- 独立数据源  
  所有广告牌统一挂载在名为 `cesium-friendly-billboards` 的 DataSource 上，方便统一管理与批量操作。

- 图片输入适配  
  支持字符串 URL、`new URL()`、`import`/`require` 结果、对象的 `src/href/default/value` 等多种输入形式。

- 样式与位置分离  
  位置、高度等统一由几何基类管理，图片缩放、对齐、偏移等由 `BillboardEntity` 专门处理。

- 状态可保存与恢复  
  支持 `saveState()/restoreState()` 保存/恢复一整套图片样式配置，方便选中高亮、交互动画。

- 统一交互模型  
  与点位一致，支持点击、悬停、拖拽、选中/取消选中等事件，以及 TTL、显示条件等能力。

## 能力概览（不含动画）

- 图片与样式  
  支持图片 URL、缩放、旋转、透明度、颜色叠加、像素宽高、是否按米为单位等。

- 位置与高度  
  支持 `[lng, lat, alt]` 位置、贴地/相对地表高度、`heightOffset` 抬升等。

- 距离感知与显示控制  
  支持基于相机高度和相机距离的显示控制、随距离缩放、随距离透明度变化、像素偏移随距离缩放等。

- 状态与分组  
  支持 `group` 分组管理、状态保存/恢复、TTL/过期时间、显隐控制、删除等。

- 交互能力  
  支持拖拽、点击与悬停等事件绑定，并与全局选中状态联动。

## 方法列表 (Billboard Entity Methods)

`BillboardEntity` 支持的 `set` 方法及常用操作方法（本节只列非动画相关能力；动画效果单独在其它文档中说明）。

## 样式设置 (Style Setters)

- `setImage(url)`: 设置图片 URL (String 或 URL / import 结果)。

```js
cf.billboard({ position: [116.39, 39.9] })
  .setImage('/assets/camera.png')
  .add();
```

- `setScale(scale)`: 设置缩放比例 (Number)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
  .setScale(1.5)
  .add();
```

- `setRotation(degree)`: 设置旋转角度 (度数)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/arrow.png'
})
  .setRotation(90)
  .add();
```

- `setColor(color)`: 设置颜色叠加 (CSS 颜色字符串，如 '#FF0000' 或 'rgba(255,0,0,0.5)')。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/light.png'
})
  .setColor('rgba(0,255,0,0.8)')
  .add();
```

- `setOpacity(opacity)`: 设置透明度 (0.0 - 1.0)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/logo.png'
})
  .setOpacity(0.6)
  .add();
```

- `setImageWidth(width)`: 设置图片宽度 (px)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/panel.png'
})
  .setImageWidth(80)
  .add();
```

- `setImageHeight(height)`: 设置图片高度 (px)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/panel.png'
})
  .setImageHeight(60)
  .add();
```

- `setSizeInMeters(enable)`: 设置是否以米为单位计算大小 (Boolean)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/flag.png'
})
  .setSizeInMeters(true)
  .add();
```

- `setHorizontalOrigin(origin)`: 设置水平对齐 ('CENTER', 'LEFT', 'RIGHT')。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/label.png'
})
  .setHorizontalOrigin('LEFT')
  .add();
```

- `setVerticalOrigin(origin)`: 设置垂直对齐 ('CENTER', 'BOTTOM', 'TOP', 'BASELINE')。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/label.png'
})
  .setVerticalOrigin('TOP')
  .add();
```

- `setPixelOffset(x, y)`: 设置屏幕像素偏移。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/pin.png'
})
  .setPixelOffset(0, -30)
  .add();
```

- `setEyeOffset(x, y, z)`: 设置眼睛坐标偏移 (用于微调深度排序)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/icon.png'
})
  .setEyeOffset(0, 0, 2)
  .add();
```

## 位置与几何 (Position & Geometry)

- `setPosition(position)`: 设置位置 [lng, lat, alt]。

```js
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
}).add();

b.setPosition([121.47, 31.23, 80]);
```

- `setHeight(height)`: 设置高度偏移 (米)。

```js
cf.billboard({
  position: [116.39, 39.9, 0],
  image: '/assets/camera.png'
})
  .setHeight(50)
  .add();
```

- `setHeightReference(reference)`: 设置高度参考 ('none', 'clampToGround', 'relativeToGround')。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
  .setHeightReference('relativeToGround')
  .setHeight(20)
  .add();
```

- `setClampToGround(enable)`: 开启/关闭贴地模式。

```js
cf.billboard({
  position: [116.39, 39.9, 0],
  image: '/assets/camera.png'
})
  .setClampToGround(true)
  .add();
```

## 显示控制 (Display Control)

- `setDisplayCondition({ min, max })`: 设置基于相机高度的显示范围 (米)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
  .setDisplayCondition({ min: 1000, max: 100000 })
  .add();
```

- `setDistanceDisplayCondition({ near, far })`: 设置基于距离的显示条件。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
  .setDistanceDisplayCondition({ near: 1000, far: 800000 })
  .add();
```

- `setScaleByDistance({ near, nearValue, far, farValue })`: 设置随距离缩放。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
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
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
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
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/tooltip.png'
})
  .setPixelOffset(0, -40)
  .setPixelOffsetScaleByDistance({
    near: 1000,
    nearValue: 1.0,
    far: 800000,
    farValue: 0.3
  })
  .add();
```

- `setDisableDepthTestDistance(distance)`: 设置深度检测失效距离 (防止地形遮挡)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/marker.png'
})
  .setDisableDepthTestDistance(1000000)
  .add();
```

## 状态与生命周期 (State & Lifecycle)

- `setGroup(groupName)`: 修改实体所属组。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
  .setGroup('alarm')
  .add();
```

- `setTTL(ms)`: 设置存活时间 (毫秒)，过期后自动删除。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/temp.png'
})
  .setTTL(60000)
  .add();
```

- `setExpiresAt(timestamp)`: 设置过期时间戳。

```js
const expiresAt = Date.now() + 5 * 60 * 1000;

cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/temp.png'
})
  .setExpiresAt(expiresAt)
  .add();
```

- `saveState()`: 保存当前状态 (用于撤销/重置)。  
- `restoreState()`: 恢复保存的状态。

```js
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/light-off.png'
})
  .saveState()
  .add();

b.setImage('/assets/light-on.png');
b.restoreState();
```

- `show()`: 显示实体。  
- `hide()`: 隐藏实体。

```js
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
}).add();

b.hide();
b.show();
```

- `select()`: 选中当前实体 (触发选中事件)。  
- `deselect()`: 取消选中 (如果当前选中是自己)。

```js
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
}).add();

b.select();
b.deselect();
```

- `delete()`: 删除实体 (销毁)。

```js
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/trash.png'
}).add();

b.delete();
```

- `update(options)`: 批量更新属性。

```js
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera-off.png'
}).add();

b.update({
  image: '/assets/camera-on.png',
  scale: 1.2
});
```

- `draggable(enable)`: 开启/关闭拖拽功能 (Boolean)。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
  .draggable(true)
  .add();
```

- `flash(enable, duration, options)`: 开启/关闭闪烁效果（动画能力，具体用法见动画相关文档）。

## 事件监听 (Event Listeners)

- `on(type, handler)`: 绑定事件 (如 'click', 'hover', 'drag')。  
- `off(type, handler)`: 解绑事件。

回调函数中第一个参数为实体实例本身 (`e`)，支持继续调用 `update` 等方法。

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
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera-off.png'
})
  .on('click', (e) => {
    e.update({
      image: '/assets/camera-on.png',
      scale: 1.2
    });
  })
  .add();
```

#### 悬停事件 (Hover)

回调函数接收两个参数：`(e, isHover)`，`isHover` 为 `true` 表示移入，`false` 表示移出。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/panel.png'
})
  .on('hover', (e, isHover) => {
    if (isHover) {
      e.setScale(1.2);
    } else {
      e.setScale(1.0);
    }
  })
  .add();
```

#### 拖拽事件 (Drag)

需先开启 `.draggable(true)`。`drag` 事件回调接收两个参数：`(e, position)`，`position` 为当前拖拽到的 `[lng, lat]`。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/marker.png'
})
  .draggable(true)
  .on('dragstart', (e) => {
    e.setColor('#FFFF00');
  })
  .on('drag', (e, pos) => {
    console.log('Dragging to:', pos);
  })
  .on('dragend', (e) => {
    e.setColor('#FFFFFF');
  })
  .add();
```

#### 选中与取消选中 (Select & Unselect)

当实体被点击并成为“当前选中项”时触发。

```js
cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
})
  .on('select', (e) => {
    e.setScale(1.3);
  })
  .on('unselect', (e) => {
    e.setScale(1.0);
  })
  .add();
```

#### 解绑事件 (Off)

```js
const b = cf.billboard({
  position: [116.39, 39.9],
  image: '/assets/camera.png'
}).add();

const handler = (e) => {
  e.setScale(1.5);
};

b.on('click', handler);
b.off('click', handler);
```
