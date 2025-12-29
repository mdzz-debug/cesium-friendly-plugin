
import { GeometryEntity } from './GeometryEntity.js';

export class PointEntity extends GeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'point';
    
    // Style props
    this.color = options.color || '#FF0000';
    this.pixelSize = options.pixelSize || 10;
    this.scale = options.scale !== undefined ? options.scale : 1.0;
    this.opacity = options.opacity != null ? options.opacity : 1;
    this.outline = options.outline || false;
    this.outlineColor = options.outlineColor || '#FFFFFF';
    this.outlineWidth = options.outlineWidth || 2;
    
    // Advanced props
    this.pixelOffset = options.pixelOffset; // {x, y}
    this.eyeOffset = options.eyeOffset; // {x, y, z}
    this.distanceDisplayCondition = options.distanceDisplayCondition;
    this.scaleByDistance = options.scaleByDistance;
    this.translucencyByDistance = options.translucencyByDistance;
    this.pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance;
    this.disableDepthTestDistance = options.disableDepthTestDistance;
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
        outlineWidth: this.outline ? this.outlineWidth : 0,
        outlineColor: this.outline ? Cesium.Color.fromCssColorString(this.outlineColor).withAlpha(this.opacity) : Cesium.Color.TRANSPARENT,
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

    const entity = new Cesium.Entity({
        id: this.id,
        name: this.name,
        description: this.description,
        position: position,
        point: pointGraphics
    });
    
    // Attach metadata
    entity._meta = { ...this.options };

    return entity;
  }
  

  // --- Style Setters (Reactive) ---

  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.point) {
        this.entity.point.color = this.cesium.Color.fromCssColorString(this.color).withAlpha(this.opacity);
    }
    this.trigger('change', this);
    return this;
  }

  setPixelSize(size) {
    this.pixelSize = size;
    if (this.entity && this.entity.point) {
        this.entity.point.pixelSize = this.pixelSize * this.scale;
    }
    this.trigger('change', this);
    return this;
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    if (this.entity && this.entity.point) {
        this.entity.point.color = this.cesium.Color.fromCssColorString(this.color).withAlpha(this.opacity);
        if (this.outline) {
            this.entity.point.outlineColor = this.cesium.Color.fromCssColorString(this.outlineColor).withAlpha(this.opacity);
        }
    }
    this.trigger('change', this);
    return this;
  }

  setOutline(enabled, color, width) {
    this.outline = enabled;
    if (color) this.outlineColor = color;
    if (width) this.outlineWidth = width;
    
    if (this.entity && this.entity.point) {
        this.entity.point.outlineWidth = this.outline ? this.outlineWidth : 0;
        this.entity.point.outlineColor = this.outline ? 
            this.cesium.Color.fromCssColorString(this.outlineColor).withAlpha(this.opacity) : 
            this.cesium.Color.TRANSPARENT;
    }
    this.trigger('change', this);
    return this;
  }

  // --- Apply Changes ---

  update(options, duration) {
      super.update(options, duration);
      if (this.entity && this.entity.point) {
          const Cesium = this.cesium;
          
          // Outline (Special handling because outlineColor/Width don't have setters and might depend on order)
          // We re-apply outline properties to ensure consistency
          this.entity.point.outlineWidth = this.outline ? this.outlineWidth : 0;
          this.entity.point.outlineColor = this.outline ? 
              Cesium.Color.fromCssColorString(this.outlineColor).withAlpha(this.opacity) : 
              Cesium.Color.TRANSPARENT;
      }
      return this;
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
      pixelOffset: this.pixelOffset ? (Array.isArray(this.pixelOffset) ? [...this.pixelOffset] : {...this.pixelOffset}) : undefined,
      eyeOffset: this.eyeOffset ? (Array.isArray(this.eyeOffset) ? [...this.eyeOffset] : {...this.eyeOffset}) : undefined,
      distanceDisplayCondition: this.distanceDisplayCondition ? {...this.distanceDisplayCondition} : undefined,
      scaleByDistance: this.scaleByDistance ? {...this.scaleByDistance} : undefined,
      translucencyByDistance: this.translucencyByDistance ? {...this.translucencyByDistance} : undefined,
      pixelOffsetScaleByDistance: this.pixelOffsetScaleByDistance ? {...this.pixelOffsetScaleByDistance} : undefined,
      disableDepthTestDistance: this.disableDepthTestDistance
    };
    return this;
  }

  restoreState(duration = 0) {
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
        
        pixelOffset: s.pixelOffset,
        eyeOffset: s.eyeOffset,
        
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
}
