# Cesium Friendly Plugin - 实体 API 完整示例

本文档详细展示了新版实体 API（`cf.entity`）的两种主要使用模式：**配置对象模式 (Options Object)** 和 **链式调用模式 (Method Chaining)**。

所有实体均支持统一的入口 `cf.entity.xxx(id, options)`。

---

## 1. Point Entity (点位)

### 模式一：配置对象 (完整参数)

在创建时通过 `options` 对象一次性配置所有属性。

```javascript
const point = cf.entity.point('pt_full_001', {
    // --- 基础定位 ---
    position: [120.123, 30.456, 100], // [经度, 纬度, 高度]
    heightReference: 'none',          // 高度模式: 'none'(绝对高度), 'clampToGround'(贴地), 'relativeToGround'(相对地面)
    
    // --- 样式属性 ---
    color: 'rgba(255, 0, 0, 1)',      // 颜色 (支持 CSS 字符串, rgba, hex)
    pixelSize: 15,                    // 点的像素大小
    opacity: 1.0,                     // 整体不透明度 (0.0 - 1.0)
    
    // --- 边框样式 ---
    outline: true,                    // 是否显示外边框
    outlineColor: '#FFFFFF',          // 边框颜色
    outlineWidth: 2,                  // 边框宽度
    
    // --- 视距控制 (可选) ---
    // distanceDisplayCondition: [0, 5000], // [近距离可见, 远距离不可见]
    // scaleByDistance: { near: 100, nearValue: 1.0, far: 10000, farValue: 0.5 }, // 随距离缩放
    // disableDepthTestDistance: 5000,      // 在 5000米内关闭深度检测(防止被地形遮挡)

    // --- 元数据 ---
    name: '测试点位',
    description: '这是一个通过配置对象创建的点',
    group: 'default_group'
}).add(); // 必须调用 add() 才能显示
```

### 模式二：链式调用 (动态构建)

先创建基础实体，再通过方法逐步设置属性。适用于动态逻辑或分步构建。

```javascript
const pointChain = cf.entity.point('pt_chain_001')
    .setPosition([120.125, 30.456, 150]) // 设置位置
    .setColor('#00FF00')                 // 设置颜色
    .setPixelSize(20)                    // 设置大小
    .setOutline(true, '#FFFF00', 3)      // 设置边框 (开启, 颜色, 宽度)
    .setOpacity(0.8)                     // 设置透明度
    .setHeightReference('relativeToGround') // 设置相对高度模式
    .add();                              // 添加到场景

// 后续依然可以继续链式修改
setTimeout(() => {
    pointChain
        .setColor('#0000FF')
        .flash(true); // 开启闪烁
}, 2000);
```

---

## 2. Billboard Entity (广告牌/图标)

### 模式一：配置对象 (完整参数)

```javascript
const billboard = cf.entity.billboard('bb_full_001', {
    // --- 基础属性 ---
    position: [120.128, 30.456, 100],
    imageUrl: './assets/marker.png',  // 图片 URL
    
    // --- 变换属性 ---
    scale: 1.5,                       // 缩放比例
    rotation: 45,                     // 旋转角度 (度)
    width: 32,                        // 强制指定宽度 (可选)
    height: 32,                       // 强制指定高度 (可选)
    
    // --- 颜色混合 ---
    color: '#FFFFFF',                 // 颜色混合 (默认白色即原图)
    opacity: 1.0,                     // 透明度
    
    // --- 对齐与偏移 ---
    horizontalOrigin: 'CENTER',       // 水平锚点: 'CENTER', 'LEFT', 'RIGHT'
    verticalOrigin: 'BOTTOM',         // 垂直锚点: 'CENTER', 'BOTTOM', 'TOP'
    pixelOffset: [0, -10],            // 屏幕空间偏移 [x, y]
    eyeOffset: [0, 0, -5],            // 眼睛坐标系偏移 (用于微调遮挡关系)
    
    // --- 高级控制 ---
    sizeInMeters: false,              // 大小是否单位为米 (true则随地图缩放物理大小)
    disableDepthTestDistance: Number.POSITIVE_INFINITY // 始终开启深度检测(false), 或设置距离
}).add();
```

### 模式二：链式调用 (动态构建)

```javascript
const bbChain = cf.entity.billboard('bb_chain_001')
    .setPosition([120.130, 30.456, 100])
    .setImage('./assets/icon_default.png')
    .setScale(1.0)
    .setRotation(0)
    .add();

// 模拟交互：鼠标悬停变大并换图
// bbChain
//     .setScale(2.0)
//     .setImage('./assets/icon_hover.png')
//     .setPixelOffset(0, -20);
```

---

## 3. Label Entity (文字标签)

### 模式一：配置对象 (完整参数)

```javascript
const label = cf.entity.label('lbl_full_001', {
    // --- 基础内容 ---
    position: [120.133, 30.456, 120],
    text: '核心区域\nLevel 1',        // 文本内容 (支持 \n 换行)
    font: 'bold 24px Microsoft YaHei', // CSS 字体字符串
    
    // --- 字体样式 ---
    style: 'FILL_AND_OUTLINE',        // 'FILL', 'OUTLINE', 'FILL_AND_OUTLINE'
    fillColor: '#FFFFFF',             // 填充颜色
    outlineColor: '#000000',          // 描边颜色
    outlineWidth: 4,                  // 描边宽度
    
    // --- 背景框 ---
    showBackground: true,             // 是否显示背景
    backgroundColor: 'rgba(0,0,0,0.5)', // 背景颜色
    backgroundPadding: [10, 5],       // 背景内边距 [x, y]
    
    // --- 对齐与偏移 ---
    horizontalOrigin: 'LEFT',         // 文本左对齐
    verticalOrigin: 'BASELINE',       // 垂直基线对齐
    pixelOffset: [10, 0],             // 偏移
    
    // --- 视距缩放 ---
    scaleByDistance: { 
        near: 1000,   // 近处距离
        nearValue: 1.5, // 近处缩放倍率
        far: 10000,   // 远处距离
        farValue: 0.5   // 远处缩放倍率
    }
}).add();
```

### 模式二：链式调用 (动态构建)

```javascript
const lblChain = cf.entity.label('lbl_chain_001')
    .setPosition([120.135, 30.456, 120])
    .setText('Loading...')
    .setFont('16px sans-serif')
    .setFillColor('#CCCCCC')
    .add();

// 异步更新数据
// setTimeout(() => {
//     lblChain
//         .setText('数据加载完成')
//         .setFillColor('#00FF00')
//         .setFont('20px bold sans-serif');
// }, 1000);
```

---

## 4. 组合模式 (Composition)

这是新架构的核心优势。通过链式调用的 `label()` 和 `billboard()` 方法，可以将组件挂载到任意实体上。

**场景：创建一个带图标、文字说明和底部指示点的复合实体**

```javascript
// 1. 创建主实体 (通常用作位置锚点)
const composite = cf.entity.point('comp_full', {
    position: [120.140, 30.456, 0],
    color: 'rgba(255,255,0,0.5)', // 半透明黄色圆点作为地面指示
    pixelSize: 10,
    outline: false
});

// 2. 挂载广告牌 (配置对象模式)
composite.billboard({
    image: './assets/camera.png',
    width: 32,
    height: 32,
    pixelOffset: [0, -20] // 悬浮在点上方
});

// 3. 挂载文字标签 (配置对象模式)
composite.label({
    text: '监控设备 #03',
    font: '14px sans-serif',
    style: 'FILL',
    fillColor: '#FFFFFF',
    showBackground: true,
    backgroundColor: 'rgba(0,0,0,0.8)',
    pixelOffset: [0, -50] // 悬浮在图标上方
});

// 4. 最后添加到场景
composite.add();

// 5. 统一操作
// composite.setOpacity(0.5); // 同时影响点、图标、文字的透明度
// composite.destroy();       // 统一销毁
```
