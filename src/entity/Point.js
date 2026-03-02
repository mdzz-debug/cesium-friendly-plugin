import { BaseEntity } from './BaseEntity.js';

export class Point extends BaseEntity {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'point';
    
    // Defaults
    this.color = options.color || 'red';
    this.pixelSize = options.pixelSize || 10;
    this.outlineColor = options.outlineColor || 'white';
    this.outlineWidth = options.outlineWidth || 0;
  }

  _createEntity() {
    const Cesium = this.cesium;
    // Use current options instead of this.color etc.
    const opts = this.options;
    const position = this._resolvePosition(opts.position);
    
    // Resolve props ensuring we use the updated options
    let color = this._resolveColor(opts.color, 'red');
    
    // Apply Opacity
    if (opts.opacity !== undefined) {
        color = color.withAlpha(opts.opacity);
    }
    
    const pixelSize = opts.pixelSize || 10;
    const outlineColor = this._resolveColor(opts.outlineColor, 'white');
    const outlineWidth = opts.outlineWidth || 0;
    
    const pointGraphics = {
        pixelSize: pixelSize,
        color: color,
        outlineColor: outlineColor,
        outlineWidth: outlineWidth,
        disableDepthTestDistance: this._resolveDisableDepthTestDistance(opts)
    };
    
    // Apply Common Configs
    if (opts.pixelOffset) {
        pointGraphics.pixelOffset = new Cesium.Cartesian2(opts.pixelOffset.x, opts.pixelOffset.y);
    }
    const eyeOffset = this._resolveEyeOffset(opts);
    if (eyeOffset) pointGraphics.eyeOffset = eyeOffset;
    
    if (opts.distanceDisplayCondition) {
        pointGraphics.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            opts.distanceDisplayCondition.near, 
            opts.distanceDisplayCondition.far
        );
    }

    if (opts.scaleByDistance) {
        pointGraphics.scaleByDistance = new Cesium.NearFarScalar(
            opts.scaleByDistance.near,
            opts.scaleByDistance.nearValue,
            opts.scaleByDistance.far,
            opts.scaleByDistance.farValue
        );
    }

    if (opts.translucencyByDistance) {
        pointGraphics.translucencyByDistance = new Cesium.NearFarScalar(
            opts.translucencyByDistance.near,
            opts.translucencyByDistance.nearValue,
            opts.translucencyByDistance.far,
            opts.translucencyByDistance.farValue
        );
    }
     
     if (opts.heightReference) {
         pointGraphics.heightReference = Cesium.HeightReference[opts.heightReference];
     }
     
     return {
      id: this.id,
      position: position,
      point: pointGraphics
    };
  }

  _resolvePosition(pos) {
    const Cesium = this.cesium;
    if (!pos) return Cesium.Cartesian3.fromDegrees(0, 0, 0);
    if (Array.isArray(pos)) {
      return Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0);
    }
    return Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt || 0);
  }

  _updatePosition() {
    if (this.entity) {
      this.entity.position = this._resolvePosition(this.options.position);
    }
  }

  _resolveColor(value, fallback = 'red') {
      const Cesium = this.cesium;
      if (this.app && typeof this.app.resolveColorToken === 'function') {
          return this.app.resolveColorToken(value, fallback);
      }
      if (value instanceof Cesium.Color) return value;
      if (typeof value === 'string') return Cesium.Color.fromCssColorString(value);
      if (value && typeof value === 'object' &&
          value.red !== undefined && value.green !== undefined &&
          value.blue !== undefined && value.alpha !== undefined) {
          return new Cesium.Color(value.red, value.green, value.blue, value.alpha);
      }
      return Cesium.Color.fromCssColorString(fallback);
  }

  // --- Specific Setters ---

  setColor(color) {
    this.options.color = color;
    return this;
  }

  setSize(size) {
    this.options.pixelSize = size;
    return this;
  }
  
  setOutline(width, color) {
      this.options.outlineWidth = width;
      if (color) this.options.outlineColor = color;
      return this;
  }
  
  _updateEntity() {
      if (!this.entity || !this.entity.point) return;
      
      const opts = this.options;
      const Cesium = this.cesium;
      
      // Update Position
      if (opts.position) {
          this.entity.position = this._resolvePosition(opts.position);
      }
      
      // Update Point Props
      if (opts.color || opts.opacity !== undefined) {
          const baseColor = this._resolveColor(opts.color, 'red');
          const alpha = opts.opacity !== undefined ? opts.opacity : 1.0;
          this.entity.point.color = baseColor.withAlpha(alpha);
      }
      
      if (opts.pixelSize) {
          this.entity.point.pixelSize = opts.pixelSize;
      }
      
      if (opts.outlineWidth !== undefined) {
          this.entity.point.outlineWidth = opts.outlineWidth;
      }
      
      if (opts.outlineColor) {
          this.entity.point.outlineColor = this._resolveColor(opts.outlineColor, 'white');
      }
      
      // Update Common Configs
      if (opts.pixelOffset) {
          this.entity.point.pixelOffset = new Cesium.Cartesian2(opts.pixelOffset.x, opts.pixelOffset.y);
      }
      const eyeOffset = this._resolveEyeOffset(opts);
      if (eyeOffset) this.entity.point.eyeOffset = eyeOffset;
      
      if (opts.distanceDisplayCondition) {
          this.entity.point.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
              opts.distanceDisplayCondition.near, 
              opts.distanceDisplayCondition.far
          );
      }

      if (opts.scaleByDistance) {
          this.entity.point.scaleByDistance = new Cesium.NearFarScalar(
              opts.scaleByDistance.near,
              opts.scaleByDistance.nearValue,
              opts.scaleByDistance.far,
              opts.scaleByDistance.farValue
          );
      }

      if (opts.translucencyByDistance) {
          this.entity.point.translucencyByDistance = new Cesium.NearFarScalar(
              opts.translucencyByDistance.near,
              opts.translucencyByDistance.nearValue,
              opts.translucencyByDistance.far,
              opts.translucencyByDistance.farValue
          );
      }
      
      if (opts.heightReference) {
          this.entity.point.heightReference = Cesium.HeightReference[opts.heightReference];
      }

      this.entity.point.disableDepthTestDistance = this._resolveDisableDepthTestDistance(opts);
  }
}
