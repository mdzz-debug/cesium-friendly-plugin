import { BaseEntity } from './BaseEntity.js';

export class Billboard extends BaseEntity {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'billboard';
  }

  setImage(image) {
    this.options.image = image;
    return this;
  }

  setScale(scale) {
    this.options.scale = scale;
    return this;
  }

  setSize(width, height = width) {
    this.options.width = width;
    this.options.height = height;
    return this;
  }

  setColor(color) {
    this.options.color = color;
    return this;
  }

  _resolvePosition(pos) {
    const Cesium = this.cesium;
    if (!pos) return Cesium.Cartesian3.fromDegrees(0, 0, 0);
    if (Array.isArray(pos)) return Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0);
    return Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt || 0);
  }

  _resolveColor(value, fallback = 'white') {
    const Cesium = this.cesium;
    if (this.app && typeof this.app.resolveColorToken === 'function') {
      return this.app.resolveColorToken(value, fallback);
    }
    if (value instanceof Cesium.Color) return value;
    if (typeof value === 'string') return Cesium.Color.fromCssColorString(value);
    return Cesium.Color.fromCssColorString(fallback);
  }

  _createEntity() {
    const Cesium = this.cesium;
    const opts = this.options;

    const graphics = {
      image: opts.image || '',
      scale: opts.scale !== undefined ? opts.scale : 1,
      disableDepthTestDistance: this._resolveDisableDepthTestDistance(opts)
    };

    if (opts.color || opts.opacity !== undefined) {
      const alpha = opts.opacity !== undefined ? opts.opacity : 1;
      graphics.color = this._resolveColor(opts.color, 'white').withAlpha(alpha);
    }

    if (opts.width !== undefined) graphics.width = opts.width;
    if (opts.height !== undefined) graphics.height = opts.height;
    if (opts.rotation !== undefined) graphics.rotation = opts.rotation;
    if (opts.horizontalOrigin !== undefined) {
      graphics.horizontalOrigin = this._resolveHorizontalOrigin(opts.horizontalOrigin, 'CENTER');
    }
    if (opts.verticalOrigin !== undefined) {
      graphics.verticalOrigin = this._resolveVerticalOrigin(opts.verticalOrigin, 'CENTER');
    }

    if (opts.pixelOffset) {
      graphics.pixelOffset = new Cesium.Cartesian2(opts.pixelOffset.x, opts.pixelOffset.y);
    }
    const eyeOffset = this._resolveEyeOffset(opts);
    if (eyeOffset) graphics.eyeOffset = eyeOffset;

    if (opts.distanceDisplayCondition) {
      graphics.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }

    if (opts.scaleByDistance) {
      graphics.scaleByDistance = new Cesium.NearFarScalar(
        opts.scaleByDistance.near,
        opts.scaleByDistance.nearValue,
        opts.scaleByDistance.far,
        opts.scaleByDistance.farValue
      );
    }

    if (opts.translucencyByDistance) {
      graphics.translucencyByDistance = new Cesium.NearFarScalar(
        opts.translucencyByDistance.near,
        opts.translucencyByDistance.nearValue,
        opts.translucencyByDistance.far,
        opts.translucencyByDistance.farValue
      );
    }

    if (opts.heightReference) {
      graphics.heightReference = Cesium.HeightReference[opts.heightReference];
    }

    return {
      id: this.id,
      position: this._resolvePosition(opts.position),
      billboard: graphics
    };
  }

  _updatePosition() {
    if (this.entity) this.entity.position = this._resolvePosition(this.options.position);
  }

  _updateEntity() {
    if (!this.entity || !this.entity.billboard) return;
    const Cesium = this.cesium;
    const opts = this.options;

    if (opts.position) this.entity.position = this._resolvePosition(opts.position);
    if (opts.image !== undefined) this.entity.billboard.image = opts.image;
    if (opts.scale !== undefined) this.entity.billboard.scale = opts.scale;
    if (opts.width !== undefined) this.entity.billboard.width = opts.width;
    if (opts.height !== undefined) this.entity.billboard.height = opts.height;
    if (opts.rotation !== undefined) this.entity.billboard.rotation = opts.rotation;
    if (opts.horizontalOrigin !== undefined) {
      this.entity.billboard.horizontalOrigin = this._resolveHorizontalOrigin(opts.horizontalOrigin, 'CENTER');
    }
    if (opts.verticalOrigin !== undefined) {
      this.entity.billboard.verticalOrigin = this._resolveVerticalOrigin(opts.verticalOrigin, 'CENTER');
    }

    if (opts.color || opts.opacity !== undefined) {
      const alpha = opts.opacity !== undefined ? opts.opacity : 1;
      this.entity.billboard.color = this._resolveColor(opts.color, 'white').withAlpha(alpha);
    }

    if (opts.pixelOffset) {
      this.entity.billboard.pixelOffset = new Cesium.Cartesian2(opts.pixelOffset.x, opts.pixelOffset.y);
    }
    const eyeOffset = this._resolveEyeOffset(opts);
    if (eyeOffset) this.entity.billboard.eyeOffset = eyeOffset;

    if (opts.distanceDisplayCondition) {
      this.entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }

    if (opts.scaleByDistance) {
      this.entity.billboard.scaleByDistance = new Cesium.NearFarScalar(
        opts.scaleByDistance.near,
        opts.scaleByDistance.nearValue,
        opts.scaleByDistance.far,
        opts.scaleByDistance.farValue
      );
    }

    if (opts.translucencyByDistance) {
      this.entity.billboard.translucencyByDistance = new Cesium.NearFarScalar(
        opts.translucencyByDistance.near,
        opts.translucencyByDistance.nearValue,
        opts.translucencyByDistance.far,
        opts.translucencyByDistance.farValue
      );
    }

    if (opts.heightReference) {
      this.entity.billboard.heightReference = Cesium.HeightReference[opts.heightReference];
    }

    this.entity.billboard.disableDepthTestDistance = this._resolveDisableDepthTestDistance(opts);
  }
}
