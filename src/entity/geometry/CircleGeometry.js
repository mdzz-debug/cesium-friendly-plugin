import { GeometryBase } from '../GeometryBase.js';

export class CircleGeometry extends GeometryBase {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'circle';
  }

  setRadius(radius) {
    this.options.radius = radius;
    return this;
  }

  setSemiAxes(semiMajorAxis, semiMinorAxis = semiMajorAxis) {
    this.options.semiMajorAxis = semiMajorAxis;
    this.options.semiMinorAxis = semiMinorAxis;
    return this;
  }

  setRadii(radii) {
    this.options.radii = radii;
    return this;
  }

  _resolveMode(opts = {}) {
    const mode = (opts.mode || opts.shape || 'circle').toString().toLowerCase();
    if (mode === 'sphere') return 'sphere';
    if (mode === 'ellipsoid') return 'ellipsoid';
    if (mode === 'ellipse') return 'ellipse';
    return 'circle';
  }

  _hasClockSlice(opts = {}) {
    return opts.minimumClock !== undefined || opts.maximumClock !== undefined;
  }

  _resolveEllipseAxes(opts = {}) {
    const radius = Number(opts.radius);
    const defaultRadius = Number.isFinite(radius) ? radius : 1000;
    const semiMajorAxis = opts.semiMajorAxis !== undefined ? Number(opts.semiMajorAxis) : defaultRadius;
    const semiMinorAxis = opts.semiMinorAxis !== undefined ? Number(opts.semiMinorAxis) : semiMajorAxis;
    return {
      semiMajorAxis: Math.max(0, Number.isFinite(semiMajorAxis) ? semiMajorAxis : defaultRadius),
      semiMinorAxis: Math.max(0, Number.isFinite(semiMinorAxis) ? semiMinorAxis : defaultRadius)
    };
  }

  _resolveEllipsoidRadii(opts = {}) {
    const Cesium = this.cesium;
    const radius = Number(opts.radius);
    const sphereR = Math.max(0, Number.isFinite(radius) ? radius : 1000);

    if (Array.isArray(opts.radii)) {
      return new Cesium.Cartesian3(
        Math.max(0, Number(opts.radii[0]) || sphereR),
        Math.max(0, Number(opts.radii[1]) || sphereR),
        Math.max(0, Number(opts.radii[2]) || sphereR)
      );
    }

    if (opts.radii && typeof opts.radii === 'object') {
      return new Cesium.Cartesian3(
        Math.max(0, Number(opts.radii.x) || sphereR),
        Math.max(0, Number(opts.radii.y) || sphereR),
        Math.max(0, Number(opts.radii.z) || sphereR)
      );
    }

    return new Cesium.Cartesian3(sphereR, sphereR, sphereR);
  }

  _resolveLngLatAlt(pos) {
    const Cesium = this.cesium;
    if (!pos) return null;
    if (Array.isArray(pos)) {
      return { lng: Number(pos[0]) || 0, lat: Number(pos[1]) || 0, alt: Number(pos[2]) || 0 };
    }
    if (pos.lng !== undefined && pos.lat !== undefined) {
      return { lng: Number(pos.lng) || 0, lat: Number(pos.lat) || 0, alt: Number(pos.alt) || 0 };
    }
    if (pos instanceof Cesium.Cartesian3) {
      const c = Cesium.Cartographic.fromCartesian(pos);
      if (!c) return null;
      return {
        lng: Cesium.Math.toDegrees(c.longitude),
        lat: Cesium.Math.toDegrees(c.latitude),
        alt: c.height || 0
      };
    }
    return null;
  }

  _resolveSectorHierarchy(opts = {}) {
    const Cesium = this.cesium;
    const center = this._resolveLngLatAlt(opts.position);
    if (!center) return null;

    const axes = this._resolveEllipseAxes(opts);
    const start = opts.minimumClock !== undefined ? Number(opts.minimumClock) : 0;
    const end = opts.maximumClock !== undefined ? Number(opts.maximumClock) : Math.PI * 2;
    const rotation = opts.rotation !== undefined ? Number(opts.rotation) : 0;
    const parts = Math.max(12, Number(opts.slicePartitions) || 96);
    const earthR = 6378137;
    const latRad = Cesium.Math.toRadians(center.lat);
    const cosLat = Math.max(1e-6, Math.cos(latRad));

    const points = [Cesium.Cartesian3.fromDegrees(center.lng, center.lat, center.alt)];
    for (let i = 0; i <= parts; i += 1) {
      const t = start + ((end - start) * i) / parts;
      const x = axes.semiMajorAxis * Math.cos(t);
      const y = axes.semiMinorAxis * Math.sin(t);
      const xr = x * Math.cos(rotation) - y * Math.sin(rotation);
      const yr = x * Math.sin(rotation) + y * Math.cos(rotation);
      const dLon = xr / (earthR * cosLat);
      const dLat = yr / earthR;
      points.push(
        Cesium.Cartesian3.fromDegrees(
          center.lng + Cesium.Math.toDegrees(dLon),
          center.lat + Cesium.Math.toDegrees(dLat),
          center.alt
        )
      );
    }
    return new Cesium.PolygonHierarchy(points);
  }

  _createEntity() {
    const Cesium = this.cesium;
    const opts = this.options;
    const mode = this._resolveMode(opts);
    const hasHeight = opts.height !== undefined;
    const hasExtruded = opts.extrudedHeight !== undefined;
    const hasHeightReference = opts.heightReference !== undefined;
    const baseHeight = hasHeight ? opts.height : 1;
    const position = this._createDynamicPositionProperty(() => {
      return this._resolvePosition(this.options.position) || Cesium.Cartesian3.fromDegrees(0, 0, baseHeight);
    });
    if (mode === 'sphere' || mode === 'ellipsoid') {
      const ellipsoid = {
        radii: this._resolveEllipsoidRadii(opts),
        material: this._createSolidColorMaterial(opts, '#3fa7ff'),
        fill: opts.fill !== undefined ? !!opts.fill : true,
        outline: !!opts.outline,
        outlineColor: this._resolveColor(opts.outlineColor, '#ffffff'),
        outlineWidth: opts.outlineWidth !== undefined ? opts.outlineWidth : 1
      };
      if (opts.minimumClock !== undefined) ellipsoid.minimumClock = opts.minimumClock;
      if (opts.maximumClock !== undefined) ellipsoid.maximumClock = opts.maximumClock;
      if (opts.minimumCone !== undefined) ellipsoid.minimumCone = opts.minimumCone;
      if (opts.maximumCone !== undefined) ellipsoid.maximumCone = opts.maximumCone;
      this._applyDistanceDisplayCondition(ellipsoid, opts);
      return {
        id: this.id,
        position,
        ellipsoid
      };
    }

    if (this._hasClockSlice(opts)) {
      const polygon = {
        hierarchy: this._resolveSectorHierarchy(opts),
        material: this._createSolidColorMaterial(opts, '#3fa7ff'),
        fill: opts.fill !== undefined ? !!opts.fill : true,
        outline: !!opts.outline,
        outlineColor: this._resolveColor(opts.outlineColor, '#ffffff'),
        outlineWidth: opts.outlineWidth !== undefined ? opts.outlineWidth : 1
      };
      if (opts.height !== undefined) polygon.height = opts.height;
      if (opts.extrudedHeight !== undefined) polygon.extrudedHeight = opts.extrudedHeight;
      this._applyDistanceDisplayCondition(polygon, opts);
      return {
        id: this.id,
        position,
        polygon
      };
    }

    const axes = this._resolveEllipseAxes(opts);
    const ellipse = {
      semiMajorAxis: axes.semiMajorAxis,
      semiMinorAxis: axes.semiMinorAxis,
      material: this._createSolidColorMaterial(opts, '#3fa7ff'),
      fill: opts.fill !== undefined ? !!opts.fill : true,
      outline: !!opts.outline,
      outlineColor: this._resolveColor(opts.outlineColor, '#ffffff'),
      outlineWidth: opts.outlineWidth !== undefined ? opts.outlineWidth : 1
    };

    if (opts.rotation !== undefined) ellipse.rotation = opts.rotation;
    if (opts.stRotation !== undefined) ellipse.stRotation = opts.stRotation;
    if (opts.minimumClock !== undefined) ellipse.minimumClock = opts.minimumClock;
    if (opts.maximumClock !== undefined) ellipse.maximumClock = opts.maximumClock;
    if (hasExtruded) ellipse.extrudedHeight = opts.extrudedHeight;
    if (hasHeight) {
      ellipse.height = opts.height;
    } else if (!hasExtruded) {
      ellipse.height = 1;
    }
    if (opts.heightReference) {
      ellipse.heightReference = Cesium.HeightReference[opts.heightReference];
    } else if (!hasHeight && !hasExtruded && !hasHeightReference) {
      ellipse.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    }
    if (opts.extrudedHeightReference) {
      ellipse.extrudedHeightReference = Cesium.HeightReference[opts.extrudedHeightReference];
    }

    this._applyDistanceDisplayCondition(ellipse, opts);

    return {
      id: this.id,
      position,
      ellipse
    };
  }

  _updatePosition() {
    // Position is driven by CallbackProperty for smooth drag/animation updates.
  }

  _updateEntity() {
    if (!this.entity) return;
    const Cesium = this.cesium;
    const opts = this.options;
    const mode = this._resolveMode(opts);
    this._applyEntityOrientation(opts);

    // Dynamic position callback handles center updates continuously.
    if (this.entity.polygon) {
      const p = this.entity.polygon;
      const hierarchy = this._resolveSectorHierarchy(opts);
      if (hierarchy) p.hierarchy = hierarchy;
      this._syncSolidColorMaterial(p, opts, '#3fa7ff');
      if (opts.fill !== undefined) p.fill = !!opts.fill;
      if (opts.outline !== undefined) p.outline = !!opts.outline;
      if (opts.outlineColor !== undefined) p.outlineColor = this._resolveColor(opts.outlineColor, '#ffffff');
      if (opts.outlineWidth !== undefined) p.outlineWidth = opts.outlineWidth;
      if (opts.height !== undefined) p.height = opts.height;
      if (opts.extrudedHeight !== undefined) p.extrudedHeight = opts.extrudedHeight;
      if (opts.distanceDisplayCondition) {
        p.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
          opts.distanceDisplayCondition.near,
          opts.distanceDisplayCondition.far
        );
      }
      return;
    }

    if (mode === 'sphere' || mode === 'ellipsoid') {
      if (!this.entity.ellipsoid) return;
      const el = this.entity.ellipsoid;
      el.radii = this._resolveEllipsoidRadii(opts);
      this._syncSolidColorMaterial(el, opts, '#3fa7ff');
      if (opts.fill !== undefined) el.fill = !!opts.fill;
      if (opts.outline !== undefined) el.outline = !!opts.outline;
      if (opts.outlineColor !== undefined) el.outlineColor = this._resolveColor(opts.outlineColor, '#ffffff');
      if (opts.outlineWidth !== undefined) el.outlineWidth = opts.outlineWidth;
      if (opts.minimumClock !== undefined) el.minimumClock = opts.minimumClock;
      if (opts.maximumClock !== undefined) el.maximumClock = opts.maximumClock;
      if (opts.minimumCone !== undefined) el.minimumCone = opts.minimumCone;
      if (opts.maximumCone !== undefined) el.maximumCone = opts.maximumCone;
      if (opts.distanceDisplayCondition) {
        el.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
          opts.distanceDisplayCondition.near,
          opts.distanceDisplayCondition.far
        );
      }
      return;
    }

    if (!this.entity.ellipse) return;
    const e = this.entity.ellipse;

    const axes = this._resolveEllipseAxes(opts);
    e.semiMajorAxis = axes.semiMajorAxis;
    e.semiMinorAxis = axes.semiMinorAxis;

    this._syncSolidColorMaterial(e, opts, '#3fa7ff');

    if (opts.fill !== undefined) e.fill = !!opts.fill;
    if (opts.outline !== undefined) e.outline = !!opts.outline;
    if (opts.outlineColor !== undefined) e.outlineColor = this._resolveColor(opts.outlineColor, '#ffffff');
    if (opts.outlineWidth !== undefined) e.outlineWidth = opts.outlineWidth;
    if (opts.height !== undefined) e.height = opts.height;
    if (opts.extrudedHeight !== undefined) e.extrudedHeight = opts.extrudedHeight;
    if (opts.rotation !== undefined) e.rotation = opts.rotation;
    if (opts.stRotation !== undefined) e.stRotation = opts.stRotation;
    if (opts.minimumClock !== undefined) e.minimumClock = opts.minimumClock;
    if (opts.maximumClock !== undefined) e.maximumClock = opts.maximumClock;
    if (opts.heightReference) {
      e.heightReference = Cesium.HeightReference[opts.heightReference];
    } else if (opts.height === undefined && opts.extrudedHeight === undefined) {
      e.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
      e.height = 1;
    }
    if (opts.extrudedHeightReference) {
      e.extrudedHeightReference = Cesium.HeightReference[opts.extrudedHeightReference];
    }

    if (opts.distanceDisplayCondition) {
      e.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
        opts.distanceDisplayCondition.near,
        opts.distanceDisplayCondition.far
      );
    }
  }

  _applyGeometryAnimStateToEntity(state) {
    if (!this.entity) return false;
    const Cesium = this.cesium;
    const mode = this._resolveMode(this.options);
    if (
      state.rotation3D !== undefined ||
      state.heading !== undefined ||
      state.pitch !== undefined ||
      state.roll !== undefined
    ) {
      this._applyEntityOrientation(this.options);
    }

    if (this.entity.polygon) {
      const p = this.entity.polygon;
      if (
        state.radius !== undefined ||
        state.semiMajorAxis !== undefined ||
        state.semiMinorAxis !== undefined ||
        state.minimumClock !== undefined ||
        state.maximumClock !== undefined ||
        state.rotation !== undefined
      ) {
        const hierarchy = this._resolveSectorHierarchy(this.options);
        if (hierarchy) p.hierarchy = hierarchy;
      }
      if (state.color !== undefined || state.opacity !== undefined) {
        this._syncSolidColorMaterial(p, this.options, '#3fa7ff');
      }
      if (state.fill !== undefined) p.fill = !!this.options.fill;
      if (state.outline !== undefined) p.outline = !!this.options.outline;
      if (state.outlineColor !== undefined) p.outlineColor = this._resolveColor(this.options.outlineColor, '#ffffff');
      if (state.outlineWidth !== undefined) p.outlineWidth = this.options.outlineWidth;
      if (state.height !== undefined) p.height = this.options.height;
      if (state.extrudedHeight !== undefined) p.extrudedHeight = this.options.extrudedHeight;
      return true;
    }

    if (mode === 'sphere' || mode === 'ellipsoid') {
      if (!this.entity.ellipsoid) return false;
      const el = this.entity.ellipsoid;
      if (state.radii !== undefined || state.radius !== undefined) {
        el.radii = this._resolveEllipsoidRadii(this.options);
      }
      if (state.color !== undefined || state.opacity !== undefined) {
        this._syncSolidColorMaterial(el, this.options, '#3fa7ff');
      }
      if (state.fill !== undefined) el.fill = !!this.options.fill;
      if (state.outline !== undefined) el.outline = !!this.options.outline;
      if (state.outlineColor !== undefined) el.outlineColor = this._resolveColor(this.options.outlineColor, '#ffffff');
      if (state.outlineWidth !== undefined) el.outlineWidth = this.options.outlineWidth;
      if (state.minimumClock !== undefined) el.minimumClock = this.options.minimumClock;
      if (state.maximumClock !== undefined) el.maximumClock = this.options.maximumClock;
      if (state.minimumCone !== undefined) el.minimumCone = this.options.minimumCone;
      if (state.maximumCone !== undefined) el.maximumCone = this.options.maximumCone;
      return true;
    }

    if (!this.entity.ellipse) return false;
    const e = this.entity.ellipse;

    if (state.radius !== undefined || state.semiMajorAxis !== undefined || state.semiMinorAxis !== undefined) {
      const axes = this._resolveEllipseAxes(this.options);
      e.semiMajorAxis = axes.semiMajorAxis;
      e.semiMinorAxis = axes.semiMinorAxis;
    }
    if (state.color !== undefined || state.opacity !== undefined) {
      this._syncSolidColorMaterial(e, this.options, '#3fa7ff');
    }
    if (state.fill !== undefined) e.fill = !!this.options.fill;
    if (state.outline !== undefined) e.outline = !!this.options.outline;
    if (state.outlineColor !== undefined) e.outlineColor = this._resolveColor(this.options.outlineColor, '#ffffff');
    if (state.outlineWidth !== undefined) e.outlineWidth = this.options.outlineWidth;
    if (state.height !== undefined) e.height = this.options.height;
    if (state.extrudedHeight !== undefined) e.extrudedHeight = this.options.extrudedHeight;
    if (state.rotation !== undefined) e.rotation = this.options.rotation;
    if (state.stRotation !== undefined) e.stRotation = this.options.stRotation;
    if (state.minimumClock !== undefined) e.minimumClock = this.options.minimumClock;
    if (state.maximumClock !== undefined) e.maximumClock = this.options.maximumClock;
    if (state.heightReference !== undefined && this.options.heightReference) {
      e.heightReference = Cesium.HeightReference[this.options.heightReference];
    }
    if (state.extrudedHeightReference !== undefined && this.options.extrudedHeightReference) {
      e.extrudedHeightReference = Cesium.HeightReference[this.options.extrudedHeightReference];
    }

    return true;
  }
}
