# 点位 API 使用说明

本说明文档覆盖点位创建、链式方法、事件、分组、临时点位（有效期）、批量添加等能力，并配有示例。

## 快速开始
- 初始化插件
```
cf.init(Cesium, viewer)
```
- 创建一个点位（数组或对象均可）
```
const p = cf.point.add([116.3974, 39.9093])
  .setInfo({ name: '天安门' })
  .setColor('#ff0000')
  .setPixelSize(12)
  .setClampToGround(true)
  .setHeight(50); // 贴地抬高 50m
```

## 创建与管理
- `cf.point.add(options | positionArray)` 创建单个点位
  - 支持数组：`[lng, lat, height?]`
  - 支持对象：
    - `position: [lng, lat, height?]`
    - `color`, `pixelSize`, `imageUrl`, `heightReference`, `heightOffset`, `group`, `ttlMs`, `expiresAt`
  - 返回 `Point` 实例（支持链式）
  - 参考实现：`src/point/add.js:24`

- `cf.point.addMultiple(list, shared?)` 批量创建
  - `list` 为点配置数组，支持：
    - 对象数组：`[{ position: [...], name: '...' }, ...]`
    - 坐标数组：`[[lng, lat], [lng, lat, height], ...]`
  - `shared` 为共享配置（如共享事件、TTL、图标等），优先级低于 `list` 中的单项配置
  - 在 `shared.on` 或 `shared.events` 中提供 `{ eventName: handler }`
  - 返回 `Point[]`
  - 参考实现：`src/point/add.js:200`

- `cf.point.get(id)` 获取点位实例  
  - `src/index.js:66` → `src/point/manager.js:92`

- `cf.point.getAll()` 获取所有点位实例数组  
  - `src/index.js:67` → `src/point/manager.js:100`

- `cf.point.remove(idOrPoint)` 删除单个点位（支持传入 id 或 Point 实例）  
  - `src/index.js:68` → `src/point/manager.js:137`

- `cf.point.removeAll()` 删除全部点位  
  - `src/index.js:69` → `src/point/manager.js:179`

- `cf.point.updatePosition(id, [lng, lat, height?])` 更新位置  
  - `src/index.js:70` → `src/point/manager.js:203`

## 分组
- `cf.point.removeGroup(groupName)` 删除某组的全部点位  
  - 设置分组：创建时 `options.group` 或实例上 `setGroup('组名')`
  - `src/index.js:71` → `src/point/manager.js:213`

## 临时点位（有效期）
- 在 `add` 或 `addMultiple` 的配置中：
  - `ttlMs`: 有效期（毫秒），到期自动删除
  - `expiresAt`: 未来时间戳，到期自动删除
  - 参考实现：`src/point/manager.js:116`

## 事件系统
- 支持事件：`click`、`hover`、`select`
- 使用：
```
cf.point.add([lng, lat])
  .on('click', (p) => p.setFlash(true, { duration: 600 }))
  .on('hover', (point, isHover) => point.setOpacity(isHover ? 1.0 : 0.85))
  .on('select', (p) => {/* 选中后联动 */})
```
- 触发逻辑：
  - 点击：触发 `click` 与 `select`（`src/point/manager.js:40–43`）
  - 悬停：进入触发 `hover(true)`，离开触发 `hover(false)`（`src/point/manager.js:69`、`src/point/manager.js:83`）
- 鼠标样式：悬停点位时 `canvas.style.cursor='pointer'`，否则 `default`（`src/point/manager.js:86`）

## 点位实例方法（链式）
- `setInfo(info)` 设置信息（id/name/description 以及任意自定义字段）
  - 自定义字段会合并到 `getInfo().data`，并镜像到 `entity._meta`
  - `src/point/point.js:134`

- `getInfo()` 获取当前点位信息对象  
  - 包含：`id/name/description/position/color/pixelSize/imageUrl/opacity/group/heightReference/heightOffset/data`  
  - `src/point/point.js:147`

- `setColor(color)` 设置颜色  
  - 接受 CSS 颜色字符串（`#rrggbb`、`red`、`rgb(...)`、`rgba(...)`）
  - 普通点：设置 `entity.point.color`
  - 图片点：染色 `entity.billboard.color`（对白底图效果更明显）
  - 透明度由 `setOpacity` 控制  
  - `src/point/point.js:54`

- `setPixelSize(size)` 设置像素点大小  
  - 仅对 `entity.point` 生效  
  - `src/point/point.js:64`

- `setFlash(enable, duration?, options?)` 闪烁（透明度呼吸灯效果）  
  - `duration`: 周期（毫秒），默认 `1000ms`
  - `options.minOpacity`: 最小透明度，默认 `0.0`
  - `options.maxOpacity`: 最大透明度，默认 `this.opacity`
  - `src/point/point.js:174`

- `setIcon(url)` 设置图片点图标  
  - **暂未启用**：方法已清空，后续将单独封装广告牌逻辑
  - `src/point/point.js:76`

- `setGroup(groupName)` 设置分组（支持动态分组更新）  
  - 自动更新管理器中的分组索引，并清理同位置同组旧点
  - `src/point/point.js:170`

- `setOpacity(alpha)` 设置透明度  
  - 影响 `point.color` 或 `billboard.color` 的 alpha  
  - `src/point/point.js:78`

- `setOutline(enable, color?, width?)` 设置点的外边框  
  - 仅普通点有效（`entity.point`）  
  - `src/point/point.js:90`

- `show()` / `hide()` 显示/隐藏  
  - 设置 `entity.show`  
  - `src/point/point.js:97`、`src/point/point.js:102`

- `setClampToGround(clamp?)` 贴地开关  
  - 默认 `true`（开启贴地）
  - 同步 `point.heightReference`/`billboard.heightReference`  
  - `src/point/point.js:107`

- `setHeight(height)` 设置距地高度（相对地面）  
  - 高度值 > 0 时，会自动切换到 `RELATIVE_TO_GROUND` 并立即更新 `entity.position`  
  - `src/point/point.js:116`

- `updatePosition([lng, lat, h?])` 仅更新实例内位置（管理器会在 `updatePointPosition` 中统一更新实体位置）  
  - `src/point/point.js:49`

- `on(type, handler)` / `off(type, handler)` 注册/移除事件  
  - `type`：`click`、`hover`、`select`  
  - `src/point/point.js:28`、`src/point/point.js:33`

## 常见示例
- 贴地点位抬高并加边框：
```
cf.point.add([116.3974, 39.9093])
  .setClampToGround(true)
  .setHeight(80)
  .setColor('#00aaff')
  .setPixelSize(16)
  .setOutline(true, '#ffffff', 2);
```
- 图片点位并染色：
```
cf.point.add({
  position: [116.3974, 39.9093],
  imageUrl: '/icons/pin.png',
  group: 'A',
  ttlMs: 10000
}).setColor('red').setOpacity(0.7);
```
- 批量添加共享事件：
```
cf.point.addMultiple(
  [
    { position: [116.1, 39.1], color: '#f00', group: 'G1' },
    { position: [116.2, 39.2], imageUrl: '/icons/pin.png', group: 'G1' }
  ],
  {
    ttlMs: 15000,
    on: {
      click: (p) => p.setFlash(true, { duration: 600 }),
      hover: (point, isHover) => { /* 高亮或提示 */ }
    }
  }
);
```
- 分组删除：
```
cf.point.removeGroup('G1');
```

## 交互细节
- 点击触发 `click` 与 `select`：`src/point/manager.js:40–43`
- 悬停触发 `hover(true/false)`：`src/point/manager.js:69` 与 `src/point/manager.js:83`
- 悬停指针样式：`src/point/manager.js:86`
