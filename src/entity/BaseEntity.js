
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
    pointsManager.registerPoint(this, this.options); 
    
    this._enableHeightCheck();
    this._updateFinalVisibility();
  }

  show() {
    this._hidden = false;
    this._updateFinalVisibility();
    return this;
  }

  hide() {
    this._hidden = true;
    this._updateFinalVisibility();
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

  // --- Chainable Setters ---

  setDisplayCondition(min, max) {
    this.minDisplayHeight = min !== undefined ? min : 0;
    // Fix: Treat 0 as Infinity for maxDisplayHeight to mean "no limit"
    this.maxDisplayHeight = (max !== undefined && max !== 0) ? max : Infinity;
    
    // Re-evaluate if height check is needed
    this._disableHeightCheck();
    this._enableHeightCheck();
    
    // Trigger immediate check to update visibility right now
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
    return this;
  }

  destroy() {
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
    // Note: pointsManager.removePoint calls point.destroy(), so the flag prevents recursion
    pointsManager.removePoint(this.id);
    
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
                peer.destroy();
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

  setGroup(groupName) {
    const oldGroup = this.group;
    this.group = groupName || null;
    pointsManager.updateGroup(this, oldGroup, this.group);
    
    // If geometry entity, might need to check duplicates, but that's lower down
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
        this.destroy();
      } else {
        pointsManager.updateTTL(this.id, ttl);
      }
    }
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

  label(options) {
    if (!options) return this;

    const Types = BaseEntity.Types;
    if (Types && Types.LabelEntity) {
        // Create new LabelEntity
        // Generate a sub-ID. 
        // Note: Chaining multiple labels? We append unique suffix.
        const id = this.id + '_label_' + Math.random().toString(36).substr(2, 5);
        
        // Inherit position and other relevant context
        // Try to get position from this entity if available (GeometryEntity has it)
        const pos = this.position || (this.options ? this.options.position : undefined);
        
        const newOpts = {
            ...options,
            position: options.position || pos,
            group: this.group,
            heightReference: options.heightReference || this.heightReference
        };
        
        const next = new Types.LabelEntity(id, this.viewer, this.cesium, newOpts);
        
        // Share the collection
        next._entityCollection = this._entityCollection;
        this._entityCollection.push(next);
        
        return next;
    }

    console.warn('CesiumFriendlyPlugin: LabelEntity not registered. Cannot create separate label entity.');
    return this;
  }

  // Aliases for compatibility
  showLabel(options) { return this.label(options); }
  updateLabel(options) { return this.label(options); } // Create new one? Or update existing?
  // updateLabel implies updating an existing label. 
  // With separate entities, we need to find the label entity in the collection.
  // This is a tricky part of the migration.
  // If the user does entity.point().billboard().updateLabel(), they might expect to update the label attached to the group?
  // But typically updateLabel is called on the object that HAS the label.
  // If we return LabelEntity, then `.updateLabel` on it is just `label(newOptions)`?
  // Or `setText`?
  // Let's implement updateLabel to find the first LabelEntity in the group and update it.
  
  hideLabel() { 
      // Find label in group and hide it
      const labelEnt = this._entityCollection.find(e => e.type === 'label');
      if (labelEnt) labelEnt.hide();
      return this; 
  }
  
  setLabel(options) { return this.label(options); }

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

  billboard(img, options = {}) {
      if (!img && !options) return this;
      
      // Handle img argument flexibility
      if (typeof img === 'object') {
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

  // Aliases for compatibility
  showBillboard(options) { return this.billboard(options); }
  updateBillboard(options) { return this.billboard(options); } 
  hideBillboard() { 
      const bb = this._entityCollection.find(e => e.type === 'billboard');
      if (bb) bb.hide();
      return this;
  }
  setBillboard(options) { return this.billboard(options); }

  // --- Internal ---
  
  _createEntity() {
    throw new Error('_createEntity must be implemented by subclass');
  }
}
