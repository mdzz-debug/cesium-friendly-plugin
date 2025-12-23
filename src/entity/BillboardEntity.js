
import { GeometryEntity } from './GeometryEntity.js';

function resolveImageInput(input) {
  if (input == null) return null;
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (typeof input === 'object') {
    if (typeof input.value !== 'undefined') return resolveImageInput(input.value);
    if (typeof input.default === 'string') return input.default;
    if (typeof input.href === 'string') return input.href;
    if (typeof input.src === 'string') return input.src;
  }
  return input;
}

export class BillboardEntity extends GeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'billboard';
    
    // Style props
    // Fix: options.image might be the prop name instead of imageUrl
    this.imageUrl = resolveImageInput(options.imageUrl || options.image) || '';
    this.color = options.color || '#FFFFFF';
    this.scale = options.scale != null ? options.scale : 1.0;
    this.rotation = options.rotation || 0;
    this.opacity = options.opacity != null ? options.opacity : 1;
    
    // Advanced props
    this.width = options.width;
    this.height = options.height;
    this.sizeInMeters = options.sizeInMeters;
    this.pixelOffset = options.pixelOffset || [0, 0];
    // Default eyeOffset to slightly back (positive Z) to prevent Z-fighting with Point
    this.eyeOffset = options.eyeOffset || [0, 0, 1]; 
    this.horizontalOrigin = options.horizontalOrigin || 'CENTER';
    this.verticalOrigin = options.verticalOrigin || 'CENTER';
    this.distanceDisplayCondition = options.distanceDisplayCondition;
    this.scaleByDistance = options.scaleByDistance;
    this.translucencyByDistance = options.translucencyByDistance;
    this.pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance;
    this.disableDepthTestDistance = options.disableDepthTestDistance === false ? undefined : Number.POSITIVE_INFINITY;
  }

  _createEntity() {
    const Cesium = this.cesium;

    // Initial Position
    const isRelative = this.heightReference === 'relativeToGround';
    const h = isRelative ? (this.heightOffset || 0) : (this.position[2] || 0);
    const position = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], h);

    // Setup Billboard Graphics
    const billboardOptions = {
        image: this.imageUrl,
        color: this.color ? Cesium.Color.fromCssColorString(this.color).withAlpha(this.opacity) : Cesium.Color.WHITE,
        scale: this.scale,
        rotation: this.rotation ? Cesium.Math.toRadians(this.rotation) : 0,
        width: this.width,
        height: this.height,
        sizeInMeters: this.sizeInMeters,
        pixelOffset: this.pixelOffset ? new Cesium.Cartesian2(this.pixelOffset[0], this.pixelOffset[1]) : new Cesium.Cartesian2(0, 0),
        eyeOffset: this.eyeOffset ? new Cesium.Cartesian3(this.eyeOffset[0], this.eyeOffset[1], this.eyeOffset[2]) : new Cesium.Cartesian3(0, 0, 0),
        horizontalOrigin: this._getHorizontalOrigin(this.horizontalOrigin),
        verticalOrigin: this._getVerticalOrigin(this.verticalOrigin),
        distanceDisplayCondition: this.distanceDisplayCondition ? 
            new Cesium.DistanceDisplayCondition(this.distanceDisplayCondition.near, this.distanceDisplayCondition.far) : undefined,
        scaleByDistance: this.scaleByDistance,
        translucencyByDistance: this.translucencyByDistance,
        pixelOffsetScaleByDistance: this.pixelOffsetScaleByDistance,
        disableDepthTestDistance: this.disableDepthTestDistance,
        heightReference: this._getHeightReferenceEnum()
    };

    const entity = new Cesium.Entity({
        id: this.id,
        name: this.name,
        description: this.description,
        position: position,
        billboard: new Cesium.BillboardGraphics(billboardOptions)
    });
    
    // Attach metadata
    entity._meta = { ...this.options };

    return entity;
  }
  

  // --- Style Setters ---

  setImage(url) {
    const resolved = resolveImageInput(url);
    this.imageUrl = resolved;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.image = resolved;
    }
    return this;
  }

  setScale(scale) {
    this.scale = scale;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.scale = scale;
    }
    return this;
  }

  setRotation(degree) {
    this.rotation = degree;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.rotation = this.cesium.Math.toRadians(degree);
    }
    return this;
  }

  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.billboard) {
      const col = this.cesium.Color.fromCssColorString(color).withAlpha(this.opacity);
      this.entity.billboard.color = col;
    }
    return this;
  }

  setOpacity(alpha) {
    this.opacity = alpha;
    if (this.entity && this.entity.billboard) {
      const c = this.cesium.Color.fromCssColorString(this.color).withAlpha(alpha);
      this.entity.billboard.color = c;
    }
    return this;
  }
  
  setPixelOffset(x, y) {
    this.pixelOffset = [x, y];
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.pixelOffset = new this.cesium.Cartesian2(x, y);
    }
    return this;
  }

  setEyeOffset(x, y, z) {
    this.eyeOffset = [x, y, z];
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.eyeOffset = new this.cesium.Cartesian3(x, y, z);
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

    if (this.entity && this.entity.billboard) {
        this.entity.billboard.disableDepthTestDistance = this.disableDepthTestDistance;
    }
    return this;
  }

  setImageWidth(width) {
    this.width = width;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.width = width;
    }
    return this;
  }

  setImageHeight(height) {
    this.height = height;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.height = height;
    }
    return this;
  }

  setSizeInMeters(enable) {
    this.sizeInMeters = enable;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.sizeInMeters = enable;
    }
    return this;
  }

  setHorizontalOrigin(origin) {
    this.horizontalOrigin = origin;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.horizontalOrigin = this._getHorizontalOrigin(origin);
    }
    return this;
  }

  setVerticalOrigin(origin) {
    this.verticalOrigin = origin;
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.verticalOrigin = this._getVerticalOrigin(origin);
    }
    return this;
  }

  setDistanceDisplayCondition(near, far) {
    this.distanceDisplayCondition = { near, far };
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.distanceDisplayCondition = new this.cesium.DistanceDisplayCondition(near, far);
    }
    return this;
  }

  setScaleByDistance(near, nearValue, far, farValue) {
    this.scaleByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.scaleByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  setTranslucencyByDistance(near, nearValue, far, farValue) {
    this.translucencyByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.translucencyByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  setPixelOffsetScaleByDistance(near, nearValue, far, farValue) {
    this.pixelOffsetScaleByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.pixelOffsetScaleByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  // --- State ---

  saveState() {
    this._savedState = {
      scale: this.scale,
      rotation: this.rotation,
      imageUrl: this.imageUrl,
      color: this.color,
      opacity: this.opacity,
      pixelOffset: this.pixelOffset,
      eyeOffset: this.eyeOffset
    };
    return this;
  }

  restoreState() {
    if (this._savedState) {
      const s = this._savedState;
      this.setScale(s.scale);
      this.setRotation(s.rotation);
      this.setImage(s.imageUrl);
      this.setColor(s.color);
      this.setOpacity(s.opacity);
      this.setPixelOffset(s.pixelOffset[0], s.pixelOffset[1]);
      this.setEyeOffset(s.eyeOffset[0], s.eyeOffset[1], s.eyeOffset[2]);
      this._savedState = null;
    }
    return this;
  }
}
