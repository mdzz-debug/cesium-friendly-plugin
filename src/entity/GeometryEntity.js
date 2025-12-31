
import { BaseEntity } from './BaseEntity.js';
import pointsManager from '../core/manager.js';

export class GeometryEntity extends BaseEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    const opts = this.options;
    this.type = 'geometry';
    
    this.position = opts.position || [0, 0, 0]; // [lng, lat, alt]
    this.heightReference = opts.heightReference || 'clampToGround';
    this.heightOffset = opts.heightOffset || 0;
    this._draggable = opts.draggable || false;
  }

  // --- Lifecycle ---
  
  add() {
    if (this._destroyed) return this;
    if (this.group && this.position) {
      // Exclude ALL entities in the current collection from removal
      // This prevents removing peers when adding a composite entity
      const excludeIds = this._entityCollection ? this._entityCollection.map(e => e.id) : [this.id];
      pointsManager.removeDuplicatesAtPosition(this.position, this.group, excludeIds);
    }
    return super.add();
  }

  // --- Position & Geometry ---

  setPosition(position) {
    this.position = position;
    
    // Handle duplicates if needed (logic from old point.js setGroup/updatePosition)
    if (this.group) {
        pointsManager.removeDuplicatesAtPosition(this.position, this.group, this.id);
    }
    
    // Position is special - user expects immediate update usually, 
    // but to strictly follow lifecycle, we should defer it?
    // However, _updateEntityPosition is used internally.
    // Let's keep it lazy as requested.
    // this._updateEntityPosition();
    
    this.trigger('change', this);
    return this;
  }

  // Alias for backward compatibility or clarity
  updatePosition(position) {
      return this.setPosition(position);
  }
  
  _updateEntityPosition() {
      if (!this.entity) return;
      
      const isRelative = this.heightReference === 'relativeToGround';
      // If relative, use heightOffset directly.
      // If none, use position[2] + heightOffset (so offset persists/applies in absolute mode too)
      const h = isRelative 
          ? (this.heightOffset || 0) 
          : (this.position[2] || 0) + (this.heightOffset || 0);
      
      this.entity.position = this.cesium.Cartesian3.fromDegrees(
          this.position[0], 
          this.position[1], 
          h
      );
      
      // Also update heightReference prop on graphics if they exist
      this._updateHeightReference();
  }
  
  _updateHeightReference() {
      if (!this.entity) return;
      
      let hr;
      if (this.heightReference === 'clampToGround') {
          hr = this.cesium.HeightReference.CLAMP_TO_GROUND;
      } else if (this.heightReference === 'relativeToGround') {
          hr = this.cesium.HeightReference.RELATIVE_TO_GROUND;
      } else {
          hr = this.cesium.HeightReference.NONE;
      }
      
      // Apply to all known graphics that support heightReference
      if (this.entity.point) this.entity.point.heightReference = hr;
      if (this.entity.billboard) this.entity.billboard.heightReference = hr;
      if (this.entity.label) this.entity.label.heightReference = hr;
      // polyline/polygon/etc might handle it differently (e.g. perPositionHeight)
  }

  _getHeightReferenceEnum() {
      const Cesium = this.cesium;
      if (this.heightReference === 'clampToGround') return Cesium.HeightReference.CLAMP_TO_GROUND;
      if (this.heightReference === 'relativeToGround') return Cesium.HeightReference.RELATIVE_TO_GROUND;
      return Cesium.HeightReference.NONE;
  }

  setHeight(height) {
    this.heightOffset = (height !== undefined && height !== null) ? height : 0;
    
    // Auto update logic from old point.js
    if (this.heightOffset !== 0 && this.heightReference === 'clampToGround') {
      this.heightReference = 'relativeToGround';
    }
    
    this.trigger('change', this);
    return this;
  }

  setHeightReference(reference) {
    // reference: 'none', 'clampToGround', 'relativeToGround'
    // Default to clampToGround if null/undefined, consistent with constructor
    this.heightReference = reference || 'clampToGround';
    
    if (this.heightReference === 'clampToGround') {
      this.heightOffset = 0;
    }
    this.trigger('change', this);
    return this;
  }
  
  // --- Common Style Setters ---

  setScale(scale) {
    this.scale = (scale !== undefined && scale !== null) ? scale : 1.0;
    this.trigger('change', this);
    return this;
  }

  setPixelOffset(x, y) {
    if (x === null || x === undefined) {
        x = 0;
        y = 0;
    }
    // Handle array or object input
    if (Array.isArray(x)) {
        y = x[1];
        x = x[0];
    } else if (typeof x === 'object' && x !== null) {
        if (x.x !== undefined) {
            y = x.y;
            x = x.x;
        } else {
            // Fallback for object with numeric indices {0:x, 1:y}
            y = x[1];
            x = x[0];
        }
    }

    this.pixelOffset = [x, y];
    this.trigger('change', this);
    return this;
  }

  setEyeOffset(x, y, z) {
    if (x === null || x === undefined) {
        x = 0;
        y = 0;
        z = 0;
    }
    // Handle array or object input
    if (Array.isArray(x)) {
        z = x[2];
        y = x[1];
        x = x[0];
    } else if (typeof x === 'object' && x !== null) {
        if (x.x !== undefined) {
            z = x.z;
            y = x.y;
            x = x.x;
        } else {
            z = x[2];
            y = x[1];
            x = x[0];
        }
    }

    this.eyeOffset = [x, y, z];
    this.trigger('change', this);
    return this;
  }

  setHorizontalOrigin(origin) {
    this.horizontalOrigin = origin;
    this.trigger('change', this);
    return this;
  }

  setVerticalOrigin(origin) {
    this.verticalOrigin = origin;
    this.trigger('change', this);
    return this;
  }

  setDistanceDisplayCondition(options) {
    if (options === null) {
        this.distanceDisplayCondition = undefined;
        this.trigger('change', this);
        return this;
    }

    const { near, far } = options || {};
    const current = this.distanceDisplayCondition || {};
    
    const n = near !== undefined ? near : (current.near !== undefined ? current.near : 0);
    
    // Default far to near * 10
    let defaultFar = (n > 0) ? n * 10 : 100000;
    let f = far !== undefined ? far : (current.far !== undefined ? current.far : defaultFar);

    // Ensure far > near
    if (f <= n) {
        f = (n > 0) ? n * 10 : n + 10000;
    }

    this.distanceDisplayCondition = { near: n, far: f };
    this.trigger('change', this);
    return this;
  }
  
  _createNearFarScalar(options, currentProp) {
    const { near, nearValue, far, farValue } = options || {};
    const current = currentProp || {};

    const n = near !== undefined ? near : (current.near !== undefined ? current.near : 0);
    const nv = nearValue !== undefined ? nearValue : (current.nearValue !== undefined ? current.nearValue : 1);
    
    // Default far
    let defaultFar = (n > 0) ? n * 10 : 100000;
    let f = far !== undefined ? far : (current.far !== undefined ? current.far : defaultFar);
    
    const fv = farValue !== undefined ? farValue : (current.farValue !== undefined ? current.farValue : 1);

    // Ensure far > near
    if (f <= n) {
        f = (n > 0) ? n * 10 : n + 10000;
    }
    
    return {
        obj: { near: n, nearValue: nv, far: f, farValue: fv },
        cesiumObj: new this.cesium.NearFarScalar(n, nv, f, fv)
    };
  }

  setScaleByDistance(options) {
    if (options === null) {
        this.scaleByDistance = undefined;
        this.trigger('change', this);
        return this;
    }

    const res = this._createNearFarScalar(options, this.scaleByDistance);
    this.scaleByDistance = res.obj;
    this.trigger('change', this);
    return this;
  }

  setTranslucencyByDistance(options) {
    if (options === null) {
        this.translucencyByDistance = undefined;
        this.trigger('change', this);
        return this;
    }

    const res = this._createNearFarScalar(options, this.translucencyByDistance);
    this.translucencyByDistance = res.obj;
    this.trigger('change', this);
    return this;
  }

  setPixelOffsetScaleByDistance(options) {
    if (options === null) {
        this.pixelOffsetScaleByDistance = undefined;
        this.trigger('change', this);
        return this;
    }

    const res = this._createNearFarScalar(options, this.pixelOffsetScaleByDistance);
    this.pixelOffsetScaleByDistance = res.obj;
    this.trigger('change', this);
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
    this.trigger('change', this);
    return this;
  }

  update(options, duration) {
      // 1. Update internal options (setters)
      super.update(options, duration);
      
      // 2. Apply all properties to entity
      this._applyGeometryStyles();
      
      return this;
  }

  _applyGeometryStyles() {
      if (!this.entity) return;
      const Cesium = this.cesium;

      // Position & Height
      this._updateEntityPosition();

      // Scale
      if (this.scale !== undefined) {
         if (this.entity.billboard) {
             const sFactor = (this._asCanvas || this.isCanvas) ? (this._canvasScale || 1) : 1;
             const effective = (this.scale !== undefined && this.scale !== null ? this.scale : 1.0) / sFactor;
             this.entity.billboard.scale = effective;
         }
         if (this.entity.label) this.entity.label.scale = this.scale;
         if (this.entity.point && this.pixelSize !== undefined) {
             this.entity.point.pixelSize = this.pixelSize * this.scale;
         }
      }

      // Pixel Offset
      if (this.pixelOffset) {
          const po = new Cesium.Cartesian2(this.pixelOffset[0], this.pixelOffset[1]);
          if (this.entity.billboard) this.entity.billboard.pixelOffset = po;
          if (this.entity.label) this.entity.label.pixelOffset = po;
      }
      if ((this._asCanvas || this.isCanvas) && this.entity && this.entity.billboard && this._canvasAnchor) {
          const userScale = (this.scale !== undefined && this.scale !== null) ? this.scale : 1.0;
          const extraX = this.pixelOffset ? this.pixelOffset[0] : 0;
          const extraY = this.pixelOffset ? this.pixelOffset[1] : 0;
          this.entity.billboard.pixelOffset = new Cesium.Cartesian2(
              -this._canvasAnchor.centerX * userScale + extraX,
              -this._canvasAnchor.centerY * userScale + extraY
          );
      }

      // Eye Offset
      if (this.eyeOffset) {
          const eo = new Cesium.Cartesian3(this.eyeOffset[0], this.eyeOffset[1], this.eyeOffset[2]);
          if (this.entity.billboard) this.entity.billboard.eyeOffset = eo;
          if (this.entity.label) this.entity.label.eyeOffset = eo;
      }

      // Horizontal Origin
      if (this.horizontalOrigin) {
          const val = this._getHorizontalOrigin(this.horizontalOrigin);
          if (this.entity.billboard) this.entity.billboard.horizontalOrigin = val;
          if (this.entity.label) this.entity.label.horizontalOrigin = val;
      }

      // Vertical Origin
      if (this.verticalOrigin) {
          const val = this._getVerticalOrigin(this.verticalOrigin);
          if (this.entity.billboard) this.entity.billboard.verticalOrigin = val;
          if (this.entity.label) this.entity.label.verticalOrigin = val;
      }

      // Distance Display Condition
      if (this.distanceDisplayCondition !== undefined) {
          const val = this.distanceDisplayCondition ? 
              new Cesium.DistanceDisplayCondition(this.distanceDisplayCondition.near, this.distanceDisplayCondition.far) : undefined;
          if (this.entity.billboard) this.entity.billboard.distanceDisplayCondition = val;
          if (this.entity.label) this.entity.label.distanceDisplayCondition = val;
          if (this.entity.point) this.entity.point.distanceDisplayCondition = val;
      }

      // ScaleByDistance
      if (this.scaleByDistance !== undefined) {
          let val;
          if (this.scaleByDistance) {
              val = new Cesium.NearFarScalar(
                  this.scaleByDistance.near, 
                  this.scaleByDistance.nearValue, 
                  this.scaleByDistance.far, 
                  this.scaleByDistance.farValue
              );
          }
          if (this.entity.billboard) {
              this.entity.billboard.scaleByDistance = val;
              if (this._asCanvas) {
                  this.entity.billboard.pixelOffsetScaleByDistance = val;
              }
          }
          if (this.entity.label) this.entity.label.scaleByDistance = val;
          if (this.entity.point) this.entity.point.scaleByDistance = val;
      }

      // TranslucencyByDistance
      if (this.translucencyByDistance !== undefined) {
          let val;
          if (this.translucencyByDistance) {
              val = new Cesium.NearFarScalar(
                  this.translucencyByDistance.near, 
                  this.translucencyByDistance.nearValue, 
                  this.translucencyByDistance.far, 
                  this.translucencyByDistance.farValue
              );
          }
          if (this.entity.billboard) this.entity.billboard.translucencyByDistance = val;
          if (this.entity.label) this.entity.label.translucencyByDistance = val;
          if (this.entity.point) this.entity.point.translucencyByDistance = val;
      }

      // PixelOffsetScaleByDistance
      if (this.pixelOffsetScaleByDistance !== undefined) {
          let val;
          if (this.pixelOffsetScaleByDistance) {
              val = new Cesium.NearFarScalar(
                  this.pixelOffsetScaleByDistance.near, 
                  this.pixelOffsetScaleByDistance.nearValue, 
                  this.pixelOffsetScaleByDistance.far, 
                  this.pixelOffsetScaleByDistance.farValue
              );
          }
          if (this.entity.billboard) this.entity.billboard.pixelOffsetScaleByDistance = val;
          if (this.entity.label) this.entity.label.pixelOffsetScaleByDistance = val;
      }

      // DisableDepthTestDistance
      if (this.disableDepthTestDistance !== undefined) {
          const val = this.disableDepthTestDistance;
          if (this.entity.billboard) this.entity.billboard.disableDepthTestDistance = val;
          if (this.entity.label) this.entity.label.disableDepthTestDistance = val;
          if (this.entity.point) this.entity.point.disableDepthTestDistance = val;
      }
  }

  setClampToGround(clamp = true) {
    return this.setHeightReference(clamp ? 'clampToGround' : 'none');
  }

  draggable(enable) {
    this._draggable = !!enable;
    this.trigger('change', this);
    return this;
  }

  // Override setGroup to include duplicate check
  setGroup(groupName) {
      super.setGroup(groupName);
      if (this.position) {
          pointsManager.removeDuplicatesAtPosition(this.position, this.group, this.id);
      }
      this.trigger('change', this);
      return this;
  }
}
