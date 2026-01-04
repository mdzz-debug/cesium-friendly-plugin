
import { SmartGeometryEntity } from './SmartGeometryEntity.js';
import { deepClone } from '../utils/deepClone.js';

export class CylinderEntity extends SmartGeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.kind = 'cylinder';
    this.type = 'geometry';
    if (typeof console !== 'undefined') console.log('[CF] CylinderEntity: ctor', id);
  }

  _startGeometryAnimation() {
    if (!this._animContext) return this;
    
    this._animPending = false;
    this.stopAnimation();
    
    const startState = this._animContext.startValues || {};
    this._animContext.startValues = startState;
    
    // Patch defaults for cylinder/cone properties
    const kind = (this.kind || 'cylinder').toLowerCase();
    const r = this.radiusValue || 1000;
    
    if (startState.lengthValue === undefined && this.lengthValue !== undefined) {
         startState.lengthValue = 1000;
    }
    
    // Default logic based on kind
    if (kind === 'cone') {
        if (startState.topRadiusValue === undefined && this.topRadiusValue !== undefined) {
            startState.topRadiusValue = 0;
        }
        if (startState.bottomRadiusValue === undefined && this.bottomRadiusValue !== undefined) {
            startState.bottomRadiusValue = r;
        }
    } else {
        // cylinder
        if (startState.bottomRadiusValue === undefined && this.bottomRadiusValue !== undefined) {
            startState.bottomRadiusValue = r;
        }
        if (startState.topRadiusValue === undefined && this.topRadiusValue !== undefined) {
            startState.topRadiusValue = startState.bottomRadiusValue !== undefined ? startState.bottomRadiusValue : r;
        }
    }
    
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
                 if (forward) {
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

    opts.position = pos;
    opts.orientation = this._getDynamicOrientation(pos);

    // Cylinder/Cone specific properties
    const kind = (this.kind || 'cylinder').toLowerCase();
    const length = this.lengthValue || 1000;
    const r = this.radiusValue || 1000;
    
    let topR = this.topRadiusValue;
    let bottomR = this.bottomRadiusValue;
    
    // Default logic based on kind
    if (kind === 'cone') {
        if (topR === undefined) topR = 0;
        if (bottomR === undefined) bottomR = r;
    } else {
        // cylinder
        if (bottomR === undefined) bottomR = r;
        if (topR === undefined) topR = bottomR;
    }
    
    const slices = this.sectorSamples || 128; 

    opts.cylinder = {
        length: length,
        topRadius: topR,
        bottomRadius: bottomR,
        slices: slices,
        material: mat,
        fill: !!this.fill,
        outline: !!this._outlineEnabled,
        outlineColor: oc,
        outlineWidth: this._outlineWidth,
        heightReference: this._getHeightReferenceEnum()
    };
    
    return opts;
  }

  _applySmartGeometry() {
    if (!this.viewer || !this.viewer.entities) return;
    const e = this.viewer.entities.getById(this.id);
    if (!e) return;
    
    // Ensure entity position is synced
    if (typeof this._updateEntityPosition === 'function') {
        this._updateEntityPosition();
    }
    
    const Cesium = this.cesium;
    
    // Check orientation update
    // We use CallbackProperty for orientation to support smooth updates during drag/animation
    if (!e.orientation || !(e.orientation instanceof Cesium.CallbackProperty)) {
         const center = (this.position && this.position.length >= 2) ? 
             Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], this.position[2] || 0) : Cesium.Cartesian3.ZERO;
         e.orientation = this._getDynamicOrientation(center);
    }

    // Material & Outline Sigs
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
    
    // Geometry Sigs
    const kind = (this.kind || 'cylinder').toLowerCase();
    const r = this.radiusValue || 1000;
    let topR = this.topRadiusValue;
    let bottomR = this.bottomRadiusValue;
    
    if (kind === 'cone') {
        if (topR === undefined) topR = 0;
        if (bottomR === undefined) bottomR = r;
    } else {
        if (bottomR === undefined) bottomR = r;
        if (topR === undefined) topR = bottomR;
    }

    const length = this.lengthValue || 1000;
    const slices = this.sectorSamples || 128;
    const geoSig = `${length}|${topR}|${bottomR}|${slices}`;

    if (!e.cylinder) {
        // Recreate if missing
        mat = this._resolveMaterial(this._material);
        oc = this._resolveColor(this._outlineColor);
        
        e.cylinder = new Cesium.CylinderGraphics({
            length: new Cesium.CallbackProperty(() => this.lengthValue || 1000, false),
            topRadius: new Cesium.CallbackProperty(() => {
                const kind = (this.kind || 'cylinder').toLowerCase();
                const r = this.radiusValue || 1000;
                let topR = this.topRadiusValue;
                let bottomR = this.bottomRadiusValue;
                
                if (kind === 'cone') {
                    if (topR === undefined) topR = 0;
                } else {
                    if (bottomR === undefined) bottomR = r;
                    if (topR === undefined) topR = bottomR;
                }
                return topR;
            }, false),
            bottomRadius: new Cesium.CallbackProperty(() => {
                const kind = (this.kind || 'cylinder').toLowerCase();
                const r = this.radiusValue || 1000;
                let bottomR = this.bottomRadiusValue;
                
                if (bottomR === undefined) bottomR = r;
                return bottomR;
            }, false),
            slices: new Cesium.CallbackProperty(() => this.sectorSamples || 128, false),
            material: mat,
            fill: !!this.fill,
            outline: !!this._outlineEnabled,
            outlineColor: oc,
            outlineWidth: this._outlineWidth,
            heightReference: this._getHeightReferenceEnum()
        });
        this._prevMatSig = matSig;
        this._prevOutlineSig = outlineSig;
        this._prevGeoSig = geoSig;
    } else {
        // Ensure CallbackProperty is attached
        if (!(e.cylinder.length instanceof Cesium.CallbackProperty)) {
            e.cylinder.length = new Cesium.CallbackProperty(() => this.lengthValue || 1000, false);
        }
        if (!(e.cylinder.topRadius instanceof Cesium.CallbackProperty)) {
             e.cylinder.topRadius = new Cesium.CallbackProperty(() => {
                const kind = (this.kind || 'cylinder').toLowerCase();
                const r = this.radiusValue || 1000;
                let topR = this.topRadiusValue;
                let bottomR = this.bottomRadiusValue;
                
                if (kind === 'cone') {
                    if (topR === undefined) topR = 0;
                } else {
                    if (bottomR === undefined) bottomR = r;
                    if (topR === undefined) topR = bottomR;
                }
                return topR;
            }, false);
        }
        if (!(e.cylinder.bottomRadius instanceof Cesium.CallbackProperty)) {
             e.cylinder.bottomRadius = new Cesium.CallbackProperty(() => {
                const kind = (this.kind || 'cylinder').toLowerCase();
                const r = this.radiusValue || 1000;
                let bottomR = this.bottomRadiusValue;
                
                if (bottomR === undefined) bottomR = r;
                return bottomR;
             }, false);
        }
        if (!(e.cylinder.slices instanceof Cesium.CallbackProperty)) {
             e.cylinder.slices = new Cesium.CallbackProperty(() => this.sectorSamples || 128, false);
        }

        // Update Material
        updateMaterial(e.cylinder);

        // Update Outline
        if (this._prevOutlineSig !== outlineSig) {
            const oc = this._resolveColor(this._outlineColor);
            e.cylinder.outline = !!this._outlineEnabled;
            if (oc) e.cylinder.outlineColor = oc;
            if (this._outlineWidth !== undefined) e.cylinder.outlineWidth = this._outlineWidth;
            this._prevOutlineSig = outlineSig;
        }
        
        // Update HeightReference
        const hr = this._getHeightReferenceEnum();
        if (e.cylinder.heightReference !== hr) {
            e.cylinder.heightReference = hr;
        }
    }
    
    // Update cache
    if (this._prevMatSig !== matSig) this._prevMatSig = matSig;

    if (this.viewer && this.viewer.scene) this.viewer.scene.requestRender();
  }
}

// Self-register
SmartGeometryEntity.Types.cylinder = CylinderEntity;
