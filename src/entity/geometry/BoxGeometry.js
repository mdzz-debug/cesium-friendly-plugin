import { GeometryBase } from '../GeometryBase.js';

export class BoxGeometry extends GeometryBase {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'box';
  }

  setDimensions(dimensions) {
    this.options.dimensions = dimensions;
    return this;
  }

  _resolveDimensions(dimensions) {
    const Cesium = this.cesium;
    let x = 500;
    let y = 500;
    let z = 500;

    if (Array.isArray(dimensions)) {
      x = Number(dimensions[0]) || x;
      y = Number(dimensions[1]) || x;
      z = Number(dimensions[2]) || x;
    } else if (dimensions && typeof dimensions === 'object') {
      x = Number(dimensions.x) || x;
      y = Number(dimensions.y) || x;
      z = Number(dimensions.z) || x;
    } else if (typeof dimensions === 'number') {
      x = y = z = dimensions;
    }

    return new Cesium.Cartesian3(x, y, z);
  }

  _createEntity() {
    const Cesium = this.cesium;
    const opts = this.options;
    const position = this._createDynamicPositionProperty(() => {
      return this._resolvePosition(this.options.position) || Cesium.Cartesian3.fromDegrees(0, 0, 0);
    });

    const box = {
      dimensions: this._resolveDimensions(opts.dimensions),
      material: this._createSolidColorMaterial(opts, '#7cd6ff'),
      fill: opts.fill !== undefined ? !!opts.fill : true,
      outline: !!opts.outline,
      outlineColor: this._resolveColor(opts.outlineColor, '#ffffff'),
      outlineWidth: opts.outlineWidth !== undefined ? opts.outlineWidth : 1
    };

    this._applyDistanceDisplayCondition(box, opts);

    return {
      id: this.id,
      position,
      box
    };
  }

  _updatePosition() {
    // Position is driven by CallbackProperty for smooth drag/animation updates.
  }

  _updateEntity() {
    if (!this.entity || !this.entity.box) return;
    const Cesium = this.cesium;
    const opts = this.options;
    const box = this.entity.box;
    this._applyEntityOrientation(opts);

    // Dynamic position callback handles center updates continuously.

    if (opts.dimensions !== undefined) box.dimensions = this._resolveDimensions(opts.dimensions);
    this._syncSolidColorMaterial(box, opts, '#7cd6ff');
    if (opts.fill !== undefined) box.fill = !!opts.fill;
    if (opts.outline !== undefined) box.outline = !!opts.outline;
    if (opts.outlineColor !== undefined) box.outlineColor = this._resolveColor(opts.outlineColor, '#ffffff');
    if (opts.outlineWidth !== undefined) box.outlineWidth = opts.outlineWidth;

    if (opts.distanceDisplayCondition) {
      box.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }
  }

  _applyGeometryAnimStateToEntity(state) {
    if (!this.entity || !this.entity.box) return false;
    const box = this.entity.box;
    if (
      state.rotation3D !== undefined ||
      state.heading !== undefined ||
      state.pitch !== undefined ||
      state.roll !== undefined
    ) {
      this._applyEntityOrientation(this.options);
    }

    if (state.dimensions !== undefined) box.dimensions = this._resolveDimensions(this.options.dimensions);
    if (state.color !== undefined || state.opacity !== undefined) {
      this._syncSolidColorMaterial(box, this.options, '#7cd6ff');
    }
    if (state.fill !== undefined) box.fill = !!this.options.fill;
    if (state.outline !== undefined) box.outline = !!this.options.outline;
    if (state.outlineColor !== undefined) box.outlineColor = this._resolveColor(this.options.outlineColor, '#ffffff');
    if (state.outlineWidth !== undefined) box.outlineWidth = this.options.outlineWidth;

    return true;
  }
}
