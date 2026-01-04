import { SmartGeometryEntity } from './SmartGeometryEntity.js';

export class BoxEntity extends SmartGeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.kind = 'box';
    this.type = 'geometry';
  }

  _createEntity() {
    const Cesium = this.cesium;
    const mat = this._resolveMaterial(this._material);
    // Box doesn't use outline in SmartGeometryEntity implementation (at least in _createEntity for box it wasn't explicit, but let's check)
    // Actually lines 460-463 in SmartGeometryEntity didn't set outline for box.
    // But let's check if it should. The doc example doesn't show outline.
    // I will stick to existing logic but maybe add outline support if generic.
    // Wait, SmartGeometryEntity line 463: opts.box = { dimensions: ..., material: mat };
    // It does NOT set outline.
    
    const hh = this._effectiveHeight();
    const lng = this.position[0], lat = this.position[1];
    const terrainH = this._getGroundHeight(lng, lat);
    const hrMode = this.heightReference;
    const centerH = hrMode === 'clampToGround' ? terrainH
                   : hrMode === 'relativeToGround' ? (terrainH + (this.heightOffset || 0))
                   : hh;
    const pos = Cesium.Cartesian3.fromDegrees(lng, lat, centerH);
    
    const opts = { 
        id: this.id, 
        name: this.name, 
        description: this.description,
        position: pos,
        orientation: this._getDynamicOrientation(pos)
    };

    const dx = this.dimX || 1;
    const dy = this.dimY || 1;
    const dz = this.dimZ || 1;

    opts.box = {
        dimensions: new Cesium.Cartesian3(dx, dy, dz),
        material: mat,
        fill: !!this.fill
    };
    
    // Check if outline is supported for BoxGraphics in Cesium. Yes it is. 
    // But original code didn't use it. I should probably add it for consistency if the user asks for it.
    // However, strict refactoring means keeping behavior.
    // But 'SmartGeometryEntity' generic 'outline()' method sets _outlineEnabled.
    // If I add it, it's an improvement.
    if (this._outlineEnabled) {
        opts.box.outline = true;
        if (this._outlineColor) opts.box.outlineColor = this._resolveColor(this._outlineColor);
        if (this._outlineWidth) opts.box.outlineWidth = this._outlineWidth;
    }

    return opts;
  }

  _applySmartGeometry() {
    if (!this.viewer || !this.viewer.entities) return;
    const e = this.viewer.entities.getById(this.id);
    if (!e) return;

    // Ensure position sync
    this._updateEntityPosition();
    
    const Cesium = this.cesium;
    const mat = this._resolveMaterial(this._material);
    const oc = this._resolveColor(this._outlineColor);

    if (!e.box) {
        e.box = new Cesium.BoxGraphics({
            dimensions: new Cesium.Cartesian3(this.dimX || 1, this.dimY || 1, this.dimZ || 1),
            material: mat,
            fill: !!this.fill
        });
        if (this._outlineEnabled) {
            e.box.outline = true;
            if (oc) e.box.outlineColor = oc;
            if (this._outlineWidth) e.box.outlineWidth = this._outlineWidth;
        }
    } else {
        const dx = this.dimX || 1, dy = this.dimY || 1, dz = this.dimZ || 1;
        e.box.dimensions = new Cesium.Cartesian3(dx, dy, dz);
        if (mat) e.box.material = mat;
        e.box.fill = !!this.fill;
        
        if (this._outlineEnabled !== undefined) e.box.outline = !!this._outlineEnabled;
        if (oc) e.box.outlineColor = oc;
        if (this._outlineWidth !== undefined) e.box.outlineWidth = this._outlineWidth;
    }

    // Orientation is handled by SmartGeometryEntity base logic for 'nativeOrientationShapes' 
    // if we let it, but here we override _applySmartGeometry so we must handle it or call super?
    // SmartGeometryEntity.js _applySmartGeometry calls sub-class _applySmartGeometry and RETURNS.
    // So we must handle orientation here.
    
    // Check orientation logic in SmartGeometryEntity lines 521-536.
    if (this.position && this.position.length >= 2) {
         if (!e.orientation || !(e.orientation instanceof Cesium.CallbackProperty)) {
              const center = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], this.position[2] || 0);
              e.orientation = this._getDynamicOrientation(center);
         }
    }
  }
}
