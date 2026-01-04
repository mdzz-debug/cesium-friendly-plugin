import { SmartGeometryEntity } from './SmartGeometryEntity.js';

export class RectangleEntity extends SmartGeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.kind = 'rectangle';
    this.type = 'geometry';
  }

  _createEntity() {
    const Cesium = this.cesium;
    const mat = this._resolveMaterial(this._material);
    const oc = this._resolveColor(this._outlineColor);
    
    // Rectangle doesn't necessarily need a position, but if one is provided in options, we use it for the entity position (e.g. for label or billboard attachment).
    // However, the geometry itself is defined by coordinates.
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

    const coordsCb = new Cesium.CallbackProperty(() => {
        return this._normalizeRectangle(this.rectangleCoordinates);
    }, false);
    opts.rectangle = {
        coordinates: coordsCb,
        material: mat,
        fill: !!this.fill,
        outline: !!this._outlineEnabled,
        outlineColor: oc,
        extrudedHeight: this.extrudedHeight,
        height: 0,
        heightReference: this.cesium.HeightReference.NONE
    };
    
    if (this._outlineWidth) opts.rectangle.outlineWidth = this._outlineWidth;

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

        if (!e.rectangle) {
            e.rectangle = new Cesium.RectangleGraphics({
                coordinates: new Cesium.CallbackProperty(() => this._normalizeRectangle(this.rectangleCoordinates), false),
                material: mat,
                fill: !!this.fill,
                outline: !!this._outlineEnabled,
                outlineColor: oc,
                extrudedHeight: this.extrudedHeight,
                height: 0,
                heightReference: Cesium.HeightReference.NONE
            });
            if (this._outlineWidth) e.rectangle.outlineWidth = this._outlineWidth;
        
        } else {
            if (this.rectangleCoordinates) {
                if (!(e.rectangle.coordinates instanceof Cesium.CallbackProperty)) {
                    e.rectangle.coordinates = new Cesium.CallbackProperty(() => this._normalizeRectangle(this.rectangleCoordinates), false);
                }
            }
            if (this.extrudedHeight !== undefined) e.rectangle.extrudedHeight = this.extrudedHeight;
            if (mat) e.rectangle.material = mat;
            e.rectangle.fill = !!this.fill;
            e.rectangle.outline = !!this._outlineEnabled;
            if (oc) e.rectangle.outlineColor = oc;
            if (this._outlineWidth !== undefined) e.rectangle.outlineWidth = this._outlineWidth;
            // 强制使用 NONE 高度引用，避免不可见
            e.rectangle.height = 0;
            e.rectangle.heightReference = Cesium.HeightReference.NONE;
        
        }
  }
}
