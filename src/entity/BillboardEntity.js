
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
        pixelOffsetScaleByDistance: this.pixelOffsetScaleByDistance ? new Cesium.NearFarScalar(
            this.pixelOffsetScaleByDistance.near, 
            this.pixelOffsetScaleByDistance.nearValue, 
            this.pixelOffsetScaleByDistance.far, 
            this.pixelOffsetScaleByDistance.farValue
        ) : undefined,
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
    this.imageUrl = resolveImageInput(url);
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.image = this.imageUrl;
    }
    this.trigger('change', this);
    return this;
  }

  setRotation(degree) {
    this.rotation = degree;
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.rotation = this.cesium.Math.toRadians(this.rotation);
    }
    this.trigger('change', this);
    return this;
  }

  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.color = this.cesium.Color.fromCssColorString(this.color).withAlpha(this.opacity);
    }
    this.trigger('change', this);
    return this;
  }

  setOpacity(alpha) {
    this.opacity = alpha;
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.color = this.cesium.Color.fromCssColorString(this.color).withAlpha(this.opacity);
    }
    this.trigger('change', this);
    return this;
  }
  
  setImageWidth(width) {
    this.width = width;
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.width = this.width;
    }
    this.trigger('change', this);
    return this;
  }

  setImageHeight(height) {
    this.height = height;
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.height = this.height;
    }
    this.trigger('change', this);
    return this;
  }

  setSizeInMeters(enable) {
    this.sizeInMeters = enable;
    if (this.entity && this.entity.billboard) {
        this.entity.billboard.sizeInMeters = this.sizeInMeters;
    }
    this.trigger('change', this);
    return this;
  }

  // --- State ---

  saveState() {
    this._savedState = {
      scale: this.scale !== undefined ? this.scale : 1.0,
      rotation: this.rotation,
      imageUrl: this.imageUrl,
      color: this.color,
      opacity: this.opacity,
      pixelOffset: this.pixelOffset ? [...this.pixelOffset] : [0,0],
      eyeOffset: this.eyeOffset ? [...this.eyeOffset] : [0,0,0],
      width: this.width,
      height: this.height,
      sizeInMeters: this.sizeInMeters,
      horizontalOrigin: this.horizontalOrigin,
      verticalOrigin: this.verticalOrigin,
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
    if (this._savedState) {
      const s = this._savedState;
      const options = {
        scale: s.scale,
        rotation: s.rotation,
        image: s.imageUrl,
        color: s.color,
        opacity: s.opacity,
        pixelOffset: s.pixelOffset,
        eyeOffset: s.eyeOffset,
        
        imageWidth: s.width,
        imageHeight: s.height,
        sizeInMeters: s.sizeInMeters,
        
        horizontalOrigin: s.horizontalOrigin,
        verticalOrigin: s.verticalOrigin,
        
        heightReference: s.heightReference,
        height: s.heightOffset,
        
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
