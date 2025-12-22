# Cesium Friendly Plugin

![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)
<!-- [![GitHub](https://img.shields.io/badge/GitHub-Repo-black?logo=github)](https://github.com/mdzz-debug/cesium-friendly-plugin) -->

Cesium 开发伴侣，提供一套友好的链式调用 API，简化 Cesium 原生繁琐的实体管理、事件绑定和交互逻辑。

> **版本 v1.0.1 更新**: 全面增强 **广告牌 (Billboard)** 功能，支持拖拽、旋转、缩放及事件系统；**点位 (Point)** 新增拖拽支持；优化选中/取消选中状态管理。

## 特性

- **链式调用**：`cf.billboard.add(...).setScale(1.5).on('click', ...)`，代码更优雅。
- **自动管理**：内置实体管理器，支持批量操作、分组管理、自动清理。
- **高级交互**：
  - **事件**：Click, Hover, Select, Drag (拖拽) 等。
  - **状态**：自动管理选中/非选中状态恢复，无需手动重置样式。
  - **特效**：呼吸灯闪烁、自动贴地/相对高度模式切换。
- **Vue 集成**：提供开箱即用的 Vue 2/3 插件和组件。

## API 概览

插件提供了**类型专用**的命名空间方法和**全局通用**的方法。

### 1. 类型专用 API (推荐)

命名空间下的方法会自动过滤实体类型，避免误操作。

| 命名空间 | 方法示例 | 说明 |
| :--- | :--- | :--- |
| **`cf.billboard`** | `add`, `get`, `remove` | 仅操作**广告牌** |
| **`cf.point`** | `add`, `get`, `remove` | 仅操作**点位** |

**示例**：
```javascript
// 仅获取所有广告牌（不含点位）
const billboards = cf.billboard.getAll(); 

// 仅移除点位类型的 id（如果该 id 是广告牌，则忽略）
cf.point.remove('some-id'); 
```

### 2. 全局通用 API

用于跨类型的混合操作。

| 方法 | 说明 |
| :--- | :--- |
| **`cf.get(id)`** | 获取任意类型的实体实例 |
| **`cf.getAll()`** | 获取所有实体 |
| **`cf.remove(id)`** | 移除指定 ID 的实体 |
| **`cf.removeAll()`** | 清空所有实体 |
| **`cf.removeGroup(name)`** | 移除指定分组的所有实体 |
| **`cf.select(id)`** | 选中指定实体 |
| **`cf.deselect()`** | 取消当前选中 |

## 安装

```bash
npm install cesium-friendly-plugin
```

## 快速开始

### 1. 引入并初始化

```javascript
import * as Cesium from 'cesium';
import cf from 'cesium-friendly-plugin';

// 假设你已经创建了 viewer
const viewer = new Cesium.Viewer('cesiumContainer');

// 初始化插件
cf.init(Cesium, viewer);
```

### 2. 添加广告牌 (Billboard)

```javascript
cf.billboard.add({
  position: [116.3974, 39.9093],
  imageUrl: '/icons/car.png',
  scale: 1.2,
  draggable: true // 开启拖拽
}).on('click', (b) => {
  console.log('点击了车:', b.id);
  b.setFlash(true); // 开启闪烁
}).on('dragend', (b) => {
  console.log('车辆新位置:', b.position);
});
```

### 3. 添加点位 (Point)

```javascript
cf.point.add([116.40, 39.91])
  .setColor('red')
  .setPixelSize(15)
  .setHeight(100) // 离地 100米
  .setOutline(true, 'white', 2)
  .on('hover', (p, isHover) => {
    p.setPixelSize(isHover ? 20 : 15);
  });
```

## 功能模块文档

- [🖼️ 广告牌 (Billboard) API 文档](./src/billboard/README.md)
  - 图片展示、缩放旋转、拖拽交互、状态管理。
- [📍 点位 (Point) API 文档](./src/point/README.md)
  - 基础点位、样式设置、有效期（TTL）、批量管理。

## Vue 集成

插件会自动识别 Vue 版本（2.x 或 3.x）并注册。

```javascript
// main.js
import { VuePlugin } from 'cesium-friendly-plugin';
app.use(VuePlugin);

// 组件中
this.$cesiumPlugin.billboard.add(...);
```

## 构建

```bash
npm install
npm run build
```

## License

MIT
