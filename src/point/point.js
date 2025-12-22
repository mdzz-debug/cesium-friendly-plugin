import pointsManager from '../core/manager.js';
import { Label } from '../label/label.js';
import { createLabelEntityOptions } from '../label/add.js';

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
    this.viewer = options.viewer || null;
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
    
    this.labelObj = null; // Label instance
  }
  setEntity(entity) {
    this.entity = entity;
    return this;
  }
  getEntity() {
    return this.entity;
  }
  
  // --- Label Integration ---
  
  /**
   * Show label for this point
   * @param {Object} options Label options (text, color, fontSize, etc.)
   */
  showLabel(options = {}) {
    if (!this.viewer || !this.cesium) {
      console.warn('Point: Cannot show label, viewer or cesium not available.');
      return this;
    }

    const labelText = options.text || options.name || this.name || '';
    
    // If label already exists, we might want to update it or recreate it
    // For simplicity, let's recreate it to ensure all options apply, 
    // unless we want to optimize.
    if (this.labelObj) {
        this.hideLabel();
    }
    
    const labelId = this.id + '-label';
    const labelOptions = {
        ...options,
        id: labelId,
        text: labelText,
        position: this.position, // Use point's position
        viewer: this.viewer,
        cesium: this.cesium,
        // Inherit height reference from point if not specified
        heightReference: options.heightReference || this.heightReference,
        heightOffset: options.heightOffset !== undefined ? options.heightOffset : this.heightOffset,
        // Default eyeOffset to prevent occlusion by the point itself
        // Moves the label 5 meters closer to the camera
        eyeOffset: options.eyeOffset || [0, 0, -5]
    };

    // Create Label Instance
    this.labelObj = new Label(labelId, labelOptions);
    
    // Create Entity using shared logic
    // Note: createLabelEntityOptions expects options.position to be array [lng, lat, height]
    // this.position is [lng, lat, height]
    const entityOptions = createLabelEntityOptions(this.cesium, labelId, labelOptions);
    
    // Add to viewer
    const entity = this.viewer.entities.add(entityOptions);
    this.labelObj.setEntity(entity);
    
    // Note: We do NOT register this label with pointsManager to avoid double management 
    // or cluttering the global list if it's considered "part of" the point.
    // However, this means `cf.label.getAll()` won't return it. 
    // This is consistent with "point internally calls label".

    return this;
  }

  hideLabel() {
    if (this.labelObj) {
        try {
            if (this.labelObj.getEntity()) {
                this.viewer.entities.remove(this.labelObj.getEntity());
            }
        } catch (e) {
            console.warn('Failed to remove label entity:', e);
        }
        
        try {
            this.labelObj.destroy();
        } catch (e) {
            console.warn('Failed to destroy label object:', e);
        }
        
        this.labelObj = null;
    }
    return this;
  }

  updateLabel(options) {
      if (this.labelObj) {
          // Partial update if supported, else recreate
          // Label class supports some updates
          if (options.text !== undefined) this.labelObj.setText(options.text);
          if (options.color !== undefined) this.labelObj.setColor(options.color);
          if (options.backgroundColor !== undefined) this.labelObj.setBackgroundColor(options.backgroundColor);
          if (options.fontSize !== undefined) this.labelObj.setFontSize(options.fontSize);
          if (options.bold !== undefined) this.labelObj.setBold(options.bold);
          if (options.heightOffset !== undefined) this.labelObj.setHeight(options.heightOffset);
          if (options.pixelOffset !== undefined) this.labelObj.setPixelOffset(options.pixelOffset[0], options.pixelOffset[1]);
          if (options.minDisplayHeight !== undefined || options.maxDisplayHeight !== undefined) {
             const min = options.minDisplayHeight !== undefined ? options.minDisplayHeight : this.labelObj.minDisplayHeight;
             const max = options.maxDisplayHeight !== undefined ? options.maxDisplayHeight : this.labelObj.maxDisplayHeight;
             this.labelObj.setDisplayHeightRange(min, max);
          }
          // For other complex property changes, might be easier to recreate
      } else {
          this.showLabel(options);
      }
      return this;
  }
  
  // --- End Label Integration ---

  // Clean up
  destroy() {
    this.hideLabel();
    if (this._flashTimer) {
      clearInterval(this._flashTimer);
      this._flashTimer = null;
    }
    this.entity = null;
    this._eventHandlers.clear();
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
    if (this.labelObj) {
      this.labelObj.updatePosition(position);
    }
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
      opacity: this.opacity,
      label: this.labelObj ? {
          text: this.labelObj.text,
          fontSize: this.labelObj.fontSize,
          bold: this.labelObj.bold,
          backgroundColor: this.labelObj.backgroundColor,
          heightOffset: this.labelObj.heightOffset,
          pixelOffset: this.labelObj.pixelOffset,
          minDisplayHeight: this.labelObj.minDisplayHeight,
          maxDisplayHeight: this.labelObj.maxDisplayHeight
      } : null
    };
    return this;
  }

  restoreState() {
    if (this._savedState) {
      this.setColor(this._savedState.color);
      this.setPixelSize(this._savedState.pixelSize);
      this.setOpacity(this._savedState.opacity);

      // Restore label state
      if (this._savedState.label) {
          const opts = this._savedState.label;
          this.showLabel({
              text: opts.text,
              fontSize: opts.fontSize,
              bold: opts.bold,
              backgroundColor: opts.backgroundColor,
              heightOffset: opts.heightOffset,
              pixelOffset: opts.pixelOffset,
              minDisplayHeight: opts.minDisplayHeight,
              maxDisplayHeight: opts.maxDisplayHeight
          });
      } else {
          this.hideLabel();
      }

      this._savedState = null;
    }
    return this;
  }
}
