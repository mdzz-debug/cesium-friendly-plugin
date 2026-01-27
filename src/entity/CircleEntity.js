import { SmartGeometryEntity } from './SmartGeometryEntity.js';
import { deepClone } from '../utils/deepClone.js';

export class CircleEntity extends SmartGeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.kind = 'circle';
    this.type = 'geometry'; // inherited, but good to be explicit or leave it
    if (typeof console !== 'undefined') console.log('[CF] CircleEntity: ctor', id);
  }

  _startGeometryAnimation() {
    // if (typeof console !== 'undefined') console.log('[CF] CircleEntity: _startGeometryAnimation', this.id);
    
    if (!this._animContext) return this;
    
    this._animPending = false;
    this.stopAnimation();
    
    const startState = this._animContext.startValues || {};
    if (this.rotationAxis !== undefined) startState.rotationAxis = this.rotationAxis;
    
    // Patch defaults for sector angles if they are transitioning from undefined (Full) to defined (Partial)
    // This ensures interpolation works instead of jumping values
    if (startState.sectorSweepAngle === undefined && this.sectorSweepAngle !== undefined) {
         startState.sectorSweepAngle = 2 * Math.PI;
    }
    if (startState.sectorStartAngle === undefined && this.sectorStartAngle !== undefined) {
         startState.sectorStartAngle = 0;
    }
    if (startState.sectorVerticalAngle === undefined && this.sectorVerticalAngle !== undefined) {
         startState.sectorVerticalAngle = Math.PI;
    }
    
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
    
    // Stabilize spin axis across animation legs: keep target axis constant
    if (targetState._spinAxis !== undefined) {
        startState._spinAxis = targetState._spinAxis;
        this._animContext.startValues._spinAxis = targetState._spinAxis;
        if (targets._spinAxis !== undefined) {
            delete targets._spinAxis;
        }
    }
    
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
        } else if (this._animContext.repeat) {
            forward = true;
            linearT = (elapsed % legDuration) / legDuration;
        } else {
            linearT = Math.min(elapsed / legDuration, 1);
        }
        this._animContext.direction = forward ? 1 : -1;
        // Ease-in-out
        const t = linearT < 0.5 ? 2 * linearT * linearT : -1 + (4 - 2 * linearT) * linearT;
        
        targetKeys.forEach(key => {
            const s = startState[key];
            const e = targets[key];
            
            if (typeof s === 'number' && typeof e === 'number') {
                 const twoPi = 2 * Math.PI;
                 const isAngleKey = key === 'rotationAngle' || key === '_spinAngle' || key === 'sectorStartAngle' || key === 'sectorSweepAngle';
                 const diff = Math.abs(e - s);
                 const mod = diff % twoPi;
                 const connected = this._animContext.repeat && isAngleKey && (mod < 1e-6 || Math.abs(mod - twoPi) < 1e-6);
                 if (connected) {
                     const cycles = Math.floor(elapsed / legDuration);
                     current[key] = s + (e - s) * (cycles + t);
                 } else if (forward) {
                     current[key] = s + (e - s) * t;
                 } else {
                     current[key] = e + (s - e) * t;
                 }
            } else if (Array.isArray(s) && Array.isArray(e) && s.length === e.length && key === 'position') {
                 // Array interpolation (specifically for position)
                 current[key] = s.map((v, i) => {
                     if (typeof v === 'number' && typeof e[i] === 'number') {
                         return forward ? (v + (e[i] - v) * t) : (e[i] + (v - e[i]) * t);
                     }
                     return forward ? e[i] : v;
                 });
            } else {
                 current[key] = forward ? e : s;
            }
        });
        
        this._inUpdateAnimation = true;
        
        // 1. Update properties on 'this'
        // We use super.update() to set values without triggering another animation start
        super.update(current); 

        // 2. Apply to Cesium Entity
        this._applySmartGeometry();
        
        this._inUpdateAnimation = false;
        
        if (this.viewer && this.viewer.scene) {
            this.viewer.scene.requestRender();
        }

        if ((linearT < 1 || this._animContext.loop || this._animContext.repeat) && this._animPending === false) {
             this._animFrame = requestAnimationFrame(animate);
        } else {
             this._animFrame = null;
             this._inUpdateAnimation = false;
             if (!this._animContext.loop && !this._animContext.repeat) {
                 this.update(targets);
             }
        }
    };
    
    this._animFrame = requestAnimationFrame(animate);
    return this;
  }

  _createEntity() {
    if (typeof console !== 'undefined') console.log('[CF] CircleEntity: _createEntity', this.id, this.modeDim, this.rotationAxis);
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
    
    // Check for 3D rotation intent (non-Z axis)
    const axis = (this.rotationAxis || 'X').toUpperCase();
    
    // Check if we have a base state that implies 3D posture (e.g. standing up)
    // even if current animation axis is Z
    const s = this._savedState || {};
    const baseAxis = (s.rotationAxis !== undefined ? s.rotationAxis : axis).toUpperCase();
    const baseAngle = (s.rotationAngle !== undefined ? s.rotationAngle : (this.rotationAngle || 0));
    
    // 3D Rotation is active if:
    // 1. Current axis is NOT Z (e.g. rotating X or Y)
    // 2. OR Base axis is NOT Z (e.g. we are standing up, so we are in 3D mode)
    // 3. OR Spin axis is NOT Z
    const is3DRotation = (axis !== 'Z' && ((this.rotationAngle || 0) !== 0)) ||
                         (baseAxis !== 'Z' && baseAngle !== 0) ||
                         ((this._spinAxis || 'Z').toUpperCase() !== 'Z' && (this._spinAngle || 0) !== 0);
    
    // Determine sector offset based on axis to align "0 degrees" with the axis itself
    const sectorOffset = (axis === 'Y') ? Math.PI / 2 : 0;

    // Force update debug axes
    this._updateDebugAxes();

    if (this.modeDim === '3d' || is3DRotation) {
      const a = this.semiMajorAxis || this.radiusValue || 1000;
      const b = this.semiMinorAxis || this.radiusValue || 1000;
      
      // 3D sphere sector -> polygon wedge (extruded) or ellipsoid sector
      // Or 3D rotated disk sector -> ellipsoid sector (wedge)
      if (this.sectorVerticalAngle !== undefined || (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined)) {
        const baseStart = this.sectorStartAngle || 0;
        const minClock = baseStart + sectorOffset;
        const maxClock = baseStart + (this.sectorSweepAngle || (2 * Math.PI)) + sectorOffset;
        
        opts.position = pos;
        opts.ellipsoid = {
          radii: new Cesium.Cartesian3(a, b, (this.modeDim === '3d' ? Math.max(a, b) : 0.1)),
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
            opts.ellipsoid.radii = new Cesium.Cartesian3(a, b, 0.1);
        }
        opts.orientation = this._getDynamicOrientation(pos);
       } else {
        // Standard Sphere or Disk
        opts.position = pos;
        opts.orientation = this._getDynamicOrientation(pos);
        
        const radii = new Cesium.Cartesian3(a, b, (this.modeDim === '3d' ? Math.max(a, b) : 0.1));
        
        opts.ellipsoid = { radii: radii, material: mat, fill: !!this.fill, outline: !!this._outlineEnabled, outlineColor: oc, heightReference: this._getHeightReferenceEnum() };
      }
    } else {
      if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined) {
        const a = this.semiMajorAxis || this.radiusValue || 1000;
        const b = this.semiMinorAxis || this.radiusValue || 1000;
        {
          let rot = (this.rotationAngle || 0) % (2 * Math.PI);
          if (rot < 0) rot += (2 * Math.PI);
          if (Math.abs(rot) < 1e-4) rot = 1e-4;
          if (Math.abs(rot - (2 * Math.PI)) < 1e-4) rot = (2 * Math.PI) - 1e-4;
          const start = (this.sectorStartAngle || 0) + rot;
          const pts = this._computeSectorPositions(this.position, a, b, 0, start, this.sectorSweepAngle, this.sectorSamples, hh);
          opts.polygon = { hierarchy: pts, material: mat, outline: !!this._outlineEnabled, outlineColor: oc, extrudedHeight: this.extrudedHeight, height: hh, heightReference: this._getHeightReferenceEnum() };
        }
      } else {
        const a = this.semiMajorAxis || this.radiusValue || 1000;
        const b = this.semiMinorAxis || this.radiusValue || 1000;
        opts.position = pos;
        opts.ellipse = { semiMajorAxis: a, semiMinorAxis: b, height: hh, material: mat, fill: this.fill, outline: !!this._outlineEnabled, outlineColor: oc, outlineWidth: this._outlineWidth, rotation: this.rotationAngle || 0, extrudedHeight: this.extrudedHeight };
      }
    }
    
    return opts;
  }

  _applySmartGeometry() {
    // if (typeof console !== 'undefined') console.log('[CF] CircleEntity: _applySmartGeometry', this.id, this.modeDim, this.rotationAxis);
    if (!this.viewer || !this.viewer.entities) return;

    // Draw debug axes (X/Y/Z)
    if (this._updateDebugAxes) {
        this._updateDebugAxes();
    }

    const e = this.viewer.entities.getById(this.id);
    if (!e) return;
    
    // Ensure entity position is synced with this.position (especially for animation)
    if (typeof this._updateEntityPosition === 'function') {
        this._updateEntityPosition();
    }
    
    const Cesium = this.cesium;
    // Optimization: Resolve material/color only if needed, or rely on caching below
    // const mat = this._resolveMaterial(this._material);
    // const oc = this._resolveColor(this._outlineColor);
    
    const axis = (this.rotationAxis || 'X').toUpperCase();
    
    // Check if we have a base state that implies 3D posture (e.g. standing up)
    const s = this._savedState || {};
    const baseAxis = (s.rotationAxis !== undefined ? s.rotationAxis : axis).toUpperCase();
    const baseAngle = (s.rotationAngle !== undefined ? s.rotationAngle : (this.rotationAngle || 0));
    
    // Use robust 3D check (same as _createEntity)
    const is3DRotation = (axis !== 'Z' && ((this.rotationAngle || 0) !== 0)) ||
                         (baseAxis !== 'Z' && baseAngle !== 0) ||
                         ((this._spinAxis || 'Z').toUpperCase() !== 'Z' && (this._spinAngle || 0) !== 0);
                         
    const is3dEllipsoid = (this.modeDim === '3d' || is3DRotation);
    
    // Update Orientation
    if (is3dEllipsoid) {
       if (this.position && this.position.length >= 2) {
          const center = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], this.position[2] || 0);
          // Delegate to SmartGeometryEntity's robust composition logic
          e.orientation = this._getDynamicOrientation(center);
       }
    }

    // Prepare styles
    // Optimization: Only update material/outline if changed to avoid primitive rebuilds
    const matSig = JSON.stringify({ m: this._material, o: this.materialOpacity, f: this.fill });
    const outlineSig = JSON.stringify({ e: this._outlineEnabled, c: this._outlineColor, w: this._outlineWidth });
    
    let mat, oc;
    const updateMaterial = (target) => {
        if (this._prevMatSig !== matSig) {
            mat = this._resolveMaterial(this._material);
            if (mat) target.material = mat;
            target.fill = !!this.fill;
        }
    };
    const updateOutline = (target) => {
        if (this._prevOutlineSig !== outlineSig) {
            oc = this._resolveColor(this._outlineColor);
            target.outline = !!this._outlineEnabled;
            if (oc) target.outlineColor = oc;
            if (this._outlineWidth !== undefined) target.outlineWidth = this._outlineWidth;
        }
    };

    // Remove unified ellipsoid handling for sectors in 2D; let later logic handle 3D only

    // 3D circle with sector -> ellipsoid
    if (is3dEllipsoid) {
      const hr = this._getHeightReferenceEnum();
      const a = this.semiMajorAxis || this.radiusValue || 1000;
      const b = this.semiMinorAxis || this.radiusValue || 1000;
      const rx = a;
      const ry = b;
      const rz = (this.modeDim === '3d') ? Math.max(rx, ry) : 0.1;
      
      if (this.sectorVerticalAngle !== undefined || (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined)) {
         
         if (!e.ellipsoid) {
          mat = this._resolveMaterial(this._material);
          oc = this._resolveColor(this._outlineColor);
          
          e.ellipsoid = new Cesium.EllipsoidGraphics({
            radii: new Cesium.Cartesian3(rx, ry, rz),
            material: mat,
            fill: !!this.fill,
            outline: !!this._outlineEnabled,
            outlineColor: oc,
            outlineWidth: this._outlineWidth,
            heightReference: hr,
            minimumClock: new Cesium.CallbackProperty(() => {
                const axis = (this.rotationAxis || 'Z').toUpperCase();
                const sectorOffset = (axis === 'Y') ? Math.PI / 2 : 0;
                return (this.sectorStartAngle || 0) + sectorOffset;
            }, false),
            maximumClock: new Cesium.CallbackProperty(() => {
                const axis = (this.rotationAxis || 'Z').toUpperCase();
                const sectorOffset = (axis === 'Y') ? Math.PI / 2 : 0;
                let sweep = this.sectorSweepAngle;
                if (sweep === undefined) sweep = 2 * Math.PI;
                // Snap to 2PI if close to avoid triangulation issues, but allow full circle
                if (Math.abs(sweep - 2 * Math.PI) < 0.001) sweep = 2 * Math.PI;
                return (this.sectorStartAngle || 0) + sweep + sectorOffset;
            }, false),
            maximumCone: new Cesium.CallbackProperty(() => {
                return this.sectorVerticalAngle !== undefined ? this.sectorVerticalAngle : Math.PI;
            }, false),
            minimumCone: 0
          });
          e.ellipse = undefined;
          if (e.polygon) {
            e.polygon.hierarchy = new Cesium.CallbackProperty(() => {
              return new Cesium.PolygonHierarchy([]);
            }, false);
            e.polygon.fill = false;
            e.polygon.outline = false;
            e.polygon.extrudedHeight = undefined;
            e.polygon.height = 0;
            e.polygon.heightReference = this.cesium.HeightReference.NONE;
          }
          // Force update sigs
          this._prevMatSig = matSig;
          this._prevOutlineSig = outlineSig;
        } else {
          e.ellipsoid.radii = new Cesium.Cartesian3(rx, ry, rz);
          
          updateMaterial(e.ellipsoid);
          updateOutline(e.ellipsoid);
          
          e.ellipsoid.heightReference = hr;
          
          // Ensure CallbackProperty if transitioning from static sphere to sector
          if (!(e.ellipsoid.minimumClock instanceof Cesium.CallbackProperty)) {
             e.ellipsoid.minimumClock = new Cesium.CallbackProperty(() => {
                 const axis = (this.rotationAxis || 'Z').toUpperCase();
                 const sectorOffset = (axis === 'Y') ? Math.PI / 2 : 0;
                 return (this.sectorStartAngle || 0) + sectorOffset;
             }, false);
             e.ellipsoid.maximumClock = new Cesium.CallbackProperty(() => {
                 const axis = (this.rotationAxis || 'Z').toUpperCase();
                 const sectorOffset = (axis === 'Y') ? Math.PI / 2 : 0;
                 let sweep = this.sectorSweepAngle;
                 if (sweep === undefined) sweep = 2 * Math.PI;
                 if (Math.abs(sweep - 2 * Math.PI) < 0.001) sweep = 2 * Math.PI;
                 return (this.sectorStartAngle || 0) + sweep + sectorOffset;
             }, false);
             e.ellipsoid.maximumCone = new Cesium.CallbackProperty(() => {
                 return this.sectorVerticalAngle !== undefined ? this.sectorVerticalAngle : Math.PI;
             }, false);
          }
        }
      } else {
        if (!e.ellipsoid) {
          mat = this._resolveMaterial(this._material);
          oc = this._resolveColor(this._outlineColor);
          e.ellipsoid = new Cesium.EllipsoidGraphics({
            radii: new Cesium.Cartesian3(rx, ry, rz),
            material: mat,
            fill: !!this.fill,
            outline: !!this._outlineEnabled,
            outlineColor: oc,
            heightReference: hr
          });
          e.ellipse = undefined;
          if (e.polygon) {
            e.polygon.hierarchy = new Cesium.CallbackProperty(() => {
              return new Cesium.PolygonHierarchy([]);
            }, false);
            e.polygon.fill = false;
            e.polygon.outline = false;
            e.polygon.extrudedHeight = undefined;
            e.polygon.height = 0;
            e.polygon.heightReference = this.cesium.HeightReference.NONE;
          }
          this._prevMatSig = matSig;
          this._prevOutlineSig = outlineSig;
        } else {
          e.ellipsoid.radii = new Cesium.Cartesian3(rx, ry, rz);
          
          updateMaterial(e.ellipsoid);
          updateOutline(e.ellipsoid);

          e.ellipsoid.heightReference = hr;
          e.ellipsoid.minimumClock = 0;
          e.ellipsoid.maximumClock = 2 * Math.PI;
          e.ellipsoid.minimumCone = 0;
          e.ellipsoid.maximumCone = Math.PI;
        }
      }
      if (this.viewer && this.viewer.scene) this.viewer.scene.requestRender();
      
      // Update cache
      if (this._prevMatSig !== matSig) this._prevMatSig = matSig;
      if (this._prevOutlineSig !== outlineSig) this._prevOutlineSig = outlineSig;
      return;
    }
    
    // 2D Circle (Ellipse or Polygon)
    const hh = this._effectiveHeight();
    const hr = this._getHeightReferenceEnum();

    // [Fix] Interpret extrudedHeight as thickness (delta)
    let computedExtrudedHeightSector = this.extrudedHeight;
    if (computedExtrudedHeightSector !== undefined) {
        if (hr !== Cesium.HeightReference.CLAMP_TO_GROUND) {
            computedExtrudedHeightSector += hh;
        }
    }

    if (this.sectorStartAngle !== undefined && this.sectorSweepAngle !== undefined) {
       // Sector -> Polygon
       if (!e.polygon) {
           mat = this._resolveMaterial(this._material);
           oc = this._resolveColor(this._outlineColor);
           e.polygon = new Cesium.PolygonGraphics({ 
              hierarchy: new Cesium.CallbackProperty(() => {
                  const CesiumRef = this.cesium;
                  const p = this.position;
                  let centerDeg;
                  if (Array.isArray(p) && p.length >= 2) {
                      centerDeg = p;
                  } else if (p && typeof p === 'object' && 'x' in p && 'y' in p && 'z' in p) {
                      const carto = CesiumRef.Cartographic.fromCartesian(p);
                      centerDeg = [CesiumRef.Math.toDegrees(carto.longitude), CesiumRef.Math.toDegrees(carto.latitude), carto.height || 0];
                  } else {
                      return this._lastSectorHierarchy || new CesiumRef.PolygonHierarchy([]);
                  }
                  let sweep = this.sectorSweepAngle;
                  if (sweep === undefined) sweep = 2 * Math.PI;
                  if (Math.abs(sweep - 2 * Math.PI) < 0.001) sweep = 2 * Math.PI;
                  let a = (this.rotationAngle || 0) + (this._spinAngle || 0);
                  if (!(this._animContext && this._animContext.repeat)) {
                    a = a % (2 * Math.PI);
                    if (a < 0) a += (2 * Math.PI);
                    if (Math.abs(a) < 1e-9) a = 1e-9;
                    if (Math.abs(a - (2 * Math.PI)) < 1e-9) a = (2 * Math.PI) - 1e-9;
                  }
                  const start = (this.sectorStartAngle || 0) + a;
                  try {
                    const deg = a * 180 / Math.PI;
                    const sDeg = start * 180 / Math.PI;
                    const swDeg = sweep * 180 / Math.PI;
                    const changed = Math.abs((this._lastLog2dRotDeg ?? -9999) - deg) > 0.01
                      || Math.abs((this._lastLog2dStartDeg ?? -9999) - sDeg) > 0.01
                      || Math.abs((this._lastLog2dSweepDeg ?? -9999) - swDeg) > 0.01;
                    if (changed) {
                      this._lastLog2dRotDeg = deg;
                      this._lastLog2dStartDeg = sDeg;
                      this._lastLog2dSweepDeg = swDeg;
                      // if (typeof console !== 'undefined') console.log('[CF][Z] 2D sector', this.id, 'rotDeg=', deg.toFixed(4), 'startDeg=', sDeg.toFixed(4), 'sweepDeg=', swDeg.toFixed(4));
                    }
                  } catch (_) {}
                  const pts = this._computeSectorPositions(
                      centerDeg, 
                      this.radiusValue || 1000, 
                      this.radiusValue || 1000, 
                      0, 
                      start, 
                      sweep, 
                      this.sectorSamples, 
                      this._effectiveHeight()
                  );
                  const hierarchy = new CesiumRef.PolygonHierarchy(pts);
                  this._lastSectorHierarchy = hierarchy;
                  return hierarchy;
              }, false),
               material: mat, 
               fill: !!this.fill,
               outline: !!this._outlineEnabled, 
               outlineColor: oc, 
               extrudedHeight: computedExtrudedHeightSector, 
               height: hh, 
               heightReference: hr 
           });
           e.ellipse = undefined;
           e.ellipsoid = undefined;
           this._prevMatSig = matSig;
           this._prevOutlineSig = outlineSig;
       } else {
           // e.polygon.hierarchy is CallbackProperty, no need to update
           
           updateMaterial(e.polygon);
           updateOutline(e.polygon);

           e.polygon.extrudedHeight = computedExtrudedHeightSector;
           e.polygon.height = hh;
           e.polygon.heightReference = hr;
           
           if (!(e.polygon.hierarchy instanceof Cesium.CallbackProperty)) {
               e.polygon.hierarchy = new Cesium.CallbackProperty(() => {
                   const CesiumRef = this.cesium;
                   const p = this.position;
                   let centerDeg;
                   if (Array.isArray(p) && p.length >= 2) {
                       centerDeg = p;
                   } else if (p && typeof p === 'object' && 'x' in p && 'y' in p && 'z' in p) {
                       const carto = CesiumRef.Cartographic.fromCartesian(p);
                       centerDeg = [CesiumRef.Math.toDegrees(carto.longitude), CesiumRef.Math.toDegrees(carto.latitude), carto.height || 0];
                   } else {
                       return this._lastSectorHierarchy || new CesiumRef.PolygonHierarchy([]);
                   }
                   let sweep = this.sectorSweepAngle;
                  if (sweep === undefined) sweep = 2 * Math.PI;
                  if (Math.abs(sweep - 2 * Math.PI) < 0.001) sweep = 2 * Math.PI;
                  let a = (this.rotationAngle || 0) + (this._spinAngle || 0);
                  if (!(this._animContext && this._animContext.repeat)) {
                     a = a % (2 * Math.PI);
                     if (a < 0) a += (2 * Math.PI);
                     if (Math.abs(a) < 1e-9) a = 1e-9;
                     if (Math.abs(a - (2 * Math.PI)) < 1e-9) a = (2 * Math.PI) - 1e-9;
                  }
                  const start = (this.sectorStartAngle || 0) + a;
                   try {
                     const deg = a * 180 / Math.PI;
                     const sDeg = start * 180 / Math.PI;
                     const swDeg = (sweep * 180 / Math.PI);
                     const changed = Math.abs((this._lastLog2dRotDeg ?? -9999) - deg) > 0.01
                       || Math.abs((this._lastLog2dStartDeg ?? -9999) - sDeg) > 0.01
                       || Math.abs((this._lastLog2dSweepDeg ?? -9999) - swDeg) > 0.01;
                     if (changed) {
                       this._lastLog2dRotDeg = deg;
                       this._lastLog2dStartDeg = sDeg;
                       this._lastLog2dSweepDeg = swDeg;
                      //  if (typeof console !== 'undefined') console.log('[CF][Z] 2D sector', this.id, 'rotDeg=', deg.toFixed(4), 'startDeg=', sDeg.toFixed(4), 'sweepDeg=', swDeg.toFixed(4));
                     }
                   } catch (_) {}
                   const pts = this._computeSectorPositions(
                       centerDeg, 
                       this.radiusValue || 1000, 
                       this.radiusValue || 1000, 
                       0, 
                       start, 
                       sweep, 
                       this.sectorSamples, 
                       this._effectiveHeight()
                    );
                   const hierarchy = new CesiumRef.PolygonHierarchy(pts);
                   this._lastSectorHierarchy = hierarchy;
                   return hierarchy;
                }, false);
            }
        }
       } else {
          // Full Circle -> Ellipse
          const a = this.semiMajorAxis || this.radiusValue || 1000;
          const b = this.semiMinorAxis || this.radiusValue || 1000;

          // [Fix] Interpret extrudedHeight as thickness (delta) instead of absolute altitude
          // unless clamped to ground (where base is implicitly 0 relative to ground).
          let computedExtrudedHeight = this.extrudedHeight;
          if (computedExtrudedHeight !== undefined) {
             if (hr !== Cesium.HeightReference.CLAMP_TO_GROUND) {
                computedExtrudedHeight += hh;
             }
          }

          if (!e.ellipse) {
           mat = this._resolveMaterial(this._material);
           oc = this._resolveColor(this._outlineColor);
           e.ellipse = new Cesium.EllipseGraphics({ semiMajorAxis: a, semiMinorAxis: b, height: hh, material: mat, fill: this.fill, outline: !!this._outlineEnabled, outlineColor: oc, outlineWidth: this._outlineWidth, rotation: (this.rotationAngle || 0) + (this._spinAngle || 0), extrudedHeight: computedExtrudedHeight, heightReference: hr });
           if (e.polygon) {
               e.polygon.hierarchy = new Cesium.CallbackProperty(() => {
                   return new Cesium.PolygonHierarchy([]);
               }, false);
               e.polygon.fill = false;
               e.polygon.outline = false;
               e.polygon.extrudedHeight = undefined;
               e.polygon.height = 0;
               e.polygon.heightReference = this.cesium.HeightReference.NONE;
           }
           e.ellipsoid = undefined;
           this._prevMatSig = matSig;
           this._prevOutlineSig = outlineSig;
       } else {
           // If a polygon exists from previous sector state, keep it inert to avoid Cesium dynamic updater crashes
           if (e.polygon) {
               e.polygon.hierarchy = new Cesium.CallbackProperty(() => {
                   return new Cesium.PolygonHierarchy([]);
               }, false);
               e.polygon.fill = false;
               e.polygon.outline = false;
               e.polygon.extrudedHeight = undefined;
               e.polygon.height = 0;
               e.polygon.heightReference = this.cesium.HeightReference.NONE;
           }
           e.ellipse.semiMajorAxis = a;
           e.ellipse.semiMinorAxis = b;
           e.ellipse.height = hh;
           
           updateMaterial(e.ellipse);
           updateOutline(e.ellipse);

           {
             let a3 = (this.rotationAngle || 0) + (this._spinAngle || 0);
             if (!(this._animContext && this._animContext.repeat)) {
               a3 = a3 % (2 * Math.PI);
               if (a3 < 0) a3 += (2 * Math.PI);
               if (Math.abs(a3) < 1e-9) a3 = 1e-9;
               if (Math.abs(a3 - (2 * Math.PI)) < 1e-9) a3 = (2 * Math.PI) - 1e-9;
             }
             e.ellipse.rotation = a3;
           }
           e.ellipse.extrudedHeight = computedExtrudedHeight;
           e.ellipse.extrudedHeightReference = this.extrudedHeightReference;
           e.ellipse.heightReference = hr;
       }
    }
    
    // Update cache
    if (this._prevMatSig !== matSig) this._prevMatSig = matSig;
    if (this._prevOutlineSig !== outlineSig) this._prevOutlineSig = outlineSig;

    if (this.viewer && this.viewer.scene) this.viewer.scene.requestRender();
  }
}

// Self-register to SmartGeometryEntity
SmartGeometryEntity.Types.circle = CircleEntity;
