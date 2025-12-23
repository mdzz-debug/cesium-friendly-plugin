# 点位 Point

创建时间: 2025年12月15日 16:06
上线版本号: V1.0.0
状态: 进行中

| **功能** | **是否实现** | **实现方法** | **版本** |
| --- | --- | --- | --- |
| 添加点位 | ✅ | point.add([坐标*]) | V1.0.0 |
| 添加临时点位 | ✅ | point.add([坐标*]).setTTL(ms)/setExpiresAt(timestamp) | V1.0.1 |
| 添加多个点位 | ✅ | point.addMultiple([list], options) | V1.0.0 |
| 分组 | ✅ | point.add([坐标*]).setGroup( typeof String ) | V1.0.0 |
| 颜色 | ✅ | point.setColor(’white’) | V1.0.0 |
| 设置点位信息 | ✅ | point.add([坐标*]).setInfo( typeof Object { info } ) | V1.0.0 |
| 是否贴地 | ✅ | point.add([坐标*]).setClampToGround(默认 `true`) | V1.0.0 |
| 距离地面高度 | ✅ | point.add([坐标*]).setHeight( typeof Number ) | V1.0.0 |
| 点位大小 | ✅ | point.add([坐标*]).setPixelSize( typeof Number ) | V1.0.0 |
| 外边框 | ✅ | point.add([坐标*]).setOutline(true, 'black', 10) | V1.0.0 |
| 透明度 | ✅ | point.add([坐标*]).setOpacity(0.8) | V1.0.0 |
| 显示/隐藏 | ✅ | point.add([坐标*]).show()/hide() | V1.0.0 |
| 是否拖拽 | ✅ | point.add([坐标*]).setDraggable(true) | v1.0.1 |
| 更新位置 | ✅ | point.add([坐标*]).updatePosition([坐标*]) | V1.0.1 |
| 显示标签 | ✅ | point.add([坐标*]).showLabel(options) | V1.0.1 |
| 隐藏标签 | ✅ | point.add([坐标*]).hideLabel() | V1.0.1 |
| 更新标签 | ✅ | point.add([坐标*]).updateLabel(options) | V1.0.1 |
| 保存状态 | ✅ | point.add([坐标*]).saveState() | V1.0.1 |
| 恢复状态 | ✅ | point.add([坐标*]).restoreState() | V1.0.1 |
|  |  |  |  |
| 点击事件 | ✅ | point.add([坐标*]).on(’click’, (e) ⇒ { 点击事件 }) | V1.0.0 |
| hover事件 | ✅ | point.add([坐标*]).on(’hover’, (e) ⇒ { hover 事件 }) | V1.0.0 |
| 拖拽开始 | ✅ | point.add([坐标*]).on(’dragstart’, (e) ⇒ { dragstart 事件 }) | V1.0.1 |
| 拖拽中 | ✅ | point.add([坐标*]).on(’drag’, (e) ⇒ { drag 事件 }) | V1.0.1 |
| 拖拽结束 | ✅ | point.add([坐标*]).on(’dragend’, (e) ⇒ { dragend 事件 }) | V1.0.1 |
| 选中事件 | ✅ | point.add([坐标*]).on(’select’, (e) ⇒ { 选中事件 }) | V1.0.0 |
| 取消选中事件 | ✅ | point.add([坐标*]).on(’unselect’, (e) ⇒ { 取消选中事件 }) | V1.0.1 |
| 事件解绑 | ✅ | point.add([坐标*]).off(‘事件’) | V1.0.1 |
|  |  |  |  |
| 设置闪烁 | ✅ | point.add([坐标*]).setFlash(true, 2000, { minOpacity: 默认 `0.0` ,maxOpacity: 默认 `this.opacity` }) | V1.0.0 |
|  |  |  |  |
| 获取点位信息 | ✅ | p.getInfo() / point.get(id) | V1.0.0 |
| 删除点位 (单独) | ✅ | point.remove(`id || Point`) | V1.0.0 |
| 删除点位 (全部) | ✅ | point.removeAll() | V1.0.0 |
| 删除点位 (组) | ✅ | point.removeGroup('分组名称') | V1.0.0 |
|  |  |  |  |