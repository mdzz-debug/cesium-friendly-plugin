# 广告牌 Billboard

创建时间: 2025年12月23日
上线版本号: V1.0.0
状态: 进行中

| **功能** | **是否实现** | **实现方法** | **版本** |
| --- | --- | --- | --- |
| 添加广告牌 | ✅ | billboard.add({ position: [..], imageUrl: 'url' }) | V1.0.0 |
| 添加临时广告牌 | ✅ | billboard.add({...}).setTTL(ms)/setExpiresAt(timestamp) | V1.0.0 |
| 添加多个广告牌 | ✅ | billboard.addMultiple([list], options) | V1.0.0 |
| 分组 | ✅ | billboard.add({...}).setGroup( typeof String ) | V1.0.0 |
| 颜色 | ✅ | billboard.add({...}).setColor('white') | V1.0.0 |
| 缩放 | ✅ | billboard.add({...}).setScale(1.0) | V1.0.0 |
| 旋转 | ✅ | billboard.add({...}).setRotation(90) | V1.0.0 |
| 设置图片 | ✅ | billboard.add({...}).setImage('url') | V1.0.0 |
| 设置信息 | ✅ | billboard.add({...}).setInfo( typeof Object { info } ) | V1.0.0 |
| 是否贴地 | ✅ | billboard.add({...}).setClampToGround(默认 `true`) | V1.0.0 |
| 距离地面高度 | ✅ | billboard.add({...}).setHeight( typeof Number ) | V1.0.0 |
| 透明度 | ✅ | billboard.add({...}).setOpacity(1.0) | V1.0.0 |
| 显示/隐藏 | ✅ | billboard.add({...}).show()/hide() | V1.0.0 |
| 是否拖拽 | ✅ | billboard.add({...}).setDraggable(true) | V1.0.0 |
| 更新位置 | ✅ | billboard.add({...}).updatePosition([坐标*]) | V1.0.0 |
| 保存状态 | ✅ | billboard.add({...}).saveState() | V1.0.0 |
| 恢复状态 | ✅ | billboard.add({...}).restoreState() | V1.0.0 |
|  |  |  |  |
| 点击事件 | ✅ | billboard.add({...}).on('click', (e) => { 点击事件 }) | V1.0.0 |
| hover事件 | ✅ | billboard.add({...}).on('hover', (e) => { hover 事件 }) | V1.0.0 |
| 拖拽开始 | ✅ | billboard.add({...}).on('dragstart', (e) => { dragstart 事件 }) | V1.0.0 |
| 拖拽中 | ✅ | billboard.add({...}).on('drag', (e) => { drag 事件 }) | V1.0.0 |
| 拖拽结束 | ✅ | billboard.add({...}).on('dragend', (e) => { dragend 事件 }) | V1.0.0 |
| 选中事件 | ✅ | billboard.add({...}).on('select', (e) => { 选中事件 }) | V1.0.0 |
| 取消选中事件 | ✅ | billboard.add({...}).on('unselect', (e) => { 取消选中事件 }) | V1.0.0 |
| 事件解绑 | ✅ | billboard.add({...}).off('事件') | V1.0.0 |
|  |  |  |  |
| 设置闪烁 | ✅ | billboard.add({...}).setFlash(true, 2000, { minOpacity: 0.0, maxOpacity: this.opacity }) | V1.0.0 |
|  |  |  |  |
| 获取信息 | ✅ | b.getInfo() / billboard.get(id) | V1.0.0 |
| 删除广告牌 (单独) | ✅ | billboard.remove(id \|\| Billboard) | V1.0.0 |
| 删除广告牌 (全部) | ✅ | billboard.removeAll() | V1.0.0 |
| 删除广告牌 (组) | ✅ | billboard.removeGroup('分组名称') | V1.0.0 |
|  |  |  |  |
