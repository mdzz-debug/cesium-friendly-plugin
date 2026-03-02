import { GeometryBase } from '../GeometryBase.js';

export class RectangleGeometry extends GeometryBase {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'rectangle';
  }

  setCoordinates(coordinates) {
    this.options.coordinates = coordinates;
    return this;
  }

  _resolveCenterPosition(rect, height = 0) {
    const Cesium = this.cesium;
    if (!rect) return null;
    const center = Cesium.Rectangle.center(rect);
    return Cesium.Cartesian3.fromRadians(center.longitude, center.latitude, height);
  }

  _createEntity() {
    const Cesium = this.cesium;
    const opts = this.options;
    const rectangleCoordinates = this._resolveRectangle(opts.coordinates);
    if (!rectangleCoordinates) {
      throw new Error('[CesiumFriendly] rectangle requires `coordinates` ([west,south,east,north])');
    }

    const hasHeight = opts.height !== undefined;
    const hasExtruded = opts.extrudedHeight !== undefined;
    const hasHeightReference = opts.heightReference !== undefined;
    const baseHeight = hasHeight ? opts.height : 1;
    const rectangle = {
      coordinates: rectangleCoordinates,
      material: opts.material !== undefined
        ? this._createSolidColorMaterial(opts, '#4fc3f7')
        : this._createDynamicColorMaterial('#4fc3f7'),
      fill: opts.fill !== undefined ? !!opts.fill : true,
      outline: !!opts.outline,
      outlineColor: this._resolveColor(opts.outlineColor, '#ffffff'),
      outlineWidth: opts.outlineWidth !== undefined ? opts.outlineWidth : 1
    };

    if (opts.rotation !== undefined) rectangle.rotation = opts.rotation;
    if (opts.stRotation !== undefined) rectangle.stRotation = opts.stRotation;
    if (hasExtruded) rectangle.extrudedHeight = opts.extrudedHeight;
    if (hasHeight) {
      rectangle.height = opts.height;
    } else if (!hasExtruded) {
      rectangle.height = 1;
    }
    if (opts.heightReference) {
      rectangle.heightReference = Cesium.HeightReference[opts.heightReference];
    } else if (!hasHeight && !hasExtruded && !hasHeightReference) {
      rectangle.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    }
    if (opts.extrudedHeightReference) {
      rectangle.extrudedHeightReference = Cesium.HeightReference[opts.extrudedHeightReference];
    }

    this._applyDistanceDisplayCondition(rectangle, opts);

    const position = this._createDynamicPositionProperty(() => {
      const coords = this._resolveRectangle(this.options.coordinates);
      return this._resolvePosition(this.options.position) || this._resolveCenterPosition(coords, baseHeight);
    });

    return {
      id: this.id,
      position,
      rectangle
    };
  }

  _updatePosition() {
    // Position is driven by CallbackProperty for smooth drag/animation updates.
  }

  _updateEntity() {
    if (!this.entity || !this.entity.rectangle) return;
    const Cesium = this.cesium;
    const opts = this.options;
    const r = this.entity.rectangle;

    const rectangleCoordinates = this._resolveRectangle(opts.coordinates);
    if (rectangleCoordinates) r.coordinates = rectangleCoordinates;

    // Dynamic position callback handles center updates continuously.

    if (!r.material || opts.material !== undefined) {
      r.material = opts.material !== undefined
        ? this._createSolidColorMaterial(opts, '#4fc3f7')
        : this._createDynamicColorMaterial('#4fc3f7');
    }

    if (opts.fill !== undefined) r.fill = !!opts.fill;
    if (opts.outline !== undefined) r.outline = !!opts.outline;
    if (opts.outlineColor !== undefined) r.outlineColor = this._resolveColor(opts.outlineColor, '#ffffff');
    if (opts.outlineWidth !== undefined) r.outlineWidth = opts.outlineWidth;
    if (opts.height !== undefined) r.height = opts.height;
    if (opts.extrudedHeight !== undefined) r.extrudedHeight = opts.extrudedHeight;
    if (opts.rotation !== undefined) r.rotation = opts.rotation;
    if (opts.stRotation !== undefined) r.stRotation = opts.stRotation;
    if (opts.heightReference) {
      r.heightReference = Cesium.HeightReference[opts.heightReference];
    } else if (opts.height === undefined && opts.extrudedHeight === undefined) {
      r.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
      r.height = 1;
    }
    if (opts.extrudedHeightReference) {
      r.extrudedHeightReference = Cesium.HeightReference[opts.extrudedHeightReference];
    }

    if (opts.distanceDisplayCondition) {
      r.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }
  }

  _applyGeometryAnimStateToEntity(state) {
    if (!this.entity || !this.entity.rectangle) return false;
    const Cesium = this.cesium;
    const r = this.entity.rectangle;

    if (state.coordinates !== undefined) {
      const coords = this._resolveRectangle(this.options.coordinates);
      if (coords) r.coordinates = coords;
    }
    if (state.color !== undefined || state.opacity !== undefined) {
      r.material = this.options.material !== undefined
        ? this._createSolidColorMaterial(this.options, '#4fc3f7')
        : this._createDynamicColorMaterial('#4fc3f7');
    }
    if (state.material !== undefined) {
      r.material = this.options.material !== undefined
        ? this._createSolidColorMaterial(this.options, '#4fc3f7')
        : this._createDynamicColorMaterial('#4fc3f7');
    }
    if (state.fill !== undefined) r.fill = !!this.options.fill;
    if (state.outline !== undefined) r.outline = !!this.options.outline;
    if (state.outlineColor !== undefined) r.outlineColor = this._resolveColor(this.options.outlineColor, '#ffffff');
    if (state.outlineWidth !== undefined) r.outlineWidth = this.options.outlineWidth;
    if (state.height !== undefined) r.height = this.options.height;
    if (state.extrudedHeight !== undefined) r.extrudedHeight = this.options.extrudedHeight;
    if (state.rotation !== undefined) r.rotation = this.options.rotation;
    if (state.stRotation !== undefined) r.stRotation = this.options.stRotation;
    if (state.heightReference !== undefined && this.options.heightReference) {
      r.heightReference = Cesium.HeightReference[this.options.heightReference];
    }
    if (state.extrudedHeightReference !== undefined && this.options.extrudedHeightReference) {
      r.extrudedHeightReference = Cesium.HeightReference[this.options.extrudedHeightReference];
    }

    return true;
  }
}
