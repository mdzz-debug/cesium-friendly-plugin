import { BaseEntity } from './BaseEntity.js';

export class Model extends BaseEntity {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'model';
  }

  _resolvePosition(pos) {
    const Cesium = this.cesium;
    if (!pos) return Cesium.Cartesian3.fromDegrees(0, 0, 0);
    if (pos instanceof Cesium.Cartesian3) return pos;
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

  _resolveColorWithAlpha(opts) {
    const base = this._resolveColor(opts.color, 'white');
    const alpha = opts.opacity !== undefined ? Math.max(0, Math.min(1, Number(opts.opacity) || 0)) : 1;
    return base.withAlpha(alpha);
  }

  _createEntity() {
    const Cesium = this.cesium;
    const opts = this.options;
    if (!opts.uri) {
      throw new Error('[CesiumFriendly] model requires `uri`');
    }

    const model = {
      uri: opts.uri,
      scale: opts.scale !== undefined ? opts.scale : 1,
      minimumPixelSize: opts.minimumPixelSize !== undefined ? opts.minimumPixelSize : 0,
      maximumScale: opts.maximumScale
    };

    if (opts.runAnimations !== undefined) model.runAnimations = !!opts.runAnimations;
    if (opts.color || opts.opacity !== undefined) {
      model.color = this._resolveColorWithAlpha(opts);
      model.colorBlendMode = Cesium.ColorBlendMode.MIX;
      model.colorBlendAmount = opts.colorBlendAmount !== undefined ? opts.colorBlendAmount : 1;
    }
    if (opts.silhouetteColor) model.silhouetteColor = this._resolveColor(opts.silhouetteColor, '#00ffff');
    if (opts.silhouetteSize !== undefined) model.silhouetteSize = opts.silhouetteSize;
    if (opts.distanceDisplayCondition) {
      model.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }
    if (opts.heightReference) {
      model.heightReference = Cesium.HeightReference[opts.heightReference];
    }

    return {
      id: this.id,
      position: this._resolvePosition(opts.position),
      orientation: this._resolveOrientation(opts),
      model
    };
  }

  _resolveOrientation(opts = {}) {
    const Cesium = this.cesium;
    const heading = this._toRadians(opts.heading || 0);
    const pitch = this._toRadians(opts.pitch || 0);
    const roll = this._toRadians(opts.roll || 0);
    if (!heading && !pitch && !roll) return undefined;
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    return Cesium.Transforms.headingPitchRollQuaternion(this._resolvePosition(opts.position), hpr);
  }

  _toRadians(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    const Cesium = this.cesium;
    if (Math.abs(n) > Math.PI * 2) return Cesium.Math.toRadians(n);
    return n;
  }

  _updatePosition() {
    if (this.entity) this.entity.position = this._resolvePosition(this.options.position);
  }

  _updateEntity() {
    if (!this.entity || !this.entity.model) return;
    const Cesium = this.cesium;
    const opts = this.options;
    const m = this.entity.model;

    if (opts.position) this.entity.position = this._resolvePosition(opts.position);
    const q = this._resolveOrientation(opts);
    if (q) this.entity.orientation = q;

    if (opts.uri !== undefined) m.uri = opts.uri;
    if (opts.scale !== undefined) m.scale = opts.scale;
    if (opts.minimumPixelSize !== undefined) m.minimumPixelSize = opts.minimumPixelSize;
    if (opts.maximumScale !== undefined) m.maximumScale = opts.maximumScale;
    if (opts.runAnimations !== undefined) m.runAnimations = !!opts.runAnimations;

    if (opts.color || opts.opacity !== undefined) {
      m.color = this._resolveColorWithAlpha(opts);
      m.colorBlendMode = Cesium.ColorBlendMode.MIX;
      m.colorBlendAmount = opts.colorBlendAmount !== undefined ? opts.colorBlendAmount : 1;
    }
    if (opts.silhouetteColor !== undefined) m.silhouetteColor = this._resolveColor(opts.silhouetteColor, '#00ffff');
    if (opts.silhouetteSize !== undefined) m.silhouetteSize = opts.silhouetteSize;
    if (opts.distanceDisplayCondition) {
      m.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }
    if (opts.heightReference) {
      m.heightReference = Cesium.HeightReference[opts.heightReference];
    }
  }

  tick(time) {
    super.tick(time);
    if (!this.entity || !this.entity.model || !this.viewer || !this.viewer.camera) return;
    const opts = this.options;
    const pos = this.entity.position && this.entity.position.getValue
      ? this.entity.position.getValue(time || this.cesium.JulianDate.now())
      : this._resolvePosition(opts.position);
    if (!pos) return;
    const d = this.cesium.Cartesian3.distance(this.viewer.camera.positionWC, pos);

    if (opts.scaleByDistance) {
      const s = this._sampleNearFar(opts.scaleByDistance, d);
      if (Number.isFinite(s)) {
        this.entity.model.scale = s;
      }
    }

    if (opts.translucencyByDistance) {
      const alpha = this._sampleNearFar(opts.translucencyByDistance, d);
      if (Number.isFinite(alpha)) {
        const nextColor = this._resolveColor(opts.color, 'white').withAlpha(Math.max(0, Math.min(1, alpha)));
        this.entity.model.color = nextColor;
        this.entity.model.colorBlendMode = this.cesium.ColorBlendMode.MIX;
        this.entity.model.colorBlendAmount = opts.colorBlendAmount !== undefined ? opts.colorBlendAmount : 1;
      }
    }

    if (this.viewer.scene && typeof this.viewer.scene.requestRender === 'function') {
      this.viewer.scene.requestRender();
    }
  }

  _sampleNearFar(s, d) {
    const near = Number(s.near);
    const far = Number(s.far);
    const nearValue = Number(s.nearValue);
    const farValue = Number(s.farValue);
    if (!Number.isFinite(near) || !Number.isFinite(far) || far <= near) return nearValue;
    if (d <= near) return nearValue;
    if (d >= far) return farValue;
    const t = (d - near) / (far - near);
    return nearValue + (farValue - nearValue) * t;
  }
}
