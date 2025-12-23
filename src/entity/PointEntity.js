
import { GeometryEntity } from './GeometryEntity.js';

export class PointEntity extends GeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'point';
    
    // Style props
    this.color = options.color || '#FF0000';
    this.pixelSize = options.pixelSize || 10;
    this.opacity = options.opacity != null ? options.opacity : 1;
    this.outline = options.outline || false;
    this.outlineColor = options.outlineColor || '#FFFFFF';
    this.outlineWidth = options.outlineWidth || 2;
    
    // Advanced props
    this.distanceDisplayCondition = options.distanceDisplayCondition;
    this.scaleByDistance = options.scaleByDistance;
    this.translucencyByDistance = options.translucencyByDistance;
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
        pixelSize: this.pixelSize,
        outlineWidth: this.outline ? this.outlineWidth : 0,
        outlineColor: this.outline ? Cesium.Color.fromCssColorString(this.outlineColor).withAlpha(this.opacity) : Cesium.Color.TRANSPARENT,
        heightReference: this._getHeightReferenceEnum(),
        distanceDisplayCondition: this.distanceDisplayCondition ? 
            new Cesium.DistanceDisplayCondition(this.distanceDisplayCondition.near, this.distanceDisplayCondition.far) : undefined,
        scaleByDistance: this.scaleByDistance,
        translucencyByDistance: this.translucencyByDistance,
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
  

  // --- Style Setters ---

  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.point) {
      this.entity.point.color = this.cesium.Color.fromCssColorString(color).withAlpha(this.opacity);
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

  setOpacity(opacity) {
    this.opacity = opacity;
    if (this.entity && this.entity.point) {
      this.entity.point.color = this.cesium.Color.fromCssColorString(this.color).withAlpha(opacity);
      if (this.outline) {
          this.entity.point.outlineColor = this.cesium.Color.fromCssColorString(this.outlineColor).withAlpha(opacity);
      }
    }
    return this;
  }

  setOutline(enabled, color, width) {
    this.outline = enabled;
    if (color) this.outlineColor = color;
    if (width) this.outlineWidth = width;

    if (this.entity && this.entity.point) {
        this.entity.point.outlineWidth = this.outline ? this.outlineWidth : 0;
        this.entity.point.outlineColor = this.outline ? this.cesium.Color.fromCssColorString(this.outlineColor).withAlpha(this.opacity) : this.cesium.Color.TRANSPARENT;
    }
    return this;
  }

  setDistanceDisplayCondition(near, far) {
    this.distanceDisplayCondition = { near, far };
    if (this.entity && this.entity.point) {
        this.entity.point.distanceDisplayCondition = new this.cesium.DistanceDisplayCondition(near, far);
    }
    return this;
  }

  setScaleByDistance(near, nearValue, far, farValue) {
    this.scaleByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.point) {
        this.entity.point.scaleByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  setTranslucencyByDistance(near, nearValue, far, farValue) {
    this.translucencyByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.point) {
        this.entity.point.translucencyByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  setDisableDepthTestDistance(distance) {
    if (distance === true) {
        this.disableDepthTestDistance = Number.POSITIVE_INFINITY;
    } else if (distance === false) {
        this.disableDepthTestDistance = undefined;
    } else {
        this.disableDepthTestDistance = distance;
    }

    if (this.entity && this.entity.point) {
      this.entity.point.disableDepthTestDistance = this.disableDepthTestDistance;
    }
    return this;
  }

  // --- State ---

  saveState() {
    this._savedState = {
      color: this.color,
      pixelSize: this.pixelSize,
      opacity: this.opacity,
      outline: this.outline,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth
      // Label/Billboard state should be saved by BaseEntity if implemented there, 
      // or we explicitly save it here if BaseEntity doesn't handle it yet.
    };
    return this;
  }

  restoreState() {
    if (this._savedState) {
      this.setColor(this._savedState.color);
      this.setPixelSize(this._savedState.pixelSize);
      this.setOpacity(this._savedState.opacity);
      this.setOutline(this._savedState.outline, this._savedState.outlineColor, this._savedState.outlineWidth);
      this._savedState = null;
    }
    return this;
  }
}
