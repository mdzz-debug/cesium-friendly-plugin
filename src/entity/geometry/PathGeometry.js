import { GeometryBase } from '../GeometryBase.js';

export class PathGeometry extends GeometryBase {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'path';
  }

  setPositions(positions) {
    this.options.positions = positions;
    return this;
  }

  setWidth(width) {
    this.options.width = width;
    return this;
  }

  _resolveTubeShape(radius, sides = 32) {
    const Cesium = this.cesium;
    const r = Math.max(0.1, Number(radius) || 30);
    const count = Math.max(3, Number(sides) || 32);
    const shape = [];
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      shape.push(new Cesium.Cartesian2(Math.cos(a) * r, Math.sin(a) * r));
    }
    return shape;
  }

  _createPathGraphics(opts) {
    const Cesium = this.cesium;
    const kind = (opts.kind || 'polyline').toLowerCase();
    const positions = this._resolvePositions(opts.positions);
    const color = opts.material !== undefined
      ? this._createSolidColorMaterial(opts, '#00e5ff')
      : this._createDynamicColorMaterial('#00e5ff');

    if (kind === 'tube' || kind === 'polylinevolume') {
      const polylineVolume = {
        positions,
        shape: this._resolveTubeShape(opts.radius, opts.sides),
        material: color,
        fill: opts.fill !== undefined ? !!opts.fill : true,
        outline: !!opts.outline,
        outlineColor: this._resolveColor(opts.outlineColor, '#ffffff'),
        cornerType: opts.cornerType && Cesium.CornerType[opts.cornerType]
          ? Cesium.CornerType[opts.cornerType]
          : Cesium.CornerType.ROUNDED
      };
      this._applyDistanceDisplayCondition(polylineVolume, opts);
      return { kind: 'tube', graphics: polylineVolume };
    }

    const polyline = {
      positions,
      width: opts.width !== undefined ? opts.width : 3,
      material: color,
      clampToGround: !!opts.clampToGround
    };
    if (opts.arcType && Cesium.ArcType[opts.arcType]) polyline.arcType = Cesium.ArcType[opts.arcType];
    if (opts.depthFailColor) {
      polyline.depthFailMaterial = this._resolveColor(opts.depthFailColor).withAlpha(
        opts.depthFailOpacity !== undefined ? opts.depthFailOpacity : 1
      );
    }
    this._applyDistanceDisplayCondition(polyline, opts);
    return { kind: 'polyline', graphics: polyline };
  }

  _resolveEntityPosition(opts) {
    const explicit = this._resolvePosition(opts.position);
    if (explicit) return explicit;
    const cartesianPositions = this._resolvePositions(opts.positions);
    if (cartesianPositions.length === 0) return null;
    return this.cesium.BoundingSphere.fromPoints(cartesianPositions).center;
  }

  _createEntity() {
    const opts = this.options;
    const shape = this._createPathGraphics(opts);
    const position = this._createDynamicPositionProperty(() => this._resolveEntityPosition(this.options));

    return {
      id: this.id,
      position,
      polyline: shape.kind === 'polyline' ? shape.graphics : undefined,
      polylineVolume: shape.kind === 'tube' ? shape.graphics : undefined
    };
  }

  _updatePosition() {
    // Position is driven by CallbackProperty for smooth drag/animation updates.
  }

  _updateEntity() {
    if (!this.entity) return;
    const Cesium = this.cesium;
    const opts = this.options;
    const kind = (opts.kind || 'polyline').toLowerCase();
    const cartesianPositions = this._resolvePositions(opts.positions);

    // Dynamic position callback handles center updates continuously.

    if (kind === 'tube' || kind === 'polylinevolume') {
      if (!this.entity.polylineVolume) return;
      const pv = this.entity.polylineVolume;
      if (cartesianPositions.length > 0) pv.positions = cartesianPositions;
      if (opts.radius !== undefined || opts.sides !== undefined) {
        pv.shape = this._resolveTubeShape(opts.radius, opts.sides);
      }
      if (!pv.material || opts.material !== undefined) {
        pv.material = opts.material !== undefined
          ? this._createSolidColorMaterial(opts, '#00e5ff')
          : this._createDynamicColorMaterial('#00e5ff');
      }
      if (opts.fill !== undefined) pv.fill = !!opts.fill;
      if (opts.outline !== undefined) pv.outline = !!opts.outline;
      if (opts.outlineColor !== undefined) pv.outlineColor = this._resolveColor(opts.outlineColor, '#ffffff');
      if (opts.cornerType && Cesium.CornerType[opts.cornerType]) {
        pv.cornerType = Cesium.CornerType[opts.cornerType];
      }
      if (opts.distanceDisplayCondition) {
        pv.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
          opts.distanceDisplayCondition.near,
          opts.distanceDisplayCondition.far
        );
      }
      return;
    }

    if (!this.entity.polyline) return;
    const pl = this.entity.polyline;
    if (cartesianPositions.length > 0) pl.positions = cartesianPositions;
    if (opts.width !== undefined) pl.width = opts.width;
    if (!pl.material || opts.material !== undefined) {
      pl.material = opts.material !== undefined
        ? this._createSolidColorMaterial(opts, '#00e5ff')
        : this._createDynamicColorMaterial('#00e5ff');
    }
    if (opts.clampToGround !== undefined) pl.clampToGround = !!opts.clampToGround;
    if (opts.arcType && Cesium.ArcType[opts.arcType]) pl.arcType = Cesium.ArcType[opts.arcType];
    if (opts.depthFailColor) {
      pl.depthFailMaterial = this._resolveColor(opts.depthFailColor).withAlpha(
        opts.depthFailOpacity !== undefined ? opts.depthFailOpacity : 1
      );
    }
    if (opts.distanceDisplayCondition) {
      pl.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }
  }

  _applyGeometryAnimStateToEntity(state) {
    // Path uses full _updateEntity per frame for stability.
    return false;
  }
}
