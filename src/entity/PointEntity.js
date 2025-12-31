
import { GeometryEntity } from './GeometryEntity.js';
import pointsManager from '../core/manager.js';

export class PointEntity extends GeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    // 1. Sanitize options BEFORE passing to super/BaseEntity
    // This ensures the instance never receives polluted properties from shared config objects
    const cleanOptions = { ...options };
    
    // Remove properties that don't belong to PointEntity or could cause pollution
    const pollutionKeys = ['verticalOrigin', 'horizontalOrigin', 'width', 'height', 'image', 'text', 'font', 'pixelOffset', 'eyeOffset'];
    pollutionKeys.forEach(key => {
        if (cleanOptions[key] !== undefined) {
            delete cleanOptions[key];
        }
    });

    super(id, viewer, cesium, cleanOptions);
    
    // Double-check: Force reset these properties on the instance itself
    // just in case BaseEntity/GeometryEntity logic attached them.
    this.verticalOrigin = undefined;
    this.horizontalOrigin = undefined;
    this.width = undefined;
    this.height = undefined;
    this.pixelOffset = undefined;
    this.eyeOffset = undefined;
     
     const opts = this.options; // These are now the deep-cloned clean options
    //  console.log(`[CesiumFriendly Debug] PointEntity ${id} initialized with clean options:`, JSON.stringify(opts));
 
     this.type = 'point';
    
    // Style props
    this.color = opts.color || '#FF0000';
    this.pixelSize = opts.pixelSize || 10;
    this.scale = opts.scale !== undefined ? opts.scale : 1.0;
    this.opacity = opts.opacity != null ? opts.opacity : 1;
    this.outline = opts.outline || false;
    this.outlineColor = opts.outlineColor || '#FFFFFF';
    this.outlineWidth = opts.outlineWidth || 2;
    this._colorCached = this.cesium.Color.fromCssColorString(this.color);
    this._colorCached.alpha = this.opacity;
    this._outlineColorCached = this.cesium.Color.fromCssColorString(this.outlineColor);
    this._outlineColorCached.alpha = this.opacity;
    
    // Advanced props
    this.eyeOffset = opts.eyeOffset; // {x, y, z}
    this.distanceDisplayCondition = opts.distanceDisplayCondition;
    this.scaleByDistance = opts.scaleByDistance;
    this.translucencyByDistance = opts.translucencyByDistance;
    this.pixelOffsetScaleByDistance = opts.pixelOffsetScaleByDistance;
    this.disableDepthTestDistance = opts.disableDepthTestDistance;
  }

  getCollection() {
    return pointsManager.getDataSource('cesium-friendly-points').entities;
  }

  _createEntity() {
    const Cesium = this.cesium;
    
    // Initial Position
    const isRelative = this.heightReference === 'relativeToGround';
    const h = isRelative ? (this.heightOffset || 0) : (this.position[2] || 0);
    const position = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], h);

    // Initial Graphics
    const pointGraphics = new Cesium.PointGraphics({
        color: Cesium.Color.fromCssColorString(this.color).withAlpha(this.opacity),
        pixelSize: this.pixelSize * this.scale,
        outlineWidth: (this.outline && this.outlineWidth > 0) ? this.outlineWidth : 0,
        outlineColor: (this.outline && this.outlineWidth > 0) ? Cesium.Color.fromCssColorString(this.outlineColor).withAlpha(this.opacity) : Cesium.Color.TRANSPARENT,
        heightReference: this._getHeightReferenceEnum(),
        distanceDisplayCondition: this.distanceDisplayCondition ? 
            new Cesium.DistanceDisplayCondition(this.distanceDisplayCondition.near, this.distanceDisplayCondition.far) : undefined,
        scaleByDistance: this.scaleByDistance ? new Cesium.NearFarScalar(
            this.scaleByDistance.near, 
            this.scaleByDistance.nearValue, 
            this.scaleByDistance.far, 
            this.scaleByDistance.farValue
        ) : undefined,
        translucencyByDistance: this.translucencyByDistance ? new Cesium.NearFarScalar(
            this.translucencyByDistance.near, 
            this.translucencyByDistance.nearValue, 
            this.translucencyByDistance.far, 
            this.translucencyByDistance.farValue
        ) : undefined,
        disableDepthTestDistance: this.disableDepthTestDistance
    });

    // Return plain configuration object instead of Entity instance
    // This allows BaseEntity to use viewer.entities.add(options) natively
    // which avoids pollution issues
    const entityOptions = {
        id: this.id,
        name: this.name,
        description: this.description,
        position: position,
        point: pointGraphics
    };
    
    // Attach metadata (will be lost on native add, but wrapper has it)
    // entity._meta = { ...this.options };
    
    return entityOptions;
  }
  

  // --- Style Setters (Reactive) ---

  setColor(color) {
    this.color = color;
    if (this.cesium) {
      this._colorCached = this.cesium.Color.fromCssColorString(this.color);
      this._colorCached.alpha = this.opacity;
    }
    this.trigger('change', this);
    return this;
  }

  setPixelSize(size) {
    this.pixelSize = size;
    this.trigger('change', this);
    return this;
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    if (this._colorCached) this._colorCached.alpha = this.opacity;
    if (this._outlineColorCached) this._outlineColorCached.alpha = this.opacity;
    this.trigger('change', this);
    return this;
  }

  setOutlineColor(color) {
    this.outlineColor = color;
    if (this.cesium) {
      this._outlineColorCached = this.cesium.Color.fromCssColorString(this.outlineColor);
      this._outlineColorCached.alpha = this.opacity;
    }
    this.trigger('change', this);
    return this;
  }

  setOutlineWidth(width) {
    this.outlineWidth = width;
    this.trigger('change', this);
    return this;
  }

  setOutline(enabled, color, width) {
    this.outline = enabled;
    if (color) this.outlineColor = color;
    if (width) this.outlineWidth = width;
    
    this.trigger('change', this);
    return this;
  }

  // --- Apply Changes ---

  update(options, duration) {
      super.update(options, duration);
      this._applyPointStyles();
      return this;
  }

  _applyPointStyles() {
      if (this.entity && this.entity.point) {
          const Cesium = this.cesium;
          
          if (!this._inUpdateAnimation) {
            // Color
            const c = this._colorCached || Cesium.Color.fromCssColorString(this.color);
            this.entity.point.color = c;
            
            // Pixel Size
            this.entity.point.pixelSize = this.pixelSize * this.scale;
            
            // Outline Width & Color
            // If width is 0, we force transparent color to prevent 1px visible lines
            const width = (this.outline && this.outlineWidth > 0) ? this.outlineWidth : 0;
            this.entity.point.outlineWidth = width;
            
            if (width > 0) {
               const oc = this._outlineColorCached || Cesium.Color.fromCssColorString(this.outlineColor);
               this.entity.point.outlineColor = oc;
            } else {
               this.entity.point.outlineColor = Cesium.Color.TRANSPARENT;
            }
          }
      }
  }

  // --- State ---

  saveState() {
    this._savedState = {
      color: this.color,
      pixelSize: this.pixelSize,
      scale: this.scale,
      opacity: this.opacity,
      outline: this.outline,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth,
      heightReference: this.heightReference,
      heightOffset: this.heightOffset,
      
      distanceDisplayCondition: this.distanceDisplayCondition ? {...this.distanceDisplayCondition} : undefined,
      scaleByDistance: this.scaleByDistance ? {...this.scaleByDistance} : undefined,
      translucencyByDistance: this.translucencyByDistance ? {...this.translucencyByDistance} : undefined,
      pixelOffsetScaleByDistance: this.pixelOffsetScaleByDistance ? {...this.pixelOffsetScaleByDistance} : undefined,
      disableDepthTestDistance: this.disableDepthTestDistance
    };
    return this;
  }

  restoreState(duration = 0) {
    // If an animation is currently running, do not restore state to avoid conflict/flickering
    if (this._updateTimer) {
        // console.log(`[CesiumFriendly] restoreState skipped due to running animation on ${this.id}`);
        return this;
    }

    if (this._savedState) {
      const s = this._savedState;
      const options = {
        color: s.color,
        pixelSize: s.pixelSize,
        scale: s.scale,
        opacity: s.opacity,
        outline: s.outline,
        outlineColor: s.outlineColor,
        outlineWidth: s.outlineWidth,
        
        heightReference: s.heightReference,
        height: s.heightOffset,
        
        // eyeOffset removed
        
        distanceDisplayCondition: s.distanceDisplayCondition || null,
        scaleByDistance: s.scaleByDistance || null,
        translucencyByDistance: s.translucencyByDistance || null,
        pixelOffsetScaleByDistance: s.pixelOffsetScaleByDistance || null,
        disableDepthTestDistance: s.disableDepthTestDistance
      };
      
      this.update(options, duration);
      this._savedState = null;
    }
    return this;
  }

  // --- Unsupported Methods (Override to prevent state pollution) ---
  setPixelOffset() { return this; }
  setEyeOffset() { return this; }
  setHorizontalOrigin() { 
      // console.log(`[CesiumFriendly Debug] PointEntity ignored setHorizontalOrigin for ${this.id}`);
      return this; 
  }
  setVerticalOrigin() { 
      // console.log(`[CesiumFriendly Debug] PointEntity ignored setVerticalOrigin for ${this.id}`);
      return this; 
  }
}
