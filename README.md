# Cesium Friendly Plugin

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-black?logo=github)](https://github.com/mdzz-debug/cesium-friendly-plugin)

Cesium 开发伴侣，提供一套友好的链式调用 API，简化 Cesium 原生繁琐的实体管理、事件绑定和交互逻辑。

> **版本说明**: 当前版本 `1.0.0` 主要聚焦于 **点位 (Point)** 功能的完善。详情请查阅 [CHANGELOG.md](./CHANGELOG.md)。

## 特性

- **链式调用**：`cf.point.add(...).setColor(...).on('click', ...)`，代码更优雅。
- **自动管理**：内置实体管理器，支持批量操作、分组管理、自动清理。
- **增强交互**：内置点击、悬停、选中事件，支持呼吸灯闪烁、自动贴地等常用功能。
- **Vue 集成**：提供开箱即用的 Vue 2/3 插件和组件。

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

### 2. 添加点位

```javascript
// 创建一个带点击事件的红色点位
cf.point.add([116.3974, 39.9093])
  .setInfo({ name: '北京' })
  .setColor('red')
  .setPixelSize(15)
  .setClampToGround(true) // 自动贴地
  .on('click', (p) => {
    console.log('点击了:', p.getInfo().name);
    p.setFlash(true); // 开启闪烁
  });

// 批量添加
cf.point.addMultiple(
  [
    [116.3, 39.9],
    [116.4, 39.9],
    { position: [116.5, 39.9], color: 'blue' } // 混合配置
  ],
  {
    group: 'MyGroup',
    pixelSize: 10,
    on: {
      hover: (p, isHover) => p.setPixelSize(isHover ? 20 : 10)
    }
  }
);
```

## 功能模块文档

- [📍 点位 (Point) API 文档](./src/point/README.md)
  - 包含：创建、样式设置、事件绑定、分组管理、有效期（TTL）、闪烁特效等。

## Vue 集成

插件会自动识别 Vue 版本（2.x 或 3.x）并注册。

### main.js

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import { VuePlugin } from 'cesium-friendly-plugin';

const app = createApp(App);
app.use(VuePlugin);
app.mount('#app');
```

### 组件中使用

```javascript
// 在组件中通过 this.$cesiumPlugin 或 inject 使用
export default {
  mounted() {
    // 确保 viewer 已经初始化
    const cf = this.$cesiumPlugin;
    
    // 如果插件尚未初始化，可以手动初始化
    // cf.init(Cesium, viewer);
    
    cf.point.add(...);
  }
}
```

## 构建

```bash
npm install
npm run build
```

## License

MIT
