import pointsManager from '../core/manager.js';
import { getHeightListener } from '../utils/heightListener.js';

export class Label {
  constructor(id, options = {}) {
    this.id = id;
    this.type = 'label';
    this.group = options.group || null;
    this.position = options.position || [0, 0, 0];
    this.text = options.text || '';
    this.fontSize = options.fontSize || 14;
    this.bold = !!options.bold;
    this.font = options.font || `${this.bold ? 'bold ' : ''}${this.fontSize}px sans-serif`;
    this.style = options.style || 'FILL';
    this.color = options.color || '#FFFFFF';
    this.backgroundColor = options.backgroundColor || null;
    this.showBackground = !!options.backgroundColor;
    this.scale = options.scale || 1.0;
    this.pixelOffset = options.pixelOffset || [0, 0];
    this.eyeOffset = options.eyeOffset || [0, 0, 0];
    this.horizontalOrigin = options.horizontalOrigin || 'CENTER';
    this.verticalOrigin = options.verticalOrigin || 'CENTER';
    this.heightReference = options.heightReference || 'clampToGround';
    this.heightOffset = options.heightOffset || 0;
    this.distanceDisplayCondition = options.distanceDisplayCondition || null;
    this.scaleByDistance = options.scaleByDistance || null;
    this.translucencyByDistance = options.translucencyByDistance || null;
    this.pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance || null;
    this.disableDepthTestDistance = options.disableDepthTestDistance === false ? undefined : Number.POSITIVE_INFINITY;
    
    this.cesium = options.cesium || null;
    this.viewer = options.viewer || null;
    this.entity = null;
    
    // Custom height display logic parameters
    this.minDisplayHeight = options.minDisplayHeight !== undefined ? options.minDisplayHeight : 0;
    this.maxDisplayHeight = options.maxDisplayHeight !== undefined ? options.maxDisplayHeight : Infinity;
    
    this._heightListenerUnsubscribe = null;
    this._eventHandlers = new Map();
    
    // Bind the update method to 'this' so it can be passed as callback
    this.updateVisibilityByHeight = this.updateVisibilityByHeight.bind(this);
  }

  setEntity(entity) {
    this.entity = entity;
    this._enableHeightCheck();
    return this;
  }

  getEntity() {
    return this.entity;
  }

  // Event handling
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

  // --- Label Specific Methods ---

  setText(text) {
    this.text = text;
    if (this.entity && this.entity.label) {
      this.entity.label.text = text;
    }
    return this;
  }

  setFont(font) {
    this.font = font;
    if (this.entity && this.entity.label) {
      this.entity.label.font = font;
    }
    return this;
  }

  setFontSize(size) {
    this.fontSize = size;
    this.font = `${this.bold ? 'bold ' : ''}${size}px sans-serif`;
    return this.setFont(this.font);
  }

  setBold(enable) {
    this.bold = !!enable;
    this.font = `${this.bold ? 'bold ' : ''}${this.fontSize}px sans-serif`;
    return this.setFont(this.font);
  }

  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.label) {
      this.entity.label.fillColor = this.cesium.Color.fromCssColorString(color);
    }
    return this;
  }

  setBackgroundColor(color) {
    this.backgroundColor = color;
    this.showBackground = !!color;
    if (this.entity && this.entity.label) {
      if (color) {
        this.entity.label.showBackground = true;
        this.entity.label.backgroundColor = this.cesium.Color.fromCssColorString(color);
      } else {
        this.entity.label.showBackground = false;
      }
    }
    return this;
  }

  setScale(scale) {
    this.scale = scale;
    if (this.entity && this.entity.label) {
      this.entity.label.scale = scale;
    }
    return this;
  }

  setClampToGround(clamp = true) {
    this.heightReference = clamp ? 'clampToGround' : 'none';
    if (this.entity && this.entity.label) {
      const isRelative = this.heightReference === 'relativeToGround';
      const hr = isRelative ? this.cesium.HeightReference.RELATIVE_TO_GROUND
        : (this.heightReference === 'none' ? this.cesium.HeightReference.NONE : this.cesium.HeightReference.CLAMP_TO_GROUND);
      
      this.entity.label.heightReference = hr;
      
      // If we are switching modes, we might need to re-evaluate position
      // but usually setHeight is called after or the position update handles it.
    }
    return this;
  }

  setHeight(height) {
    this.heightOffset = height || 0;

    // Auto update heightReference state similar to Point
    if (this.heightOffset > 0 && this.heightReference === 'clampToGround') {
      this.heightReference = 'relativeToGround';
    }

    // Update internal position Z
    if (this.position && this.position.length >= 2) {
        this.position[2] = height;
    }

    if (this.entity) {
      const isRelative = this.heightReference === 'relativeToGround';
      const hr = isRelative ? this.cesium.HeightReference.RELATIVE_TO_GROUND
        : (this.heightReference === 'none' ? this.cesium.HeightReference.NONE : this.cesium.HeightReference.CLAMP_TO_GROUND);
      
      if (this.entity.label) {
        this.entity.label.heightReference = hr;
        if (this.disableDepthTestDistance !== undefined) {
             this.entity.label.disableDepthTestDistance = this.disableDepthTestDistance;
        }
      }
      
      this.entity.position = this.cesium.Cartesian3.fromDegrees(
          this.position[0], 
          this.position[1], 
          height
      );
    }
    
    return this;
  }

  setPixelOffset(x, y) {
    this.pixelOffset = [x, y];
    if (this.entity) {
        this.entity.label.pixelOffset = new this.cesium.Cartesian2(x, y);
    }
    return this;
  }

  setEyeOffset(x, y, z) {
    this.eyeOffset = [x, y, z];
    if (this.entity && this.entity.label) {
        this.entity.label.eyeOffset = new this.cesium.Cartesian3(x, y, z);
    }
    return this;
  }

  setDisableDepthTestDistance(disable) {
    this.disableDepthTestDistance = disable === false ? undefined : Number.POSITIVE_INFINITY;
    if (this.entity && this.entity.label) {
        this.entity.label.disableDepthTestDistance = this.disableDepthTestDistance;
    }
    return this;
  }

  // --- Height Display Logic ---

  /**
   * Set height range for visibility
   * @param {number} min 
   * @param {number} max 
   */
  setDisplayHeightRange(min, max) {
    this.minDisplayHeight = min !== undefined ? min : 0;
    this.maxDisplayHeight = max !== undefined ? max : Infinity;
    this._enableHeightCheck();
    return this;
  }

  /**
   * Update visibility based on current camera height
   * This logic is fully controlled by the Label class
   * @param {number} cameraHeight 
   */
  updateVisibilityByHeight(cameraHeight) {
    if (!this.entity) return;
    
    const visible = cameraHeight >= this.minDisplayHeight && cameraHeight <= this.maxDisplayHeight;
    
    // Only set if changed to avoid unnecessary property assignments (though Cesium handles this well)
    if (this.entity.show !== visible) {
        this.entity.show = visible;
    }
  }

  _enableHeightCheck() {
    // Clean up existing listener first
    this._disableHeightCheck();

    // If range is default (all visible) OR both are 0 (special case for always visible)
    if ((this.minDisplayHeight <= 0 && this.maxDisplayHeight === Infinity) || 
        (this.minDisplayHeight === 0 && this.maxDisplayHeight === 0)) {
        if (this.entity) this.entity.show = true;
        return;
    }

    if (this.viewer && this.cesium) {
        const hl = getHeightListener(this.viewer, this.cesium);
        // Subscribe to height updates
        // The Label class decides WHAT to do with the height (updateVisibilityByHeight)
        // HeightListener only provides the height
        this._heightListenerUnsubscribe = hl.subscribe(this.updateVisibilityByHeight);

        // Immediate check to ensure correct initial state
        // This fixes the issue where adding a label at a stable camera height (no movement)
        // wouldn't trigger the listener because the height hasn't changed.
        try {
            const camera = this.viewer.camera;
            if (camera && camera.position) {
                const cartographic = this.cesium.Cartographic.fromCartesian(camera.position);
                if (cartographic) {
                    this.updateVisibilityByHeight(cartographic.height);
                }
            }
        } catch (e) {
            // Ignore potential initial errors
        }
    }
  }

  _disableHeightCheck() {
    if (this._heightListenerUnsubscribe) {
      this._heightListenerUnsubscribe();
      this._heightListenerUnsubscribe = null;
    }
  }

  /**
   * Destroy the label instance
   * Cleanup listeners and resources
   */
  destroy() {
    this._disableHeightCheck();
    this._eventHandlers.clear();
    // Entity removal is handled by the manager or caller
  }
  
  // Basic update position
  updatePosition(position) {
    this.position = position;
    if (this.entity) {
      const isRelative = this.heightReference === 'relativeToGround' || this.heightOffset > 0;
      const h = isRelative ? (this.heightOffset || 0) : (position[2] || 0);
      this.entity.position = this.cesium.Cartesian3.fromDegrees(position[0], position[1], h);
    }
    return this;
  }
  
  // Interface required by manager
  setGroup(groupName) {
      const oldGroup = this.group;
      this.group = groupName || null;
      pointsManager.updateGroup(this, oldGroup, this.group);
      pointsManager.removeDuplicatesAtPosition(this.position, this.group, this.id);
      return this;
  }
}
