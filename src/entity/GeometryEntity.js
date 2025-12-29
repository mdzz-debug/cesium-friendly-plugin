
import { BaseEntity } from './BaseEntity.js';
import pointsManager from '../core/manager.js';

export class GeometryEntity extends BaseEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'geometry';
    
    this.position = options.position || [0, 0, 0]; // [lng, lat, alt]
    this.heightReference = options.heightReference || 'clampToGround';
    this.heightOffset = options.heightOffset || 0;
    this._draggable = options.draggable || false;
  }

  // --- Lifecycle ---
  
  add() {
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
    
    this._updateEntityPosition();
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
    if (this.heightOffset > 0 && this.heightReference === 'clampToGround') {
      this.heightReference = 'relativeToGround';
    }
    
    this._updateEntityPosition();
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
    this._updateHeightReference();
    this._updateEntityPosition(); // Position might change based on height reference
    this.trigger('change', this);
    return this;
  }
  
  // --- Common Style Setters ---

  setScale(scale) {
    this.scale = (scale !== undefined && scale !== null) ? scale : 1.0;
    if (this.entity) {
        if (this.entity.billboard) this.entity.billboard.scale = this.scale;
        if (this.entity.label) this.entity.label.scale = this.scale;
        // PointEntity handles scale differently (multiplied with pixelSize), so we might override or handle it there.
        // But for generic scale property on entity.point (which doesn't exist), we can't do much.
        // PointEntity.js overrides setScale to update pixelSize.
        // However, if we put it here, we should ensure it doesn't break PointEntity.
        // PointEntity's setScale updates pixelSize = this.pixelSize * this.scale.
        // So we can check for point and do that if we have access to pixelSize.
        if (this.entity.point && this.pixelSize !== undefined) {
             this.entity.point.pixelSize = this.pixelSize * this.scale;
        }
    }
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
    if (this.entity) {
        const Cesium = this.cesium;
        const pixelOffset = new Cesium.Cartesian2(x, y);
        if (this.entity.billboard) this.entity.billboard.pixelOffset = pixelOffset;
        if (this.entity.label) this.entity.label.pixelOffset = pixelOffset;
    }
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
    if (this.entity) {
        const Cesium = this.cesium;
        const eyeOffset = new Cesium.Cartesian3(x, y, z);
        if (this.entity.billboard) this.entity.billboard.eyeOffset = eyeOffset;
        if (this.entity.label) this.entity.label.eyeOffset = eyeOffset;
    }
    this.trigger('change', this);
    return this;
  }

  setHorizontalOrigin(origin) {
    this.horizontalOrigin = origin;
    if (this.entity) {
        const val = this._getHorizontalOrigin(origin);
        if (this.entity.billboard) this.entity.billboard.horizontalOrigin = val;
        if (this.entity.label) this.entity.label.horizontalOrigin = val;
    }
    this.trigger('change', this);
    return this;
  }

  setVerticalOrigin(origin) {
    this.verticalOrigin = origin;
    if (this.entity) {
        const val = this._getVerticalOrigin(origin);
        if (this.entity.billboard) this.entity.billboard.verticalOrigin = val;
        if (this.entity.label) this.entity.label.verticalOrigin = val;
    }
    this.trigger('change', this);
    return this;
  }

  setDistanceDisplayCondition(options) {
    if (options === null) {
        this.distanceDisplayCondition = undefined;
        if (this.entity) {
            const val = undefined;
            if (this.entity.billboard) this.entity.billboard.distanceDisplayCondition = val;
            if (this.entity.label) this.entity.label.distanceDisplayCondition = val;
            if (this.entity.point) this.entity.point.distanceDisplayCondition = val;
        }
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
    
    if (this.entity) {
        const val = new this.cesium.DistanceDisplayCondition(n, f);
        if (this.entity.billboard) this.entity.billboard.distanceDisplayCondition = val;
        if (this.entity.label) this.entity.label.distanceDisplayCondition = val;
        if (this.entity.point) this.entity.point.distanceDisplayCondition = val;
    }
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
        if (this.entity) {
            const val = undefined;
            if (this.entity.billboard) this.entity.billboard.scaleByDistance = val;
            if (this.entity.label) this.entity.label.scaleByDistance = val;
            if (this.entity.point) this.entity.point.scaleByDistance = val;
        }
        this.trigger('change', this);
        return this;
    }

    const res = this._createNearFarScalar(options, this.scaleByDistance);
    this.scaleByDistance = res.obj;
    if (this.entity) {
        if (this.entity.billboard) this.entity.billboard.scaleByDistance = res.cesiumObj;
        if (this.entity.label) this.entity.label.scaleByDistance = res.cesiumObj;
        if (this.entity.point) this.entity.point.scaleByDistance = res.cesiumObj;
    }
    this.trigger('change', this);
    return this;
  }

  setTranslucencyByDistance(options) {
    if (options === null) {
        this.translucencyByDistance = undefined;
        if (this.entity) {
            const val = undefined;
            if (this.entity.billboard) this.entity.billboard.translucencyByDistance = val;
            if (this.entity.label) this.entity.label.translucencyByDistance = val;
            if (this.entity.point) this.entity.point.translucencyByDistance = val;
        }
        this.trigger('change', this);
        return this;
    }

    const res = this._createNearFarScalar(options, this.translucencyByDistance);
    this.translucencyByDistance = res.obj;
    if (this.entity) {
        if (this.entity.billboard) this.entity.billboard.translucencyByDistance = res.cesiumObj;
        if (this.entity.label) this.entity.label.translucencyByDistance = res.cesiumObj;
        if (this.entity.point) this.entity.point.translucencyByDistance = res.cesiumObj;
    }
    this.trigger('change', this);
    return this;
  }

  setPixelOffsetScaleByDistance(options) {
    if (options === null) {
        this.pixelOffsetScaleByDistance = undefined;
        if (this.entity) {
            const val = undefined;
            if (this.entity.billboard) this.entity.billboard.pixelOffsetScaleByDistance = val;
            if (this.entity.label) this.entity.label.pixelOffsetScaleByDistance = val;
        }
        this.trigger('change', this);
        return this;
    }

    const res = this._createNearFarScalar(options, this.pixelOffsetScaleByDistance);
    this.pixelOffsetScaleByDistance = res.obj;
    if (this.entity) {
        if (this.entity.billboard) this.entity.billboard.pixelOffsetScaleByDistance = res.cesiumObj;
        if (this.entity.label) this.entity.label.pixelOffsetScaleByDistance = res.cesiumObj;
    }
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
    
    if (this.entity) {
        if (this.entity.billboard) this.entity.billboard.disableDepthTestDistance = this.disableDepthTestDistance;
        if (this.entity.label) this.entity.label.disableDepthTestDistance = this.disableDepthTestDistance;
        if (this.entity.point) this.entity.point.disableDepthTestDistance = this.disableDepthTestDistance;
    }
    this.trigger('change', this);
    return this;
  }

  update(options, duration) {
      if (options) {
          super.update(options, duration);
      }
      this._updateEntityPosition();
      return this;
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
