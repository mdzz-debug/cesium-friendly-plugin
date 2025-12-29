# 全局方法列表 (Global Methods)

`CesiumFriendlyPlugin` (通常别名为 `cf`) 提供的全局方法。

## 初始化与基础
- `init(cesium, viewer, options)`: 初始化插件。
- `getCesium()`: 获取 Cesium 核心对象。
- `getViewer()`: 获取 Viewer 实例。

## 实体管理
- `get(id)`: 获取指定 ID 的实体。
- `getAll()`: 获取所有实体（返回 EntityGroup，支持链式操作）。
- `remove(idOrPoint)`: 移除指定实体。
- `delete(idOrPoint)`: 移除指定实体（`remove` 的别名）。
- `removeAll()`: 移除所有实体。
- `updatePosition(id, position)`: 更新指定实体的经纬度位置。

### 组操作 (Group Operations)
不再提供全局的 `showGroup`/`hideGroup` 方法，请使用链式调用：
```javascript
// 获取组并进行操作
cf.getGroup('myGroup').hide();
cf.getGroup('myGroup').show();
cf.getGroup('myGroup').delete(); // 移除组内所有实体
cf.getGroup('myGroup').setColor('red');
```

## 交互与选择
- `select(idOrPoint)`: 选中指定实体（触发选中事件）。
- `deselect()`: 取消当前选中。
- `getSelected()`: 获取当前选中的实体。

## 地球与相机控制
- `flyTo(position, orientation, duration)`: 相机飞向指定位置。
- `flyAndOrbit(position, orientation, duration, cycles)`: 飞向并环绕目标点旋转。
- `getCurrentCamera()`: 获取当前相机参数。
- `setSurfaceOpacity(opacity)`: 设置地表透明度。
- `setDepthTest(enabled)`: 开启/关闭深度检测。
