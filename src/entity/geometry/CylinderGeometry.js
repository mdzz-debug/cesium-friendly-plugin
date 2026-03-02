import { GeometryBase } from '../GeometryBase.js';

export class CylinderGeometry extends GeometryBase {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'cylinder';
  }

  setLength(length) {
    this.options.length = length;
    return this;
  }

  setRadius(topRadius, bottomRadius = topRadius) {
    this.options.topRadius = topRadius;
    this.options.bottomRadius = bottomRadius;
    return this;
  }

  _createEntity() {
    const Cesium = this.cesium;
    const opts = this.options;
    const position = this._createDynamicPositionProperty(() => {
      return this._resolvePosition(this.options.position) || Cesium.Cartesian3.fromDegrees(0, 0, 0);
    });

    const cylinder = {
      length: opts.length !== undefined ? opts.length : 1000,
      topRadius: opts.topRadius !== undefined ? opts.topRadius : 300,
      bottomRadius: opts.bottomRadius !== undefined ? opts.bottomRadius : 300,
      slices: opts.slices !== undefined ? opts.slices : 64,
      material: this._createSolidColorMaterial(opts, '#6bf2ff'),
      fill: opts.fill !== undefined ? !!opts.fill : true,
      outline: !!opts.outline,
      outlineColor: this._resolveColor(opts.outlineColor, '#ffffff'),
      outlineWidth: opts.outlineWidth !== undefined ? opts.outlineWidth : 1
    };

    if (opts.heightReference) cylinder.heightReference = Cesium.HeightReference[opts.heightReference];
    this._applyDistanceDisplayCondition(cylinder, opts);

    return {
      id: this.id,
      position,
      cylinder
    };
  }

  _updatePosition() {
    // Position is driven by CallbackProperty for smooth drag/animation updates.
  }

  _updateEntity() {
    if (!this.entity || !this.entity.cylinder) return;
    const Cesium = this.cesium;
    const opts = this.options;
    const c = this.entity.cylinder;
    this._applyEntityOrientation(opts);

    // Dynamic position callback handles center updates continuously.

    if (opts.length !== undefined) c.length = opts.length;
    if (opts.topRadius !== undefined) c.topRadius = opts.topRadius;
    if (opts.bottomRadius !== undefined) c.bottomRadius = opts.bottomRadius;
    if (opts.slices !== undefined) c.slices = opts.slices;
    this._syncSolidColorMaterial(c, opts, '#6bf2ff');
    if (opts.fill !== undefined) c.fill = !!opts.fill;
    if (opts.outline !== undefined) c.outline = !!opts.outline;
    if (opts.outlineColor !== undefined) c.outlineColor = this._resolveColor(opts.outlineColor, '#ffffff');
    if (opts.outlineWidth !== undefined) c.outlineWidth = opts.outlineWidth;
    if (opts.heightReference) c.heightReference = Cesium.HeightReference[opts.heightReference];

    if (opts.distanceDisplayCondition) {
      c.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }
  }

  _applyGeometryAnimStateToEntity(state) {
    if (!this.entity || !this.entity.cylinder) return false;
    const Cesium = this.cesium;
    const c = this.entity.cylinder;
    if (
      state.rotation3D !== undefined ||
      state.heading !== undefined ||
      state.pitch !== undefined ||
      state.roll !== undefined
    ) {
      this._applyEntityOrientation(this.options);
    }

    if (state.length !== undefined) c.length = this.options.length;
    if (state.topRadius !== undefined) c.topRadius = this.options.topRadius;
    if (state.bottomRadius !== undefined) c.bottomRadius = this.options.bottomRadius;
    if (state.slices !== undefined) c.slices = this.options.slices;
    if (state.color !== undefined || state.opacity !== undefined) {
      this._syncSolidColorMaterial(c, this.options, '#6bf2ff');
    }
    if (state.fill !== undefined) c.fill = !!this.options.fill;
    if (state.outline !== undefined) c.outline = !!this.options.outline;
    if (state.outlineColor !== undefined) c.outlineColor = this._resolveColor(this.options.outlineColor, '#ffffff');
    if (state.outlineWidth !== undefined) c.outlineWidth = this.options.outlineWidth;
    if (state.heightReference !== undefined && this.options.heightReference) {
      c.heightReference = Cesium.HeightReference[this.options.heightReference];
    }

    return true;
  }
}
