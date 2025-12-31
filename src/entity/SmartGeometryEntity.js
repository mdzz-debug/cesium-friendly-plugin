import { GeometryEntity } from './GeometryEntity.js';

export class SmartGeometryEntity extends GeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'geometry';
    const o = this.options || {};
    this.kind = o.kind || 'circle';
    this.modeDim = o.mode || '2d';
    this.material = o.material;
    this.fill = o.fill !== undefined ? o.fill : true;
    this.outline = o.outline || false;
    this.outlineColor = o.outlineColor;
    this.outlineWidth = o.outlineWidth || 1;
    this.rotationAngle = o.rotation || 0;
    this.extrudedHeight = o.extrudedHeight;
    this.radiusValue = o.radius || 1000;
    this.semiMajorAxis = o.semiMajorAxis;
    this.semiMinorAxis = o.semiMinorAxis;
    this.radiiX = o.radiiX;
    this.radiiY = o.radiiY;
    this.radiiZ = o.radiiZ;
    this.lengthValue = o.length;
    this.topRadiusValue = o.topRadius;
    this.bottomRadiusValue = o.bottomRadius;
    this.dimX = o.dimX;
    this.dimY = o.dimY;
    this.dimZ = o.dimZ;
    this.polylinePositionsData = o.polylinePositions;
    this.polylineWidth = o.polylineWidth || o.width;
    this.volumeShapeData = o.volumeShape;
    this.corridorPositionsData = o.corridorPositions;
    this.corridorWidth = o.corridorWidth || o.width;
    this.rectangleCoordinates = o.rectangleCoordinates;
    this.polygonHierarchyData = o.polygonHierarchy || o.hierarchy;
    this.wallPositionsData = o.wallPositions;
    this.sectorStartAngle = o.sectorStartAngle;
    this.sectorSweepAngle = o.sectorSweepAngle;
    this.sectorSamples = o.sectorSamples || 64;
  }

  getCollection() {
    return this.viewer.entities;
  }

  shape(k) { this.kind = k; this.trigger('change', this); return this; }
  mode(m) { this.modeDim = m; this.trigger('change', this); return this; }
  radius(r) { this.radiusValue = r; this.trigger('change', this); return this; }
  radii(x, y, z) { this.radiiX = x; this.radiiY = y; this.radiiZ = z; this.trigger('change', this); return this; }
  semiAxes(major, minor) { this.semiMajorAxis = major; this.semiMinorAxis = minor; this.trigger('change', this); return this; }
  rotation(angle) { this.rotationAngle = angle; this.trigger('change', this); return this; }
  extrude(h) { this.extrudedHeight = h; this.trigger('change', this); return this; }
  material(m) { this.material = m; this.trigger('change', this); return this; }
  outline(enabled, color, width) { this.outline = !!enabled; if (color !== undefined) this.outlineColor = color; if (width !== undefined) this.outlineWidth = width; this.trigger('change', this); return this; }
  length(h) { this.lengthValue = h; this.trigger('change', this); return this; }
  topRadius(r) { this.topRadiusValue = r; this.trigger('change', this); return this; }
  bottomRadius(r) { this.bottomRadiusValue = r; this.trigger('change', this); return this; }
  dimensions(x, y, z) { this.dimX = x; this.dimY = y; this.dimZ = z; this.trigger('change', this); return this; }
  polylinePositions(p) { this.polylinePositionsData = p; this.trigger('change', this); return this; }
  volumeShape(s) { this.volumeShapeData = s; this.trigger('change', this); return this; }
  corridorPositions(p) { this.corridorPositionsData = p; this.trigger('change', this); return this; }
  corridorWidthSet(w) { this.corridorWidth = w; this.trigger('change', this); return this; }
  rectangleCoordinatesSet(rect) { this.rectangleCoordinates = rect; this.trigger('change', this); return this; }
  polygonHierarchy(h) { this.polygonHierarchyData = h; this.trigger('change', this); return this; }
  wallPositions(p) { this.wallPositionsData = p; this.trigger('change', this); return this; }
  sector(cfg) { if (cfg && typeof cfg === 'object') { this.sectorStartAngle = cfg.startAngle; this.sectorSweepAngle = cfg.sweepAngle; if (cfg.samples) this.sectorSamples = cfg.samples; } this.trigger('change', this); return this; }

  _createEntity() {
    const Cesium = this.cesium;
    const isRelative = this.heightReference === 'relativeToGround' || (this.heightOffset && this.heightOffset > 0);
    const hh = isRelative ? (this.heightOffset || 0) : (this.position[2] || 0);
    const pos = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], hh);
    const opts = { id: this.id, name: this.name, description: this.description };
    const kind = (this.kind || 'circle').toLowerCase();
    if (kind === 'circle') {
      if (this.modeDim === '3d') {
        const r = this.radiusValue || 1000;
        opts.position = pos;
        opts.ellipsoid = { radii: new Cesium.Cartesian3(r, r, r), material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, heightReference: this._getHeightReferenceEnum() };
      } else {
        if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined) {
          const pts = this._computeSectorPositions(this.position, this.radiusValue || 1000, this.radiusValue || 1000, this.rotationAngle || 0, this.sectorStartAngle, this.sectorSweepAngle, this.sectorSamples, hh);
          opts.polygon = { hierarchy: pts, material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, extrudedHeight: this.extrudedHeight };
        } else {
          const r = this.radiusValue || 1000;
          opts.position = pos;
          opts.ellipse = { semiMajorAxis: r, semiMinorAxis: r, height: hh, material: this.material, fill: this.fill, outline: !!this.outline, outlineColor: this.outlineColor, outlineWidth: this.outlineWidth, rotation: this.rotationAngle || 0, extrudedHeight: this.extrudedHeight };
        }
      }
    } else if (kind === 'ellipse') {
      if (this.modeDim === '3d') {
        const rx = this.radiiX || this.semiMajorAxis || this.radiusValue || 1000;
        const ry = this.radiiY || this.semiMinorAxis || this.radiusValue || 1000;
        const rz = this.radiiZ || this.radiusValue || 1000;
        opts.position = pos;
        opts.ellipsoid = { radii: new Cesium.Cartesian3(rx, ry, rz), material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, heightReference: this._getHeightReferenceEnum() };
      } else {
        if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined) {
          const a = this.semiMajorAxis || this.radiusValue || 1000;
          const b = this.semiMinorAxis || this.radiusValue || 1000;
          const pts = this._computeSectorPositions(this.position, a, b, this.rotationAngle || 0, this.sectorStartAngle, this.sectorSweepAngle, this.sectorSamples, hh);
          opts.polygon = { hierarchy: pts, material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, extrudedHeight: this.extrudedHeight };
        } else {
          const a = this.semiMajorAxis || this.radiusValue || 1000;
          const b = this.semiMinorAxis || this.radiusValue || 1000;
          opts.position = pos;
          opts.ellipse = { semiMajorAxis: a, semiMinorAxis: b, height: hh, material: this.material, fill: this.fill, outline: !!this.outline, outlineColor: this.outlineColor, outlineWidth: this.outlineWidth, rotation: this.rotationAngle || 0, extrudedHeight: this.extrudedHeight };
        }
      }
    } else if (kind === 'sphere') {
      const r = this.radiusValue || this.radiiX || 1000;
      opts.position = pos;
      opts.ellipsoid = { radii: new Cesium.Cartesian3(r, r, r), material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, heightReference: this._getHeightReferenceEnum() };
    } else if (kind === 'ellipsoid') {
      const rx = this.radiiX || 1000;
      const ry = this.radiiY || 1000;
      const rz = this.radiiZ || 1000;
      opts.position = pos;
      opts.ellipsoid = { radii: new Cesium.Cartesian3(rx, ry, rz), material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, heightReference: this._getHeightReferenceEnum() };
    } else if (kind === 'polygon') {
      opts.polygon = { hierarchy: this._normalizeHierarchy(this.polygonHierarchyData), material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, extrudedHeight: this.extrudedHeight };
    } else if (kind === 'polyline') {
      opts.polyline = { positions: this._normalizePositions(this.polylinePositionsData), width: this.polylineWidth || 1, material: this.material };
    } else if (kind === 'polylinevolume' || kind === 'polylineVolume') {
      opts.polylineVolume = { positions: this._normalizePositions(this.polylinePositionsData), shape: this.volumeShapeData || [], material: this.material };
    } else if (kind === 'rectangle') {
      opts.rectangle = { coordinates: this.rectangleCoordinates, material: this.material, outline: !!this.outline, outlineColor: this.outlineColor, extrudedHeight: this.extrudedHeight };
    } else if (kind === 'corridor') {
      opts.corridor = { positions: this._normalizePositions(this.corridorPositionsData), width: this.corridorWidth || 1, material: this.material, outline: !!this.outline, outlineColor: this.outlineColor };
    } else if (kind === 'box') {
      opts.position = pos;
      opts.box = { dimensions: new Cesium.Cartesian3(this.dimX || 1, this.dimY || 1, this.dimZ || 1), material: this.material };
    } else if (kind === 'cylinder') {
      opts.position = pos;
      opts.cylinder = { length: this.lengthValue || 1, topRadius: this.topRadiusValue || 1, bottomRadius: this.bottomRadiusValue || 1, material: this.material, outline: !!this.outline, outlineColor: this.outlineColor };
    } else if (kind === 'cone') {
      opts.position = pos;
      opts.cylinder = { length: this.lengthValue || 1, topRadius: 0, bottomRadius: this.bottomRadiusValue || this.topRadiusValue || 1, material: this.material, outline: !!this.outline, outlineColor: this.outlineColor };
    } else if (kind === 'wall') {
      opts.wall = { positions: this._normalizePositions(this.wallPositionsData, true), material: this.material };
    } else {
      opts.position = pos;
      opts.point = { pixelSize: 10, color: Cesium.Color.YELLOW, heightReference: this._getHeightReferenceEnum() };
    }
    return opts;
  }

  update(options, duration) {
    super.update(options, duration);
    this._applySmartGeometry();
    return this;
  }

  _applySmartGeometry() {
    const Cesium = this.cesium;
    const e = this.entity;
    if (!e) return;
    const kind = (this.kind || '').toLowerCase();
    if (e.ellipse) {
      if (this.semiMajorAxis) e.ellipse.semiMajorAxis = this.semiMajorAxis;
      if (this.semiMinorAxis) e.ellipse.semiMinorAxis = this.semiMinorAxis;
      if (this.extrudedHeight !== undefined) e.ellipse.extrudedHeight = this.extrudedHeight;
      if (this.rotationAngle !== undefined) e.ellipse.rotation = this.rotationAngle;
      if (this.material) e.ellipse.material = this.material;
      e.ellipse.fill = !!this.fill;
      e.ellipse.outline = !!this.outline;
      if (this.outlineColor) e.ellipse.outlineColor = this.outlineColor;
      if (this.outlineWidth !== undefined) e.ellipse.outlineWidth = this.outlineWidth;
    }
    if (e.ellipsoid) {
      const rx = this.radiiX || (kind === 'sphere' ? (this.radiusValue || 1000) : undefined);
      const ry = this.radiiY || (kind === 'sphere' ? (this.radiusValue || 1000) : undefined);
      const rz = this.radiiZ || (kind === 'sphere' ? (this.radiusValue || 1000) : undefined);
      if (rx && ry && rz) e.ellipsoid.radii = new Cesium.Cartesian3(rx, ry, rz);
      if (this.material) e.ellipsoid.material = this.material;
      e.ellipsoid.outline = !!this.outline;
      if (this.outlineColor) e.ellipsoid.outlineColor = this.outlineColor;
    }
    if (e.polygon) {
      if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined && (kind === 'circle' || kind === 'ellipse')) {
        const a = kind === 'circle' ? (this.radiusValue || 1000) : (this.semiMajorAxis || this.radiusValue || 1000);
        const b = kind === 'circle' ? (this.radiusValue || 1000) : (this.semiMinorAxis || this.radiusValue || 1000);
        const isRelative = this.heightReference === 'relativeToGround' || (this.heightOffset && this.heightOffset > 0);
        const hh = isRelative ? (this.heightOffset || 0) : (this.position[2] || 0);
        e.polygon.hierarchy = this._computeSectorPositions(this.position, a, b, this.rotationAngle || 0, this.sectorStartAngle, this.sectorSweepAngle, this.sectorSamples, hh);
      } else if (this.polygonHierarchyData) {
        e.polygon.hierarchy = this._normalizeHierarchy(this.polygonHierarchyData);
      }
      if (this.extrudedHeight !== undefined) e.polygon.extrudedHeight = this.extrudedHeight;
      if (this.material) e.polygon.material = this.material;
      e.polygon.outline = !!this.outline;
      if (this.outlineColor) e.polygon.outlineColor = this.outlineColor;
    }
    if (e.polyline) {
      if (this.polylinePositionsData) e.polyline.positions = this._normalizePositions(this.polylinePositionsData);
      if (this.polylineWidth) e.polyline.width = this.polylineWidth;
      if (this.material) e.polyline.material = this.material;
    }
    if (e.polylineVolume) {
      if (this.polylinePositionsData) e.polylineVolume.positions = this._normalizePositions(this.polylinePositionsData);
      if (this.volumeShapeData) e.polylineVolume.shape = this.volumeShapeData;
      if (this.material) e.polylineVolume.material = this.material;
    }
    if (e.corridor) {
      if (this.corridorPositionsData) e.corridor.positions = this._normalizePositions(this.corridorPositionsData);
      if (this.corridorWidth) e.corridor.width = this.corridorWidth;
      if (this.material) e.corridor.material = this.material;
      e.corridor.outline = !!this.outline;
      if (this.outlineColor) e.corridor.outlineColor = this.outlineColor;
    }
    if (e.rectangle) {
      if (this.rectangleCoordinates) e.rectangle.coordinates = this.rectangleCoordinates;
      if (this.extrudedHeight !== undefined) e.rectangle.extrudedHeight = this.extrudedHeight;
      if (this.material) e.rectangle.material = this.material;
      e.rectangle.outline = !!this.outline;
      if (this.outlineColor) e.rectangle.outlineColor = this.outlineColor;
    }
    if (e.box) {
      const dx = this.dimX || 1, dy = this.dimY || 1, dz = this.dimZ || 1;
      e.box.dimensions = new Cesium.Cartesian3(dx, dy, dz);
      if (this.material) e.box.material = this.material;
    }
    if (e.cylinder) {
      if (this.lengthValue) e.cylinder.length = this.lengthValue;
      if (this.topRadiusValue !== undefined) e.cylinder.topRadius = this.topRadiusValue;
      if (this.bottomRadiusValue !== undefined) e.cylinder.bottomRadius = this.bottomRadiusValue;
      if (this.material) e.cylinder.material = this.material;
      e.cylinder.outline = !!this.outline;
      if (this.outlineColor) e.cylinder.outlineColor = this.outlineColor;
    }
    if (e.wall) {
      if (this.wallPositionsData) e.wall.positions = this._normalizePositions(this.wallPositionsData, true);
      if (this.material) e.wall.material = this.material;
    }
  }

  _normalizePositions(p, withHeights) {
    const Cesium = this.cesium;
    if (!p) return [];
    if (Array.isArray(p)) {
      if (p.length === 0) return [];
      if (p[0] instanceof Cesium.Cartesian3) return p;
      if (typeof p[0] === 'number') {
        if (withHeights) return Cesium.Cartesian3.fromDegreesArrayHeights(p);
        return Cesium.Cartesian3.fromDegreesArray(p);
      }
      if (Array.isArray(p[0]) && p[0].length >= 2) {
        const arr = [];
        for (const v of p) {
          const lng = v[0];
          const lat = v[1];
          const h = v[2] || 0;
          arr.push(Cesium.Cartesian3.fromDegrees(lng, lat, h));
        }
        return arr;
      }
    }
    return [];
  }

  _normalizeHierarchy(h) {
    const Cesium = this.cesium;
    if (!h) return [];
    if (Array.isArray(h)) {
      if (h.length === 0) return [];
      if (h[0] instanceof Cesium.Cartesian3) return h;
      if (typeof h[0] === 'number') return Cesium.Cartesian3.fromDegreesArray(h);
      if (Array.isArray(h[0]) && h[0].length >= 2) {
        const arr = [];
        for (const v of h) {
          const lng = v[0];
          const lat = v[1];
          const hh = v[2] || 0;
          arr.push(Cesium.Cartesian3.fromDegrees(lng, lat, hh));
        }
        return arr;
      }
    }
    return h;
  }

  _computeSectorPositions(centerDeg, a, b, rotation, startAngle, sweepAngle, samples, height) {
    const Cesium = this.cesium;
    const R = 6378137;
    const lng = centerDeg[0];
    const lat = centerDeg[1];
    const latRad = lat * Math.PI / 180;
    const pts = [];
    pts.push(Cesium.Cartesian3.fromDegrees(lng, lat, height));
    for (let i = 0; i <= samples; i++) {
      const t = startAngle + (sweepAngle * i / samples);
      const x = a * Math.cos(t);
      const y = b * Math.sin(t);
      const xr = x * Math.cos(rotation) - y * Math.sin(rotation);
      const yr = x * Math.sin(rotation) + y * Math.cos(rotation);
      const dLat = (yr / R) * (180 / Math.PI);
      const dLon = (xr / (R * Math.cos(latRad))) * (180 / Math.PI);
      pts.push(Cesium.Cartesian3.fromDegrees(lng + dLon, lat + dLat, height));
    }
    pts.push(Cesium.Cartesian3.fromDegrees(lng, lat, height));
    return pts;
  }

  static helpers = {
    circleShape(CesiumRef, r) {
      const arr = [];
      for (let i = 0; i < 360; i++) {
        const rad = i * Math.PI / 180;
        arr.push(new CesiumRef.Cartesian2(r * Math.cos(rad), r * Math.sin(rad)));
      }
      return arr;
    }
  };
}
