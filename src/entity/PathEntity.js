import { SmartGeometryEntity } from './SmartGeometryEntity.js';

export class PathEntity extends SmartGeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    // kind will be set by factory or options, default to polyline if not set?
    // But usually passed in options.
    this.type = 'geometry';
  }

  _createEntity() {
    const Cesium = this.cesium;
    const mat = this._resolveMaterial(this._material);
    const oc = this._resolveColor(this._outlineColor);
    
    // Path entities might not have a single 'position' (center), but usually use a list of positions.
    // However, for rotation, a center 'position' is required.
    const opts = { 
        id: this.id, 
        name: this.name, 
        description: this.description 
    };

    if (this.position && this.position.length >= 2) {
        const hh = this._effectiveHeight();
        const lng = this.position[0], lat = this.position[1];
        const terrainH = this._getGroundHeight(lng, lat);
        const hrMode = this.heightReference;
        const centerH = hrMode === 'clampToGround' ? terrainH
                    : hrMode === 'relativeToGround' ? (terrainH + (this.heightOffset || 0))
                    : hh;
        opts.position = Cesium.Cartesian3.fromDegrees(lng, lat, centerH);
    }

    const kind = (this.kind || 'polyline').toLowerCase();

    if (kind === 'polyline') {
        let pp = this._normalizePositions(this.polylinePositionsData);
        pp = this._rotatePositions(pp);
        opts.polyline = { 
            positions: pp, 
            width: this.polylineWidth || 1, 
            material: mat 
        };
    } else if (kind === 'polylinevolume' || kind === 'polylineVolume') {
        let pv = this._normalizePositions(this.polylinePositionsData);
        pv = this._rotatePositions(pv);
        opts.polylineVolume = { 
            positions: pv, 
            shape: this._normalizeVolumeShape(this.volumeShapeData) || [], 
            material: mat 
        };
    } else if (kind === 'corridor') {
        const posCb = new Cesium.CallbackProperty(() => {
            let cp = this._normalizePositions(this.corridorPositionsData);
            cp = this._rotatePositions(cp);
            return cp;
        }, false);
        opts.corridor = { 
            positions: posCb, 
            width: this.corridorWidth || 1, 
            material: mat, 
            outline: !!this._outlineEnabled, 
            outlineColor: oc 
        };
    } else if (kind === 'wall') {
        // Wall uses CallbackProperty for positions as per original optimization
        const posCb = new Cesium.CallbackProperty(() => {
            let wp = this._normalizePositions(this.wallPositionsData, true);
            wp = this._rotatePositions(wp);
            return wp;
        }, false);
        opts.wall = { 
            positions: posCb, 
            material: mat,
            outline: !!this._outlineEnabled,
            outlineColor: oc
        };
    }

    return opts;
  }

  _applySmartGeometry() {
    if (!this.viewer || !this.viewer.entities) return;
    const e = this.viewer.entities.getById(this.id);
    if (!e) return;

    this._updateEntityPosition();
    
    const Cesium = this.cesium;
    const mat = this._resolveMaterial(this._material);
    const oc = this._resolveColor(this._outlineColor);
    const kind = (this.kind || 'polyline').toLowerCase();

    if (kind === 'polyline') {
        if (!e.polyline) {
            let pp = this._normalizePositions(this.polylinePositionsData);
            pp = this._rotatePositions(pp);
            e.polyline = new Cesium.PolylineGraphics({
                positions: pp,
                width: this.polylineWidth || 1,
                material: mat
            });
        } else {
            if (this.polylinePositionsData) {
                let p = this._normalizePositions(this.polylinePositionsData);
                p = this._rotatePositions(p);
                e.polyline.positions = p;
            }
            if (this.polylineWidth) e.polyline.width = this.polylineWidth;
            if (mat) e.polyline.material = mat;
        }
    } else if (kind === 'polylinevolume' || kind === 'polylineVolume') {
        if (!e.polylineVolume) {
            let pv = this._normalizePositions(this.polylinePositionsData);
            pv = this._rotatePositions(pv);
            e.polylineVolume = new Cesium.PolylineVolumeGraphics({
                positions: pv,
                shape: this._normalizeVolumeShape(this.volumeShapeData) || [],
                material: mat
            });
        } else {
            if (this.polylinePositionsData) e.polylineVolume.positions = this._rotatePositions(this._normalizePositions(this.polylinePositionsData));
            if (this.volumeShapeData) e.polylineVolume.shape = this._normalizeVolumeShape(this.volumeShapeData);
            if (mat) e.polylineVolume.material = mat;
        }
    } else if (kind === 'corridor') {
        if (!e.corridor) {
             e.corridor = new Cesium.CorridorGraphics({
                 positions: new Cesium.CallbackProperty(() => {
                     let cp = this._normalizePositions(this.corridorPositionsData);
                     cp = this._rotatePositions(cp);
                     return cp;
                 }, false),
                 width: this.corridorWidth || 1,
                 material: mat,
                 outline: !!this._outlineEnabled,
                 outlineColor: oc
             });
             
        } else {
            if (this.corridorPositionsData) {
                if (!(e.corridor.positions instanceof Cesium.CallbackProperty)) {
                    e.corridor.positions = new Cesium.CallbackProperty(() => {
                        let cp = this._normalizePositions(this.corridorPositionsData);
                        cp = this._rotatePositions(cp);
                        return cp;
                    }, false);
                }
            }
            if (this.corridorWidth) e.corridor.width = this.corridorWidth;
            if (mat) e.corridor.material = mat;
            e.corridor.outline = !!this._outlineEnabled;
            if (oc) e.corridor.outlineColor = oc;
            
        }
    } else if (kind === 'wall') {
        if (!e.wall) {
            e.wall = new Cesium.WallGraphics({
                positions: new Cesium.CallbackProperty(() => {
                    let wp = this._normalizePositions(this.wallPositionsData, true);
                    wp = this._rotatePositions(wp);
                    return wp;
                }, false),
                material: mat,
                outline: !!this._outlineEnabled,
                outlineColor: oc
            });
            
        } else {
            // Wall uses CallbackProperty, so usually we don't need to update positions here if it's already a callback
            // But if the user sets new wallPositionsData, the callback will pick it up automatically because it references this.wallPositionsData.
            // However, if e.wall.positions is NOT a callback (e.g. created externally), we might need to reset it.
            // But _createEntity sets it as callback.
            
            // Just update styles
            if (mat) e.wall.material = mat;
            e.wall.outline = !!this._outlineEnabled;
            if (oc) e.wall.outlineColor = oc;
            
        }
    }
  }
}
