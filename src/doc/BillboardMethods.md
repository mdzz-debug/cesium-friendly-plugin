# 广告牌实体方法列表 (Billboard Entity Methods)

`BillboardEntity` 支持的 `set` 方法及常用操作方法。

## 样式设置 (Style Setters)
- `setImage(url)`: 设置图片 URL (String).
- `setScale(scale)`: 设置缩放比例 (Number).
- `setRotation(degree)`: 设置旋转角度 (度数).
- `setColor(color)`: 设置颜色 (CSS颜色字符串, 如 '#FF0000', 'rgba(255,0,0,0.5)').
- `setOpacity(opacity)`: 设置透明度 (0.0 - 1.0).
- `setImageWidth(width)`: 设置图片宽度 (px).
- `setImageHeight(height)`: 设置图片高度 (px).
- `setSizeInMeters(enable)`: 设置是否以米为单位计算大小 (Boolean).
- `setHorizontalOrigin(origin)`: 设置水平对齐 ('CENTER', 'LEFT', 'RIGHT').
- `setVerticalOrigin(origin)`: 设置垂直对齐 ('CENTER', 'BOTTOM', 'TOP', 'BASELINE').
- `setPixelOffset(x, y)`: 设置屏幕像素偏移.
- `setEyeOffset(x, y, z)`: 设置眼睛坐标偏移 (用于微调深度排序).

## 位置与几何 (Position & Geometry)
- `setPosition(position)`: 设置位置 [lng, lat, alt].
- `setHeight(height)`: 设置高度偏移 (米).
- `setHeightReference(reference)`: 设置高度参考 ('none', 'clampToGround', 'relativeToGround').
- `setClampToGround(enable)`: 开启/关闭贴地模式.

## 显示控制 (Display Control)
- `setDisplayCondition({ min, max })`: 设置基于相机高度的显示范围 (米).
- `setDistanceDisplayCondition({ near, far })`: 设置基于距离的显示条件.
- `setScaleByDistance({ near, nearValue, far, farValue })`: 设置随距离缩放.
- `setTranslucencyByDistance({ near, nearValue, far, farValue })`: 设置随距离透明度变化.
- `setPixelOffsetScaleByDistance({ near, nearValue, far, farValue })`: 设置随距离像素偏移缩放.
- `setDisableDepthTestDistance(distance)`: 设置深度检测失效距离 (防止地形遮挡).

## 状态与生命周期 (State & Lifecycle)
- `setGroup(groupName)`: 修改实体所属组.
- `setTTL(ms)`: 设置存活时间 (毫秒)，过期后自动删除.
- `setExpiresAt(timestamp)`: 设置过期时间戳.
- `saveState()`: 保存当前状态 (用于撤销/重置).
- `restoreState()`: 恢复保存的状态.
- `show()`: 显示实体.
- `hide()`: 隐藏实体.
- `delete()`: 删除实体 (销毁).
- `update(options)`: 批量更新属性.
- `draggable(enable)`: 开启/关闭拖拽功能 (Boolean).
- `flash(enable, duration, options)`: 开启/关闭闪烁效果.

## 事件 (Events)
- `on(type, handler)`: 绑定事件 (如 'click', 'hover').
- `off(type, handler)`: 解绑事件.
