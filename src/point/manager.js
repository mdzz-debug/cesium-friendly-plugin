

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
  }

  init(cesium, viewer) {
    this.cesium = cesium;
    this.viewer = viewer;
    this.setupClickHandler();
    this.setupMoveHandler();
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
      for (const picked of picks) {
        const pickedEntity = picked && picked.id ? picked.id : null;
        if (!pickedEntity) continue;
        for (const point of this.points.values()) {
          if (point.entity === pickedEntity || (pickedEntity.id && pickedEntity.id === point.id)) {
            point.trigger('click', point);
            this._selectedId = point.id;
            point.trigger('select', point);
            return;
          }
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  setupMoveHandler() {
    if (this.moveHandler) {
      return;
    }
    this.moveHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.moveHandler.setInputAction((movement) => {
      let picks = this.viewer.scene.drillPick(movement.endPosition) || [];
      if (!Array.isArray(picks) || picks.length === 0) {
        const p = this.viewer.scene.pick(movement.endPosition);
        picks = p ? [p] : [];
      }
      let hoveredId = null;
      for (const picked of picks) {
        const pickedEntity = picked && picked.id ? picked.id : null;
        if (!pickedEntity) continue;
        for (const point of this.points.values()) {
          if (point.entity === pickedEntity || (pickedEntity.id && pickedEntity.id === point.id)) {
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
        if (hoveredId) break;
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

  /**
   * Get point by ID
   */
  getPoint(id) {
    return this.points.get(id);
  }

  /**
   * Get all points
   */
  getAllPoints() {
    return Array.from(this.points.values());
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

    if (typeof ttlMs === 'number' && ttlMs > 0) {
      const timer = setTimeout(() => {
        this.removePoint(point.id);
      }, ttlMs);
      this.ttlTimers.set(point.id, timer);
    } else if (typeof expiresAt === 'number' && expiresAt > Date.now()) {
      const delay = expiresAt - Date.now();
      const timer = setTimeout(() => {
        this.removePoint(point.id);
      }, delay);
      this.ttlTimers.set(point.id, timer);
    }
  }

  /**
   * Remove point by ID or point instance
   * @param {string|Object} idOrPoint - Point ID or Point instance
   * @returns {boolean} Success or not
   */
  removePoint(idOrPoint) {
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
   */
  removeAllPoints() {
    this.points.forEach(point => {
      const entity = point.entity;
      if (entity) {
        this.viewer.entities.remove(entity);
      } else if (point && point.id) {
        const found = this.viewer.entities.getById(point.id);
        if (found) {
          this.viewer.entities.remove(found);
        }
      }
      point.destroy();
    });
    this.points.clear();
    for (const t of this.ttlTimers.values()) {
      clearTimeout(t);
    }
    this.ttlTimers.clear();
    this.groups.clear();
  }

  /**
   * Update point position
   */
  updatePointPosition(id, position) {
    const point = this.points.get(id);
    if (point && point.entity) {
      point.updatePosition(position);
      const isRelative = point.heightReference === 'relativeToGround';
      const h = isRelative ? (point.heightOffset || 0) : (position[2] || 0);
      point.entity.position = this.cesium.Cartesian3.fromDegrees(position[0], position[1], h);
    }
  }

  findPointsAtPosition(position, epsilon = 1e-8) {
    if (!position || position.length < 2) return [];
    const [lng, lat] = position;
    const res = [];
    for (const point of this.points.values()) {
      const pos = point.position || [];
      if (pos.length < 2) continue;
      if (Math.abs(pos[0] - lng) <= epsilon && Math.abs(pos[1] - lat) <= epsilon) {
        res.push(point);
      }
    }
    return res;
  }

  removeDuplicatesAtPosition(position, groupName, excludeId) {
    const found = this.findPointsAtPosition(position);
    let count = 0;
    const newGroup = groupName || null;
    for (const p of found) {
      if (excludeId && p.id === excludeId) continue;
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

  removeGroup(groupName) {
    const ids = this.groups.get(groupName);
    if (!ids) return 0;
    let count = 0;
    for (const id of Array.from(ids)) {
      if (this.removePoint(id)) count++;
    }
    this.groups.delete(groupName);
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
    if (this.viewer && this.viewer.scene && this.viewer.scene.canvas) {
      this.viewer.scene.canvas.style.cursor = 'default';
    }
    
    this.removeAllPoints();
    this.viewer = null;
    this.cesium = null;
  }
}

export default new PointsManager();
