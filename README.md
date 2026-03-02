# Cesium Friendly Plugin

`cesium-friendly-plugin` 是一个面向业务开发的 Cesium 封装库，提供统一、语义化、可链式的 API，覆盖点位、广告牌、标签、组合实体、几何实体、模型、材质与数据加载等常见场景。

- 官网: [http://cf.luohao.online/](http://cf.luohao.online/)
- 包名: `cesium-friendly-plugin`
- 当前主版本: `2.0.0`
- License: `MIT`

## 1. 核心特性

- 链式 API 与 Object API 双模式，适配不同团队编码习惯
- 统一事件系统（click/hover/select/drag）与交互反馈
- 动画系统（from/to、easing、loop/yoyo、onUpdate/onComplete）
- 几何能力（circle/rectangle/path/box/cylinder/cone）与扩展几何模式
- 材质系统（solid/flow/water/pulse/radar）及 uniforms 动画
- 数据加载能力（GeoJSON）并预留 GeoServer 扩展入口
- Vue 2 / Vue 3 插件化集成

## 2. 安装

```bash
npm i cesium-friendly-plugin cesium
```

## 3. 快速开始

### 3.1 Vue 3

```js
import { createApp } from 'vue'
import App from './App.vue'
import CesiumFriendly from 'cesium-friendly-plugin'

const app = createApp(App)
app.use(CesiumFriendly)
app.mount('#app')
```

```vue
<script setup>
import { inject, onMounted, ref } from 'vue'
import * as Cesium from 'cesium'

const el = ref(null)
const cf = inject('cf')

onMounted(() => {
  const viewer = new Cesium.Viewer(el.value)
  cf.init(viewer, Cesium)
})
</script>
```

### 3.2 原生 JS

```js
import * as Cesium from 'cesium'
import CesiumFriendly from 'cesium-friendly-plugin'

const viewer = new Cesium.Viewer('map')
const cf = new CesiumFriendly(viewer, Cesium)
```

## 4. 基础用法

```js
cf.point({ id: 'p1', position: [116.39, 39.9] })
  .setColor('#00e5ff')
  .setSize(12)
  .on('click', (e) => console.log(e.id))
  .add()
  .flyTo({ range: 240000, duration: 1.8 })
```

```js
cf.create({
  type: 'billboard',
  id: 'bb1',
  position: [116.4, 39.91, 0],
  image: '/icon.png',
  scale: 1.2
}).add()
```

## 5. API 概览

### 5.1 工厂入口

- `cf.create(options)`
- `cf.point / cf.billboard / cf.label / cf.canvas`
- `cf.circle / cf.rectangle / cf.path / cf.box / cf.cylinder / cf.cone / cf.model`

### 5.2 全局管理

- `cf.get(id)` / `cf.getAll()` / `cf.getByGroup(group)`
- `cf.removeGroup(group)` / `cf.removeAll()`
- `cf.queryInfo(query, options?)` / `cf.removeByQuery(query, options?)`
- `cf.loadGeoJSON(input, options?)`
- `cf.loadData(type, input, options?)`
- `cf.registerDataProvider(type, loader)`

### 5.3 常用公共链式方法

- `add() / remove() / destroy() / update()`
- `show() / hide() / setVisible(boolean)`
- `setPosition(...) / setOpacity(alpha)`
- `setVisibleRange({ near, far })`
- `setScaleByDistance(...)`（点/广告牌/标签/模型）
- `setTranslucencyByDistance(...)`（点/广告牌/标签/模型）
- `setDepthTest(boolean)` / `setDisableDepthTestDistance(distance)`
- `flyTo({ range, height, duration, heading, pitch, orientation })`
- `on(type, handler) / off(type, handler)`

## 6. 动画系统

```js
entity.animate({
  from: { opacity: 1 },
  to: { opacity: 0.3, pixelSize: 20 },
  duration: 1.6,
  yoyo: true,
  loop: true,
  easing: 'easeInOutCubic',
  onUpdate: (e, state, progress) => {},
  onComplete: (e) => {}
})
```

- 统一使用 `onUpdate` 作为过程回调
- `onComplete` 仅在非无限循环场景有意义

## 7. 材质系统

```js
cf.rectangle({
  coordinates: [112.0, 30.0, 112.6, 30.4],
  height: 80000
})
  .setMaterial({ type: 'water', color: '#2f7fd3', opacity: 0.85 })
  .add()
```

支持材质类型：

- `solid`
- `flow`
- `water`
- `pulse`
- `radar`

支持 uniforms 动画（`animate({ to: { material: { uniforms: ... } } })`）。

## 8. 版本说明（2.0）

`2.0.0` 为主版本升级，核心方向：

- 完整链式 API 体系升级
- 几何与材质系统能力增强
- GeoJSON 数据能力与扩展口完善
- 文档与 Demo 体系重构

## 9. 开发与构建

```bash
npm install
npm run build
```

发布前会自动执行 `prepublishOnly` 构建。

