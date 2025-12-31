import { GeometryEntity } from './GeometryEntity.js';
import { deepClone } from '../utils/deepClone.js';

export class SmartGeometryEntity extends GeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'geometry';
    const o = this.options || {};
    this.kind = o.kind || 'circle';
    this.modeDim = o.mode || '2d';
    this._material = o.material;
    this.materialOpacity = o.opacity;
    this.fill = o.fill !== undefined ? o.fill : true;
    this._outlineEnabled = o.outline || false;
    this._outlineColor = o.outlineColor;
    this._outlineWidth = o.outlineWidth || 1;
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
    this.rotationAxis = o.rotationAxis || 'Z';
    this.sectorStartAngle = o.sectorStartAngle;
    this.sectorSweepAngle = o.sectorSweepAngle;
    this.sectorVerticalAngle = o.sectorVerticalAngle;
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
  rotation(angle, axis) { 
    this.rotationAngle = angle; 
    if (axis) this.rotationAxis = axis;
    this.trigger('change', this); 
    return this; 
  }
  rotationDeg(deg, axis) { 
    this.rotationAngle = (deg || 0) * Math.PI / 180; 
    if (axis) this.rotationAxis = axis;
    this.trigger('change', this); 
    return this; 
  }
  extrude(h) { this.extrudedHeight = h; this.trigger('change', this); return this; }
  material(m) { this._material = m; this.trigger('change', this); return this; }
  setOpacity(a) { this.materialOpacity = a; this.trigger('change', this); return this; }
  outline(enabled, color, width) { this._outlineEnabled = !!enabled; if (color !== undefined) this._outlineColor = color; if (width !== undefined) this._outlineWidth = width; this.trigger('change', this); return this; }
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
  sector(arg1, arg2, arg3, arg4) {
    if (arg1 && typeof arg1 === 'object') {
      const cfg = arg1;
      this.sectorStartAngle = cfg.startAngle;
      this.sectorSweepAngle = cfg.sweepAngle;
      this.sectorVerticalAngle = cfg.verticalAngle;
      if (cfg.samples) this.sectorSamples = cfg.samples;
    } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
      this.sectorStartAngle = (arg1 || 0) * Math.PI / 180;
      this.sectorSweepAngle = (arg2 || 0) * Math.PI / 180;
      let vCut = arg3;
      let sam = arg4;
      if (sam === undefined && typeof vCut === 'number') {
         // Heuristic: if vCut > 180, it's likely samples (since cone > 180 is meaningless)
         if (vCut > 180) { sam = vCut; vCut = undefined; }
      }
      if (typeof vCut === 'number') this.sectorVerticalAngle = vCut * Math.PI / 180;
      if (typeof sam === 'number') this.sectorSamples = sam;
    }
    this.trigger('change', this);
    return this;
  }

  sectorDeg(cfg) { 
    if (cfg && typeof cfg === 'object') { 
      const sd = (cfg.start !== undefined ? cfg.start : (cfg.startDeg !== undefined ? cfg.startDeg : 0));
      const sw = (cfg.sweep !== undefined ? cfg.sweep : (cfg.sweepDeg !== undefined ? cfg.sweepDeg : 0));
      const vc = (cfg.vertical !== undefined ? cfg.vertical : (cfg.verticalCut !== undefined ? cfg.verticalCut : (cfg.maximumCone !== undefined ? cfg.maximumCone : undefined)));
      this.sectorStartAngle = (sd || 0) * Math.PI / 180; 
      this.sectorSweepAngle = (sw || 0) * Math.PI / 180; 
      if (vc !== undefined) this.sectorVerticalAngle = vc * Math.PI / 180;
      if (cfg.samples) this.sectorSamples = cfg.samples; 
    } 
    this.trigger('change', this); 
    return this; 
  }
  sectorHalf(startDeg = 0) { 
    this.sectorStartAngle = (startDeg || 0) * Math.PI / 180; 
    this.sectorSweepAngle = Math.PI; 
    this.trigger('change', this); 
    return this; 
  }
  sectorQuarter(startDeg = 0) { 
    this.sectorStartAngle = (startDeg || 0) * Math.PI / 180; 
    this.sectorSweepAngle = Math.PI / 2; 
    this.trigger('change', this); 
    return this; 
  }

  _startGeometryAnimation() {
    if (!this._animContext) return;
    
    this._animPending = false;
    this.stopAnimation();
    
    const startState = this._animContext.startValues || {};
    this._animContext.startValues = startState;
    
    this.saveState();
    const targetState = deepClone(this._savedState || {});
    
    const targets = {};
    Object.keys(targetState).forEach(key => {
        const s = startState[key];
        const t = targetState[key];
        if (s !== t) {
            targets[key] = t;
        }
    });
    
    this._animContext.targets = targets;
    
    this._savedState = deepClone(startState);
    this.restoreState(0);
    
    let startTime = null;
    const duration = this._animContext.duration;
    const legDuration = this._animContext.loop ? (duration / 2) : duration;
    
    const targetKeys = Object.keys(targets);
    const current = {};

    const animate = (now) => {
        if (!this._animContext) return;

        if (!startTime) startTime = now;

        const elapsed = now - startTime;
        let forward = true;
        let linearT;
        if (this._animContext.loop) {
            const cycles = Math.floor(elapsed / legDuration);
            forward = cycles % 2 === 0;
            linearT = (elapsed % legDuration) / legDuration;
        } else {
            linearT = Math.min(elapsed / legDuration, 1);
        }
        this._animContext.direction = forward ? 1 : -1;
        const t = linearT < 0.5 ? 2 * linearT * linearT : -1 + (4 - 2 * linearT) * linearT;
        
        targetKeys.forEach(key => {
            const s = startState[key];
            const e = targets[key];
            
            if (typeof s === 'number' && typeof e === 'number') {
                 if (forward) {
                     current[key] = s + (e - s) * t;
                 } else {
                     current[key] = e + (s - e) * t;
                 }
            } else {
                 current[key] = forward ? e : s;
            }
        });
        
        this._inUpdateAnimation = true;
        
        // --- Geometry Optimized Update ---
        // 1. Call GeometryEntity.update to set properties (bypass SmartGeometryEntity.update)
        super.update(current); 

        // 2. Decide if we need _applySmartGeometry
        const kind = (this.kind || '').toLowerCase();
        if (kind === 'wall' && this.wallPositionsData) {
             // Optimized: Wall uses CallbackProperty, so properties set by super.update 
             // (like rotationAngle) are automatically picked up by the callback.
             // No need to call _applySmartGeometry (which would recreate the callback).
        } else {
             // Standard: Other shapes need explicit geometry update
             this._applySmartGeometry();
        }
        
        this._inUpdateAnimation = false;
        
        if (this.viewer && this.viewer.scene) {
            this.viewer.scene.requestRender();
        }

        if ((linearT < 1 || this._animContext.loop) && this._animPending === false) {
             this._animFrame = requestAnimationFrame(animate);
        } else {
             this._animFrame = null;
             this._inUpdateAnimation = false;
             if (!this._animContext.loop) {
                 this.update(targets);
             }
        }
    };
    
    this._animFrame = requestAnimationFrame(animate);
    return this;
  }

  _createEntity() {
    const Cesium = this.cesium;
    const mat = this._resolveMaterial(this._material);
    const oc = this._resolveColor(this._outlineColor);
    const hh = this._effectiveHeight();
    const lng = this.position[0], lat = this.position[1];
    const terrainH = this._getGroundHeight(lng, lat);
    const hrMode = this.heightReference;
    const centerH = hrMode === 'clampToGround' ? terrainH
                   : hrMode === 'relativeToGround' ? (terrainH + (this.heightOffset || 0))
                   : hh;
    const pos = Cesium.Cartesian3.fromDegrees(lng, lat, centerH);
    const opts = { id: this.id, name: this.name, description: this.description };
    const kind = (this.kind || 'circle').toLowerCase();
    
    // Check for 3D rotation intent (non-Z axis) for circles/ellipses
    const axis = (this.rotationAxis || 'Z').toUpperCase();
    const is3DRotation = (kind === 'circle' || kind === 'ellipse') && (axis !== 'Z');

    if (kind === 'circle') {
      if (this.modeDim === '3d' || is3DRotation) {
        const r = this.radiusValue || 1000;
        
        // 3D sphere sector -> polygon wedge (extruded) or ellipsoid sector
        // Or 3D rotated disk sector -> ellipsoid sector (wedge)
        if (this.sectorVerticalAngle !== undefined || (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined)) {
          const minClock = this.sectorStartAngle || 0;
          const maxClock = (this.sectorStartAngle || 0) + (this.sectorSweepAngle || (2 * Math.PI));
          opts.position = pos;
          opts.ellipsoid = {
            radii: new Cesium.Cartesian3(r, r, r),
            material: mat,
            fill: !!this.fill,
            outline: !!this._outlineEnabled,
            outlineColor: oc,
            heightReference: this._getHeightReferenceEnum(),
            minimumClock: minClock,
            maximumClock: maxClock,
            maximumCone: this.sectorVerticalAngle !== undefined ? this.sectorVerticalAngle : Math.PI
           };
           // If it's a disk (not 3D mode), we need flat Z
           if (this.modeDim !== '3d') {
               opts.ellipsoid.radii = new Cesium.Cartesian3(r, r, 0.1);
               // For disk sector, we usually want the full cone (PI) or maybe half? 
               // Standard ellipsoid sector uses clock for longitude (wedge).
               // Cone controls latitude. For a disk (flat ellipsoid), cone doesn't matter much if flattened, 
               // but strictly speaking 0-PI covers the whole sphere.
           }
           opts.orientation = this._getOrientation(pos);
         } else {
          // Standard Sphere or Disk
          opts.position = pos;
          opts.orientation = this._getOrientation(pos);
          
          let radii;
          if (this.modeDim === '3d') {
              // Sphere
              radii = new Cesium.Cartesian3(r, r, r);
          } else {
              // 3D Rotated Disk (thin ellipsoid)
              radii = new Cesium.Cartesian3(r, r, 0.1);
          }
          
          opts.ellipsoid = { radii: radii, material: mat, fill: !!this.fill, outline: !!this._outlineEnabled, outlineColor: oc, heightReference: this._getHeightReferenceEnum() };
        }
      } else {
        if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined) {
          const pts = this._computeSectorPositions(this.position, this.radiusValue || 1000, this.radiusValue || 1000, this.rotationAngle || 0, this.sectorStartAngle, this.sectorSweepAngle, this.sectorSamples, hh);
          opts.polygon = { hierarchy: pts, material: mat, outline: !!this._outlineEnabled, outlineColor: oc, extrudedHeight: this.extrudedHeight, height: hh, heightReference: this._getHeightReferenceEnum() };
        } else {
          const r = this.radiusValue || 1000;
          opts.position = pos;
          opts.ellipse = { semiMajorAxis: r, semiMinorAxis: r, height: hh, material: mat, fill: this.fill, outline: !!this._outlineEnabled, outlineColor: oc, outlineWidth: this._outlineWidth, rotation: this.rotationAngle || 0, extrudedHeight: this.extrudedHeight };
        }
      }
    } else if (kind === 'ellipse') {
      if (this.modeDim === '3d' || is3DRotation) {
        const rx = this.radiiX || this.semiMajorAxis || this.radiusValue || 1000;
        const ry = this.radiiY || this.semiMinorAxis || this.radiusValue || 1000;
        let rz;
        if (this.modeDim === '3d') {
            rz = this.radiiZ || this.radiusValue || Math.max(rx, ry, 1000);
        } else {
            // Disk
            rz = 0.1;
        }

        // 3D ellipsoid sector -> polygon wedge (extruded) or ellipsoid sector
        if (this.sectorVerticalAngle !== undefined || (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined)) {
          const minClock = this.sectorStartAngle || 0;
          const maxClock = (this.sectorStartAngle || 0) + (this.sectorSweepAngle || (2 * Math.PI));
          opts.position = pos;
          opts.ellipsoid = {
            radii: new Cesium.Cartesian3(rx, ry, rz),
            material: mat,
            fill: !!this.fill,
            outline: !!this._outlineEnabled,
            outlineColor: oc,
            heightReference: this._getHeightReferenceEnum(),
            minimumClock: minClock,
            maximumClock: maxClock,
            maximumCone: this.sectorVerticalAngle !== undefined ? this.sectorVerticalAngle : Math.PI
           };
           opts.orientation = this._getOrientation(pos);
         } else {
          opts.position = pos;
          opts.orientation = this._getOrientation(pos);
          opts.ellipsoid = { radii: new Cesium.Cartesian3(rx, ry, rz), material: mat, fill: !!this.fill, outline: !!this._outlineEnabled, outlineColor: oc, heightReference: this._getHeightReferenceEnum() };
        }
      } else {
        if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined) {
          const a = this.semiMajorAxis || this.radiusValue || 1000;
          const b = this.semiMinorAxis || this.radiusValue || 1000;
          let pts = this._computeSectorPositions(this.position, a, b, 0, this.sectorStartAngle, this.sectorSweepAngle, this.sectorSamples, hh);
          pts = this._rotatePositions(pts);
          opts.polygon = { hierarchy: pts, material: mat, outline: !!this._outlineEnabled, outlineColor: oc, extrudedHeight: this.extrudedHeight, height: hh, heightReference: this._getHeightReferenceEnum() };
        } else {
          const a = this.semiMajorAxis || this.radiusValue || 1000;
          const b = this.semiMinorAxis || this.radiusValue || 1000;
          opts.position = pos;
          opts.orientation = this._getOrientation(pos);
          opts.ellipse = { semiMajorAxis: a, semiMinorAxis: b, height: hh, material: mat, fill: this.fill, outline: !!this._outlineEnabled, outlineColor: oc, outlineWidth: this._outlineWidth, extrudedHeight: this.extrudedHeight };
        }
      }
    } else if (kind === 'sphere') {
      const r = this.radiusValue || this.radiiX || 1000;
      opts.position = pos;
      opts.orientation = this._getOrientation(pos);
      opts.ellipsoid = { radii: new Cesium.Cartesian3(r, r, r), material: mat, fill: !!this.fill, outline: !!this._outlineEnabled, outlineColor: oc, heightReference: this._getHeightReferenceEnum() };
    } else if (kind === 'ellipsoid') {
      const rx = this.radiiX || 1000;
      const ry = this.radiiY || 1000;
      const rz = this.radiiZ || 1000;
      opts.position = pos;
      opts.orientation = this._getOrientation(pos);
      opts.ellipsoid = { radii: new Cesium.Cartesian3(rx, ry, rz), material: mat, fill: !!this.fill, outline: !!this._outlineEnabled, outlineColor: oc, heightReference: this._getHeightReferenceEnum() };
    } else if (kind === 'polygon') {
      let ph = this._normalizeHierarchy(this.polygonHierarchyData);
      if (Array.isArray(ph)) ph = this._rotatePositions(ph);
      else if (ph && ph.positions) ph.positions = this._rotatePositions(ph.positions);
      opts.polygon = { hierarchy: ph, material: mat, outline: !!this._outlineEnabled, outlineColor: oc, extrudedHeight: this.extrudedHeight };
    } else if (kind === 'polyline') {
      let pp = this._normalizePositions(this.polylinePositionsData);
      pp = this._rotatePositions(pp);
      opts.polyline = { positions: pp, width: this.polylineWidth || 1, material: mat };
    } else if (kind === 'polylinevolume' || kind === 'polylineVolume') {
      let pv = this._normalizePositions(this.polylinePositionsData);
      pv = this._rotatePositions(pv);
      opts.polylineVolume = { positions: pv, shape: this._normalizeVolumeShape(this.volumeShapeData) || [], material: mat };
    } else if (kind === 'rectangle') {
      opts.rectangle = { coordinates: this._normalizeRectangle(this.rectangleCoordinates), material: mat, outline: !!this._outlineEnabled, outlineColor: oc, extrudedHeight: this.extrudedHeight };
    } else if (kind === 'corridor') {
      let cp = this._normalizePositions(this.corridorPositionsData);
      cp = this._rotatePositions(cp);
      opts.corridor = { positions: cp, width: this.corridorWidth || 1, material: mat, outline: !!this._outlineEnabled, outlineColor: oc };
    } else if (kind === 'box') {
      opts.position = pos;
      opts.orientation = this._getOrientation(pos);
      opts.box = { dimensions: new Cesium.Cartesian3(this.dimX || 1, this.dimY || 1, this.dimZ || 1), material: mat };
    } else if (kind === 'cylinder') {
      opts.position = pos;
      opts.orientation = this._getOrientation(pos);
      const r = this.radiusValue !== undefined ? this.radiusValue : 1;
      const tr = this.topRadiusValue !== undefined ? this.topRadiusValue : r;
      const br = this.bottomRadiusValue !== undefined ? this.bottomRadiusValue : r;
      opts.cylinder = { length: this.lengthValue || 1, topRadius: tr, bottomRadius: br, material: mat, outline: !!this._outlineEnabled, outlineColor: oc };
    } else if (kind === 'cone') {
      opts.position = pos;
      opts.orientation = this._getOrientation(pos);
      const tr = this.topRadiusValue !== undefined ? this.topRadiusValue : 0;
      const br = this.bottomRadiusValue !== undefined ? this.bottomRadiusValue : 1;
      opts.cylinder = { length: this.lengthValue || 1, topRadius: tr, bottomRadius: br, material: mat, outline: !!this._outlineEnabled, outlineColor: oc };
    } else if (kind === 'wall') {
      const CesiumRef = Cesium;
      const posCb = new CesiumRef.CallbackProperty(() => {
        let wp = this._normalizePositions(this.wallPositionsData, true);
        wp = this._rotatePositions(wp);
        return wp;
      }, false);
      opts.wall = { positions: posCb, material: mat };
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
    this._updateEntityPosition();
    const kind = (this.kind || '').toLowerCase();
    const mat = this._resolveMaterial(this._material);
    const oc = this._resolveColor(this._outlineColor);

    // Apply native orientation for supported 3D shapes
    const nativeOrientationShapes = ['box', 'cylinder', 'cone', 'ellipsoid', 'sphere'];
    const axis = (this.rotationAxis || 'Z').toUpperCase();
    const is3DRotation = (axis !== 'Z');
    
    // We treat circle/ellipse as 3D (Ellipsoid/Disk) if mode is 3d OR if 3D rotation is applied
    const is3dEllipsoid = ((this.modeDim === '3d' || is3DRotation) && (kind === 'circle' || kind === 'ellipse'));
    
    if (nativeOrientationShapes.includes(kind) || is3dEllipsoid) {
       if (this.position && this.position.length >= 2) {
          const center = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], this.position[2] || 0);
          const angle = this.rotationAngle || 0;
          let hpr;
          if (axis === 'X') {
             hpr = new Cesium.HeadingPitchRoll(0, 0, angle);
          } else if (axis === 'Y') {
             hpr = new Cesium.HeadingPitchRoll(0, -angle, 0);
          } else {
             hpr = new Cesium.HeadingPitchRoll(angle, 0, 0);
          }
          e.orientation = Cesium.Transforms.headingPitchRollQuaternion(center, hpr);
       }
    }

    // 3D circle/ellipse with sector -> polygon wedge; otherwise -> ellipsoid
    if (is3dEllipsoid) {
      const hr = this._getHeightReferenceEnum();
      const rx = kind === 'circle' ? (this.radiusValue || 1000) : (this.radiiX || this.semiMajorAxis || this.radiusValue || 1000);
      const ry = kind === 'circle' ? (this.radiusValue || 1000) : (this.radiiY || this.semiMinorAxis || this.radiusValue || 1000);
      let rz;
      if (this.modeDim === '3d') {
          rz = kind === 'circle' ? (this.radiusValue || 1000) : (this.radiiZ || this.radiusValue || Math.max(rx, ry, 1000));
      } else {
          rz = 0.1;
      }
      
      const hh = this._effectiveHeight();
      
      if (this.sectorVerticalAngle !== undefined || (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined)) {
        const minClock = this.sectorStartAngle || 0;
        const maxClock = (this.sectorStartAngle || 0) + (this.sectorSweepAngle || (2 * Math.PI));
        const maxCone = this.sectorVerticalAngle !== undefined ? this.sectorVerticalAngle : Math.PI;
         
         if (!e.ellipsoid) {
          e.ellipsoid = new Cesium.EllipsoidGraphics({
            radii: new Cesium.Cartesian3(rx, ry, rz),
            material: mat,
            fill: !!this.fill,
            outline: !!this._outlineEnabled,
            outlineColor: oc,
            heightReference: hr,
            minimumClock: minClock,
            maximumClock: maxClock,
            maximumCone: maxCone,
            minimumCone: 0
          });
          e.ellipse = undefined;
          e.polygon = undefined;
        } else {
          e.ellipsoid.radii = new Cesium.Cartesian3(rx, ry, rz);
          if (mat) e.ellipsoid.material = mat;
          e.ellipsoid.fill = !!this.fill;
          e.ellipsoid.outline = !!this._outlineEnabled;
          if (oc) e.ellipsoid.outlineColor = oc;
          if (this._outlineWidth !== undefined) e.ellipsoid.outlineWidth = this._outlineWidth;
          e.ellipsoid.heightReference = hr;
          e.ellipsoid.minimumClock = minClock;
          e.ellipsoid.maximumClock = maxClock;
          e.ellipsoid.maximumCone = maxCone;
          e.ellipsoid.minimumCone = 0;
        }
      } else {
        if (!e.ellipsoid) {
          e.ellipsoid = new Cesium.EllipsoidGraphics({
            radii: new Cesium.Cartesian3(rx, ry, rz),
            material: mat,
            fill: !!this.fill,
            outline: !!this._outlineEnabled,
            outlineColor: oc,
            heightReference: hr
          });
          e.ellipse = undefined;
          e.polygon = undefined;
        } else {
          e.ellipsoid.radii = new Cesium.Cartesian3(rx, ry, rz);
          if (mat) e.ellipsoid.material = mat;
          e.ellipsoid.fill = !!this.fill;
          e.ellipsoid.outline = !!this._outlineEnabled;
          if (oc) e.ellipsoid.outlineColor = oc;
          if (this._outlineWidth !== undefined) e.ellipsoid.outlineWidth = this._outlineWidth;
          e.ellipsoid.heightReference = hr;
          e.ellipsoid.minimumClock = 0;
          e.ellipsoid.maximumClock = 2 * Math.PI;
          e.ellipsoid.minimumCone = 0;
          e.ellipsoid.maximumCone = Math.PI;
        }
      }
      if (this.viewer && this.viewer.scene) this.viewer.scene.requestRender();
      return;
    }
    // --- Circle/Ellipse: sector -> polygon conversion on-the-fly (2D only)
    const isCircleOrEllipse = (kind === 'circle' || kind === 'ellipse') && this.modeDim !== '3d';
    const hasSector = isCircleOrEllipse && (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined);
    if (hasSector) {
      const a = kind === 'circle' ? (this.radiusValue || 1000) : (this.semiMajorAxis || this.radiusValue || 1000);
      const b = kind === 'circle' ? (this.radiusValue || 1000) : (this.semiMinorAxis || this.radiusValue || 1000);
      const hh = this._effectiveHeight();
      let pts = this._computeSectorPositions(this.position, a, b, 0, this.sectorStartAngle, this.sectorSweepAngle, this.sectorSamples, hh);
      pts = this._rotatePositions(pts);
      if (!e.polygon) {
        e.polygon = new Cesium.PolygonGraphics({
          hierarchy: pts,
          material: mat,
          outline: !!this._outlineEnabled,
          outlineColor: oc,
          extrudedHeight: this.extrudedHeight,
          height: hh,
          heightReference: this._getHeightReferenceEnum()
        });
        e.ellipse = undefined;
      } else {
        e.polygon.hierarchy = pts;
        if (mat) e.polygon.material = mat;
        e.polygon.outline = !!this._outlineEnabled;
        if (oc) e.polygon.outlineColor = oc;
        if (this.extrudedHeight !== undefined) e.polygon.extrudedHeight = this.extrudedHeight;
        e.polygon.height = hh;
        e.polygon.heightReference = this._getHeightReferenceEnum();
      }
      // ensure render
      if (this.viewer && this.viewer.scene) this.viewer.scene.requestRender();
      return;
    }
    // --- Ellipse graphics updates when not sector
    if (e.ellipse) {
      if (this.semiMajorAxis) e.ellipse.semiMajorAxis = this.semiMajorAxis;
      if (this.semiMinorAxis) e.ellipse.semiMinorAxis = this.semiMinorAxis;
      if (this.extrudedHeight !== undefined) e.ellipse.extrudedHeight = this.extrudedHeight;
      if (this.rotationAngle !== undefined) e.ellipse.rotation = this.rotationAngle;
      if (mat) e.ellipse.material = mat;
      e.ellipse.fill = !!this.fill;
      e.ellipse.outline = !!this._outlineEnabled;
      if (oc) e.ellipse.outlineColor = oc;
      if (this._outlineWidth !== undefined) e.ellipse.outlineWidth = this._outlineWidth;
    }
    if (e.ellipsoid) {
      const rx = this.radiiX || (kind === 'sphere' ? (this.radiusValue || 1000) : undefined);
      const ry = this.radiiY || (kind === 'sphere' ? (this.radiusValue || 1000) : undefined);
      const rz = this.radiiZ || (kind === 'sphere' ? (this.radiusValue || 1000) : undefined);
      if (rx && ry && rz) e.ellipsoid.radii = new Cesium.Cartesian3(rx, ry, rz);
      if (mat) e.ellipsoid.material = mat;
      e.ellipsoid.outline = !!this._outlineEnabled;
      if (oc) e.ellipsoid.outlineColor = oc;
    }
    // Polygon updates (non-circle/ellipse sector usage)
    if (e.polygon) {
      if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined && (kind === 'circle' || kind === 'ellipse')) {
        const a = kind === 'circle' ? (this.radiusValue || 1000) : (this.semiMajorAxis || this.radiusValue || 1000);
        const b = kind === 'circle' ? (this.radiusValue || 1000) : (this.semiMinorAxis || this.radiusValue || 1000);
        const isRelative = this.heightReference === 'relativeToGround' || (this.heightOffset && this.heightOffset > 0);
        const hh = isRelative ? (this.heightOffset || 0) : (this.position[2] || 0);
        let pts = this._computeSectorPositions(this.position, a, b, 0, this.sectorStartAngle, this.sectorSweepAngle, this.sectorSamples, hh);
        e.polygon.hierarchy = this._rotatePositions(pts);
      } else if (this.polygonHierarchyData) {
        let h = this._normalizeHierarchy(this.polygonHierarchyData);
        // If it's simple positions, rotate them. If it's hierarchy, it's more complex.
        // For now support simple position array rotation or handle Hierarchy if needed.
        // _normalizeHierarchy returns either Cartesian3[] or PolygonHierarchy.
        if (Array.isArray(h)) {
           h = this._rotatePositions(h);
        } else if (h && h.positions) {
           h.positions = this._rotatePositions(h.positions);
           // Handle holes if needed?
        }
        e.polygon.hierarchy = h;
      }
      if (this.extrudedHeight !== undefined) e.polygon.extrudedHeight = this.extrudedHeight;
      if (mat) e.polygon.material = mat;
      e.polygon.outline = !!this._outlineEnabled;
      if (oc) e.polygon.outlineColor = oc;
      const hh2 = this._effectiveHeight();
      e.polygon.height = hh2;
      e.polygon.heightReference = this._getHeightReferenceEnum();
    }
    if (e.polyline) {
      if (this.polylinePositionsData) {
        let p = this._normalizePositions(this.polylinePositionsData);
        p = this._rotatePositions(p);
        e.polyline.positions = p;
      }
      if (this.polylineWidth) e.polyline.width = this.polylineWidth;
      if (mat) e.polyline.material = mat;
    }
    if (e.polylineVolume) {
      if (this.polylinePositionsData) e.polylineVolume.positions = this._normalizePositions(this.polylinePositionsData);
      if (this.volumeShapeData) e.polylineVolume.shape = this._normalizeVolumeShape(this.volumeShapeData);
      if (mat) e.polylineVolume.material = mat;
    }
    if (e.corridor) {
      if (this.corridorPositionsData) e.corridor.positions = this._normalizePositions(this.corridorPositionsData);
      if (this.corridorWidth) e.corridor.width = this.corridorWidth;
      if (mat) e.corridor.material = mat;
      e.corridor.outline = !!this._outlineEnabled;
      if (oc) e.corridor.outlineColor = oc;
    }
    if (e.rectangle) {
      if (this.rectangleCoordinates) e.rectangle.coordinates = this.rectangleCoordinates;
      if (this.extrudedHeight !== undefined) e.rectangle.extrudedHeight = this.extrudedHeight;
      if (mat) e.rectangle.material = mat;
      e.rectangle.outline = !!this._outlineEnabled;
      if (oc) e.rectangle.outlineColor = oc;
    }
    if (e.box) {
      const dx = this.dimX || 1, dy = this.dimY || 1, dz = this.dimZ || 1;
      e.box.dimensions = new Cesium.Cartesian3(dx, dy, dz);
      if (mat) e.box.material = mat;
    }
    if (e.cylinder) {
      if (this.lengthValue) e.cylinder.length = this.lengthValue;
      if (kind === 'cone') {
        const tr = this.topRadiusValue !== undefined ? this.topRadiusValue : 0;
        const br = this.bottomRadiusValue !== undefined ? this.bottomRadiusValue : 1;
        e.cylinder.topRadius = tr;
        e.cylinder.bottomRadius = br;
      } else {
        const r = this.radiusValue !== undefined ? this.radiusValue : 1;
        const tr = this.topRadiusValue !== undefined ? this.topRadiusValue : r;
        const br = this.bottomRadiusValue !== undefined ? this.bottomRadiusValue : r;
        e.cylinder.topRadius = tr;
        e.cylinder.bottomRadius = br;
      }
      if (mat) e.cylinder.material = mat;
      e.cylinder.outline = !!this._outlineEnabled;
      if (oc) e.cylinder.outlineColor = oc;
    }
    if (e.wall) {
      if (this.wallPositionsData) {
        const CesiumRef = Cesium;
        e.wall.positions = new CesiumRef.CallbackProperty(() => {
          let wp = this._normalizePositions(this.wallPositionsData, true);
          wp = this._rotatePositions(wp);
          return wp;
        }, false);
      }
      if (mat) e.wall.material = mat;
    }
  }

  _rotatePositions(positions) {
    if (!positions || positions.length === 0) return positions;
    if (!this.rotationAngle || this.rotationAngle === 0) return positions;
    // We need a center to rotate around. If this.position is set, use it.
    if (!this.position || this.position.length < 2) return positions;

    const Cesium = this.cesium;
    const centerFixed = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], this.position[2] || 0);
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerFixed);
    const inverseModelMatrix = Cesium.Matrix4.inverse(modelMatrix, new Cesium.Matrix4());

    let rotationMatrix;
    const axis = (this.rotationAxis || 'Z').toUpperCase();
    const angle = this.rotationAngle;

    if (axis === 'X') {
      rotationMatrix = Cesium.Matrix3.fromRotationX(angle);
    } else if (axis === 'Y') {
      rotationMatrix = Cesium.Matrix3.fromRotationY(angle);
    } else {
      rotationMatrix = Cesium.Matrix3.fromRotationZ(angle);
    }

    const rotatedPositions = [];
    const scratchLocal = new Cesium.Cartesian3();
    const scratchRotatedLocal = new Cesium.Cartesian3();

    for (const p of positions) {
      // To local
      Cesium.Matrix4.multiplyByPoint(inverseModelMatrix, p, scratchLocal);
      // Rotate
      Cesium.Matrix3.multiplyByVector(rotationMatrix, scratchLocal, scratchRotatedLocal);
      // To fixed
      const finalP = Cesium.Matrix4.multiplyByPoint(modelMatrix, scratchRotatedLocal, new Cesium.Cartesian3());
      rotatedPositions.push(finalP);
    }
    return rotatedPositions;
  }

  _getOrientation(pos) {
    const Cesium = this.cesium;
    const axis = (this.rotationAxis || 'Z').toUpperCase();
    const angle = this.rotationAngle || 0;
    // if (angle === 0) return undefined; // Let's return undefined if no rotation? 
    // Actually Cesium entity.orientation default is undefined (aligned with frame).
    // If we have rotation, we return quaternion.
    if (pos) {
        let hpr;
        if (axis === 'X') hpr = new Cesium.HeadingPitchRoll(0, 0, angle);
        else if (axis === 'Y') hpr = new Cesium.HeadingPitchRoll(0, -angle, 0);
        else hpr = new Cesium.HeadingPitchRoll(angle, 0, 0);
        return Cesium.Transforms.headingPitchRollQuaternion(pos, hpr);
    }
    return undefined;
  }

  _normalizePositions(p, withHeights) {
    const Cesium = this.cesium;
    if (!p) return [];
    if (Array.isArray(p)) {
      if (p.length === 0) return [];
      if (p[0] instanceof Cesium.Cartesian3) return p.map(v => new Cesium.Cartesian3(v.x, v.y, v.z));
      if (typeof p[0] === 'object' && p[0] !== null && 'x' in p[0] && 'y' in p[0] && 'z' in p[0]) {
        return p.map(v => new Cesium.Cartesian3(v.x, v.y, v.z));
      }
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
      if (h[0] instanceof Cesium.Cartesian3) return h.map(v => new Cesium.Cartesian3(v.x, v.y, v.z));
      if (typeof h[0] === 'object' && h[0] !== null && 'x' in h[0] && 'y' in h[0] && 'z' in h[0]) {
        return h.map(v => new Cesium.Cartesian3(v.x, v.y, v.z));
      }
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
    if (typeof h === 'object' && h !== null) {
      const positions = this._normalizePositions(h.positions, true);
      let holes = [];
      if (Array.isArray(h.holes) && h.holes.length > 0) {
        holes = h.holes.map(hole => {
          if (Array.isArray(hole)) {
            return new Cesium.PolygonHierarchy(this._normalizeHierarchy(hole));
          } else if (typeof hole === 'object' && hole !== null) {
            const hp = this._normalizePositions(hole.positions, true);
            const hh = Array.isArray(hole.holes) ? hole.holes.map(inner => new Cesium.PolygonHierarchy(this._normalizeHierarchy(inner))) : [];
            return new Cesium.PolygonHierarchy(hp, hh);
          }
          return hole;
        });
      }
      try {
        return new Cesium.PolygonHierarchy(positions, holes);
      } catch (_) {
        return positions;
      }
    }
    return h;
  }

  _normalizeVolumeShape(s) {
    const Cesium = this.cesium;
    if (!s) return [];
    if (Array.isArray(s)) {
      if (s.length === 0) return [];
      if (s[0] instanceof Cesium.Cartesian2) {
        // 重新拷贝为全新的 Cartesian2，避免代理/不可克隆对象
        return s.map(p => new Cesium.Cartesian2(p.x, p.y));
      }
      if (typeof s[0] === 'object' && s[0] !== null && 'x' in s[0] && 'y' in s[0]) {
        return s.map(v => new Cesium.Cartesian2(v.x, v.y));
      }
      // 支持 [[x,y], ...] 的写法
      if (Array.isArray(s[0]) && s[0].length >= 2) {
        return s.map(v => new Cesium.Cartesian2(v[0], v[1]));
      }
    }
    return s;
  }
  _normalizeRectangle(rect) {
    const Cesium = this.cesium;
    if (!rect) return rect;
    if (rect instanceof Cesium.Rectangle) {
      return new Cesium.Rectangle(rect.west, rect.south, rect.east, rect.north);
    }
    if (Array.isArray(rect) && rect.length === 4) {
      return Cesium.Rectangle.fromDegrees(rect[0], rect[1], rect[2], rect[3]);
    }
    if (typeof rect === 'object' && rect !== null && 'west' in rect && 'south' in rect && 'east' in rect && 'north' in rect) {
      return new Cesium.Rectangle(rect.west, rect.south, rect.east, rect.north);
    }
    return rect;
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

  _resolveMaterial(m) {
    if (typeof m === 'string' && m.length > 0) {
      let c = this.cesium.Color.fromCssColorString(m);
      if (this.materialOpacity !== undefined) {
        c = new this.cesium.Color(c.red, c.green, c.blue, this.materialOpacity);
      }
      return c;
    }
    if (m && m.red !== undefined && m.green !== undefined && m.blue !== undefined && m.alpha !== undefined) {
      if (this.materialOpacity !== undefined) {
        return new this.cesium.Color(m.red, m.green, m.blue, this.materialOpacity);
      }
    }
    return m;
  }

  _resolveColor(c) {
    if (typeof c === 'string' && c.length > 0) {
      return this.cesium.Color.fromCssColorString(c);
    }
    return c;
  }
  _effectiveHeight() {
    const base = this.position && this.position.length >= 3 ? (this.position[2] || 0) : 0;
    const offset = this.heightOffset || 0;
    if (this.heightReference === 'relativeToGround') {
      return offset;
    }
    return base + offset;
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

  _getGroundHeight(lng, lat) {
    try {
      const Cesium = this.cesium;
      const carto = Cesium.Cartographic.fromDegrees(lng, lat);
      const globe = this.viewer && this.viewer.scene ? this.viewer.scene.globe : null;
      if (globe && typeof globe.getHeight === 'function') {
        const h = globe.getHeight(carto);
        return (h !== undefined && h !== null) ? h : 0;
      }
    } catch (_) {}
    return 0;
  }

  _updateEntityPosition() {
    if (!this.entity) return;
    const Cesium = this.cesium;
    const lng = this.position[0];
    const lat = this.position[1];
    const isRelative = this.heightReference === 'relativeToGround';
    const isClamp = this.heightReference === 'clampToGround';
    let terrainH = this._getGroundHeight(lng, lat);
    let h;
    if (isClamp) {
      h = terrainH;
    } else if (isRelative) {
      h = terrainH + (this.heightOffset || 0);
    } else {
      h = (this.position[2] || 0) + (this.heightOffset || 0);
    }
    this.entity.position = Cesium.Cartesian3.fromDegrees(lng, lat, h);
    this._updateHeightReference();
    // If terrain height not ready yet, try sampling most detailed asynchronously
    if ((isClamp || isRelative) && terrainH === 0 && Cesium.sampleTerrainMostDetailed && this.viewer && this.viewer.terrainProvider) {
      const carto = Cesium.Cartographic.fromDegrees(lng, lat);
      Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, [carto]).then((res) => {
        const sampled = res && res[0] ? res[0].height : undefined;
        if (sampled !== undefined && sampled !== null) {
          terrainH = sampled;
          const newH = isClamp ? terrainH : (terrainH + (this.heightOffset || 0));
          this.entity.position = Cesium.Cartesian3.fromDegrees(lng, lat, newH);
          this._updateHeightReference();
          if (this.viewer && this.viewer.scene) this.viewer.scene.requestRender();
        }
      }).catch(() => {});
    }
  }

  saveState() {
    this._savedState = {
      radiusValue: this.radiusValue,
      semiMajorAxis: this.semiMajorAxis,
      semiMinorAxis: this.semiMinorAxis,
      radiiX: this.radiiX,
      radiiY: this.radiiY,
      radiiZ: this.radiiZ,
      rotationAngle: this.rotationAngle,
      rotationAxis: this.rotationAxis,
      heightReference: this.heightReference,
      heightOffset: this.heightOffset,
      sectorStartAngle: this.sectorStartAngle,
      sectorSweepAngle: this.sectorSweepAngle,
      sectorVerticalAngle: this.sectorVerticalAngle,
      extrudedHeight: this.extrudedHeight,
      fill: this.fill,
      _outlineEnabled: this._outlineEnabled,
      _outlineWidth: this._outlineWidth,
      materialOpacity: this.materialOpacity
    };
    return this;
  }

  restoreState() {
    const s = this._savedState || {};
    if (s.radiusValue !== undefined) this.radiusValue = s.radiusValue;
    if (s.semiMajorAxis !== undefined) this.semiMajorAxis = s.semiMajorAxis;
    if (s.semiMinorAxis !== undefined) this.semiMinorAxis = s.semiMinorAxis;
    if (s.radiiX !== undefined) this.radiiX = s.radiiX;
    if (s.radiiY !== undefined) this.radiiY = s.radiiY;
    if (s.radiiZ !== undefined) this.radiiZ = s.radiiZ;
    if (s.rotationAngle !== undefined) this.rotationAngle = s.rotationAngle;
    if (s.rotationAxis !== undefined) this.rotationAxis = s.rotationAxis;
    if (s.heightReference !== undefined) this.heightReference = s.heightReference;
    if (s.heightOffset !== undefined) this.heightOffset = s.heightOffset;
    if (s.sectorStartAngle !== undefined) this.sectorStartAngle = s.sectorStartAngle;
    if (s.sectorSweepAngle !== undefined) this.sectorSweepAngle = s.sectorSweepAngle;
    if (s.sectorVerticalAngle !== undefined) this.sectorVerticalAngle = s.sectorVerticalAngle;
    if (s.extrudedHeight !== undefined) this.extrudedHeight = s.extrudedHeight;
    if (s.fill !== undefined) this.fill = s.fill;
    if (s._outlineEnabled !== undefined) this._outlineEnabled = s._outlineEnabled;
    if (s._outlineWidth !== undefined) this._outlineWidth = s._outlineWidth;
    if (s.materialOpacity !== undefined) this.materialOpacity = s.materialOpacity;
    this._applySmartGeometry();
    return this;
  }
}
