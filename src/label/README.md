# 文字标签 (Label) API 使用说明

文字标签（Label）用于在地图上展示文字信息，支持颜色、背景色、视点偏移、以及基于相机高度的显示控制。

## 快速开始

```javascript
// 初始化
cf.init(Cesium, viewer);

// 添加一个简单的文字标签
cf.label.add({
  position: [116.3974, 39.9093],
  text: '北京',
  color: '#FFFFFF',
  backgroundColor: '#000000',
  scale: 1.0
});
```

## 创建与管理

### 单个创建 `cf.label.add(options)`

创建并返回一个 `Label` 实例。

**参数 `options` 对象：**

| 属性 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `position` | Array | 是 | - | `[lng, lat, height?]` 经纬度及高度 |
| `text` | String | 是 | `''` | 标签文字内容 |
| `color` | String | 否 | `#FFFFFF` | 文字颜色 |
| `backgroundColor` | String | 否 | - | 背景颜色（若不填则无背景） |
| `scale` | Number | 否 | `1.0` | 缩放比例 |
| `font` | String | 否 | `14px sans-serif` | 字体样式 |
| `style` | String | 否 | `FILL` | 样式 (`FILL`, `OUTLINE`, `FILL_AND_OUTLINE`) |
| `pixelOffset` | Array | 否 | `[0, 0]` | 像素偏移 `[x, y]` |
| `eyeOffset` | Array | 否 | `[0, 0, 0]` | 视点偏移 `[x, y, z]` (3D空间中的偏移) |
| `heightReference` | String | 否 | `clampToGround` | 高度模式 (`none`, `clampToGround`, `relativeToGround`) |
| `heightOffset` | Number | 否 | `0` | 相对地面的高度偏移量 |
| `minDisplayHeight` | Number | 否 | `0` | 最小显示高度（相机高度小于此值不显示） |
| `maxDisplayHeight` | Number | 否 | `Infinity` | 最大显示高度（相机高度大于此值不显示） |
| `group` | String | 否 | - | 分组名称 |

### 批量创建 `cf.label.addMultiple(list, shared)`

```javascript
cf.label.addMultiple([
  { position: [116.1, 39.9], text: 'A' },
  { position: [116.2, 39.9], text: 'B' }
], {
  color: '#FFFF00',
  scale: 1.2
});
```

## 实例方法

创建 Label 实例后，支持链式调用修改属性。

### 基础属性修改

```javascript
const label = cf.label.add({ ... });

// 修改文字
label.setText('新文字');

// 修改颜色
label.setColor('#FF0000');

// 修改背景色 (传 null 移除背景)
label.setBackgroundColor('rgba(0,0,0,0.5)');

// 修改字体大小
label.setFontSize(20);

// 设置加粗
label.setBold(true);

// 修改缩放
label.setScale(1.5);
```

### 位置与高度控制

```javascript
// 设置高度 (自动处理贴地/相对高度逻辑)
// 如果当前是贴地模式，设置高度后会自动转为相对高度模式
label.setHeight(100);

// 设置是否贴地
label.setClampToGround(true); // 贴地
label.setClampToGround(false); // 绝对高度模式

// 设置像素偏移 (屏幕空间)
label.setPixelOffset(10, -10);

// 设置视点偏移 (3D空间)
label.setEyeOffset(0, 0, -100);

// 更新经纬度位置
label.updatePosition([120.0, 30.0]);
```

### 可见性控制

```javascript
// 设置可见高度范围 (相机高度在此范围内时显示)
label.setDisplayHeightRange(1000, 50000);

// 设置分组
label.setGroup('主要地标');
```

### 销毁

```javascript
label.destroy();
```

## 高度监听功能

Label 组件内置了高度监听功能，可以根据相机距离地面的高度自动控制标签的显示与隐藏。

```javascript
const label = cf.label.add({
  position: [116.3, 39.9],
  text: '高度敏感标签',
  minDisplayHeight: 1000,   // 相机高度 > 1000米 时显示
  maxDisplayHeight: 50000   // 相机高度 < 50000米 时显示
});

// 动态修改
label.setDisplayHeightRange(2000, 10000);
```

## 事件监听

Label 支持独立的事件监听（不依赖默认的点位交互逻辑）。

```javascript
const label = cf.label.add({ ... });

label.on('click', (instance) => {
  console.log('点击了标签', instance);
});

// 手动触发
label.trigger('customEvent');
```
