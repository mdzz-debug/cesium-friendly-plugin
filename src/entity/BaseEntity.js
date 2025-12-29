
import pointsManager from '../core/manager.js';
import { getHeightListener } from '../utils/heightListener.js';

export class BaseEntity {
  constructor(id, viewer, cesium, options = {}) {
    this.id = id;
    this.viewer = viewer;
    this.cesium = cesium;
    this.options = options;
    
    // 1. Basic Properties
    this.name = options.name || '';
    this.description = options.description || '';
    this.group = options.group || 'default';
    this.type = 'base'; // Should be overridden
    
    // Internal Cesium Entity
    this.entity = null; 
    
    // Composition Group (for chaining multiple entities)
    this._entityCollection = [this];

    // State management
    this._hidden = false;
    this._eventHandlers = new Map();
    this._savedState = null;
    this._flashTimer = null;
    this._flashing = false;

    // Display Condition (Height)
    this.minDisplayHeight = options.minDisplayHeight !== undefined ? options.minDisplayHeight : 0;
    this.maxDisplayHeight = options.maxDisplayHeight !== undefined ? options.maxDisplayHeight : Infinity;

    // Support options.displayCondition object for consistency with setDisplayCondition
    if (options.displayCondition) {
        if (options.displayCondition.min !== undefined) this.minDisplayHeight = options.displayCondition.min;
        if (options.displayCondition.max !== undefined) this.maxDisplayHeight = options.displayCondition.max;
    }

    this._heightVisible = true;
    this._heightListenerUnsubscribe = null;
    this.updateVisibilityByHeight = this.updateVisibilityByHeight.bind(this);
  }

  // --- Lifecycle ---

  add() {
    // Define render priority: lower value = earlier mount (lower layer)
    // Billboard (0) -> Point/Geometry (1) -> Label (2)
    const priority = {
        'billboard': 0,
        'point': 1,
        'geometry': 1, // Generic geometry treated as point-level
        'label': 2
    };

    // Sort the collection based on priority
    const sorted = [...this._entityCollection].sort((a, b) => {
        const pa = priority[a.type] !== undefined ? priority[a.type] : 0;
        const pb = priority[b.type] !== undefined ? priority[b.type] : 0;
        return pa - pb;
    });

    // Iterate over the sorted collection and mount each entity
    sorted.forEach(entity => {
        entity._mount();
    });
    return this;
  }

  _mount() {
    if (!this.viewer) return;
    
    // Create the Cesium entity if not already created
    if (!this.entity) {
      const created = this._createEntity();
      if (created) {
          this.entity = created;
      }
    }

    if (!this.entity) {
         // console.warn('CesiumFriendlyPlugin: No entity created for', this.type);
         return;
    }
    
    // Add to viewer if not already added
    if (!this.viewer.entities.getById(this.id)) {
      this.viewer.entities.add(this.entity);
    }

    // Register with manager
    pointsManager.registerEntity(this, this.options); 
    
    // Auto-save initial state so restoreState() works without manual save
    this.saveState();

    this._enableHeightCheck();
    this._updateFinalVisibility();
  }

  show() {
    this._hidden = false;
    this._updateFinalVisibility();
    this.trigger('change', this);
    return this;
  }

  hide() {
    this._hidden = true;
    this._updateFinalVisibility();
    this.trigger('change', this);
    return this;
  }

  _updateFinalVisibility() {
    if (this.entity) {
      this.entity.show = !this._hidden && this._heightVisible;
    }
  }

  _enableHeightCheck() {
    if (this.minDisplayHeight === 0 && this.maxDisplayHeight === Infinity) return;
    
    const hl = getHeightListener(this.viewer, this.cesium);
    this._heightListenerUnsubscribe = hl.subscribe(this.updateVisibilityByHeight);

    // Initial check immediately to ensure correct visibility state on startup/add
    const currentHeight = hl.getCurrentHeight();
    this.updateVisibilityByHeight(currentHeight);
  }

  _disableHeightCheck() {
    if (this._heightListenerUnsubscribe) {
      this._heightListenerUnsubscribe();
      this._heightListenerUnsubscribe = null;
    }
  }

  updateVisibilityByHeight(height) {
    const inRange = height >= this.minDisplayHeight && height <= this.maxDisplayHeight;
    if (this._heightVisible !== inRange) {
      this._heightVisible = inRange;
      this._updateFinalVisibility();
    }
  }

  // --- Update API ---

  update(options, duration = 0) {
    if (!options || typeof options !== 'object') return this;
    
    // Animation Hook
    if (duration > 0) {
       return this._animateUpdate(options, duration);
    }
    
    Object.keys(options).forEach(key => {
        const value = options[key];
        
        // 1. Delegate to composition methods
        if (key === 'label' && typeof this.label === 'function') {
            this.label(value);
            return;
        }
        if (key === 'billboard' && typeof this.billboard === 'function') {
            this.billboard(value);
            return;
        }

        // 2. Try setter: setKey(val)
        const setterName = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
        if (typeof this[setterName] === 'function') {
            this[setterName](value);
        } 
        // 3. Special properties
        else if (key === 'position') {
             if (typeof this.setPosition === 'function') {
                 this.setPosition(value);
             } else {
                 this.position = value;
             }
        }
        // 4. Direct property set
        else {
             this[key] = value;
             if (this.entity && (key === 'name' || key === 'description')) {
                 this.entity[key] = value;
             }
        }
    });
    this.trigger('change', this);
    return this;
  }

  // --- Animation ---

  /**
   * 开启链式动画模式。
   * 示例: entity.animate(2000).setColor('red').setPixelSize(20).update();
   * @param {number} duration 动画时长 (ms)
   * @returns {Proxy} 代理对象，拦截 set 方法并记录目标值，最后调用 update() 或 start() 触发动画
   */
  animate(duration = 1000) {
    const pendingOptions = {};
    const self = this;

    return new Proxy(this, {
      get(target, prop, receiver) {
        // 1. Trigger methods
        
        // update(): Execute animation with pending options
        if (prop === 'update') {
            return () => {
                return self.update(pendingOptions, duration);
            };
        }
        
        // Intercept lifecycle methods that support animation
        if (prop === 'add') {
            return () => self.add(duration);
        }
        if (prop === 'restoreState') {
            return () => self.restoreState(duration);
        }

        // 2. 拦截 Setter
        if (typeof prop === 'string' && prop.startsWith('set')) {
            return (...args) => {
                let key = prop.slice(3);
                if (key.length > 0) {
                    key = key.charAt(0).toLowerCase() + key.slice(1);
                    
                    // 处理特殊的多参数 Setter
                    if (prop === 'setOutline') {
                         if (args[0] !== undefined) pendingOptions.outline = args[0];
                         if (args[1] !== undefined) pendingOptions.outlineColor = args[1];
                         if (args[2] !== undefined) pendingOptions.outlineWidth = args[2];
                    }
                    else if (prop === 'setPixelOffset') {
                        if (args.length >= 2) pendingOptions.pixelOffset = { x: args[0], y: args[1] };
                        else pendingOptions.pixelOffset = args[0];
                    }
                    else if (prop === 'setEyeOffset') {
                         if (args.length >= 3) pendingOptions.eyeOffset = { x: args[0], y: args[1], z: args[2] };
                         else pendingOptions.eyeOffset = args[0];
                    }
                    // 默认单参数 Setter
                    else {
                        if (args.length > 0) pendingOptions[key] = args[0];
                    }
                }
                return receiver; // 返回代理以支持链式调用
            };
        }

        // 3. 透传其他属性/方法
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') {
             return val.bind(target);
        }
        return val;
      }
    });
  }

  _animateUpdate(targetOptions, duration) {
    // 1. Identify animatable properties and their start/end values
    const props = [];
    const Cesium = this.cesium;
    
    // Stop any existing update animation
    if (this._updateTimer) {
        clearInterval(this._updateTimer);
        this._updateTimer = null;
    }

    Object.keys(targetOptions).forEach(key => {
        const endVal = targetOptions[key];
        const startVal = this[key];

        // Skip if values are same (shallow check)
        if (endVal === startVal) return;
        
        // Skip special composed properties for now (billboard, label) unless we recurse
        // We only animate direct properties on this entity
        if (key === 'billboard' || key === 'label') return;

        // A. Number Interpolation (opacity, scale, pixelSize, rotation, width, height, etc)
        if (typeof endVal === 'number' && typeof startVal === 'number') {
            props.push({
                key,
                type: 'number',
                start: startVal,
                end: endVal
            });
        }
        // B. Color Interpolation (color, outlineColor, fillColor, etc)
        // Check if key contains 'Color' or is 'color'
        else if ((key.toLowerCase().includes('color')) && typeof endVal === 'string') {
             try {
                 const c1 = Cesium.Color.fromCssColorString(startVal || '#FFFFFF');
                 const c2 = Cesium.Color.fromCssColorString(endVal);
                 props.push({
                     key,
                     type: 'color',
                     start: c1,
                     end: c2
                 });
             } catch (e) {
                 // Fallback: just set it at end
                 console.warn('Animation color parse error', e);
             }
        }
        // C. Position Interpolation
        else if (key === 'position' && Array.isArray(endVal) && Array.isArray(startVal)) {
            // Assume [lng, lat, alt]
            // We can interpolate linearly on these coordinates for short distances
            // Or convert to Cartesian3, lerp, and convert back?
            // Simple linear on [lng, lat, alt] is usually fine for local movements.
            props.push({
                key,
                type: 'array',
                start: [...startVal],
                end: [...endVal]
            });
        }
        // D. Non-animatable: Apply at end
        else {
            // We'll just apply these at the very end of the animation
            props.push({
                key,
                type: 'value',
                end: endVal
            });
        }
    });

    if (props.length === 0) return this;

    // 2. Start Animation Loop
    const startTime = Date.now();
    const frameRate = 30; // 30fps is enough for property updates usually
    const interval = 1000 / frameRate;
    
    this._updateTimer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        let t = elapsed / duration;
        
        if (t >= 1) {
            t = 1;
            clearInterval(this._updateTimer);
            this._updateTimer = null;
        }

        // Apply Easing? (Optional, Linear for now)
        // t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // EaseInOutQuad

        const currentOptions = {};
        
        props.forEach(p => {
            if (p.type === 'number') {
                const val = p.start + (p.end - p.start) * t;
                currentOptions[p.key] = val;
            } 
            else if (p.type === 'color') {
                const col = Cesium.Color.lerp(p.start, p.end, t, new Cesium.Color());
                // Convert back to CSS string for the setter
                currentOptions[p.key] = col.toCssColorString();
            }
            else if (p.type === 'array') {
                 const val = p.start.map((v, i) => {
                     const e = p.end[i] !== undefined ? p.end[i] : v;
                     return v + (e - v) * t;
                 });
                 currentOptions[p.key] = val;
            }
            else if (p.type === 'value' && t === 1) {
                 currentOptions[p.key] = p.end;
            }
        });

        // Apply updates using existing update method (duration=0)
        // We use the existing update logic so it handles setters, dirty checking, etc.
        // This might trigger 'change' event many times.
        this.update(currentOptions, 0);

    }, interval);

    return this;
  }

  // --- Chainable Setters ---

  setDisplayCondition(options) {
    const { min, max } = options || {};
    
    // Use current values if defined, otherwise defaults
    const currentMin = this.minDisplayHeight !== undefined ? this.minDisplayHeight : 0;
    const currentMax = this.maxDisplayHeight !== undefined ? this.maxDisplayHeight : Infinity;

    this.minDisplayHeight = min !== undefined ? min : currentMin;
    
    // Default max to min * 10 or min + 10000 to ensure reasonable visibility range if not specified
    // But for DisplayCondition (min/max height), Infinity is often desired. 
    // However, if user updates min and wants a constrained range but forgets max, Infinity might be unexpected.
    // Let's stick to Infinity as default for max height as it's standard Cesium behavior (visible from min to space).
    // So we only override if max is explicitly provided or currentMax exists.
    let newMax = max !== undefined ? max : currentMax;
    
    // Ensure max > min
    if (newMax !== Infinity && newMax <= this.minDisplayHeight) {
        newMax = Infinity;
    }
    this.maxDisplayHeight = newMax;

    this._disableHeightCheck();
    this._enableHeightCheck();
    if (this._heightListenerUnsubscribe) {
       const hl = getHeightListener(this.viewer, this.cesium);
       const currentHeight = hl.getCurrentHeight();
       this.updateVisibilityByHeight(currentHeight);
    }
    return this;
  }

  setGroup(groupName) {
    const oldGroup = this.group;
    this.group = groupName || 'default';
    
    if (oldGroup !== this.group) {
      pointsManager.updateGroup(this, oldGroup, this.group);
    }
    this.trigger('change', this);
    return this;
  }

  delete() {
    if (this._destroyed) return;
    this._destroyed = true;

    this._disableHeightCheck();

    if (this._flashTimer) {
      clearInterval(this._flashTimer);
      this._flashTimer = null;
    }
    
    // Remove from viewer
    if (this.viewer && this.entity) {
      this.viewer.entities.remove(this.entity);
    }
    
    // Remove from manager
    // Note: pointsManager.removeEntity calls point.delete(), so the flag prevents recursion
    pointsManager.removeEntity(this.id);
    
    this.entity = null;
    this._eventHandlers.clear();

    // Propagate destruction to collection peers (Composite Lifecycle)
    if (this._entityCollection) {
        const collection = this._entityCollection;
        // Clear reference on self first
        this._entityCollection = null;
        
        // Iterate copy to destroy peers
        [...collection].forEach(peer => {
            if (peer !== this && !peer._destroyed) {
                peer.delete();
            }
        });
    }
  }

  // --- Events ---

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
        } catch (e) {
          console.error(`Error in event handler for ${type}:`, e);
        }
      }
    }
    return this;
  }

  // --- Behavior ---

  setTTL(ms) {
    pointsManager.updateTTL(this.id, ms);
    this.trigger('change', this);
    return this;
  }

  setExpiresAt(timestamp) {
    if (typeof timestamp === 'number') {
      if (timestamp < 10000000000) {
        timestamp *= 1000;
      }
      const ttl = timestamp - Date.now();
      if (ttl <= 0) {
        this.delete();
      } else {
        pointsManager.updateTTL(this.id, ttl);
      }
    }
    this.trigger('change', this);
    return this;
  }

  flash(enable, duration = 1000, options = {}) {
     // Compatible with old signature: flash(enable, options)
    if (typeof duration === 'object' && duration !== null) {
      options = duration;
      duration = options.duration || 1000;
    }

    const minOpacity = options.minOpacity != null ? options.minOpacity : 0.0;
    const maxOpacity = options.maxOpacity != null ? options.maxOpacity : (this.opacity || 1);
    
    if (this._flashTimer) {
      clearInterval(this._flashTimer);
      this._flashTimer = null;
    }
    this._flashing = !!enable;

    if (!enable) {
      this.setOpacity(this.opacity || 1); // Restore
      if (!this._hidden && this.entity) this.entity.show = true;
      return this;
    }

    if (this.entity) this.entity.show = true;
    
    let isFadingOut = true;
    const stepInterval = 50;
    const steps = duration / stepInterval;
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
      // This requires the subclass to implement setOpacity or we access entity directly
      // Better to use a method if available
      if (typeof this.setOpacity === 'function') {
        this.setOpacity(currentOpacity);
      } else if (this.entity) {
         // Fallback generic opacity handling if possible (complex for mixed entities)
      }
    }, stepInterval);

    return this;
  }

  saveState() {
    // Should be overridden or extended by subclasses
    this._savedState = {
      // Basic common props
    };
    return this;
  }

  restoreState() {
    // Should be overridden
    return this;
  }

  // --- Composition Proxies ---

  _createProxy(createFn, EntityClassType) {
      const self = this;
      const proxy = new Proxy(createFn, {
          get(target, prop, receiver) {
              if (prop in target) {
                  return Reflect.get(target, prop, receiver);
              }
              
              const Types = BaseEntity.Types;
              const EntityClass = Types && Types[EntityClassType];
              
              if (EntityClass && EntityClass.prototype && prop in EntityClass.prototype) {
                  // Reuse existing entity of this type if available in collection
                  // This prevents creating duplicate labels/billboards when accessing the property multiple times
                  let entity = null;
                  if (self._entityCollection) {
                      entity = self._entityCollection.find(e => e instanceof EntityClass);
                  }
                  
                  if (!entity) {
                      entity = createFn();
                  }
                  
                  const value = entity[prop];
                  if (typeof value === 'function') {
                      return value.bind(entity);
                  }
                  return value;
              }
              return undefined;
          }
      });
      return proxy;
  }

  _createLabel(options) {
    const Types = BaseEntity.Types;
    if (Types && Types.LabelEntity) {
        options = options || {};
        
        const id = this.id + '_label_' + Math.random().toString(36).substr(2, 5);
        const pos = this.position || (this.options ? this.options.position : undefined);
        
        const newOpts = {
            ...options,
            position: options.position || pos,
            group: this.group,
            heightReference: options.heightReference || this.heightReference
        };
        
        const next = new Types.LabelEntity(id, this.viewer, this.cesium, newOpts);
        next._entityCollection = this._entityCollection;
        this._entityCollection.push(next);
        return next;
    }
    console.warn('CesiumFriendlyPlugin: LabelEntity not registered.');
    return this;
  }

  get label() {
       const fn = (options) => this._createLabel(options);
       return this._createProxy(fn, 'LabelEntity');
   }

   _getHorizontalOrigin(origin) {
      if (typeof origin === 'number') return origin;
      if (typeof origin === 'string') {
          const upper = origin.toUpperCase();
          if (upper === 'CENTER') return this.cesium.HorizontalOrigin.CENTER;
          if (upper === 'LEFT') return this.cesium.HorizontalOrigin.LEFT;
          if (upper === 'RIGHT') return this.cesium.HorizontalOrigin.RIGHT;
      }
      return this.cesium.HorizontalOrigin.CENTER;
   }

   _getVerticalOrigin(origin) {
      if (typeof origin === 'number') return origin;
      if (typeof origin === 'string') {
          const upper = origin.toUpperCase();
          if (upper === 'CENTER') return this.cesium.VerticalOrigin.CENTER;
          if (upper === 'BOTTOM') return this.cesium.VerticalOrigin.BOTTOM;
          if (upper === 'TOP') return this.cesium.VerticalOrigin.TOP;
          if (upper === 'BASELINE') return this.cesium.VerticalOrigin.BASELINE;
      }
      return this.cesium.VerticalOrigin.BOTTOM;
   }
 
   _createBillboard(img, options = {}) {
      // Handle img argument flexibility
      if (typeof img === 'object' && img !== null) {
          options = img;
          img = options.image;
      } else {
          options.image = img;
      }

      const Types = BaseEntity.Types;
      if (Types && Types.BillboardEntity) {
          const id = this.id + '_billboard_' + Math.random().toString(36).substr(2, 5);
          const pos = this.position || (this.options ? this.options.position : undefined);
          
          const newOpts = {
              ...options,
              position: options.position || pos,
              group: this.group,
              heightReference: options.heightReference || this.heightReference
          };
          
          const next = new Types.BillboardEntity(id, this.viewer, this.cesium, newOpts);
          next._entityCollection = this._entityCollection;
          this._entityCollection.push(next);
          return next;
      }
      
      console.warn('CesiumFriendlyPlugin: BillboardEntity not registered.');
      return this;
  }

  get billboard() {
      const fn = (img, options) => this._createBillboard(img, options);
      return this._createProxy(fn, 'BillboardEntity');
  }




  // --- Internal ---
  
  _createEntity() {
    throw new Error('_createEntity must be implemented by subclass');
  }
}
