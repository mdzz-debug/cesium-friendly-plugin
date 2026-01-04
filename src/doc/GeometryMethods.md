# SmartGeometryEntity 使用说明

- 统一几何实体：通过一个类生成并切换多种几何图形
- 支持形态切换与少量参数组合：圆 ⇄ 球，圆/椭圆扇形（半圆、四分之一圆），圆柱 ⇄ 圆锥，椭圆 ⇄ 椭球体等
- 需先初始化插件：`CesiumFriendlyPlugin.init(Cesium, viewer)`

## 支持的几何
- 点：point
- 线：polyline
- 折线体：polylineVolume
- 面：polygon
- 圆（含椭圆别名，2D/3D）：circle
- 矩形：rectangle
- 走廊：corridor
- 盒子：box
- 圆柱/圆锥：cylinder、cone
- 球/椭球体（3D）：circle（3D 模式，等价于 sphere/ellipsoid）
- 墙：wall

## 基本用法
- 创建统一几何实体（工厂）：

```js
const cf = CesiumFriendlyPlugin;
const g = cf.geometry({ position: [111, 40, 200000] });
```

- 通用方法
  - shape(kind): 设定形态（如 'circle'、'ellipse'、'sphere'、'cylinder' 等）
  - mode(dim): '2d' 或 '3d'（例如 circle 在 3d 下变为 sphere）
  - radius(r) / radii(x, y, z) / semiAxes(major, minor)
  - rotation(angle, axis) / rotationDeg(deg, axis): 旋转角度（弧度/度）及轴向（'X', 'Y', 'Z'）
  - setOpacity(alpha) // 设置材质透明度（0~1）
  - extrude(height) // 挤出高度
  - setHeight(height) // 设置离地高度（自动处理贴地模式）
  - material(m), outline(enabled, color, width)
  - add(), update()

## 圆 ⇄ 扇形 ⇄ 椭圆 ⇄ 球

```js
// 圆（2D）
const circle = cf.geometry({ position: [111, 40, 200000] })
  .shape('circle').mode('2d').radius(300000)
  .material('green').setOpacity(0.4)
  .outline(true, 'blue', 1)
  .add();

// 半圆（扇形）
circle.sectorHalf(0).update();
// 四分之一圆（扇形）
circle.sectorQuarter(0).update();
// 特殊角度扇形：从 15° 开始，扫过 135°
circle.sector(15, 135).update();

// 椭圆（2D，ellipse 为 circle 的别名）
circle.shape('circle').semiAxes(400000, 250000).rotationDeg(30).update();

// 球（3D）
circle.shape('circle').mode('3d').radius(300000).update();

// 3D 垂直角切割（maximumCone）：贴地半球/球冠
// 用法一：度数参数（startDeg, sweepDeg, verticalCutDeg, samples?）
circle
  .shape('circle').mode('3d').radius(300000)
  .sector(0, 360, 90)      // 垂直角 90° => 半球
  .update();

// 用法二：对象参数（支持 maximumCone/vertical）
circle
  .shape('circle').mode('3d').radii(300000, 300000, 300000)
  .sectorDeg({ start: 0, sweep: 360, maximumCone: 60 }) // 60° 球冠
  .update();
```

## 圆柱 ⇄ 圆锥

```js
const cyl = cf.geometry({ position: [100, 40, 200000] })
  .shape('cylinder').length(400000).bottomRadius(200000).topRadius(200000)
  .material('green')
  .outline(true, 'darkgreen', 1)
  .add();

// 变成圆锥（顶半径为 0）
cyl.shape('cone').length(400000).bottomRadius(200000).update();

// 圆锥尖朝下（底半径为 0，顶半径为实值）
cyl.shape('cone').length(400000).topRadius(200000).bottomRadius(0).update();
```

## 折线体 polylineVolume

```js
function circleShape(r) {
  const pts = [];
  for (let i = 0; i < 360; i++) {
    const rad = Cesium.Math.toRadians(i);
    pts.push(new Cesium.Cartesian2(r * Math.cos(rad), r * Math.sin(rad)));
  }
  return pts;
}

const pv = cf.geometry({})
  .shape('polylineVolume')
  .polylinePositions(Cesium.Cartesian3.fromDegreesArray([85,32, 85,36, 89,36]))
  .volumeShape(circleShape(60000))
  .material('red')
  .add();
```

## 面 polygon（含挤出）

```js
cf.geometry({})
  .shape('polygon')
  .polygonHierarchy(Cesium.Cartesian3.fromDegreesArray([
    115, 37,
    115, 32,
    107, 33,
    102, 31,
    102, 35
  ]))
  .material('red')
  .outline(true, 'red', 1)
  .extrude(200000)
  .add();
```

## 椭球/球体（circle 3D 模式）

```js
// 球体（3D 模式下的 circle）
cf.geometry({ position: [107, 40, 300000] })
  .shape('circle').mode('3d')
  .radius(300000)
  .material('red')
  .outline(true, '#000', 1)
  .add();

// 椭球体（3D 模式下的 circle）
cf.geometry({ position: [114, 40, 300000] })
  .shape('circle').mode('3d')
  .radii(200000, 200000, 300000)
  .material('blue')
  .add();

// 椭球体 + 垂直角切割（maximumCone）
cf.geometry({ position: [114, 40, 300000] })
  .shape('circle').mode('3d')
  .radii(300000, 300000, 300000)
  .sectorDeg({ start: 0, sweep: 120, vertical: 75 }) // 水平扇区 + 垂直切割
  .material('purple')
  .outline(true, '#333', 1)
  .add();
```

## 线/走廊/矩形/墙

```js
// 线
cf.geometry({})
  .shape('polyline')
  .polylinePositions(Cesium.Cartesian3.fromDegreesArray([75,35, 125,35]))
  .material('red')
  .update()
  .add();

// 走廊
cf.geometry({})
  .shape('corridor')
  .corridorPositions(Cesium.Cartesian3.fromDegreesArray([100,40, 105,40, 105,35]))
  .corridorWidthSet(200000)
  .material('red')
  .outline(true, 'red', 1)
  .add();

// 矩形
cf.geometry({})
  .shape('rectangle')
  .rectangleCoordinatesSet(Cesium.Rectangle.fromDegrees(80, 20, 110, 25))
  .material('red')
  .outline(true, 'red', 1)
  .add();

// 墙
cf.geometry({})
  .shape('wall')
  .wallPositions([
    [107.0, 43.0, 100000.0],
    [97.0, 43.0, 100000.0],
    [97.0, 40.0, 100000.0],
    [107.0, 40.0, 100000.0],
    [107.0, 43.0, 100000.0]
  ])
  .material('green')
  .add();
```

## 盒子 box

```js
cf.geometry({ position: [100, 30, 0] })
  .shape('box')
  .dimensions(100000, 50000, 50000)
  .material('orange')
  .add();
```

## 旋转与轴向控制
支持所有几何实体的旋转，可指定旋转角度和旋转轴（X/Y/Z）。
对于 Wall、Polygon、Polyline 等非原生支持旋转的几何，插件会自动计算顶点变换。

```js
// 创建一个墙并旋转
// 注意：旋转需要指定中心点 position 作为旋转轴心
const wall = cf.geometry({ position: [102.5, 40, 0] })
  .shape('wall')
  .wallPositions([
    [100, 40, 50000],
    [105, 40, 50000]
  ])
  .material('red')
  .add();

// 绕 Z 轴旋转 45 度
wall.rotationDeg(45, 'Z').update();

// 绕 X 轴旋转 90 度
wall.rotationDeg(90, 'X').update();

// 链式调用
wall.rotationDeg(30, 'Y').update();
```

提示：
- 若未显式设置轴向，rotationDeg 默认等价于 rotationDeg(0, 'X')
- 椭圆（ellipse）在 2D 模式同样支持 rotationDeg 旋转与动画
- 往复/循环动画会保持用户设置的旋转轴，不会在收缩阶段切换

## 动画支持
使用 animate(duration, options?) 定义动画上下文，再用 update({ 属性: 目标值 }) 启动动画。
支持 loop（往返）、repeat（重复）与 easing（easeInOut/linear/easeIn/easeOut）。

```js
// 让几何体旋转起来
const entity = cf.geometry({ position: [100, 40, 0] })
  .shape('box').dimensions(100000, 50000, 50000)
  .material('blue')
  .add();

// 往复动画：持续 5 秒，A→B→A
entity.animate(5000, { loop: true });
entity.update({ rotationAngle: Math.PI * 2 });

// 椭圆绕 Z 轴连续旋转（保留用户轴向设置）
const ellipse = cf.geometry({ position: [111, 40, 200000] })
  .shape('ellipse').semiAxes(400000, 250000)
  .rotationDeg(0, 'Z')
  .add();
ellipse.animate(6000, { loop: true });
ellipse.update({ rotationAngle: Math.PI * 2 });
```
