import pointsManager from '../core/manager.js';

function resolveImageInput(input) {
  if (input == null) return null;
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (typeof input === 'object') {
    if (typeof input.value !== 'undefined') return resolveImageInput(input.value);
    if (typeof input.default === 'string') return input.default;
    if (typeof input.href === 'string') return input.href;
    if (typeof input.src === 'string') return input.src;
  }
  return input;
}

export class Billboard {
  constructor(id, options = {}) {
    this.id = id;
    this.type = 'billboard';
    this.position = options.position || [0, 0, 0];
    this.name = options.name || '';
    this.description = options.description || '';
    this.info = options.info || {};
    this.entity = null;
    this.cesium = options.cesium || null;
    this.color = options.color || '#FFFFFF'; // 默认白色，不影响图片颜色
    this.scale = options.scale != null ? options.scale : 1.0;
    this.rotation = options.rotation || 0; // 角度
    this.imageUrl = resolveImageInput(options.imageUrl) || '';
    this.draggable = options.draggable || false;
    this.heightOffset = options.heightOffset || 0;
    this.heightReference = options.heightReference || 'clampToGround';
    this.opacity = options.opacity != null ? options.opacity : 1;
    this.group = options.group || null;
    this._eventHandlers = new Map();
    this._flashTimer = null;
    this._flashing = false;
    this._hidden = false;
  }
  setEntity(entity) {
    this.entity = entity;
    // 初始化属性
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.image = this.imageUrl;
      this.entity.billboard.scale = this.scale;
      this.entity.billboard.rotation = this.cesium.Math.toRadians(this.rotation);
      this.setOpacity(this.opacity);
    }
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
    if (this.entity) {
      const isRelative = this.heightReference === 'relativeToGround' || this.heightOffset > 0;
      const h = isRelative ? (this.heightOffset || 0) : (position[2] || 0);
      this.entity.position = this.cesium.Cartesian3.fromDegrees(position[0], position[1], h);
    }
    return this;
  }
  
  // --- Billboard Specific Methods ---

  setImage(url) {
    const resolved = resolveImageInput(url);
    this.imageUrl = resolved;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.image = resolved;
    }
    return this;
  }

  setScale(scale) {
    this.scale = scale;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.scale = scale;
    }
    return this;
  }

  setRotation(degree) {
    this.rotation = degree;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.rotation = this.cesium.Math.toRadians(degree);
    }
    return this;
  }

  setDraggable(enable) {
    this.draggable = !!enable;
    return this;
  }

  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.billboard) {
      const col = this.cesium.Color.fromCssColorString(color).withAlpha(this.opacity);
      this.entity.billboard.color = col;
    }
    return this;
  }

  setOpacity(alpha) {
    this.opacity = alpha;
    if (this.entity && this.entity.billboard) {
      const c = this.cesium.Color.fromCssColorString(this.color).withAlpha(alpha);
      this.entity.billboard.color = c;
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
    if (this.entity && this.entity.billboard) {
      const hr = clamp ? this.cesium.HeightReference.CLAMP_TO_GROUND : this.cesium.HeightReference.NONE;
      this.entity.billboard.heightReference = hr;
    }
    return this;
  }
  setHeight(height) {
    this.heightOffset = height || 0;
    
    // 根据高度自动判断参考系
    const isRelative = this.heightOffset > 0;
    // 如果有高度偏移，强制使用 RELATIVE_TO_GROUND，否则回退到默认的 heightReference (通常是 clampToGround)
    // 但如果用户显式设置了 'none'，则保持 'none'
    let targetHr = this.heightReference;
    
    if (this.heightReference === 'clampToGround' && isRelative) {
        targetHr = 'relativeToGround';
    } else if (this.heightReference === 'relativeToGround' && !isRelative) {
        // 如果高度归零，且原本是 relative，是否要切回 clamp？
        // 保持 relative 也没问题，只是高度为 0
    }

    // Update internal state
    this.heightReference = targetHr;

    if (this.entity) {
      const Cesium = this.cesium;
      const cesHr = targetHr === 'relativeToGround' ? Cesium.HeightReference.RELATIVE_TO_GROUND
        : (targetHr === 'clampToGround' ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE);
      
      if (this.entity.billboard) {
        this.entity.billboard.heightReference = cesHr;
      }
      
      // 计算新的位置坐标
      const h = this.heightOffset;
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
      scale: this.scale,
      rotation: this.rotation,
      imageUrl: this.imageUrl,
      draggable: this.draggable,
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
        console.warn(`Billboard ${this.id} expired immediately.`);
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
      scale: this.scale,
      rotation: this.rotation,
      imageUrl: this.imageUrl,
      color: this.color,
      opacity: this.opacity
    };
    return this;
  }

  restoreState() {
    if (this._savedState) {
      this.setScale(this._savedState.scale);
      this.setRotation(this._savedState.rotation);
      this.setImage(this._savedState.imageUrl);
      this.setColor(this._savedState.color);
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
