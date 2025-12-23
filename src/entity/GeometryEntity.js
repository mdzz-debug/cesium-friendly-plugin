
import { BaseEntity } from './BaseEntity.js';
import pointsManager from '../core/manager.js';

export class GeometryEntity extends BaseEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'geometry';
    
    this.position = options.position || [0, 0, 0]; // [lng, lat, alt]
    this.heightReference = options.heightReference || 'clampToGround';
    this.heightOffset = options.heightOffset || 0;
    this.draggable = options.draggable || false;
  }

  // --- Lifecycle ---
  
  add() {
    if (this.group && this.position) {
      // Exclude ALL entities in the current collection from removal
      // This prevents removing peers when adding a composite entity
      const excludeIds = this._entityCollection ? this._entityCollection.map(e => e.id) : [this.id];
      pointsManager.removeDuplicatesAtPosition(this.position, this.group, excludeIds);
    }
    return super.add();
  }

  // --- Position & Geometry ---

  setPosition(position) {
    this.position = position;
    
    // Calculate new Cartesian3
    if (this.entity) {
        this._updateEntityPosition();
    }
    
    // Handle duplicates if needed (logic from old point.js setGroup/updatePosition)
    if (this.group) {
        pointsManager.removeDuplicatesAtPosition(this.position, this.group, this.id);
    }
    
    return this;
  }

  // Alias for backward compatibility or clarity
  updatePosition(position) {
      return this.setPosition(position);
  }
  
  _updateEntityPosition() {
      if (!this.entity) return;
      
      const isRelative = this.heightReference === 'relativeToGround';
      // If relative, use heightOffset directly.
      // If none, use position[2] + heightOffset (so offset persists/applies in absolute mode too)
      const h = isRelative 
          ? (this.heightOffset || 0) 
          : (this.position[2] || 0) + (this.heightOffset || 0);
      
      this.entity.position = this.cesium.Cartesian3.fromDegrees(
          this.position[0], 
          this.position[1], 
          h
      );
      
      // Also update heightReference prop on graphics if they exist
      this._updateHeightReference();
  }
  
  _updateHeightReference() {
      if (!this.entity) return;
      
      let hr;
      if (this.heightReference === 'clampToGround') {
          hr = this.cesium.HeightReference.CLAMP_TO_GROUND;
      } else if (this.heightReference === 'relativeToGround') {
          hr = this.cesium.HeightReference.RELATIVE_TO_GROUND;
      } else {
          hr = this.cesium.HeightReference.NONE;
      }
      
      // Apply to all known graphics that support heightReference
      if (this.entity.point) this.entity.point.heightReference = hr;
      if (this.entity.billboard) this.entity.billboard.heightReference = hr;
      if (this.entity.label) this.entity.label.heightReference = hr;
      // polyline/polygon/etc might handle it differently (e.g. perPositionHeight)
  }

  _getHeightReferenceEnum() {
      const Cesium = this.cesium;
      if (this.heightReference === 'clampToGround') return Cesium.HeightReference.CLAMP_TO_GROUND;
      if (this.heightReference === 'relativeToGround') return Cesium.HeightReference.RELATIVE_TO_GROUND;
      return Cesium.HeightReference.NONE;
  }

  setHeight(height) {
    this.heightOffset = height || 0;
    
    // Auto update logic from old point.js
    if (this.heightOffset > 0 && this.heightReference === 'clampToGround') {
      this.heightReference = 'relativeToGround';
    }
    
    this._updateEntityPosition();
    return this;
  }

  setHeightReference(reference) {
    // reference: 'none', 'clampToGround', 'relativeToGround'
    this.heightReference = reference;
    this._updateEntityPosition();
    return this;
  }

  setClampToGround(clamp = true) {
    return this.setHeightReference(clamp ? 'clampToGround' : 'none');
  }

  setDraggable(enable) {
    this.draggable = !!enable;
    return this;
  }

  // Override setGroup to include duplicate check
  setGroup(groupName) {
      super.setGroup(groupName);
      if (this.position) {
          pointsManager.removeDuplicatesAtPosition(this.position, this.group, this.id);
      }
      return this;
  }
}
