import { GeometryEntity } from './GeometryEntity.js';
import { deepClone } from '../utils/deepClone.js';

export class SmartGeometryEntity extends GeometryEntity {
  static Types = {};

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
    this._spinAngle = 0;
    this._spinAxis = 'Z';
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
    this.rotationAxis = o.rotationAxis ?? this._computeDefaultAxis();
    this._rotationAxisLine = o.rotationAxisLine;
    this.sectorStartAngle = o.sectorStartAngle;
    this.sectorSweepAngle = o.sectorSweepAngle;
    this.sectorVerticalAngle = o.sectorVerticalAngle;
    this.sectorSamples = o.sectorSamples || 64;
  }

  getCollection() {
    return this.viewer.entities;
  }

  saveState() {
    const props = [
      'kind', 'modeDim', '_material', 'materialOpacity', 'fill', 
      '_outlineEnabled', '_outlineColor', '_outlineWidth', 
      'rotationAngle', 'rotationAxis', '_rotationAxisLine', '_spinAngle', '_spinAxis', 'extrudedHeight', 
      'radiusValue', 'semiMajorAxis', 'semiMinorAxis', 
      'radiiX', 'radiiY', 'radiiZ', 
      'lengthValue', 'topRadiusValue', 'bottomRadiusValue', 
      'dimX', 'dimY', 'dimZ', 
      'polylinePositionsData', 'polylineWidth', 
      'volumeShapeData', 'corridorPositionsData', 'corridorWidth', 
      'rectangleCoordinates', 'polygonHierarchyData', 'wallPositionsData', 
      'sectorStartAngle', 'sectorSweepAngle', 'sectorVerticalAngle', 'sectorSamples',
      'heightOffset', 'heightReference',
      'group', 'name', 'description', 'minDisplayHeight', 'maxDisplayHeight',
      'position', 'scale', 'pixelOffset', 'eyeOffset', 'horizontalOrigin', 'verticalOrigin',
      'distanceDisplayCondition', 'scaleByDistance', 'translucencyByDistance', 'pixelOffsetScaleByDistance', 'disableDepthTestDistance'
    ];
    
    this._savedState = {};
    props.forEach(k => {
        if (this[k] !== undefined) {
            const v = this[k];
            if (Array.isArray(v)) this._savedState[k] = [...v];
            else if (v && typeof v === 'object' && v.constructor === Object) this._savedState[k] = deepClone(v);
            else this._savedState[k] = v;
        }
    });
    return this;
  }

  restoreState() {
    if (!this._savedState) return this;
    Object.keys(this._savedState).forEach(k => {
        this[k] = this._savedState[k];
    });
    return this;
  }

  copyFrom(other) {
    if (!other) return;
    // Copy all properties that are not functions or internal private fields if needed
    // We mainly care about the configuration properties
    const keys = [
      'kind', 'modeDim', '_material', 'materialOpacity', 'fill', 
      '_outlineEnabled', '_outlineColor', '_outlineWidth', 
      'rotationAngle', 'rotationAxis', '_rotationAxisLine', '_spinAngle', '_spinAxis', 'extrudedHeight', 
      'radiusValue', 'semiMajorAxis', 'semiMinorAxis', 
      'radiiX', 'radiiY', 'radiiZ', 
      'lengthValue', 'topRadiusValue', 'bottomRadiusValue', 
      'dimX', 'dimY', 'dimZ', 
      'polylinePositionsData', 'polylineWidth', 
      'volumeShapeData', 'corridorPositionsData', 'corridorWidth', 
      'rectangleCoordinates', 'polygonHierarchyData', 'wallPositionsData', 
      'sectorStartAngle', 'sectorSweepAngle', 'sectorVerticalAngle', 'sectorSamples',
      'heightOffset', 'heightReference',
      // BaseEntity properties
      'group', 'name', 'description', 'minDisplayHeight', 'maxDisplayHeight'
    ];
    keys.forEach(k => {
      if (other[k] !== undefined) this[k] = other[k];
    });
    // Copy options too
    if (other.options) this.options = deepClone(other.options);
    // Copy position
    if (other.position) this.position = [...other.position];
    // Copy animation context
    if (other._animContext) this._animContext = deepClone(other._animContext);
  }

  shape(k) { 
    this.kind = k; 
    
    // Check if we need to switch class
    if (SmartGeometryEntity.Types[k]) {
       const TargetClass = SmartGeometryEntity.Types[k];
       // If current instance is already of TargetClass, do nothing
       if (!(this instanceof TargetClass)) {
          const newInstance = new TargetClass(this.id, this.viewer, this.cesium, this.options);
          newInstance.copyFrom(this);
          // Return new instance
          // Note: The user reference 'const a = ...' won't change, 
          // so this only works if chained: cf.geometry().shape('circle').add()
          return newInstance;
       }
    }
    
    this.trigger('change', this); 
    return this; 
  }
  mode(m) { this.modeDim = m; this.trigger('change', this); return this; }
  mode2d() { this.modeDim = '2d'; this.trigger('change', this); return this; }
  mode3d() { this.modeDim = '3d'; this.trigger('change', this); return this; }
  radius(r) { 
    const r2 = arguments.length > 1 ? arguments[1] : undefined;
    if (Array.isArray(r) && r.length >= 2) {
      this.semiMajorAxis = r[0];
      this.semiMinorAxis = r[1];
      this.radiiX = r[0];
      this.radiiY = r[1];
    } else if (typeof r === 'number' && typeof r2 === 'number') {
      this.semiMajorAxis = r;
      this.semiMinorAxis = r2;
      this.radiiX = r;
      this.radiiY = r2;
    } else if (typeof r === 'object' && r !== null) {
      const a = r.x ?? r.major ?? r.a;
      const b = r.y ?? r.minor ?? r.b;
      if (typeof a === 'number' && typeof b === 'number') {
        this.semiMajorAxis = a;
        this.semiMinorAxis = b;
        this.radiiX = a;
        this.radiiY = b;
      } else if (typeof r.z === 'number') {
        this.radiusValue = r.z;
      } else {
        this.radiusValue = r.value ?? this.radiusValue;
      }
    } else {
      this.radiusValue = r;
    }
    this.trigger('change', this); 
    return this; 
  }
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
  spinDeg(deg, axis = 'Z') { 
    this._spinAngle = (deg || 0) * Math.PI / 180; 
    this._spinAxis = axis.toUpperCase(); 
    
    if (this._animPending) {
      this._startGeometryAnimation();
    }

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
  dim(x, y, z) { return this.dimensions(x, y, z); }
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
    if (this.rotationAxis !== undefined) startState.rotationAxis = this.rotationAxis;
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
    
    // If there are no targets (start equals end), skip starting animation to avoid side effects
    if (Object.keys(targets).length === 0) {
        this._animPending = false;
        return this;
    }
    
    
    
    this._savedState = deepClone(startState);
    this.restoreState(0);
    
    let startTime = null;
    const duration = this._animContext.duration;
    const isLoop = this._animContext.loop;
    const isRepeat = this._animContext.repeat;
    const easing = this._animContext.easing || 'easeInOut';
    const legDuration = isLoop ? (duration / 2) : duration;
    
    const targetKeys = Object.keys(targets);
    const current = {};

    const animate = (now) => {
        if (!this._animContext) return;

        if (!startTime) startTime = now;

        const elapsed = now - startTime;
        let forward = true;
        let linearT;
        
        if (isLoop) {
            const cycles = Math.floor(elapsed / legDuration);
            forward = cycles % 2 === 0;
            linearT = (elapsed % legDuration) / legDuration;
        } else if (isRepeat) {
            forward = true;
            linearT = (elapsed % legDuration) / legDuration;
        } else {
            linearT = Math.min(elapsed / legDuration, 1);
        }
        this._animContext.direction = forward ? 1 : -1;
        
        let t = linearT;
        if (easing === 'easeInOut') {
            t = linearT < 0.5 ? 2 * linearT * linearT : -1 + (4 - 2 * linearT) * linearT;
        } else if (easing === 'linear') {
            t = linearT;
        } else if (easing === 'easeIn') {
            t = linearT * linearT;
        } else if (easing === 'easeOut') {
            t = linearT * (2 - linearT);
        }
        
        const cycles = Math.floor(elapsed / legDuration);
        targetKeys.forEach(key => {
            const s = startState[key];
            const e = targets[key];
            
            if (typeof s === 'number' && typeof e === 'number') {
                 if (isRepeat && (key === 'rotationAngle' || key === '_spinAngle')) {
                     current[key] = s + (e - s) * (cycles + t);
                 } else if (forward) {
                     current[key] = s + (e - s) * t;
                 } else {
                     current[key] = e + (s - e) * t;
                 }
            } else if (Array.isArray(s) && Array.isArray(e) && s.length === e.length && key === 'position') {
                 current[key] = s.map((v, i) => {
                     if (typeof v === 'number' && typeof e[i] === 'number') {
                         return forward ? (v + (e[i] - v) * t) : (e[i] + (v - e[i]) * t);
                     }
                     return forward ? e[i] : v;
                 });
            } else if (Array.isArray(s) && Array.isArray(e) && s.length === e.length && key === 'wallPositionsData') {
                 current[key] = s.map((sv, i) => {
                     const ev = e[i];
                     if (Array.isArray(sv) && Array.isArray(ev) && sv.length === ev.length) {
                         return sv.map((v, j) => {
                             const ej = ev[j];
                             if (typeof v === 'number' && typeof ej === 'number') {
                                 return forward ? (v + (ej - v) * t) : (ej + (v - ej) * t);
                             }
                             return forward ? ej : v;
                         });
                     }
                     return forward ? ev : sv;
                 });
            } else if (Array.isArray(s) && Array.isArray(e) && s.length === e.length && key === 'corridorPositionsData') {
                 // Support both nested [[lng,lat,(h)], ...] and flat [lng,lat,lng,lat,...] arrays
                 if (typeof s[0] === 'number' && typeof e[0] === 'number') {
                     current[key] = s.map((v, i) => {
                         const ei = e[i];
                         if (typeof v === 'number' && typeof ei === 'number') {
                             return forward ? (v + (ei - v) * t) : (ei + (v - ei) * t);
                         }
                         return forward ? ei : v;
                     });
                 } else {
                     current[key] = s.map((sv, i) => {
                         const ev = e[i];
                         if (Array.isArray(sv) && Array.isArray(ev) && sv.length === ev.length) {
                             return sv.map((v, j) => {
                                 const ej = ev[j];
                                 if (typeof v === 'number' && typeof ej === 'number') {
                                     return forward ? (v + (ej - v) * t) : (ej + (v - ej) * t);
                                 }
                                 return forward ? ej : v;
                             });
                         }
                         return forward ? ev : sv;
                     });
                 }
            } else if (Array.isArray(s) && Array.isArray(e) && s.length === e.length && key === 'rectangleCoordinates') {
                 current[key] = s.map((v, i) => {
                     const ei = e[i];
                     if (typeof v === 'number' && typeof ei === 'number') {
                         return forward ? (v + (ei - v) * t) : (ei + (v - ei) * t);
                     }
                     return forward ? ei : v;
                 });
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
        
        

        if ((linearT < 1 || isLoop || isRepeat) && this._animPending === false) {
             this._animFrame = requestAnimationFrame(animate);
        } else {
             this._animFrame = null;
             this._inUpdateAnimation = false;
             if (!isLoop && !isRepeat) {
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
    
    
    // rotationAxisLine logic moved to _updateRotationAxisLine and called via _applySmartGeometry

    
    // Delegate to specialized sub-class if registered (e.g., CircleEntity)
    if (SmartGeometryEntity.Types[kind]) {
      const TargetClass = SmartGeometryEntity.Types[kind];
      try {
        const temp = new TargetClass(this.id, this.viewer, this.cesium, this.options);
        temp.copyFrom(this);
        return temp._createEntity();
      } catch (_) {
        // Fallback to base logic if delegation fails
      }
    }
    
    if (kind === 'polygon') {
      let ph = this._normalizeHierarchy(this.polygonHierarchyData);
      if (Array.isArray(ph)) ph = this._rotatePositions(ph);
      else if (ph && ph.positions) ph.positions = this._rotatePositions(ph.positions);
      opts.polygon = { hierarchy: ph, material: mat, outline: !!this._outlineEnabled, outlineColor: oc, extrudedHeight: this.extrudedHeight };
    } else if (kind === 'cylinder') {
      opts.position = pos;
      opts.orientation = this._getDynamicOrientation(pos);
      const r = this.radiusValue !== undefined ? this.radiusValue : 1;
      const tr = this.topRadiusValue !== undefined ? this.topRadiusValue : r;
      const br = this.bottomRadiusValue !== undefined ? this.bottomRadiusValue : r;
      opts.cylinder = { length: this.lengthValue || 1, topRadius: tr, bottomRadius: br, material: mat, outline: !!this._outlineEnabled, outlineColor: oc };
    } else if (kind === 'cone') {
      opts.position = pos;
      opts.orientation = this._getDynamicOrientation(pos);
      const tr = this.topRadiusValue !== undefined ? this.topRadiusValue : 0;
      const br = this.bottomRadiusValue !== undefined ? this.bottomRadiusValue : 1;
      opts.cylinder = { length: this.lengthValue || 1, topRadius: tr, bottomRadius: br, material: mat, outline: !!this._outlineEnabled, outlineColor: oc };
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

  _computeDefaultAxis() {
    return 'Z';
  }

  _updateDebugAxes() {
    const Cesium = this.cesium;
    const coll = this.viewer && this.viewer.entities;
    if (!coll) {
        console.warn('[SmartGeometryEntity] No entity collection found for debug axes');
        return;
    }

    console.log('[SmartGeometryEntity] Updating Debug Axes for', this.id);

    // We need 3 lines: X (Red), Y (Green), Z (Blue)
    const axes = [
        { id: `${this.id}__debugAxisX`, color: Cesium.Color.RED, vector: new Cesium.Cartesian3(1, 0, 0) },
        { id: `${this.id}__debugAxisY`, color: Cesium.Color.GREEN, vector: new Cesium.Cartesian3(0, 1, 0) },
        { id: `${this.id}__debugAxisZ`, color: Cesium.Color.BLUE, vector: new Cesium.Cartesian3(0, 0, 1) }
    ];

    // Define the callback function generator
    const createUpdateCallback = (localVector, axisName) => (time) => {
        if (!this.position || this.position.length < 2) return [];
        
        let center;
        if (this.entity && this.entity.position) {
           center = this.entity.position.getValue(time);
        }
        if (!center) {
           const lng = this.position[0];
           const lat = this.position[1];
           const h = (this.position[2] || 0) + (this.heightOffset || 0);
           center = Cesium.Cartesian3.fromDegrees(lng, lat, h);
        }

        // Debug log once per 60 frames (approx)
        if (Math.random() < 0.01) {
            // console.log(`[DebugAxis ${axisName}] Center:`, center);
        }
        
        // 1. Get ENU frame (Fixed Frame)
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const enuRot = Cesium.Matrix4.getMatrix3(enu, new Cesium.Matrix3());
        
        // 2. User requested: X/Y parallel to ground, Z perpendicular to ground.
        // This corresponds to the ENU frame itself.
        // We do NOT apply the entity's rotation to these axes, 
        // because the user wants to see the reference frame, not the rotated local frame.
        const finalRot = enuRot;

        // 3. Calculate Direction
        const dir = Cesium.Matrix3.multiplyByVector(finalRot, localVector, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(dir, dir);

        // 4. Length (dynamic based on radius)
        const len = Math.max(
          (this.semiMajorAxis || this.radiusValue || 1000) || 1000, 
          (this.semiMinorAxis || this.radiusValue || 1000) || 1000
        ) * 1.5;

        // Draw line from Center to Center + Vector * Length
        // We use Center as start point to visualize the origin clearly
        const end = Cesium.Cartesian3.add(center, Cesium.Cartesian3.multiplyByScalar(dir, len, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        return [center, end];
    };

    axes.forEach(axisDef => {
        let axisEntity = coll.getById(axisDef.id);
        const cb = new Cesium.CallbackProperty(createUpdateCallback(axisDef.vector, axisDef.id), false);
        
        if (!axisEntity) {
            coll.add({
                id: axisDef.id,
                polyline: {
                    positions: cb,
                    width: 5,
                    material: axisDef.color,
                    clampToGround: false,
                    depthFailMaterial: axisDef.color // Make sure it's visible even if occluded by terrain
                }
            });
        } else {
            axisEntity.polyline.positions = cb;
            axisEntity.polyline.material = axisDef.color;
            axisEntity.polyline.clampToGround = false;
            axisEntity.polyline.depthFailMaterial = axisDef.color;
        }
    });
  }

  _applySmartGeometry() {
    const Cesium = this.cesium;
    const e = this.entity;
    if (!e) return;
    this._updateEntityPosition();
    this._updateDebugAxes();
    const kind = (this.kind || '').toLowerCase();
    const mat = this._resolveMaterial(this._material);
    const oc = this._resolveColor(this._outlineColor);
    
    // Delegate updates to specialized sub-class if registered (e.g., CircleEntity)
    if (SmartGeometryEntity.Types[kind]) {
      const TargetClass = SmartGeometryEntity.Types[kind];
      // Prevent infinite recursion if we are already in the target class
      if (!(this instanceof TargetClass)) {
        try {
            const temp = new TargetClass(this.id, this.viewer, this.cesium, this.options);
            temp.copyFrom(this);
            // We need to pass the real entity to the temp wrapper so it can operate on it
            temp.entity = this.entity; 
            temp._applySmartGeometry();
            return;
        } catch (err) {
            console.error('[SmartGeometryEntity] Delegation failed:', err);
        }
      }
    }

    // Apply native orientation for supported 3D shapes
    const nativeOrientationShapes = ['box', 'cylinder', 'cone'];
    if (nativeOrientationShapes.includes(kind)) {
       if (this.position && this.position.length >= 2) {
          // Optimization: avoid re-creating CallbackProperty if already set
          if (!e.orientation || !(e.orientation instanceof Cesium.CallbackProperty)) {
              const center = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], this.position[2] || 0);
              e.orientation = this._getDynamicOrientation(center);
          }
       }
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
      if (this.rotationAngle && this.rotationAngle !== 0) {
          e.polygon.perPositionHeight = true;
          // Avoid conflict with height
          e.polygon.heightReference = Cesium.HeightReference.NONE;
          e.polygon.height = undefined;
      }
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
      if (this.rotationAngle && this.rotationAngle !== 0) {
          e.polygon.perPositionHeight = true;
          // Avoid conflict with height
          e.polygon.heightReference = Cesium.HeightReference.NONE;
          e.polygon.height = undefined;
      }
    }
    if (this.extrudedHeight !== undefined) e.polygon.extrudedHeight = this.extrudedHeight;
      if (mat) e.polygon.material = mat;
      e.polygon.outline = !!this._outlineEnabled;
      if (oc) e.polygon.outlineColor = oc;
      const hh2 = this._effectiveHeight();
      e.polygon.height = hh2;
      e.polygon.heightReference = this._getHeightReferenceEnum();
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
    
    if (e.ellipsoid) {
       const a = this.semiMajorAxis || this.radiusValue || 1000;
       const b = this.semiMinorAxis || this.radiusValue || 1000;
       const c = (this.modeDim === '3d' ? Math.max(a, b) : 0.1);
       e.ellipsoid.radii = new Cesium.Cartesian3(a, b, c);
       
       if (mat) e.ellipsoid.material = mat;
       e.ellipsoid.outline = !!this._outlineEnabled;
       if (oc) e.ellipsoid.outlineColor = oc;
       
       // Handle sector updates
       if (this.sectorStartAngle !== undefined || this.sectorSweepAngle !== undefined || this.sectorVerticalAngle !== undefined) {
           const axis = (this.rotationAxis || 'X').toUpperCase(); 
           const sectorOffset = (axis === 'Y') ? Math.PI / 2 : 0;
           const baseStart = this.sectorStartAngle || 0;
           const minClock = baseStart + sectorOffset;
           const maxClock = baseStart + (this.sectorSweepAngle || (2 * Math.PI)) + sectorOffset;
           
           e.ellipsoid.minimumClock = minClock;
           e.ellipsoid.maximumClock = maxClock;
           if (this.sectorVerticalAngle !== undefined) {
               e.ellipsoid.maximumCone = this.sectorVerticalAngle;
           }
       }
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

  _getDynamicOrientation(pos) {
    const Cesium = this.cesium;

    return new Cesium.CallbackProperty(() => {
      // 1️⃣ ENU 基准
      const enuMat = Cesium.Transforms.eastNorthUpToFixedFrame(pos);
      const enuRot = Cesium.Matrix4.getMatrix3(enuMat, new Cesium.Matrix3());
      const qENU = Cesium.Quaternion.fromRotationMatrix(enuRot);

      // 2️⃣ Base Rotation（姿态）
      let qBase = Cesium.Quaternion.IDENTITY;
      if (this.rotationAngle) {
        qBase = this._axisAngleToQuat(this.rotationAxis, this.rotationAngle);
      }

      // 3️⃣ Spin Rotation（局部自转）
      let qSpin = Cesium.Quaternion.IDENTITY;
      if (this._spinAngle) {
        qSpin = this._axisAngleToQuat(this._spinAxis, this._spinAngle);
      }

      // ⚠️ 顺序极其重要
      // Local → Base → Spin → ENU
      const qLocal = Cesium.Quaternion.multiply(
        qSpin,
        qBase,
        new Cesium.Quaternion()
      );

      return Cesium.Quaternion.multiply(
        qENU,
        qLocal,
        new Cesium.Quaternion()
      );
    }, false);
  }

  _axisAngleToQuat(axis, angle) {
    const Cesium = this.cesium;
    switch ((axis || 'Z').toUpperCase()) {
      case 'X':
        return Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_X, angle);
      case 'Y':
        return Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Y, -angle);
      case 'Z':
      default:
        return Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, angle);
    }
  }

  _getOrientation(pos) {
    const Cesium = this.cesium;
    
    if (pos) {
        let qBase = Cesium.Quaternion.IDENTITY;
        let qAnim = Cesium.Quaternion.IDENTITY;

        // Explicit Spin (New API)
        if (this._spinAngle !== undefined) {
            // 1. Base Posture (Static) from rotationDeg
            const currentAxis = (this.rotationAxis || 'Z').toUpperCase();
            const currentAngle = this.rotationAngle || 0;
            
            if (currentAxis === 'X') qBase = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_X, currentAngle);
            else if (currentAxis === 'Y') qBase = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Y, -currentAngle);
            else qBase = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, currentAngle);

            // 2. Animation Spin (Dynamic) from spinDeg
            const spinAxis = (this._spinAxis || 'Z').toUpperCase();
            const spinAngle = this._spinAngle || 0;
            
            if (spinAxis === 'X') qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_X, spinAngle);
            else if (spinAxis === 'Y') qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Y, -spinAngle);
            else qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, spinAngle);
            
        } else {
            // Legacy Inference Logic
            // Current state (Animation target or Current static)
            const currentAxis = (this.rotationAxis || 'Z').toUpperCase();
            const currentAngle = this.rotationAngle || 0;
            
            // Determine Base State (Initial Posture)
            const s = this._savedState || {};
            const baseAxis = (s.rotationAxis !== undefined ? s.rotationAxis : (this.rotationAxis || 'Z')).toUpperCase();
            const baseAngle = (s.rotationAngle !== undefined ? (s.rotationAngle || 0) : 0);

            // 1. Calculate Base Quaternion (Posture)
            if (baseAxis === 'X') {
                 qBase = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_X, baseAngle);
            } else if (baseAxis === 'Y') {
                 qBase = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Y, -baseAngle);
            } else {
                 qBase = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, baseAngle);
            }

            // 2. Calculate Animation Quaternion (Spin/Heading)
            if (currentAxis === 'Z' && baseAxis !== 'Z') {
                 // We are spinning around Z, on top of a non-Z base.
                 let zAngle = currentAngle % (2 * Math.PI);
                 if (zAngle < 0) zAngle += (2 * Math.PI);
                 qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, zAngle);
            } else if (currentAxis !== 'Z' && currentAxis === baseAxis) {
                 // No complex composition, just single rotation
                 if (currentAxis === 'X') qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_X, currentAngle);
                 else if (currentAxis === 'Y') qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Y, -currentAngle);
                 else qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, currentAngle);
                 
                 qBase = Cesium.Quaternion.IDENTITY; 
            } else {
                 // Fallback
                 if (currentAxis === 'X') qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_X, currentAngle);
                 else if (currentAxis === 'Y') qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Y, -currentAngle);
                 else qAnim = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, currentAngle);
                 qBase = Cesium.Quaternion.IDENTITY;
            }
        }

        // 3. Convert Local Rotations to Reference Frame
        const qCombinedLocal = Cesium.Quaternion.multiply(qAnim, qBase, new Cesium.Quaternion());
        
        // 4. Apply to ENU Frame
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(pos);
        const enuRot = Cesium.Matrix4.getMatrix3(enu, new Cesium.Matrix3());
        const qEnu = Cesium.Quaternion.fromRotationMatrix(enuRot);
        
        // Final = qEnu * qCombinedLocal
        const qFinal = Cesium.Quaternion.multiply(qEnu, qCombinedLocal, new Cesium.Quaternion());
        
        return qFinal;
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
    
    // Check if we should switch to CallbackProperty for position to support smooth updates
    // Use CallbackProperty if not already using it
    if (!(this.entity.position instanceof Cesium.CallbackProperty)) {
        this.entity.position = new Cesium.CallbackProperty(() => {
            const lng = this.position[0];
            const lat = this.position[1];
            const isRelative = this.heightReference === 'relativeToGround';
            const isClamp = this.heightReference === 'clampToGround';
            
            // Use cached terrain height if available
            let terrainH = this._terrainHeight || 0;
            if (terrainH === 0) {
                 // Try sync cache
                 terrainH = this._getGroundHeight(lng, lat);
                 if (terrainH !== 0) this._terrainHeight = terrainH;
            }
            
            let h;
            if (isClamp) {
              h = terrainH;
            } else if (isRelative) {
              h = terrainH + (this.heightOffset || 0);
            } else {
              h = (this.position[2] || 0) + (this.heightOffset || 0);
            }
            return Cesium.Cartesian3.fromDegrees(lng, lat, h);
        }, false);
    }
    
    this._updateHeightReference();
    
    // Trigger async terrain sampling if needed
    const lng = this.position[0];
    const lat = this.position[1];
    const isRelative = this.heightReference === 'relativeToGround';
    const isClamp = this.heightReference === 'clampToGround';
    
    // Reset cache if position changed significantly?
    // For now, simple sampling
    if ((isClamp || isRelative) && (!this._terrainHeight) && Cesium.sampleTerrainMostDetailed && this.viewer && this.viewer.terrainProvider) {
       // Only sample if not already sampling
       if (!this._samplingTerrain) {
           this._samplingTerrain = true;
           const carto = Cesium.Cartographic.fromDegrees(lng, lat);
           Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, [carto]).then((res) => {
               this._samplingTerrain = false;
               const sampled = res && res[0] ? res[0].height : undefined;
               if (sampled !== undefined && sampled !== null) {
                   this._terrainHeight = sampled;
                   // Position Callback will pick this up automatically next frame
                   if (this.viewer && this.viewer.scene) this.viewer.scene.requestRender();
               }
           }).catch(() => { this._samplingTerrain = false; });
       }
    }
  }

  saveState() {
    this._savedState = {
      position: this.position ? [...this.position] : undefined,
      radiusValue: this.radiusValue,
      semiMajorAxis: this.semiMajorAxis,
      semiMinorAxis: this.semiMinorAxis,
      radiiX: this.radiiX,
      radiiY: this.radiiY,
      radiiZ: this.radiiZ,
      wallPositionsData: this.wallPositionsData ? deepClone(this.wallPositionsData) : undefined,
      corridorPositionsData: this.corridorPositionsData ? deepClone(this.corridorPositionsData) : undefined,
      corridorWidth: this.corridorWidth,
      rectangleCoordinates: Array.isArray(this.rectangleCoordinates) 
        ? deepClone(this.rectangleCoordinates) 
        : (this.rectangleCoordinates && this.rectangleCoordinates.west !== undefined 
            ? [this.rectangleCoordinates.west, this.rectangleCoordinates.south, this.rectangleCoordinates.east, this.rectangleCoordinates.north] 
            : undefined),
      dimX: this.dimX,
      dimY: this.dimY,
      dimZ: this.dimZ,
      lengthValue: this.lengthValue,
      topRadiusValue: this.topRadiusValue,
      bottomRadiusValue: this.bottomRadiusValue,
      rotationAngle: this.rotationAngle,
      rotationAxis: this.rotationAxis,
      _rotationAxisLine: this._rotationAxisLine,
      _spinAngle: this._spinAngle,
      _spinAxis: this._spinAxis,
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
    if (s.position !== undefined) this.position = [...s.position];
    if (s.radiusValue !== undefined) this.radiusValue = s.radiusValue;
    if (s.semiMajorAxis !== undefined) this.semiMajorAxis = s.semiMajorAxis;
    if (s.semiMinorAxis !== undefined) this.semiMinorAxis = s.semiMinorAxis;
    if (s.radiiX !== undefined) this.radiiX = s.radiiX;
    if (s.radiiY !== undefined) this.radiiY = s.radiiY;
    if (s.radiiZ !== undefined) this.radiiZ = s.radiiZ;
    if (s.wallPositionsData !== undefined) this.wallPositionsData = deepClone(s.wallPositionsData);
    if (s.corridorPositionsData !== undefined) this.corridorPositionsData = deepClone(s.corridorPositionsData);
    if (s.corridorWidth !== undefined) this.corridorWidth = s.corridorWidth;
    if (s.rectangleCoordinates !== undefined) this.rectangleCoordinates = deepClone(s.rectangleCoordinates);
    if (s.dimX !== undefined) this.dimX = s.dimX;
    if (s.dimY !== undefined) this.dimY = s.dimY;
    if (s.dimZ !== undefined) this.dimZ = s.dimZ;
    if (s.lengthValue !== undefined) this.lengthValue = s.lengthValue;
    if (s.topRadiusValue !== undefined) this.topRadiusValue = s.topRadiusValue;
    if (s.bottomRadiusValue !== undefined) this.bottomRadiusValue = s.bottomRadiusValue;
    if (s.rotationAngle !== undefined) this.rotationAngle = s.rotationAngle;
    if (s.rotationAxis !== undefined) this.rotationAxis = s.rotationAxis;
    if (s._rotationAxisLine !== undefined) this._rotationAxisLine = s._rotationAxisLine;
    if (s._spinAngle !== undefined) this._spinAngle = s._spinAngle;
    if (s._spinAxis !== undefined) this._spinAxis = s._spinAxis;
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

  _computeDefaultAxis() {
    const m = this.modeDim || '2d';
    const k = (this.kind || '').toLowerCase();
    if (m === '2d') return 'Z';
    if (k === 'circle' || k === 'ellipse' || k === 'ellipsoid' || k === 'sphere') return 'Z';
    if (k === 'rectangle' || k === 'polygon' || k === 'path') return 'Z';
    if (k === 'cylinder' || k === 'cone' || k === 'box') return 'Z';
    return 'Z';
  }
}
