import { BaseEntity } from './BaseEntity.js';

export class Label extends BaseEntity {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'label';
  }

  setText(text) {
    this.options.text = text;
    return this;
  }

  setFont(font) {
    this.options.font = font;
    return this;
  }

  setScale(scale) {
    this.options.scale = scale;
    return this;
  }

  setFillColor(color) {
    this.options.fillColor = color;
    return this;
  }

  setBackgroundColor(color) {
    this.options.backgroundColor = color;
    this.options.showBackground = true;
    return this;
  }

  setBackgroundVisible(show = true) {
    this.options.showBackground = !!show;
    return this;
  }

  setOutline(width, color) {
    this.options.outlineWidth = width;
    if (color) this.options.outlineColor = color;
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

  _resolveLabelStyle(style) {
    const Cesium = this.cesium;
    if (typeof style === 'number') return style;
    if (typeof style === 'string' && Cesium.LabelStyle[style]) return Cesium.LabelStyle[style];
    return Cesium.LabelStyle.FILL;
  }

  _createEntity() {
    const Cesium = this.cesium;
    const opts = this.options;

    const fillAlpha = opts.opacity !== undefined ? opts.opacity : 1;
    const fillColor = this._resolveColor(opts.fillColor || opts.color, 'white').withAlpha(fillAlpha);

    const graphics = {
      text: opts.text || '',
      font: opts.font || '16px sans-serif',
      style: this._resolveLabelStyle(opts.style),
      fillColor,
      scale: opts.scale !== undefined ? opts.scale : 1,
      outlineWidth: opts.outlineWidth !== undefined ? opts.outlineWidth : 0,
      outlineColor: this._resolveColor(opts.outlineColor, 'black'),
      horizontalOrigin: this._resolveHorizontalOrigin(opts.horizontalOrigin, 'CENTER'),
      verticalOrigin: this._resolveVerticalOrigin(opts.verticalOrigin, 'BOTTOM'),
      disableDepthTestDistance: this._resolveDisableDepthTestDistance(opts)
    };

    if (opts.showBackground !== undefined) graphics.showBackground = !!opts.showBackground;
    if (opts.backgroundColor) graphics.backgroundColor = this._resolveColor(opts.backgroundColor, 'rgba(0,0,0,0.6)');

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
      label: graphics
    };
  }

  _updatePosition() {
    if (this.entity) this.entity.position = this._resolvePosition(this.options.position);
  }

  _updateEntity() {
    if (!this.entity || !this.entity.label) return;
    const Cesium = this.cesium;
    const opts = this.options;

    if (opts.position) this.entity.position = this._resolvePosition(opts.position);
    if (opts.text !== undefined) this.entity.label.text = opts.text;
    if (opts.font !== undefined) this.entity.label.font = opts.font;
    if (opts.style !== undefined) this.entity.label.style = this._resolveLabelStyle(opts.style);
    if (opts.scale !== undefined) this.entity.label.scale = opts.scale;
    if (opts.horizontalOrigin !== undefined) {
      this.entity.label.horizontalOrigin = this._resolveHorizontalOrigin(opts.horizontalOrigin, 'CENTER');
    }
    if (opts.verticalOrigin !== undefined) {
      this.entity.label.verticalOrigin = this._resolveVerticalOrigin(opts.verticalOrigin, 'BOTTOM');
    }

    if (opts.fillColor || opts.color || opts.opacity !== undefined) {
      const alpha = opts.opacity !== undefined ? opts.opacity : 1;
      this.entity.label.fillColor = this._resolveColor(opts.fillColor || opts.color, 'white').withAlpha(alpha);
    }

    if (opts.outlineColor) this.entity.label.outlineColor = this._resolveColor(opts.outlineColor, 'black');
    if (opts.outlineWidth !== undefined) this.entity.label.outlineWidth = opts.outlineWidth;
    if (opts.showBackground !== undefined) this.entity.label.showBackground = !!opts.showBackground;
    if (opts.backgroundColor) this.entity.label.backgroundColor = this._resolveColor(opts.backgroundColor, 'rgba(0,0,0,0.6)');

    if (opts.pixelOffset) {
      this.entity.label.pixelOffset = new Cesium.Cartesian2(opts.pixelOffset.x, opts.pixelOffset.y);
    }
    const eyeOffset = this._resolveEyeOffset(opts);
    if (eyeOffset) this.entity.label.eyeOffset = eyeOffset;

    if (opts.distanceDisplayCondition) {
      this.entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }

    if (opts.scaleByDistance) {
      this.entity.label.scaleByDistance = new Cesium.NearFarScalar(
        opts.scaleByDistance.near,
        opts.scaleByDistance.nearValue,
        opts.scaleByDistance.far,
        opts.scaleByDistance.farValue
      );
    }

    if (opts.translucencyByDistance) {
      this.entity.label.translucencyByDistance = new Cesium.NearFarScalar(
        opts.translucencyByDistance.near,
        opts.translucencyByDistance.nearValue,
        opts.translucencyByDistance.far,
        opts.translucencyByDistance.farValue
      );
    }

    if (opts.heightReference) {
      this.entity.label.heightReference = Cesium.HeightReference[opts.heightReference];
    }

    this.entity.label.disableDepthTestDistance = this._resolveDisableDepthTestDistance(opts);
  }
}
