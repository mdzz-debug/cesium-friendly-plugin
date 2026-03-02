# 材质与框架缺口清单

## 一、材质还缺少的主要能力（优先级从高到低）

1. 生命周期销毁与资源回收  
问题：材质若绑定时钟/监听（如流动材质），实体删除后可能残留监听。  
建议：实现统一 `disposeMaterial(material, context)`，在 `remove/removeGroup/removeAll` 链路调用。

2. 参数校验与语义错误提示  
问题：材质参数输入错误时，当前提示不够明确。  
建议：为每种材质建立 schema（类型、范围、默认值、必填），统一输出中文警告。

3. Primitive 材质通道  
问题：当前以 Entity/Geometry 为主，高级效果与性能场景会受限。  
建议：新增 `primitive material adapter`，支持与现有 registry 复用。

4. 预设材质扩展不足  
问题：仅 `solid/flow/water`，常见业务效果不够。  
建议：补齐 `pulse/radar/scanline/heat`。

5. 材质动画事件粒度不足  
问题：只有通用动画回调，材质调试不够直观。  
建议：增加可选 `onMaterialUpdate(entity, uniforms, progress)`。

6. 文档与示例覆盖不够  
问题：材质参数、兼容范围、性能建议还不完整。  
建议：README 增加“支持矩阵+推荐参数+禁用组合”。

## 二、我认为当前框架还缺少的关键点

1. 查询与修改闭环增强  
现状：已有 `queryInfo/removeByQuery`，但缺批量更新。  
建议：新增 `updateByQuery(query, patch)` 与 dry-run 模式。

2. 统一能力矩阵  
现状：实体、几何、模型在 `distance/scale/translucency` 的支持差异较大。  
建议：维护一份 runtime capability map，并在调用时做自动提示或降级实现。

3. 动画系统分层  
现状：几何动画、材质动画、变换动画都在同一套状态管线里，后续复杂度会增高。  
建议：分成 `transform track`、`style track`、`material track`，统一调度器。

4. 诊断能力  
现状：有 debug 但不够结构化。  
建议：增加 `cfProxy.debug.snapshot()` 输出实体数、活动动画数、材质实例数、监听数。

5. 数据源扩展口落地  
现状：GeoJSON 已有，Geoserver 预留。  
建议：定义 provider 协议文档（load/update/dispose/style-mapping）并补一个 mock provider 示例。

## 三、推荐下一步迭代顺序

1. 材质销毁与资源回收  
2. 材质 schema 校验与中文错误提示  
3. 新增 `pulse/radar` 两个预设并补 demo  
4. `updateByQuery` 批量修改能力  
5. debug snapshot 诊断面板（先控制台版）
