export class DragSystem {
  constructor(viewer, cesium, entityManager) {
    this.viewer = viewer;
    this.cesium = cesium;
    this.entityManager = entityManager;
    this.handler = new cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    this._isDragging = false;
    this._draggedEntity = null;
    this._dragStartPosition = null;
    this._dragPlane = null;
    this._dragOffset = null;
    this._defaultCursor = 'default';
  }

  init() {
    this._setupHandlers();
  }

  _setupHandlers() {
    // LEFT DOWN
    this.handler.setInputAction((click) => {
      const picked = this.viewer.scene.pick(click.position);
      if (picked && picked.id) {
        const id = picked.id instanceof this.cesium.Entity ? picked.id.id : picked.id;
        const entityWrapper = this.entityManager.get(id);
        
        if (entityWrapper && entityWrapper.isDraggable) {
          this._startDrag(entityWrapper, click.position);
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOWN);

    // MOUSE MOVE
    this.handler.setInputAction((movement) => {
      if (this._isDragging && this._draggedEntity) {
        this._updateDrag(movement.endPosition);
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // LEFT UP
    this.handler.setInputAction(() => {
      this._endDrag();
    }, this.cesium.ScreenSpaceEventType.LEFT_UP);
  }

  _startDrag(entityWrapper, position) {
    this._isDragging = true;
    this._draggedEntity = entityWrapper;
    this.viewer.scene.screenSpaceCameraController.enableInputs = false;
    this._dragStartPosition = this.cesium.Cartesian2.clone(position);
    if (this.viewer && this.viewer.container) {
      this.viewer.container.style.cursor = 'grabbing';
    }

    // Calculate Drag Plane & Offset (Logic from old manager.js)
    const entityPos = entityWrapper.position; // Array or Object
    // We need Cartesian3 for plane calculation. 
    // Assuming EntityWrapper has a method to get current Cartesian3 or we compute it.
    // For simplicity, let's re-compute from wrapper's stored position (lng/lat/alt)
    
    let cartesian;
    if (!entityPos) {
        // Safe guard
        return;
    }
    
    if (Array.isArray(entityPos)) {
        cartesian = this.cesium.Cartesian3.fromDegrees(entityPos[0], entityPos[1], entityPos[2] || 0);
    } else {
        // Assuming object {lng, lat, alt} or {x, y, z} if not array
        const lng = entityPos.lng !== undefined ? entityPos.lng : (entityPos.x || 0);
        const lat = entityPos.lat !== undefined ? entityPos.lat : (entityPos.y || 0);
        const alt = entityPos.alt !== undefined ? entityPos.alt : (entityPos.z || 0);
        cartesian = this.cesium.Cartesian3.fromDegrees(lng, lat, alt);
    }

    const normal = this.cesium.Cartesian3.normalize(cartesian, new this.cesium.Cartesian3());
    this._dragPlane = this.cesium.Plane.fromPointNormal(cartesian, normal);

    const ray = this.viewer.camera.getPickRay(position);
    const intersection = this.cesium.IntersectionTests.rayPlane(ray, this._dragPlane);
    
    if (intersection) {
        this._dragOffset = this.cesium.Cartesian3.subtract(cartesian, intersection, new this.cesium.Cartesian3());
    }
    
    if (entityWrapper.trigger) {
        entityWrapper.trigger('dragstart', entityWrapper);
    }
    if (this.viewer && this.viewer.scene && typeof this.viewer.scene.requestRender === 'function') {
        this.viewer.scene.requestRender();
    }
  }

  _updateDrag(screenPosition) {
    if (!this._draggedEntity) return;

    const ray = this.viewer.camera.getPickRay(screenPosition);
    let newPosCartesian = null;

    if (this._dragPlane) {
        const intersection = this.cesium.IntersectionTests.rayPlane(ray, this._dragPlane);
        if (intersection) {
            if (this._dragOffset) {
                this.cesium.Cartesian3.add(intersection, this._dragOffset, intersection);
            }
            newPosCartesian = intersection;
        }
    }

    if (!newPosCartesian) {
        // Fallback to globe pick
        newPosCartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    }

    if (newPosCartesian) {
        const c = this.cesium.Cartographic.fromCartesian(newPosCartesian);
        const lng = this.cesium.Math.toDegrees(c.longitude);
        const lat = this.cesium.Math.toDegrees(c.latitude);
        let alt = c.height;

        const hr = this._draggedEntity?.options?.heightReference;
        if (hr === 'CLAMP_TO_GROUND' || hr === 'RELATIVE_TO_GROUND') {
            alt = 0;
        }
        if (this._draggedEntity?.type === 'circle' || this._draggedEntity?.type === 'rectangle') {
            const hasHeight = this._draggedEntity?.options?.height !== undefined;
            const hasExtruded = this._draggedEntity?.options?.extrudedHeight !== undefined;
            if (!hasHeight && !hasExtruded) {
                alt = 0;
            }
        }

        // Update Entity Wrapper
        if (this._draggedEntity.setPosition) {
            this._draggedEntity.setPosition([lng, lat, alt]);
        }
        
        // Trigger Event on Entity
        if (this._draggedEntity.trigger) {
            this._draggedEntity.trigger('drag', { lng, lat, alt });
        }
        if (this.viewer && this.viewer.scene && typeof this.viewer.scene.requestRender === 'function') {
            this.viewer.scene.requestRender();
        }
    }
  }

  _endDrag() {
    if (this._isDragging && this._draggedEntity) {
      this.viewer.scene.screenSpaceCameraController.enableInputs = true;
        if (this._draggedEntity.trigger) {
            this._draggedEntity.trigger('dragend', this._draggedEntity);
        }
        this._isDragging = false;
        this._draggedEntity = null;
        this._dragPlane = null;
        this._dragOffset = null;
        if (this.viewer && this.viewer.container) {
          this.viewer.container.style.cursor = this._defaultCursor || 'default';
        }
        if (this.viewer && this.viewer.scene && typeof this.viewer.scene.requestRender === 'function') {
            this.viewer.scene.requestRender();
        }
    }
  }

  destroy() {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }
}
