import { BaseEntity } from './BaseEntity.js';
import { Logger } from '../utils/Logger.js';

export class GeometryBase extends BaseEntity {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'geometry';
    this._geometryDistanceWarned = false;
    this._dynamicColorMaterialCache = new Map();
    this._resolvedMaterialCache = new Map();
    this._dynamicPositionProperty = null;
    if (this.options.opacity !== undefined) {
      this.options.opacity = this._normalizeOptionOpacity(this.options.opacity);
    }
  }

  onRemove() {
    this._disposeResolvedMaterials();
    this._dynamicColorMaterialCache.clear();
    this._dynamicPositionProperty = null;
  }

  setScaleByDistance(options) {
    super.setScaleByDistance(options);
    this._warnGeometryDistanceFeature('setScaleByDistance');
    return this;
  }

  setTranslucencyByDistance(options) {
    super.setTranslucencyByDistance(options);
    this._warnGeometryDistanceFeature('setTranslucencyByDistance');
    return this;
  }

  setColor(color) {
    this.options.color = color;
    return this;
  }

  setOpacity(opacity) {
    super.setOpacity(this._normalizeOptionOpacity(opacity));
    return this;
  }

  setFill(enable = true) {
    this.options.fill = !!enable;
    return this;
  }

  setOutline(width = 1, color) {
    this.options.outline = width > 0;
    this.options.outlineWidth = width;
    if (color !== undefined) this.options.outlineColor = color;
    return this;
  }

  setHeight(height) {
    this.options.height = Number(height) || 0;
    super.setHeight(height);
    return this;
  }

  setExtrudedHeight(height) {
    this.options.extrudedHeight = height;
    return this;
  }

  setRotation(angle) {
    this.options.rotation = this._toRadians(angle);
    return this;
  }

  setTextureRotation(angle) {
    this.options.stRotation = this._toRadians(angle);
    return this;
  }

  setSliceAngle(startAngle, endAngle) {
    this.options.minimumClock = this._toRadians(startAngle);
    this.options.maximumClock = this._toRadians(endAngle);
    return this;
  }

  setCutAngle(startAngle, endAngle) {
    return this.setSliceAngle(startAngle, endAngle);
  }

  setRotation3D(heading = 0, pitch = 0, roll = 0, options = {}) {
    const degrees = options.degrees !== undefined ? !!options.degrees : true;
    this.options.rotation3D = {
      heading: this._normalizeAngleValue(heading, degrees),
      pitch: this._normalizeAngleValue(pitch, degrees),
      roll: this._normalizeAngleValue(roll, degrees),
      degrees: false
    };
    return this;
  }

  setHeadingPitchRoll(heading = 0, pitch = 0, roll = 0, options = {}) {
    return this.setRotation3D(heading, pitch, roll, options);
  }

  setHeading(angle, options = {}) {
    const current = this._resolveRotation3D(this.options);
    return this.setRotation3D(angle, current.pitch, current.roll, options);
  }

  setPitch(angle, options = {}) {
    const current = this._resolveRotation3D(this.options);
    return this.setRotation3D(current.heading, angle, current.roll, options);
  }

  setRoll(angle, options = {}) {
    const current = this._resolveRotation3D(this.options);
    return this.setRotation3D(current.heading, current.pitch, angle, options);
  }

  _resolvePosition(pos) {
    const Cesium = this.cesium;
    if (!pos) return null;
    if (pos instanceof Cesium.Cartesian3) return pos;
    if (Array.isArray(pos)) return Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0);
    if (pos.lng !== undefined && pos.lat !== undefined) {
      return Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt || 0);
    }
    return null;
  }

  _resolvePositions(positions = []) {
    const Cesium = this.cesium;
    if (!Array.isArray(positions)) return [];
    return positions
      .map((p) => {
        if (!p) return null;
        if (p instanceof Cesium.Cartesian3) return p;
        if (Array.isArray(p)) return Cesium.Cartesian3.fromDegrees(p[0], p[1], p[2] || 0);
        if (p.lng !== undefined && p.lat !== undefined) {
          return Cesium.Cartesian3.fromDegrees(p.lng, p.lat, p.alt || 0);
        }
        return null;
      })
      .filter(Boolean);
  }

  _resolveColor(value, fallback = '#3fa7ff') {
    const Cesium = this.cesium;
    if (this.app && typeof this.app.resolveColorToken === 'function') {
      return this.app.resolveColorToken(value, fallback);
    }
    if (value instanceof Cesium.Color) return value;
    if (typeof value === 'string') return Cesium.Color.fromCssColorString(value);
    if (
      value &&
      typeof value === 'object' &&
      value.red !== undefined &&
      value.green !== undefined &&
      value.blue !== undefined &&
      value.alpha !== undefined
    ) {
      return new Cesium.Color(value.red, value.green, value.blue, value.alpha);
    }
    return Cesium.Color.fromCssColorString(fallback);
  }

  _resolveMaterialColor(opts = {}, fallback = '#3fa7ff') {
    let alpha = opts.opacity !== undefined ? opts.opacity : 0.6;
    alpha = this._normalizeMaterialAlpha(alpha);
    return this._resolveColor(opts.color, fallback).withAlpha(alpha);
  }

  _resolveMaterialDefinition(opts = {}, fallback = '#3fa7ff') {
    const input = opts.material;
    if (input === undefined || input === null) return null;
    const cacheKey = this._getMaterialCacheKey(input, fallback);
    if (cacheKey && this._resolvedMaterialCache.has(cacheKey)) {
      const cached = this._resolvedMaterialCache.get(cacheKey);
      if (this.app?.materialRegistry && typeof this.app.materialRegistry.update === 'function') {
        this.app.materialRegistry.update(cached, input, {
          entity: this,
          geometryType: this.type,
          options: opts,
          defaultColor: fallback
        });
      }
      return cached;
    }

    if (this.app && typeof this.app.createMaterial === 'function') {
      const material = this.app.createMaterial(input, {
        entity: this,
        geometryType: this.type,
        options: opts,
        defaultColor: fallback
      });
      if (material !== undefined && material !== null) {
        if (cacheKey) {
          this._resolvedMaterialCache.set(cacheKey, material);
        }
        return material;
      }
    }
    return input;
  }

  _getMaterialCacheKey(input, fallback = '#3fa7ff') {
    if (!input) return null;
    if (typeof input === 'string') return `${this.type}:${fallback}:${input}`;
    if (typeof input === 'object' && input.type) return `${this.type}:${fallback}:${String(input.type).toLowerCase()}`;
    return null;
  }

  _disposeResolvedMaterials() {
    if (!this.app || typeof this.app.disposeMaterial !== 'function') {
      this._resolvedMaterialCache.clear();
      return;
    }
    const disposed = new Set();
    this._resolvedMaterialCache.forEach((material, key) => {
      if (!material || disposed.has(material)) return;
      const materialType = this._extractMaterialTypeFromCacheKey(key);
      this.app.disposeMaterial(material, {
        entity: this,
        geometryType: this.type,
        materialType
      });
      disposed.add(material);
    });
    this._resolvedMaterialCache.clear();
  }

  _extractMaterialTypeFromCacheKey(key = '') {
    const parts = String(key).split(':');
    if (parts.length >= 3) return parts[2];
    return 'unknown';
  }

  _toRadians(angle) {
    const n = Number(angle);
    if (!Number.isFinite(n)) return 0;
    const Cesium = this.cesium;
    if (!Cesium || !Cesium.Math) return n;
    if (Math.abs(n) > Math.PI * 2) {
      return Cesium.Math.toRadians(n);
    }
    return n;
  }

  _normalizeAngleValue(value, degrees = true) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return degrees ? this._toRadians(n) : n;
  }

  _resolveRotation3D(opts = {}) {
    const cfg = opts.rotation3D || {};
    const degrees = cfg.degrees !== undefined ? !!cfg.degrees : false;
    const headingSrc = cfg.heading !== undefined ? cfg.heading : opts.heading;
    const pitchSrc = cfg.pitch !== undefined ? cfg.pitch : opts.pitch;
    const rollSrc = cfg.roll !== undefined ? cfg.roll : opts.roll;
    return {
      heading: this._normalizeAngleValue(headingSrc || 0, degrees),
      pitch: this._normalizeAngleValue(pitchSrc || 0, degrees),
      roll: this._normalizeAngleValue(rollSrc || 0, degrees)
    };
  }

  _resolveOrientationPosition() {
    const Cesium = this.cesium;
    if (this.entity && this.entity.position && typeof this.entity.position.getValue === 'function') {
      return this.entity.position.getValue(Cesium.JulianDate.now());
    }
    return this._resolvePosition(this.options.position);
  }

  _hasAny3DRotation(opts = {}) {
    const cfg = opts.rotation3D;
    return !!(
      cfg ||
      opts.heading !== undefined ||
      opts.pitch !== undefined ||
      opts.roll !== undefined
    );
  }

  _applyEntityOrientation(opts = this.options) {
    if (!this.entity || !this._hasAny3DRotation(opts)) return;
    const Cesium = this.cesium;
    const position = this._resolveOrientationPosition();
    if (!position) return;
    const r = this._resolveRotation3D(opts);
    const hpr = new Cesium.HeadingPitchRoll(r.heading, r.pitch, r.roll);
    this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  }

  _normalizeOptionOpacity(opacity) {
    const v = Number(opacity);
    if (!Number.isFinite(v)) return 0.6;
    let next = Math.max(0, Math.min(1, v));
    if (next >= 1) next = 0.99;
    return next;
  }

  _normalizeMaterialAlpha(alpha) {
    return this._normalizeOptionOpacity(alpha);
  }

  _createDynamicColorMaterial(fallback = '#3fa7ff') {
    if (this._dynamicColorMaterialCache.has(fallback)) {
      return this._dynamicColorMaterialCache.get(fallback);
    }
    const Cesium = this.cesium;
    const colorProperty = new Cesium.CallbackProperty(() => {
      return this._resolveMaterialColor(this.options, fallback);
    }, false);
    const material = new Cesium.ColorMaterialProperty(colorProperty);
    this._dynamicColorMaterialCache.set(fallback, material);
    return material;
  }

  _createSolidColorMaterial(opts = {}, fallback = '#3fa7ff') {
    const custom = this._resolveMaterialDefinition(opts, fallback);
    if (custom !== null && custom !== undefined) return custom;
    return this._resolveMaterialColor(opts, fallback);
  }

  _syncSolidColorMaterial(graphics, opts = {}, fallback = '#3fa7ff') {
    if (!graphics) return;
    graphics.material = this._createSolidColorMaterial(opts, fallback);
  }

  _createDynamicPositionProperty(getter) {
    const Cesium = this.cesium;
    return new Cesium.CallbackProperty(() => {
      const pos = getter();
      if (pos) return pos;
      return Cesium.Cartesian3.fromDegrees(0, 0, 0);
    }, false);
  }

  _applyDistanceDisplayCondition(graphics, opts = {}) {
    const Cesium = this.cesium;
    if (!opts.distanceDisplayCondition) return;
    graphics.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
      opts.distanceDisplayCondition.near,
      opts.distanceDisplayCondition.far
    );
  }

  _resolveFlyToDestination() {
    const fromBase = super._resolveFlyToDestination();
    if (fromBase) return fromBase;

    const Cesium = this.cesium;
    const opts = this.options || {};

    if (Array.isArray(opts.positions) && opts.positions.length > 0) {
      const cartesianPositions = this._resolvePositions(opts.positions);
      if (cartesianPositions.length > 0) {
        const bs = Cesium.BoundingSphere.fromPoints(cartesianPositions);
        return bs.center;
      }
    }

    if (opts.coordinates) {
      const rect = this._resolveRectangle(opts.coordinates);
      if (rect) {
        const center = Cesium.Rectangle.center(rect);
        return Cesium.Cartesian3.fromRadians(center.longitude, center.latitude, opts.height || 0);
      }
    }

    return null;
  }

  _resolveRectangle(rect) {
    const Cesium = this.cesium;
    if (!rect) return null;
    if (rect instanceof Cesium.Rectangle) {
      return new Cesium.Rectangle(rect.west, rect.south, rect.east, rect.north);
    }
    if (Array.isArray(rect) && rect.length >= 4) {
      return Cesium.Rectangle.fromDegrees(rect[0], rect[1], rect[2], rect[3]);
    }
    if (
      typeof rect === 'object' &&
      rect.west !== undefined &&
      rect.south !== undefined &&
      rect.east !== undefined &&
      rect.north !== undefined
    ) {
      return Cesium.Rectangle.fromDegrees(rect.west, rect.south, rect.east, rect.north);
    }
    return null;
  }

  _warnGeometryDistanceFeature(methodName) {
    if (this._geometryDistanceWarned) return;
    this._geometryDistanceWarned = true;
    Logger.warn(
      `几何实体调用了 ${methodName}，Cesium 原生几何暂不支持与 Point/Billboard/Label 相同的距离缩放/透明度标量。`,
      '当前仅对可见范围(distanceDisplayCondition)生效，若需要可改成相机距离驱动的模拟实现。'
    );
  }

  _getAnimFallbackValue(key, toValue) {
    if (key === 'opacity') {
      return this.options.opacity !== undefined ? this.options.opacity : 0.6;
    }
    if (key === 'color') {
      if (this.options.color !== undefined) return this.options.color;
      return this._getDefaultGeometryColor();
    }
    return super._getAnimFallbackValue(key, toValue);
  }

  _getDefaultGeometryColor() {
    const map = {
      circle: '#3fa7ff',
      rectangle: '#4fc3f7',
      box: '#7cd6ff',
      cylinder: '#6bf2ff',
      cone: '#6bf2ff',
      path: '#00e5ff'
    };
    return map[this.type] || '#3fa7ff';
  }

  _applyAnimState(state) {
    const next = this._stripUndefined(this._sanitizeAnimState(this._cloneAnimValue(state) || {}));
    if (next.opacity !== undefined) {
      next.opacity = this._normalizeOptionOpacity(next.opacity);
    }
    if (next.height !== undefined) {
      this.setHeight(next.height);
    }

    try {
      Object.assign(this.options, next);

      const handled = this._applyGeometryAnimStateToEntity(next);
      if (!handled) {
        this.update();
      } else if (this.viewer && this.viewer.scene && typeof this.viewer.scene.requestRender === 'function') {
        this.viewer.scene.requestRender();
      }
    } catch (err) {
      this._debugWarn('animation', 'apply geometry state failed, stop animation', {
        id: this.id,
        type: this.type || 'geometry',
        error: err?.message || String(err),
        state: next
      });
      this.stopAnimation(false);
    }
  }

  _applyGeometryAnimStateToEntity(_state) {
    return false;
  }
}
