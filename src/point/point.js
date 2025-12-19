import pointsManager from '../core/manager.js';

export class Point {
  constructor(id, options = {}) {
    this.id = id;
    this.type = 'point';
    this.position = options.position || [0, 0, 0];
    this.name = options.name || '';
    this.description = options.description || '';
    this.info = options.info || {};
    this.entity = null;
    this.cesium = options.cesium || null;
    this.color = options.color || '#FF0000';
    this.pixelSize = options.pixelSize || 10;
    this.imageUrl = options.imageUrl || null;
    this.draggable = options.draggable || false;
    this.heightOffset = options.heightOffset || 0;
    this.heightReference = options.heightReference || 'clampToGround';
    this.opacity = options.opacity != null ? options.opacity : 1;
    this.group = options.group || null;
    this._eventHandlers = new Map();
    this._flashTimer = null;
    this._flashing = false;
    this._hidden = false;
    this._savedState = null;
  }
  setEntity(entity) {
    this.entity = entity;
    return this;
  }
  getEntity() {
    return this.entity;
  }
  on(type, handler) {
    if (!this._eventHandlers.has(type)) this._eventHandlers.set(type, new Set());
    this._eventHandlers.get(type).add(handler);
    return this;
  }
  off(type, handler) {
    const s = this._eventHandlers.get(type);
    if (s) s.delete(handler);
    return this;
  }
  trigger(type, ...args) {
    const s = this._eventHandlers.get(type);
    if (s) {
      for (const h of s) {
        try {
          if (args && args.length > 0) {
            h(...args);
          } else {
            h(this);
          }
        } catch {}
      }
    }
    return this;
  }
  updatePosition(position) {
    this.position = position;
    return this;
  }
  setDraggable(enable) {
    this.draggable = !!enable;
    return this;
  }
  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.point) {
      this.entity.point.color = this.cesium.Color.fromCssColorString(color).withAlpha(this.opacity);
    }
    if (this.entity && this.entity.billboard) {
      const col = this.cesium.Color.fromCssColorString(color).withAlpha(this.opacity);
      this.entity.billboard.color = col;
    }
    return this;
  }
  setPixelSize(size) {
    this.pixelSize = size;
    if (this.entity && this.entity.point) {
      this.entity.point.pixelSize = size;
    }
    return this;
  }
  setIcon(url) {
    // 暂时清空，后续单独封装广告牌逻辑
    return this;
  }
  setOpacity(alpha) {
    this.opacity = alpha;
    if (this.entity && this.entity.point) {
      const c = this.cesium.Color.fromCssColorString(this.color).withAlpha(alpha);
      this.entity.point.color = c;
    }
    if (this.entity && this.entity.billboard) {
      const c = this.cesium.Color.fromCssColorString(this.color).withAlpha(alpha);
      this.entity.billboard.color = c;
    }
    return this;
  }
  setOutline(enable, color, width) {
    if (this.entity && this.entity.point) {
      this.entity.point.outlineWidth = enable ? (width || 2) : 0;
      this.entity.point.outlineColor = enable ? this.cesium.Color.fromCssColorString(color || '#FFFFFF') : this.cesium.Color.TRANSPARENT;
    }
    return this;
  }
  show() {
    this._hidden = false;
    if (this.entity) this.entity.show = true;
    return this;
  }
  hide() {
    this._hidden = true;
    if (this.entity) this.entity.show = false;
    return this;
  }
  setClampToGround(clamp = true) {
    this.heightReference = clamp ? 'clampToGround' : 'none';
    if (this.entity && (this.entity.point || this.entity.billboard)) {
      const hr = clamp ? this.cesium.HeightReference.CLAMP_TO_GROUND : this.cesium.HeightReference.NONE;
      if (this.entity.point) this.entity.point.heightReference = hr;
      if (this.entity.billboard) this.entity.billboard.heightReference = hr;
    }
    return this;
  }
  setHeight(height) {
    this.heightOffset = height || 0;

    // Auto update heightReference state
    if (this.heightOffset > 0 && this.heightReference === 'clampToGround') {
      this.heightReference = 'relativeToGround';
    }

    if (this.entity) {
      const Cesium = this.cesium;
      const isRelative = this.heightReference === 'relativeToGround';
      const hr = isRelative ? Cesium.HeightReference.RELATIVE_TO_GROUND
        : (this.heightReference === 'none' ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND);
      if (this.entity.point) {
        this.entity.point.heightReference = hr;
      }
      if (this.entity.billboard) {
        this.entity.billboard.heightReference = hr;
      }
      const h = isRelative ? this.heightOffset : (this.position[2] || 0);
      this.entity.position = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], h);

      // 更新内部位置数据的 Z 值，保持同步
      if (this.position && this.position.length >= 2) {
         this.position = [this.position[0], this.position[1], h];
      }
    }
    return this;
  }
  setInfo(info) {
    if (info) {
      if (info.id) this.id = info.id;
      if (info.name != null) this.name = info.name;
      if (info.description != null) this.description = info.description;
      const { id, name, description, ...rest } = info;
      this.info = { ...this.info, ...rest };
    }
    if (this.entity) {
      if (this.name != null) this.entity.name = this.name;
      if (this.description != null) this.entity.description = this.description;
      this.entity._meta = { ...(this.entity._meta || {}), ...this.info };
    }
    return this;
  }
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      position: this.position,
      color: this.color,
      pixelSize: this.pixelSize,
      imageUrl: this.imageUrl,
      opacity: this.opacity,
      group: this.group,
      heightReference: this.heightReference,
      heightOffset: this.heightOffset,
      data: this.info
    };
  }
  setGroup(groupName) {
    const oldGroup = this.group;
    this.group = groupName || null;
    pointsManager.updateGroup(this, oldGroup, this.group);
    pointsManager.removeDuplicatesAtPosition(this.position, this.group, this.id);
    return this;
  }
  setTTL(ms) {
    pointsManager.updateTTL(this.id, ms);
    return this;
  }
  setExpiresAt(timestamp) {
    if (typeof timestamp === 'number') {
      if (timestamp < 10000000000) {
        timestamp *= 1000;
      }
      const ttl = timestamp - Date.now();
      if (ttl <= 0) {
        console.warn(`Point ${this.id} expired immediately.`);
        pointsManager.removePoint(this.id);
      } else {
        pointsManager.updateTTL(this.id, ttl);
      }
    }
    return this;
  }
  setFlash(enable, duration, options = {}) {
    // 兼容旧签名：setFlash(enable, options)
    if (typeof duration === 'object' && duration !== null) {
      options = duration;
      duration = options.duration;
    }

    const dur = duration || 1000;
    const minOpacity = options.minOpacity != null ? options.minOpacity : 0.0;
    const maxOpacity = options.maxOpacity != null ? options.maxOpacity : this.opacity;
    
    if (this._flashTimer) {
      clearInterval(this._flashTimer);
      this._flashTimer = null;
    }
    this._flashing = !!enable;

    if (!enable) {
      // 停止时恢复到原透明度
      this.setOpacity(this.opacity);
      if (!this._hidden && this.entity) this.entity.show = true;
      return this;
    }

    if (this.entity) this.entity.show = true;
    
    let isFadingOut = true;
    // 使用透明度变化代替显隐切换
    // 每次变化间隔 50ms，计算步长
    const stepInterval = 50;
    const steps = dur / stepInterval;
    const opacityStep = (maxOpacity - minOpacity) / steps;
    let currentOpacity = maxOpacity;

    this._flashTimer = setInterval(() => {
      if (!this.entity) return;
      if (this._hidden) return;

      if (isFadingOut) {
        currentOpacity -= opacityStep;
        if (currentOpacity <= minOpacity) {
          currentOpacity = minOpacity;
          isFadingOut = false;
        }
      } else {
        currentOpacity += opacityStep;
        if (currentOpacity >= maxOpacity) {
          currentOpacity = maxOpacity;
          isFadingOut = true;
        }
      }
      this.setOpacity(currentOpacity);
    }, stepInterval);

    return this;
  }

  saveState() {
    this._savedState = {
      color: this.color,
      pixelSize: this.pixelSize,
      opacity: this.opacity
    };
    return this;
  }

  restoreState() {
    if (this._savedState) {
      this.setColor(this._savedState.color);
      this.setPixelSize(this._savedState.pixelSize);
      this.setOpacity(this._savedState.opacity);
      this._savedState = null;
    }
    return this;
  }

  destroy() {
    if (this._flashTimer) {
      clearInterval(this._flashTimer);
      this._flashTimer = null;
    }
    this.entity = null;
    this._eventHandlers.clear();
  }
}
