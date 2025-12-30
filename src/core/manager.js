

class PointsManager {
  constructor() {
    this.viewer = null;
    this.cesium = null;
    this.points = new Map(); // Map<id, Point>
    this.clickHandler = null;
    this.moveHandler = null;
    this.groups = new Map();
    this.ttlTimers = new Map();
    this._lastHoverId = null;
    this._selectedId = null;
    this._draggedPoint = null;
    this._isDragging = false;
    this._isMouseDown = false;
    this._dragStartPosition = null;
    this._pendingDragPoint = null;
    this._dragOffset = null; // 拖拽偏移量 (Cartesian3)
    this.selectionListeners = new Set();
    this.rightClickListeners = new Set();
    this._dataSources = new Map(); // Cache for CustomDataSources
  }

  getDataSource(name) {
      if (!this.viewer || !this.cesium) return null;
      
      // 1. Check local cache first
      if (this._dataSources.has(name)) {
          return this._dataSources.get(name);
      }
      
      // 2. Check Viewer (in case created externally or previously)
      const list = this.viewer.dataSources.getByName(name);
      if (list.length > 0) {
          const ds = list[0];
          this._dataSources.set(name, ds);
          return ds;
      }
      
      // 3. Create New
      const ds = new this.cesium.CustomDataSource(name);
      this.viewer.dataSources.add(ds);
      this._dataSources.set(name, ds);
      
      return ds;
  }

  addSelectionListener(callback) {
    this.selectionListeners.add(callback);
  }

  removeSelectionListener(callback) {
    this.selectionListeners.delete(callback);
  }

  addRightClickListener(callback) {
    this.rightClickListeners.add(callback);
  }

  removeRightClickListener(callback) {
    this.rightClickListeners.delete(callback);
  }

  _notifySelectionListeners(point) {
    for (const listener of this.selectionListeners) {
      try {
        listener(point);
      } catch (e) {
        console.error('Error in selection listener:', e);
      }
    }
  }

  _notifyRightClickListeners(point) {
    for (const listener of this.rightClickListeners) {
      try {
        listener(point);
      } catch (e) {
        console.error('Error in right click listener:', e);
      }
    }
  }

  init(cesium, viewer) {
    this.cesium = cesium;
    this.viewer = viewer;
    this.setupClickHandler();
    this.setupMoveHandler();
    this.setupDragHandler();
    this.setupRightClickHandler();
  }

  setupRightClickHandler() {
    if (this.rightClickHandler) return;

    // Prevent default context menu
    this.viewer.scene.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); }, false);

    this.rightClickHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.rightClickHandler.setInputAction((click) => {
      let picks = this.viewer.scene.drillPick(click.position) || [];
      
      let clickedPoint = null;

      for (const picked of picks) {
        let entityId = null;
        if (picked && picked.id && picked.id instanceof this.cesium.Entity) {
          entityId = picked.id.id;
        } else if (picked && typeof picked.id === 'string') {
          entityId = picked.id;
        }

        if (entityId) {
          const point = this.points.get(entityId);
          if (point) {
            clickedPoint = point;
            break; // Prioritize top entity
          }
        }
      }

      if (clickedPoint) {
        this._notifyRightClickListeners(clickedPoint);
      } else {
        // Handle Earth/Globe Click
        const ray = this.viewer.camera.getPickRay(click.position);
        const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        
        if (cartesian) {
          const cartographic = this.cesium.Cartographic.fromCartesian(cartesian);
          const earthPoint = {
            type: 'earth',
            id: 'earth_debug',
            position: {
              lng: this.cesium.Math.toDegrees(cartographic.longitude),
              lat: this.cesium.Math.toDegrees(cartographic.latitude),
              alt: cartographic.height
            },
            viewer: this.viewer,
            cesium: this.cesium
          };
          this._notifyRightClickListeners(earthPoint);
        }
      }
    }, this.cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  setupClickHandler() {
    if (this.clickHandler) {
      return;
    }

    this.clickHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.clickHandler.setInputAction((click) => {
      let picks = this.viewer.scene.drillPick(click.position) || [];
      if (!Array.isArray(picks) || picks.length === 0) {
        const p = this.viewer.scene.pick(click.position);
        picks = p ? [p] : [];
      }
      
      let clickedPoint = null;

      for (const picked of picks) {
        // 尝试获取 Entity ID
        let entityId = null;
        // 1. 如果 picked.id 是 Entity 实例
        if (picked && picked.id && picked.id instanceof this.cesium.Entity) {
          entityId = picked.id.id;
        } 
        // 2. 如果 picked.id 就是字符串 (Primitive 且手动指定了 ID)
        else if (picked && typeof picked.id === 'string') {
          entityId = picked.id;
        }

        if (!entityId) continue;
        
        // 直接从 Map 中获取
        const point = this.points.get(entityId);
        if (point) {
            clickedPoint = point;
            break; // 找到顶层的管理点位即可
        }
      }

      // 处理选中状态切换逻辑
      if (clickedPoint) {
        // 触发点击事件
        clickedPoint.trigger('click', clickedPoint);

        // 如果点击的是不同的点，或者当前没有选中点
        if (this._selectedId !== clickedPoint.id) {
           this.select(clickedPoint);
        }
      } else {
        // 点击空白区域，如果有选中点，则取消选中
        this.deselect();
      }

    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  /**
   * Select a point
   */
  select(point) {
    if (!point) return;
    if (this._selectedId === point.id) return;
    
    this.deselect(); // Unselect current first

    this._selectedId = point.id;
    // Auto save state before selection effects
    if (point.saveState) point.saveState();
    
    point.trigger('select', point);
    this._notifySelectionListeners(point);
  }

  /**
   * Deselect current point
   */
  deselect() {
    if (this._selectedId) {
      const point = this.points.get(this._selectedId);
      if (point) {
        // Auto restore state
        if (point.restoreState) point.restoreState();
        point.trigger('unselect', point);
      }
      this._selectedId = null;
    }
  }

  /**
   * Get current selected ID
   */
  getSelectedId() {
    return this._selectedId;
  }

  /**
   * Get current selected Entity
   */
  getSelectedEntity() {
    return this._selectedId ? this.points.get(this._selectedId) : null;
  }

  setupMoveHandler() {
    if (this.moveHandler) {
      return;
    }
    this.moveHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.moveHandler.setInputAction((movement) => {
      // 1. 检查是否触发拖拽阈值 (从 MOUSE_DOWN 状态转换到 DRAGGING 状态)
      if (this._isMouseDown && !this._isDragging && this._pendingDragPoint && this._dragStartPosition) {
        const dx = movement.endPosition.x - this._dragStartPosition.x;
        const dy = movement.endPosition.y - this._dragStartPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 拖拽阈值 3px
        if (distance > 3) {
           this._startDragging();
        }
      }

      // 2. 处理拖拽逻辑
      if (this._isDragging && this._draggedPoint) {
        let newPos = null;

        // 优先使用拖拽平面（针对有高度的对象，避免视差）
        if (this._dragPlane) {
          const ray = this.viewer.camera.getPickRay(movement.endPosition);
          const intersection = this.cesium.IntersectionTests.rayPlane(ray, this._dragPlane);
          
          if (intersection) {
             // 应用拖拽偏移量，防止跳变
             if (this._dragOffset) {
                // newPosCartesian = intersection + offset
                this.cesium.Cartesian3.add(intersection, this._dragOffset, intersection);
             }

             const cartographic = this.cesium.Cartographic.fromCartesian(intersection);
             const lng = this.cesium.Math.toDegrees(cartographic.longitude);
             const lat = this.cesium.Math.toDegrees(cartographic.latitude);
             // 用户要求：拖拽时只返回 [lng, lat]，去除第三位 0（高度由内部状态管理）
             newPos = [lng, lat];
          }
        }

        // 降级方案：使用 Globe pick (针对贴地对象或平面相交失败)
        if (!newPos) {
          const ray = this.viewer.camera.getPickRay(movement.endPosition);
          const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
          
          if (cartesian) {
            // 注意：贴地拖拽通常不需要 offset，或者 offset 计算复杂（涉及高度投影），暂不应用 offset
            const cartographic = this.cesium.Cartographic.fromCartesian(cartesian);
            const lng = this.cesium.Math.toDegrees(cartographic.longitude);
            const lat = this.cesium.Math.toDegrees(cartographic.latitude);
            // 用户要求：拖拽时只返回 [lng, lat]，去除第三位 0
            newPos = [lng, lat];
          }
        }

        if (newPos) {
          // 更新管理器中的实体位置
          this.updateEntityPosition(this._draggedPoint.id, newPos);
          // 触发 drag 事件
          this._draggedPoint.trigger('drag', this._draggedPoint, newPos);
        }
        return;
      }

      let picks = this.viewer.scene.drillPick(movement.endPosition) || [];
      if (!Array.isArray(picks) || picks.length === 0) {
        const p = this.viewer.scene.pick(movement.endPosition);
        picks = p ? [p] : [];
      }
      let hoveredId = null;
      for (const picked of picks) {
        let entityId = null;
        if (picked && picked.id && picked.id instanceof this.cesium.Entity) {
          entityId = picked.id.id;
        } else if (picked && typeof picked.id === 'string') {
          entityId = picked.id;
        }

        if (entityId) {
          const point = this.points.get(entityId);
          if (point) {
            hoveredId = point.id;
            if (this._lastHoverId !== point.id) {
              point.trigger('hover', point, true);
              if (this._lastHoverId && this.points.get(this._lastHoverId)) {
                const prev = this.points.get(this._lastHoverId);
                prev.trigger('hover', prev, false);
              }
              this._lastHoverId = point.id;
            }
            break;
          }
        }
      }
      const canvas = this.viewer.scene.canvas;
      if (hoveredId) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      if (!hoveredId && this._lastHoverId && this.points.get(this._lastHoverId)) {
        const prev = this.points.get(this._lastHoverId);
        prev.trigger('hover', prev, false);
        this._lastHoverId = null;
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  setupDragHandler() {
    if (this.dragHandler) return;
    this.dragHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // LEFT_DOWN: Prepare for dragging (wait for threshold)
    this.dragHandler.setInputAction((click) => {
      const picked = this.viewer.scene.pick(click.position);
      if (!picked || !picked.id) return;

      let entityId = null;
      if (picked.id instanceof this.cesium.Entity) {
        entityId = picked.id.id;
      } else if (typeof picked.id === 'string') {
        entityId = picked.id;
      }

      if (entityId) {
        const point = this.points.get(entityId);
        if (point && point._draggable) {
          this._isMouseDown = true;
          this._dragStartPosition = this.cesium.Cartesian2.clone(click.position);
          this._pendingDragPoint = point;
          this._isDragging = false; // Wait for move threshold
          this._draggedPoint = null;
          this.viewer.scene.screenSpaceCameraController.enableInputs = true; // Keep inputs enabled until drag starts
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOWN);

    // LEFT_UP: Stop dragging
    this.dragHandler.setInputAction((click) => {
      this._isMouseDown = false;
      this._pendingDragPoint = null;
      this._dragStartPosition = null;
      this._dragOffset = null;

      if (this._isDragging && this._draggedPoint) {
        this._draggedPoint.trigger('dragend', this._draggedPoint);
        this._isDragging = false;
        this._draggedPoint = null;
        this._dragPlane = null;
        this.viewer.scene.screenSpaceCameraController.enableInputs = true;
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_UP);
  }

  /**
   * Internal: Start dragging actually
   */
  _startDragging() {
    if (!this._pendingDragPoint) return;
    
    const point = this._pendingDragPoint;
    this._isDragging = true;
    this._draggedPoint = point;
    this.viewer.scene.screenSpaceCameraController.enableInputs = false;

    // 计算拖拽平面
    const entity = point.entity;
    if (entity && entity.position) {
      // 获取当前实体的笛卡尔坐标（包含高度偏移）
      const cartesian = entity.position.getValue(this.cesium.JulianDate.now());
      if (cartesian) {
        // 如果是贴地且无高度偏移，不需要平面（使用 globe pick 更贴合地形）
        const isClamped = (point.heightReference === 'clampToGround' && (!point.heightOffset || point.heightOffset === 0));
        
        if (!isClamped) {
          // 创建过该点的切平面
          const normal = this.cesium.Cartesian3.normalize(cartesian, new this.cesium.Cartesian3());
          this._dragPlane = this.cesium.Plane.fromPointNormal(cartesian, normal);

          // 计算拖拽偏移量 (Offset = EntityPos - Intersection)
          // 这样当鼠标点击实体的边缘时，实体不会跳动到鼠标中心
          if (this._dragStartPosition) {
             const ray = this.viewer.camera.getPickRay(this._dragStartPosition);
             const intersection = this.cesium.IntersectionTests.rayPlane(ray, this._dragPlane);
             if (intersection) {
               this._dragOffset = this.cesium.Cartesian3.subtract(cartesian, intersection, new this.cesium.Cartesian3());
             }
          }

        } else {
          this._dragPlane = null;
          this._dragOffset = null;
        }
      }
    } else {
      this._dragPlane = null;
      this._dragOffset = null;
    }

    point.trigger('dragstart', point);
  }

  /**
   * Get entity by ID
   */
  getEntity(id) {
    return this.points.get(id);
  }

  /**
   * Get entity by ID and type
   * @param {string} id 
   * @param {string} type 'point' | 'billboard'
   */
  getByType(id, type) {
    const p = this.points.get(id);
    if (p && p.type === type) {
      return p;
    }
    return null;
  }

  /**
   * Get all entities
   */
  getAllEntities() {
    return Array.from(this.points.values());
  }

  /**
   * Get all entities by type
   * @param {string} type 'point' | 'billboard'
   */
  getAllByType(type) {
    const res = [];
    for (const p of this.points.values()) {
      if (p.type === type) {
        res.push(p);
      }
    }
    return res;
  }

  /**
   * Check if entity exists
   */
  hasEntity(id) {
    return this.points.has(id);
  }

  /**
   * Register an entity
   * @param {Object} point - The entity wrapper instance
   * @param {Object} options - Options
   */
  registerEntity(point, options = {}) {
    if (!point || !point.id) return;
    
    // Check if ID exists and remove it properly to ensure cleanup logic runs
    if (this.points.has(point.id)) {
        const oldPoint = this.points.get(point.id);
        if (oldPoint && oldPoint !== point) {
             if (options._reused) {
                 // Just detach the old wrapper without killing the Cesium entity
                 // We still need to clear timers associated with the old wrapper ID
                 if (this.ttlTimers.has(point.id)) {
                     clearTimeout(this.ttlTimers.get(point.id));
                     this.ttlTimers.delete(point.id);
                 }
                 // Remove from old groups if needed (though group likely same)
                 // For safety, we just overwrite in the map.
             } else {
                 // Force call removeEntity to trigger all cleanup logic (resetting origins, etc.)
                 this.removeEntity(point.id);
            }
        }
    }
    
    this.points.set(point.id, point);
    
    if (point.group) {
      if (!this.groups.has(point.group)) this.groups.set(point.group, new Set());
      this.groups.get(point.group).add(point.id);
    }
    
    if (options.ttl) {
      this.updateTTL(point.id, options.ttl);
    }
  }

  /**
   * Remove entity by ID or entity instance
   * @param {string|Object} idOrEntity - Entity ID or Entity instance
   * @returns {boolean} Success or not
   */
  removeEntity(idOrEntity) {
    let id;
    let point;
    
    // Handle overload: id string or entity object
    if (typeof idOrEntity === 'string') {
      id = idOrEntity;
      point = this.points.get(id);
    } else if (typeof idOrEntity === 'object' && idOrEntity.id) {
      point = idOrEntity;
      id = point.id;
    } else {
      return false;
    }
    
    // 无论是否取到 point 对象，都尝试移除 viewer 中的实体
    // Updated logic: Check all possible locations (Viewer.entities + Custom DataSources)
    let removed = false;
    
    // 1. Try remove via point instance if available (it knows its collection)
    if (point && typeof point.getCollection === 'function') {
         const collection = point.getCollection();
         if (collection) {
             const e = point.entity || collection.getById(id);
             if (e) {
                 removed = collection.remove(e);
             }
         }
    }

    // 2. If not removed yet (or no point instance), try global viewer.entities (Legacy/Fallback)
    if (!removed) {
        const entity = this.viewer.entities.getById(id);
        if (entity) {
            removed = this.viewer.entities.remove(entity);
        }
    }
    
    // 3. If still not removed, scan known CustomDataSources (Brute force cleanup)
    if (!removed) {
        const dataSources = ['cesium-friendly-points', 'cesium-friendly-billboards', 'cesium-friendly-labels'];
            for (const dsName of dataSources) {
                 const dsList = this.viewer.dataSources.getByName(dsName);
                 // Check ALL data sources with this name (in case duplicates were created)
                 for (const ds of dsList) {
                     const e = ds.entities.getById(id);
                     if (e) {
                         const r = ds.entities.remove(e);
                         if (r) removed = true;
                     }
                 }
            }
    }

    if (this.points.has(id)) {
       point = this.points.get(id); // Ensure point is from map
       
      //  console.log(`[CesiumFriendly Debug] Removing entity: ${id}`);

       // Stop lifecycle
       if (this.ttlTimers.has(id)) {
         clearTimeout(this.ttlTimers.get(id));
         this.ttlTimers.delete(id);
       }

       if (point) {
         // Explicitly cleanup state to prevent pollution
         
         // Height
         if (typeof point.setHeight === 'function') {
           point.setHeight(0);
         }
         if (point.heightReference && point.heightReference !== 'clampToGround') {
           point.heightReference = 'clampToGround';
         }
         
         // Alignment
        if (typeof point.setVerticalOrigin === 'function') {
           point.setVerticalOrigin('CENTER');
        }
        if (typeof point.setHorizontalOrigin === 'function') {
           point.setHorizontalOrigin('CENTER');
        }
        
        // Extra Cleanup for potential pollution
        if (point.type === 'billboard' || point.type === 'label') {
            if (point.setPixelOffset) point.setPixelOffset(0, 0);
            if (point.setEyeOffset) point.setEyeOffset(0, 0, 0);
        } else if (point.type === 'point') {
            // Ensure PointEntity is clean
            if (point.setPixelOffset) point.setPixelOffset(0, 0);
        }

        // Pixel Offset & Rotation (Ensure complete reset)
        if (typeof point.setPixelOffset === 'function') {
           point.setPixelOffset(0, 0);
        }
         if (typeof point.setRotation === 'function') {
            point.setRotation(0);
         }
 
         // Destroy
         // Avoid recursive call back to delete() if we are already in a delete context
         // if (typeof point.delete === 'function') {
         //   point.delete();
         // }
         
         // Remove from groups
         if (point.group && this.groups.has(point.group)) {
             this.groups.get(point.group).delete(id);
             if (this.groups.get(point.group).size === 0) this.groups.delete(point.group);
         }
       }

       this.points.delete(id);
       return true;
    }
    
    return removed;
  }

  /**
   * Remove all entities
   * @param {string} [type] - Optional type filter
   */
  removeAllEntities(type) {
    // Native Optimization: Clear everything at once if no type filter
    if (!type) {
        // console.log('[CesiumFriendly] Removing ALL entities via native removeAll');
        
        // 1. Cleanup all wrappers (timers, events) manually to avoid loop overhead
        this.points.forEach(point => {
             // Stop lifecycle
             if (this.ttlTimers.has(point.id)) {
                 clearTimeout(this.ttlTimers.get(point.id));
             }
             
             // Mark as destroyed so they don't try to remove themselves
             if (point) {
                 point._destroyed = true;
                 point.entity = null;
                 if (point._eventHandlers) point._eventHandlers.clear();
             }
        });
        
        // 2. Clear collections
        this.points.clear();
        this.groups.clear();
        this.ttlTimers.clear();
        
        // 3. Native Clear (The Core Fix)
        if (this.viewer) {
            // Clear default collection
            if (this.viewer.entities) {
                this.viewer.entities.removeAll();
            }
            
            // Clear Custom DataSources
            const dsNames = ['cesium-friendly-points', 'cesium-friendly-billboards', 'cesium-friendly-labels'];
            dsNames.forEach(name => {
                const dsList = this.viewer.dataSources.getByName(name);
                dsList.forEach(ds => {
                    ds.entities.removeAll();
                });
            });
        }
        return;
    }

    const toRemove = [];
    this.points.forEach(point => {
      if (!type || point.type === type) {
        toRemove.push(point);
      }
    });

    toRemove.forEach(point => {
      this.removeEntity(point);
    });
  }

  /**
   * Update entity position
   */
  updateEntityPosition(id, position) {
    const point = this.points.get(id);
    if (point && point.entity) {
      point.updatePosition(position);
      const isRelative = point.heightReference === 'relativeToGround' || (point.heightOffset && point.heightOffset > 0);
      const h = isRelative ? (point.heightOffset || 0) : (position[2] || 0);

      // 强制修复 Entity 的 heightReference 状态，确保高度生效
      if (isRelative) {
         const HR_RELATIVE = this.cesium.HeightReference.RELATIVE_TO_GROUND;
         // 如果 Entity 是 Billboard 类型
         if (point.entity.billboard) {
            point.entity.billboard.heightReference = HR_RELATIVE;
         }
         // 如果 Entity 是 Point 类型
         if (point.entity.point) {
            point.entity.point.heightReference = HR_RELATIVE;
         }
      }

      point.entity.position = this.cesium.Cartesian3.fromDegrees(position[0], position[1], h);
    }
  }

  findEntitiesAtPosition(position, epsilon = 1e-5) {
    if (!position || position.length < 2) return [];
    const [lng, lat] = position;
    const height = position[2] || 0;
    const res = [];
    for (const point of this.points.values()) {
      const pos = point.position || [];
      if (pos.length < 2) continue;
      
      const pLng = pos[0];
      const pLat = pos[1];
      const pHeight = pos[2] || 0;

      // Relaxed check: match lat/lng, and match height only if both are non-zero
      // If one of them is 0 (likely clampToGround or 2D), we treat it as a match on 2D plane
      // This helps with clampToGround duplicate detection
      const latLngMatch = Math.abs(pLng - lng) <= epsilon && Math.abs(pLat - lat) <= epsilon;
      
      let heightMatch = true;
      if (height !== 0 && pHeight !== 0) {
          heightMatch = Math.abs(pHeight - height) <= epsilon;
      }
      
      if (latLngMatch && heightMatch) {
        res.push(point);
      }
    }
    return res;
  }

  removeDuplicatesAtPosition(position, groupName, excludeIdOrIds) {
    const found = this.findEntitiesAtPosition(position);
    let count = 0;
    const newGroup = groupName || null;
    
    // Normalize exclude IDs to a Set for fast lookup
    const excludeSet = new Set();
    if (excludeIdOrIds) {
        if (Array.isArray(excludeIdOrIds)) {
            excludeIdOrIds.forEach(id => excludeSet.add(id));
        } else {
            excludeSet.add(excludeIdOrIds);
        }
    }

    for (const p of found) {
      if (excludeSet.has(p.id)) continue;
      
      const sameGroup = (p.group || null) === newGroup;
      if (sameGroup) {
        if (this.removeEntity(p)) count++;
      }
    }
    return count;
  }

  updateGroup(point, oldGroup, newGroup) {
    if (oldGroup) {
      if (this.groups.has(oldGroup)) {
        this.groups.get(oldGroup).delete(point.id);
        if (this.groups.get(oldGroup).size === 0) {
          this.groups.delete(oldGroup);
        }
      }
    }
    if (newGroup) {
      if (!this.groups.has(newGroup)) {
        this.groups.set(newGroup, new Set());
      }
      this.groups.get(newGroup).add(point.id);
    }
  }

  updateTTL(id, ms) {
    // Clear existing timer
    const oldTimer = this.ttlTimers.get(id);
    if (oldTimer) {
      clearTimeout(oldTimer);
      this.ttlTimers.delete(id);
    }

    if (ms && ms > 0) {
      const timer = setTimeout(() => {
        this.removeEntity(id);
      }, ms);
      this.ttlTimers.set(id, timer);
    }
  }

  removeGroup(groupName, type) {
    const ids = this.groups.get(groupName);
    if (!ids) return 0;
    let count = 0;
    // Create a copy to iterate because removeEntity will modify the Set
    for (const id of Array.from(ids)) {
      const point = this.points.get(id);
      if (type && point && point.type !== type) continue;
      
      if (this.removeEntity(id)) count++;
    }
    // Only delete group if empty
    if (this.groups.has(groupName) && this.groups.get(groupName).size === 0) {
      this.groups.delete(groupName);
    }
    return count;
  }

  /**
   * Destroy manager
   */
  destroy() {
    if (this.clickHandler) {
      this.clickHandler.destroy();
      this.clickHandler = null;
    }
    if (this.moveHandler) {
      this.moveHandler.destroy();
      this.moveHandler = null;
    }
    if (this.dragHandler) {
      this.dragHandler.destroy();
      this.dragHandler = null;
    }
    if (this.rightClickHandler) {
      this.rightClickHandler.destroy();
      this.rightClickHandler = null;
    }
    if (this.viewer && this.viewer.scene && this.viewer.scene.canvas) {
      this.viewer.scene.canvas.style.cursor = 'default';
    }
    
    this.removeAllEntities();
    this.viewer = null;
    this.cesium = null;
  }
}

export default new PointsManager();
