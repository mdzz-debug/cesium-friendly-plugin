# Cesium Friendly Plugin 概览 (Overview)

**让 Cesium 开发像写 jQuery 一样简单、流畅。**  
**Make Cesium development as simple and fluid as jQuery.**

`cesium-friendly-plugin` 是一个专为 CesiumJS 设计的轻量级封装库，旨在解决原生 API 繁琐、样板代码多、状态管理困难等痛点。它提供了一套符合现代直觉的**链式调用 (Chained API)**、**事件驱动 (Event Driven)** 和 **生命周期管理 (Lifecycle Management)** 机制。

---

## 核心特性 (Core Features)

### 1. 极简链式调用 (Fluent Chained API)
告别深层嵌套的配置对象，使用直观的链式方法构建实体。

**Before (Native Cesium):**
```js
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.9),
  point: {
    pixelSize: 10,
    color: Cesium.Color.RED,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2
  }
});
```

**After (Cesium Friendly):**
```js
cf.point({ position: [116.39, 39.9] })
  .setColor('#FF0000')
  .setPixelSize(10)
  .setOutline(true, '#FFFFFF', 2)
  .add();
```

### 2. 强大的事件系统 (Powerful Event System)
内置交互事件支持，无需手动处理 `ScreenSpaceEventHandler`。

```js
cf.point({ position: [116.39, 39.9] })
  .on('click', (e) => {
    e.flash(); // 点击闪烁
    console.log('Clicked:', e.id);
  })
  .on('hover', (e, isHover) => {
    e.setScale(isHover ? 1.5 : 1.0); // 悬停放大
  })
  .add();
```

### 3. 完整的生命周期 (Full Lifecycle & CRUD)
将实体的管理抽象为 **增 (Add)**、**删 (Delete)**、**改 (Update)**、**查 (Query)** 四大核心操作。

- **Add**: `.add()`
- **Delete**: `.delete()`
- **Update**: `.update({ color: 'blue' })` 或链式 `.setColor('blue').update()`
- **Query**: `cf.point.query({ group: 'camera' })`

### 4. 智能几何体 (Smart Geometry)
不仅仅是点，还支持 **广告牌 (Billboard)**、**标签 (Label)**、**圆 (Circle)**、**矩形 (Rectangle)** 等多种几何体，且接口风格高度统一。

```js
// 创建广告牌
cf.billboard({ position: [116.40, 39.9], image: 'icon.png' }).add();

// 创建圆
cf.circle({ position: [116.40, 39.9], radius: 1000 }).setColor('#00FF00').add();
```

### 5. 状态与分组管理 (State & Grouping)
支持按组批量控制显隐、销毁，支持 TTL (存活时间) 和状态保存/恢复。

```js
// 批量隐藏
cf.point.getGroup('monitor-units').hide();

// 自动销毁 (5秒后)
cf.point({ position: [...] }).setTTL(5000).add();
```

---

## 为什么选择它？ (Why Choose It?)

| 特性 | 原生 Cesium (Native) | Cesium Friendly Plugin |
| :--- | :--- | :--- |
| **代码量** | 冗长，配置项多 | **减少 70%+**，简洁直观 |
| **学习曲线** | 陡峭，需理解 Property 机制 | **平缓**，符合 JS 直觉 |
| **交互开发** | 需手动计算坐标、绑定 Handler | **开箱即用**，自动处理拾取 |
| **状态维护** | 需自行维护 Entity 引用 | **内置管理器**，ID/Group 索引 |
| **类型提示** | 依赖 JSDoc | **友好**，参数语义清晰 |

---

## 适用场景 (Use Cases)

- **智慧城市 (Smart City)**: 大量设备点位（摄像头、传感器）的快速上图与交互。
- **轨迹监控 (Tracking)**: 实时更新位置与状态，无需频繁创建销毁。
- **数据大屏 (Dashboard)**: 结合 Vue/React 快速构建三维可视化大屏。
- **快速原型 (Prototyping)**: 几分钟内验证 GIS 想法与效果。
