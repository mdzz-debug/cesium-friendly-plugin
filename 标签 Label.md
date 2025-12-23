# 标签 Label

创建时间: 2025年12月23日
上线版本号: V1.0.0
状态: 进行中

| **功能** | **是否实现** | **实现方法** | **版本** |
| --- | --- | --- | --- |
| 添加标签 | ✅ | label.add({ position: [..], text: 'abc' }) | V1.0.0 |
| 添加多个标签 | ✅ | label.addMultiple([list], options) | V1.0.0 |
| 分组 | ✅ | label.add({...}).setGroup( typeof String ) | V1.0.0 |
| 文字内容 | ✅ | label.add({...}).setText('text') | V1.0.0 |
| 文字颜色 | ✅ | label.add({...}).setColor('white') | V1.0.0 |
| 背景颜色 | ✅ | label.add({...}).setBackgroundColor('black') | V1.0.0 |
| 字体大小 | ✅ | label.add({...}).setFontSize(14) | V1.0.0 |
| 字体加粗 | ✅ | label.add({...}).setBold(true) | V1.0.0 |
| 字体样式 | ✅ | label.add({...}).setFont('14px sans-serif') | V1.0.0 |
| 缩放 | ✅ | label.add({...}).setScale(1.0) | V1.0.0 |
| 像素偏移 | ✅ | label.add({...}).setPixelOffset(x, y) | V1.0.0 |
| 视点偏移 | ✅ | label.add({...}).setEyeOffset(x, y, z) | V1.0.0 |
| 是否贴地 | ✅ | label.add({...}).setClampToGround(默认 `true`) | V1.0.0 |
| 距离地面高度 | ✅ | label.add({...}).setHeight( typeof Number ) | V1.0.0 |
| 深度检测 | ✅ | label.add({...}).setDisableDepthTestDistance(false) | V1.0.0 |
| 按高度显示 | ✅ | label.add({...}).setDisplayHeightRange(min, max) | V1.0.0 |
| 更新位置 | ✅ | label.add({...}).updatePosition([坐标*]) | V1.0.0 |
|  |  |  |  |
| 点击事件 | ✅ | label.add({...}).on('click', (e) => { ... }) | V1.0.0 |
| 事件解绑 | ✅ | label.add({...}).off('事件') | V1.0.0 |
| 手动触发事件 | ✅ | label.add({...}).trigger('事件') | V1.0.0 |
|  |  |  |  |
| 获取信息 | ❌ | 暂无 getInfo 方法 (可用 label.get(id)) | - |
| 显示/隐藏 | ❌ | 暂无 show/hide 方法 (可通过 entity 操作) | - |
| 拖拽 | ❌ | 暂不支持拖拽 | - |
| 保存状态 | ❌ | 暂无 saveState | - |
| 恢复状态 | ❌ | 暂无 restoreState | - |
| 闪烁 | ❌ | 暂无 setFlash | - |
| 生命周期 | ❌ | 暂无 setTTL / setExpiresAt | - |
| 删除标签 (单独) | ✅ | label.remove(id \|\| Label) | V1.0.0 |
| 删除标签 (全部) | ✅ | label.removeAll() | V1.0.0 |
| 删除标签 (组) | ✅ | label.removeGroup('分组名称') | V1.0.0 |
