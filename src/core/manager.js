

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
   * Get current selected Point
   */
  getSelectedPoint() {
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
          this.updatePointPosition(this._draggedPoint.id, newPos);
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
        if (point && point.draggable) {
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
   * Get point by ID
   */
  getPoint(id) {
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
   * Get all points
   */
  getAllPoints() {
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
   * Check if point exists
   */
  hasPoint(id) {
    return this.points.has(id);
  }

  registerPoint(point, options = {}) {
    this.points.set(point.id, point);
    if (point.group) {
      if (!this.groups.has(point.group)) this.groups.set(point.group, new Set());
      this.groups.get(point.group).add(point.id);
    }
    let expiresAt = options.expiresAt;
    
    // 自动兼容秒级时间戳（10位）
    if (typeof expiresAt === 'number' && expiresAt < 10000000000) {
      expiresAt *= 1000;
    }

    const ttlMs = options.ttlMs;
    if (typeof ttlMs === 'number' && ttlMs > 0) {
      const timer = setTimeout(() => {
        this.removePoint(point.id);
      }, ttlMs);
      this.ttlTimers.set(point.id, timer);
    } else if (typeof expiresAt === 'number') {
      if (expiresAt > Date.now()) {
        const delay = expiresAt - Date.now();
        const timer = setTimeout(() => {
          this.removePoint(point.id);
        }, delay);
        this.ttlTimers.set(point.id, timer);
      } else {
        // 已过期，立即移除
        console.warn(`Point ${point.id} is expired (expiresAt: ${expiresAt}), removing immediately.`);
        this.removePoint(point.id);
      }
    }
  }

  /**
   * Remove point by ID or point instance
   * @param {string|Object} idOrPoint - Point ID or Point instance
   * @param {string} [type] - Optional type filter ('point' | 'billboard')
   * @returns {boolean} Success or not
   */
  removePoint(idOrPoint, type) {
    let point = null;
    let id = null;

    // 支持传入 id（字符串）或 point 对象
    if (typeof idOrPoint === 'string') {
      id = idOrPoint;
      point = this.points.get(id);
    } else if (idOrPoint && typeof idOrPoint === 'object' && idOrPoint.id) {
      // 传入 point 对象，直接使用
      point = idOrPoint;
      id = point.id;
    } else {
      return false;
    }

    // Check type if provided
    if (type && point && point.type !== type) {
      return false;
    }

    // 无论是否取到 point 对象，都尝试移除 viewer 中的实体
    const entity = point?.entity || (id ? this.viewer.entities.getById(id) : null);
    if (entity) {
      this.viewer.entities.remove(entity);
    }
    if (point) {
      point.destroy();
      this.points.delete(id);
      const t = this.ttlTimers.get(id);
      if (t) {
        clearTimeout(t);
        this.ttlTimers.delete(id);
      }
      if (point.group && this.groups.has(point.group)) {
        this.groups.get(point.group).delete(id);
        if (this.groups.get(point.group).size === 0) this.groups.delete(point.group);
      }
      return true;
    }
    // 如果没有在管理器中找到 point，但 viewer 中确实移除了实体，也视为成功
    return !!entity;
  }

  /**
   * Remove all points
   * @param {string} [type] - Optional type filter
   */
  removeAllPoints(type) {
    const toRemove = [];
    this.points.forEach(point => {
      if (!type || point.type === type) {
        toRemove.push(point);
      }
    });

    toRemove.forEach(point => {
      this.removePoint(point);
    });
    
    if (!type) {
       // If clearing all, clear timers and groups too (done by removePoint iteratively, but we can clean up leftovers if any)
    }
  }

  /**
   * Update point position
   */
  updatePointPosition(id, position) {
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

  findPointsAtPosition(position, epsilon = 1e-5) {
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
    const found = this.findPointsAtPosition(position);
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
        if (this.removePoint(p)) count++;
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
        this.removePoint(id);
      }, ms);
      this.ttlTimers.set(id, timer);
    }
  }

  removeGroup(groupName, type) {
    const ids = this.groups.get(groupName);
    if (!ids) return 0;
    let count = 0;
    // Create a copy to iterate because removePoint will modify the Set
    for (const id of Array.from(ids)) {
      const point = this.points.get(id);
      if (type && point && point.type !== type) continue;
      
      if (this.removePoint(id)) count++;
    }
    // Only delete group if empty
    if (this.groups.has(groupName) && this.groups.get(groupName).size === 0) {
      this.groups.delete(groupName);
    }
    return count;
  }

  showGroup(groupName) {
    const ids = this.groups.get(groupName);
    if (!ids) return;
    for (const id of ids) {
      const point = this.points.get(id);
      if (point) point.show();
    }
  }

  hideGroup(groupName) {
    const ids = this.groups.get(groupName);
    if (!ids) return;
    for (const id of ids) {
      const point = this.points.get(id);
      if (point) point.hide();
    }
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
    
    this.removeAllPoints();
    this.viewer = null;
    this.cesium = null;
  }
}

export default new PointsManager();
