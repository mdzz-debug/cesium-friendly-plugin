
import pointsManager from '../core/manager.js';
import canvasManager from '../core/canvasManager.js';
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
      if (!this.viewer) return null;
      if (this._asCanvas) {
          const ds = canvasManager.getDataSource('cesium-friendly-canvas');
          return ds ? ds.entities : this.viewer.entities;
      }
      return this.viewer.entities;
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
    this.isCanvas = true;
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
      
      const excludeIds = this._entityCollection ? this._entityCollection.map(e => e.id) : [this.id];
      pointsManager.removeDuplicatesAtPosition(this.position, this.group, excludeIds);
      
      const ds = canvasManager.getDataSource('cesium-friendly-canvas');
      if (ds) {
          const existing = ds.entities.getById(this.id);
          if (existing) ds.entities.remove(existing);
      }
      
      // Prepare a callback property for the image to handle async loading
      const imageProperty = new this.cesium.CallbackProperty((time, result) => {
          if (this._canvasDataUrl) {
              return this._canvasDataUrl;
          }
          // Return a transparent 1x1 pixel placeholder until ready
          return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMB9oS8WZsAAAAASUVORK5CYII=';
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
              disableDepthTestDistance: this.disableDepthTestDistance,
              distanceDisplayCondition: this.distanceDisplayCondition ? 
                  new this.cesium.DistanceDisplayCondition(this.distanceDisplayCondition.near, this.distanceDisplayCondition.far) : undefined,
              scaleByDistance: this.scaleByDistance ? new this.cesium.NearFarScalar(
                  this.scaleByDistance.near, 
                  this.scaleByDistance.nearValue, 
                  this.scaleByDistance.far, 
                  this.scaleByDistance.farValue
              ) : undefined,
              translucencyByDistance: this.translucencyByDistance ? new this.cesium.NearFarScalar(
                  this.translucencyByDistance.near, 
                  this.translucencyByDistance.nearValue, 
                  this.translucencyByDistance.far, 
                  this.translucencyByDistance.farValue
              ) : undefined
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
               this._canvasAnchor = { centerX: result.centerX, centerY: result.centerY };
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
               const extraX = this.pixelOffset ? this.pixelOffset[0] : 0;
               const extraY = this.pixelOffset ? this.pixelOffset[1] : 0;
               this.entity.billboard.pixelOffset = new this.cesium.Cartesian2(
                   -result.centerX * userScale + extraX, 
                   -result.centerY * userScale + extraY
               );

               // Sync scaleByDistance with pixelOffsetScaleByDistance
               // This is crucial for keeping the anchor point correct when the billboard scales by distance.
               if (this.scaleByDistance) {
                   // Ensure pixelOffset scales exactly the same way as the image
                   this.entity.billboard.pixelOffsetScaleByDistance = this.entity.billboard.scaleByDistance;
               }
               
               // Notify change to ensure immediate re-render
               this.trigger('change', this);
          }
      }).catch(e => {
          console.error('[CesiumFriendly] Failed to generate canvas', e);
      });
      
      // Register with manager
      // We treat it as a billboard for management purposes
      const e = ds.entities.add(combinedOptions);
      this.entity = e;
      this._enableHeightCheck();
      this._updateFinalVisibility();
      this.update();
      
      if (Array.isArray(this._entityCollection)) {
          for (const peer of this._entityCollection) {
              if (peer !== this && peer.entity) {
                  peer.entity.show = false;
              }
          }
      }
      
      // Register this wrapper
      // We might need to trick the manager into thinking this is a billboard wrapper if it was a point wrapper
      // But manager uses 'type' prop of wrapper.
      // Let's force update type to 'billboard' to ensure correct cleanup later?
      // Or just leave it, as long as manager can remove it by ID.
      // Cleanup uses ID, so it should be fine.
      
      canvasManager.registerComposite(this, { _reused: true });
      
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
    
    // Pre-clean duplicates at same position/group to avoid add failure,
    // and ensure any running animations on duplicates are stopped first.
    try {
      const excludeIds = this._entityCollection ? this._entityCollection.map(e => e.id) : [this.id];
      pointsManager.removeDuplicatesAtPosition(this.position, this.group, excludeIds);
    } catch (_) {}
    
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

    if (this._applySmartGeometry) {
        this._applySmartGeometry();
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

    // Auto-restart animation if configured (e.g. after re-add)
    if (this._animContext && !this._animFrame) {
        this._startAnimation();
    }

    // Auto-start flash if pending
    if (this._flashing && this._flashParams) {
        this.flash(this._flashParams.enable, this._flashParams.duration, this._flashParams.options);
    }
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

  update(options) {
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
            else if (key === 'height' || key === 'heightOffset') {
                 if (typeof this.setHeight === 'function') {
                     this.setHeight(value);
                 } else {
                     this.heightOffset = value;
                     if (this.heightOffset > 0 && this.heightReference === 'clampToGround') {
                         this.heightReference = 'relativeToGround';
                     }
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

    // Trigger Animation if pending
    if (this._animPending) {
       this._startAnimation();
       // Return early to prevent applying final state immediately if we are animating from start
       // However, since we already set the properties above (to target values), 
       // if we don't revert them now, the next lines (trigger change) might show them.
       // _startAnimation will revert them.
    }
    
    this.trigger('change', this);
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

    this.stopAnimation();
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
    if (this._inUpdateAnimation && type === 'change') {
      return;
    }
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
    if (this._asCanvas && Array.isArray(this._entityCollection)) {
      if (type === 'click' || type === 'select' || type === 'unselect' || type === 'hover' || type === 'dragstart' || type === 'drag' || type === 'dragend') {
        for (const peer of this._entityCollection) {
          if (peer !== this && typeof peer.trigger === 'function') {
            if (args && args.length > 0) {
              peer.trigger(type, ...args);
            } else {
              peer.trigger(type, peer);
            }
          }
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

    // Store parameters for deferred execution (if entity not mounted yet)
    this._flashParams = { enable, duration, options };

    const minOpacity = options.minOpacity != null ? options.minOpacity : 0.1;
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

    // If entity is not ready, we just set the flag and return.
    // _mount() will check _flashing and _flashParams to start the animation.
    if (!this.entity) {
        return this;
    }

    if (this.entity) this.entity.show = true;
    
    let startTime = performance.now();
    
    const animateFlash = (now) => {
        if (!this._flashing) return;
        if (!this.entity) return;
        if (this._hidden) return;

        const elapsed = now - startTime;
        
        // Use Cosine wave for smooth breathing effect (1 -> 0.1 -> 1)
        // period = duration * 2
        const angle = (elapsed / duration) * Math.PI;
        // Cosine goes 1 -> -1 -> 1. We want 1 -> 0 -> 1 for the mix factor.
        // (Math.cos(angle) + 1) / 2 goes from 1 -> 0 -> 1
        const t = (Math.cos(angle) + 1) / 2;
        
        const currentOpacity = minOpacity + (maxOpacity - minOpacity) * t;

        // This requires the subclass to implement setOpacity or we access entity directly
        // Better to use a method if available
        if (typeof this.setOpacity === 'function') {
            this.setOpacity(currentOpacity);
        } else if (this.entity) {
            // Fallback generic opacity handling if possible (complex for mixed entities)
        }
        
        // Force Cesium to render a new frame to display the change
        if (this.viewer && this.viewer.scene) {
            this.viewer.scene.requestRender();
        }

        this._flashTimer = requestAnimationFrame(animateFlash);
    };

    this._flashTimer = requestAnimationFrame(animateFlash);

    return this;
  }

  // --- Animation ---

  animate(arg1 = 1000, arg2 = false, arg3, arg4, arg5) {
    // Overloads:
    // - animate(duration, loopOrOptions)
    // - animate(propName, start, end, duration, loopOrOptions)
    if (typeof arg1 === 'string') {
        // Legacy signature
        const propName = arg1;
        const start = arg2;
        const end = arg3;
        const duration = (typeof arg4 === 'number') ? arg4 : (arg4 && arg4.duration ? arg4.duration : 1000);
        const loopOrOptions = (typeof arg4 === 'number') ? arg5 : arg4;
        
        let options = {};
        if (typeof loopOrOptions === 'object') {
            options = loopOrOptions || {};
        } else {
            options = { loop: !!loopOrOptions };
        }
        const isLoop = !!options.loop;
        const isRepeat = !!options.repeat;
        const easing = options.easing || 'easeInOut';
        
        // Build anim context directly from args
        this._animContext = {
          startValues: {},
          duration,
          loop: isLoop,
          repeat: isRepeat,
          easing,
          direction: 1
        };
        // Set start and target
        this._animContext.startValues[propName] = start;
        this._animContext.targets = { [propName]: end };
        
        // Prepare and start immediately
        this._animPending = false;
        // Save base state for axis/other orientation compat
        this.saveState();
        this._savedState = deepClone(this._animContext.startValues);
        this.restoreState(0);
        
        if (this.type === 'geometry' && typeof this._startGeometryAnimation === 'function') {
          return this._startGeometryAnimation();
        } else {
          return this._startAnimation();
        }
    } else {
        // New signature: animate(duration, loopOrOptions)
        const duration = (typeof arg1 === 'number') ? arg1 : (arg1 && arg1.duration ? arg1.duration : 1000);
        const loopOrOptions = (typeof arg1 === 'number') ? arg2 : arg1;
        
        this.saveState();
        
        let options = {};
        if (typeof loopOrOptions === 'object') {
            options = loopOrOptions || {};
        } else {
            options = { loop: !!loopOrOptions };
        }
        
        const isLoop = !!options.loop;
        const isRepeat = !!options.repeat;
        const easing = options.easing || 'easeInOut';
    
        this._animContext = {
          startValues: deepClone(this._savedState || {}),
          duration: duration,
          loop: isLoop,
          repeat: isRepeat,
          easing: easing,
          direction: 1
        };
        this._animPending = true;
        return this;
    }
  }

  _startAnimation() {
    if (this.type === 'geometry' && typeof this._startGeometryAnimation === 'function') {
      return this._startGeometryAnimation();
    }
    if (!this._animContext) return;
    
    this._animPending = false;
    this.stopAnimation();
    
    const startState = this._animContext.startValues || {};
    if (this.rotationAxis !== undefined) startState.rotationAxis = this.rotationAxis;
    this._animContext.startValues = startState;
    
    this.saveState();
    const targetState = deepClone(this._savedState || {});
    
    // 2. Identify numeric targets
    const targets = {};
    
    Object.keys(targetState).forEach(key => {
        const s = startState[key];
        const t = targetState[key];
        // Capture everything that changed
        if (s !== t) {
            targets[key] = t;
        }
    });
    
    this._animContext.targets = targets;
    
    // 3. Reset to Start State
    this._savedState = deepClone(startState);
    this.restoreState(0);
    
    // 4. Start Animation Loop (RAF)
    let startTime = null;
    const duration = this._animContext.duration;
    const isLoop = this._animContext.loop;
    const isRepeat = this._animContext.repeat;
    const easing = this._animContext.easing || 'easeInOut';
    
    // Leg duration logic:
    // Loop (Yoyo): duration / 2 (so full A->B->A cycle is duration?) -> Matches original logic
    // Repeat (Restart): duration (full A->B cycle)
    const legDuration = isLoop ? (duration / 2) : duration;
    
    // Cache keys to avoid garbage collection in loop
    const targetKeys = Object.keys(targets);
    // Reusable object for updates to reduce allocation
    const current = {};

    const animate = (now) => {
        if (!this._animContext) return; // Guard against disposal

        // Initialize startTime on first frame to ensure smooth start (elapsed = 0)
        if (!startTime) startTime = now;

        const elapsed = now - startTime;
        let forward = true;
        let linearT;
        
        if (isLoop) {
            const cycles = Math.floor(elapsed / legDuration);
            forward = cycles % 2 === 0;
            linearT = (elapsed % legDuration) / legDuration;
        } else if (isRepeat) {
            // Restart loop: Always forward, resets to 0
            forward = true;
            linearT = (elapsed % legDuration) / legDuration;
        } else {
            // Once
            linearT = Math.min(elapsed / legDuration, 1);
        }

        this._animContext.direction = forward ? 1 : -1;
        
        let t = linearT;
        if (easing === 'easeInOut') {
            t = linearT < 0.5 ? 2 * linearT * linearT : -1 + (4 - 2 * linearT) * linearT;
        } else if (easing === 'linear') {
            t = linearT;
        } else if (easing === 'easeIn') {
            t = linearT * linearT;
        } else if (easing === 'easeOut') {
            t = linearT * (2 - linearT);
        }

        const cycles = Math.floor(elapsed / legDuration);
        targetKeys.forEach(key => {
            const s = startState[key];
            const e = targets[key];
            
            if (typeof s === 'number' && typeof e === 'number') {
                 const twoPi = 2 * Math.PI;
                 const isAngleKey = key === 'rotationAngle' || key === '_spinAngle' || key === 'sectorStartAngle' || key === 'sectorSweepAngle';
                 const diff = Math.abs(e - s);
                 const mod = diff % twoPi;
                 const connected = isRepeat && isAngleKey && (mod < 1e-6 || Math.abs(mod - twoPi) < 1e-6);
                 if (connected) {
                     current[key] = s + (e - s) * (cycles + t);
                 } else if (forward) {
                     current[key] = s + (e - s) * t;
                 } else {
                     current[key] = e + (s - e) * t;
                 }
            } else {
                 current[key] = forward ? e : s;
            }
        });
        
        this._inUpdateAnimation = true;
        this.update(current);
        this._inUpdateAnimation = false;
        
        // Ensure Cesium renders this frame
        if (this.viewer && this.viewer.scene) {
            this.viewer.scene.requestRender();
        }

        if ((linearT < 1 || isLoop || isRepeat) && this._animPending === false) {
             this._animFrame = requestAnimationFrame(animate);
        } else {
             this._animFrame = null;
             this._inUpdateAnimation = false;
             // Ensure final state is exactly target if not looping/repeating
             if (!isLoop && !isRepeat) {
                 this.update(targets);
             }
        }
    };
    
    this._animFrame = requestAnimationFrame(animate);
  }

  stopAnimation() {
    if (this._animFrame) {
        cancelAnimationFrame(this._animFrame);
        this._animFrame = null;
    }
    // Also clear interval if it existed from previous version (just in case)
    if (this._animInterval) {
        clearInterval(this._animInterval);
        this._animInterval = null;
    }
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
