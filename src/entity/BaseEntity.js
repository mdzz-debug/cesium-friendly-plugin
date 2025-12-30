
import pointsManager from '../core/manager.js';
import { getHeightListener } from '../utils/heightListener.js';
import { deepClone } from '../utils/deepClone.js';
import { generateCanvas } from '../utils/canvasGenerator.js';

export class BaseEntity {
  constructor(id, viewer, cesium, options = {}) {
    this.id = id;
    this.viewer = viewer;
    this.cesium = cesium;
    // Deep copy options to prevent shared reference pollution
    this.options = deepClone(options);
    
    // 1. Basic Properties
    this.name = this.options.name || '';
    this.description = this.options.description || '';
    this.group = this.options.group || 'default';
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

  // --- Collection Management ---
  
  /**
   * Get the entity collection where this entity should be stored.
   * Default: viewer.entities (Root collection)
   * Subclasses should override this to provide isolated collections.
   */
  getCollection() {
      if (this.viewer) {
          return this.viewer.entities;
      }
      return null;
  }

  // --- Lifecycle ---

  /**
   * Combine all current entities into a single Billboard image.
   * This is chainable and modifies the behavior of .add().
   * Instead of adding separate entities, .add() will generate a canvas
   * from the current configuration and add a single BillboardEntity.
   * @param {number} scaleFactor - Multiplier for canvas resolution (e.g. 2 for Retina/HighDPI). Default 1.
   */
  toCanvas(scaleFactor = 1) {
    this._asCanvas = true;
    this._canvasScale = scaleFactor;
    return this;
  }

  add() {
    if (this._destroyed || !this._entityCollection) {
      // console.warn(`[CesiumFriendly] Cannot add destroyed entity ${this.id}`);
      return this;
    }

    if (this._asCanvas) {
        return this._addAsCanvas();
    }

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

  _addAsCanvas() {
      // 1. Gather all entities in the collection
      const entities = [...this._entityCollection];
      
      // 2. Sort by priority for correct layering on canvas
      const priority = { 'billboard': 0, 'point': 1, 'geometry': 1, 'label': 2 };
      entities.sort((a, b) => (priority[a.type] || 0) - (priority[b.type] || 0));
      
      // 3. Generate Canvas (Async)
      // Since Cesium entities are sync, we create a placeholder BillboardEntity first
      // and update its image when the promise resolves.
      
      // We need a host entity. We can reuse 'this' if it's a BillboardEntity, 
      // or we need to create one if 'this' is a Point/Label.
      // However, to keep it simple and consistent, let's look for a BillboardEntity in the chain
      // or default to creating a new one on top of 'this'.
      
      // Actually, if we are converting everything to one image, we only need ONE entity to represent it.
      // Let's use 'this' (the wrapper) but ensure the underlying Cesium entity is a Billboard.
      
      // If 'this' is NOT a BillboardEntity wrapper, we might have issues if user calls point-specific methods later.
      // But 'toCanvas' implies the final result is an image.
      
      // Strategy:
      // - Use 'this' ID.
      // - Create a BillboardGraphics configuration.
      // - Add it to the manager as a billboard type (even if wrapper says point).
      // - This might be confusing for type checks, but efficient.
      
      // Better Strategy:
      // If we are in 'toCanvas' mode, we act as a BillboardEntity.
      
      // Let's assume the position is based on the primary entity (this).
      const position = this.position;
      const heightReference = this.heightReference;
      const heightOffset = this.heightOffset;
      
      // Prepare a callback property for the image to handle async loading
      const imageProperty = new this.cesium.CallbackProperty((time, result) => {
          if (this._canvasDataUrl) {
              return this._canvasDataUrl;
          }
          // Return a transparent 1x1 pixel or loading placeholder until ready
          // return canvas; 
          return this._canvasDataUrl; // Undefined initially
      }, false);
      
      // Create options for the new combined entity
      // We should inherit common props from 'this'
      const combinedOptions = {
          id: this.id,
          name: this.name,
          position: this.cesium.Cartesian3.fromDegrees(
              position[0], 
              position[1], 
              (heightReference === 'relativeToGround' ? heightOffset : (position[2] || 0) + heightOffset)
          ),
          billboard: {
              image: imageProperty,
              horizontalOrigin: this.cesium.HorizontalOrigin.CENTER,
              verticalOrigin: this.cesium.VerticalOrigin.CENTER,
              heightReference: (heightReference === 'clampToGround') 
                  ? this.cesium.HeightReference.CLAMP_TO_GROUND 
                  : this.cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: this.disableDepthTestDistance
          }
      };
      
      // Add to viewer via Manager (as a billboard)
      // We need to register 'this' wrapper as the handler.
      // Note: We are bypassing the standard _createEntity of subclasses.
      
      // Start the generation process
      generateCanvas(entities, this._canvasScale || 1).then(result => {
          // Handle both string (old) and object (new) return format
          const dataUrl = typeof result === 'string' ? result : result.dataUrl;
          this._canvasDataUrl = dataUrl;

          // Update alignment and scale if metadata is available
          if (typeof result === 'object' && result.centerX !== undefined && this.entity && this.entity.billboard) {
               const s = this._canvasScale || 1;
               const userScale = (this.scale !== undefined && this.scale !== null) ? this.scale : 1.0;
               
               // Set scale to match physical size (1/scaleFactor) * user desired scale
               this.entity.billboard.scale = userScale / s;

               // Adjust alignment to match the generated anchor point
               // We use LEFT/TOP alignment for the billboard, and use pixelOffset to shift 
               // the anchor point (centerX, centerY) to the entity's position.
               this.entity.billboard.horizontalOrigin = this.cesium.HorizontalOrigin.LEFT;
               this.entity.billboard.verticalOrigin = this.cesium.VerticalOrigin.TOP;
               
               // Pixel offset needs to scale with the user's scale (visual size)
               // result.centerX/Y are in logical pixels.
               this.entity.billboard.pixelOffset = new this.cesium.Cartesian2(
                   -result.centerX * userScale, 
                   -result.centerY * userScale
               );

               // Sync scaleByDistance with pixelOffsetScaleByDistance
               // This is crucial for keeping the anchor point correct when the billboard scales by distance.
               if (this.scaleByDistance) {
                   // Ensure pixelOffset scales exactly the same way as the image
                   this.entity.billboard.pixelOffsetScaleByDistance = this.entity.billboard.scaleByDistance;
               }
          }
      }).catch(e => {
          console.error('[CesiumFriendly] Failed to generate canvas', e);
      });
      
      // Register with manager
      // We treat it as a billboard for management purposes
      const ds = pointsManager.getDataSource('cesium-friendly-billboards');
      const e = ds.entities.add(combinedOptions);
      this.entity = e;
      
      // Register this wrapper
      // We might need to trick the manager into thinking this is a billboard wrapper if it was a point wrapper
      // But manager uses 'type' prop of wrapper.
      // Let's force update type to 'billboard' to ensure correct cleanup later?
      // Or just leave it, as long as manager can remove it by ID.
      // Cleanup uses ID, so it should be fine.
      
      pointsManager.registerEntity(this, { _reused: true });
      
      // Mark as mounted
      this._destroyed = false;
      
      return this;
  }

  _mount() {
    this._destroyed = false;
    
    if (!this.viewer) {
        console.error(`[CesiumFriendly Error] No viewer found in _mount for ${this.id}`);
        return;
    }
    
    // Create the Cesium entity if not already created
    if (!this.entity) {
      const created = this._createEntity();
      if (created) {
          this.entity = created;
      } else {
          console.error(`[CesiumFriendly Error] _createEntity returned null for ${this.id}`);
      }
    } else {
        // Entity already exists, skipping creation
    }

    if (!this.entity) {
         return;
    }
    
    // Get the isolated collection
    const collection = this.getCollection();
    if (!collection) {
        console.error(`[CesiumFriendly Error] No collection available for ${this.id}`);
        return;
    }

    // Check for ID conflict and clean up potential ghost entities in the target collection
    const existing = collection.getById(this.id);
    let reused = false;

    if (existing) {
        const oldWrapper = pointsManager.getEntity(this.id);
        // Optimization: If identical configuration, reuse the existing Cesium entity
        // This prevents flickering and unnecessary cleanup/add cycles
        if (oldWrapper && 
            oldWrapper.type === this.type && 
            JSON.stringify(oldWrapper.options) === JSON.stringify(this.options)) {
            
            this.entity = existing; // Adopt the living entity
            reused = true;
        } else {
            // Full replacement
            // Note: If this.entity is a plain object (config), add() returns the new instance
            if (existing !== this.entity) {
                 collection.remove(existing);
                //  console.log(`[CesiumFriendly] Native Replacement Add:`, this.entity);
                 const result = collection.add(this.entity);
                 // If we passed a config object, update to the real entity instance
                 if (!(this.entity instanceof this.cesium.Entity)) {
                     this.entity = result;
                 }
            }
        }
    } else {
        const result = collection.add(this.entity);
        // If we passed a config object, update to the real entity instance
        if (!(this.entity instanceof this.cesium.Entity)) {
             this.entity = result;
        }
    }

    // Register with manager
    // Pass _reused flag so manager knows to skip destructive cleanup
    pointsManager.registerEntity(this, { ...this.options, _reused: reused }); 
    
    // Auto-save initial state so restoreState() works without manual save
    if (!reused) {
        this.saveState();
    }

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

  select() {
    pointsManager.select(this);
    return this;
  }

  deselect() {
    // 只有当自己被选中时才执行取消选中，避免误操作
    if (pointsManager.getSelectedId() === this.id) {
        pointsManager.deselect();
    }
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
    // Animation Hook
    if (duration > 0) {
       return this._animateUpdate(options || {}, duration);
    }

    if (options && typeof options === 'object') {
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
    }
    
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
        cancelAnimationFrame(this._updateTimer);
        this._updateTimer = null;
    }

    Object.keys(targetOptions).forEach(key => {
        const endVal = targetOptions[key];
        // 如果 startVal 是 undefined，尝试从 options 中获取默认值
        const startVal = this[key] !== undefined ? this[key] : (this.options[key]);

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
        // B. Color - DIRECT UPDATE (No Animation)
        // User requested to remove color animation and just apply it instantly.
        else if ((key.toLowerCase().includes('color')) && typeof endVal === 'string') {
             // Treat as non-animatable value
             props.push({
                 key,
                 type: 'value-immediate', // Mark as immediate update
                 end: endVal
             });
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
    const startTime = performance.now();
    
    const animate = (now) => {
        const elapsed = now - startTime;
        let t = elapsed / duration;
        
        if (t >= 1) {
            t = 1;
        }

        // Apply Easing? (Optional, Linear for now)
        // t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // EaseInOutQuad

        const currentOptions = {};
        
        props.forEach(p => {
            if (p.type === 'number') {
                const val = p.start + (p.end - p.start) * t;
                currentOptions[p.key] = val;
            } 
            else if (p.type === 'array') {
                 const val = p.start.map((v, i) => {
                     const e = p.end[i] !== undefined ? p.end[i] : v;
                     return v + (e - v) * t;
                 });
                 currentOptions[p.key] = val;
            }
            // Apply value types (including color) immediately at start or end?
            // If we wait for t===1, it snaps at the end.
            // But for color, user might want immediate change. 
            // However, inside an animation chain (e.g. animate(2000)), usually "value" props snap at the end.
            // If user wants immediate color change, they should just call .setColor() directly without .animate().
            // But if they call .animate().setColor(), they expect it to change as part of the transaction.
            // Since we removed interpolation, "snapping at the end" (t===1) is the standard behavior for non-interpolated values in animation libraries.
            // BUT, user said "directly change color", implying no transition.
            // If I make it snap at t=0, it changes immediately when animation starts.
            // Let's stick to t=1 (end of animation) to keep it consistent with the duration promise, 
            // OR if user meant "don't animate color, just set it", they should probably not chain it if they want it NOW.
            // Re-reading: "Color change frequency is too fast so it flashes... remove color from animation library, just change color directly".
            // This implies when `animate().setColor()` is called, it shouldn't try to LERP.
            // If we wait until t=1, it will just pop to the new color at the end.
            // If we do it at t=0, it pops at start.
            // I will make it apply at t=1 (end) so it respects the "wait" time of the animation, but doesn't flicker intermediate colors.
            else if (p.type === 'value' && t === 1) {
                  currentOptions[p.key] = p.end;
             }
             // Apply immediate values (like color) right at the start (first frame, t >= 0)
             // We check !p.applied to ensure it's only applied once to save resources, 
             // though setting it every frame is also fine but redundant.
             else if (p.type === 'value-immediate' && !p.applied) {
                 currentOptions[p.key] = p.end;
                 p.applied = true; 
             }
        });

        // Apply updates using existing update method (duration=0)
        // We use the existing update logic so it handles setters, dirty checking, etc.
        // This might trigger 'change' event many times.
        this.update(currentOptions, 0);

        if (t < 1) {
            this._updateTimer = requestAnimationFrame(animate);
        } else {
            this._updateTimer = null;
        }
    };

    this._updateTimer = requestAnimationFrame(animate);

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
      cancelAnimationFrame(this._flashTimer);
      this._flashTimer = null;
    }

    if (this._updateTimer) {
      cancelAnimationFrame(this._updateTimer);
      this._updateTimer = null;
    }
    
    // Delegate all cleanup to manager to avoid redundant logic and ensure consistency
    // manager.removeEntity handles removal from Cesium collections (CustomDataSource or Viewer)
    // and cleanup of internal maps/timers.
    pointsManager.removeEntity(this);
    
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
        console.log('%c ⚠️ CesiumFriendlyPlugin Warning ', 'background: #f59e0b; color: white; padding: 2px 5px; border-radius: 2px; font-weight: bold;', `Entity ${this.id} expired immediately (timestamp ${timestamp} is in the past).`);
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
    // Capture the intended "normal" opacity from current state if not flashing
    // If already flashing, this.opacity might be intermediate, so this logic is slightly flawed if restarting flash
    // But usually fine.
    const maxOpacity = options.maxOpacity != null ? options.maxOpacity : (this.opacity || 1);
    
    if (this._flashTimer) {
      cancelAnimationFrame(this._flashTimer);
      this._flashTimer = null;
    }
    this._flashing = !!enable;

    if (!enable) {
      // Restore to fully visible or maxOpacity?
      // Original code used this.opacity which was buggy.
      // Let's restore to 1.0 or the maxOpacity we derived.
      this.setOpacity(maxOpacity); 
      if (!this._hidden && this.entity) this.entity.show = true;
      return this;
    }

    if (this.entity) this.entity.show = true;
    
    let startTime = performance.now();
    
    const animateFlash = (now) => {
        if (!this._flashing) return;
        if (!this.entity) return;
        if (this._hidden) return;

        const elapsed = now - startTime;
        // Cycle time = duration * 2 (Out + In)
        const cycleDuration = duration * 2;
        const cyclePos = elapsed % cycleDuration;
        
        let currentOpacity;
        if (cyclePos < duration) {
            // Fading Out (Max -> Min)
            const t = cyclePos / duration;
            currentOpacity = maxOpacity - (maxOpacity - minOpacity) * t;
        } else {
            // Fading In (Min -> Max)
            const t = (cyclePos - duration) / duration;
            currentOpacity = minOpacity + (maxOpacity - minOpacity) * t;
        }

        // This requires the subclass to implement setOpacity or we access entity directly
        // Better to use a method if available
        if (typeof this.setOpacity === 'function') {
            this.setOpacity(currentOpacity);
        } else if (this.entity) {
            // Fallback generic opacity handling if possible (complex for mixed entities)
        }
        
        this._flashTimer = requestAnimationFrame(animateFlash);
    };

    this._flashTimer = requestAnimationFrame(animateFlash);

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
    // console.warn('CesiumFriendlyPlugin: LabelEntity not registered.');
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
      
      // console.warn('CesiumFriendlyPlugin: BillboardEntity not registered.');
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
