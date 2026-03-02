export class EventSystem {
  constructor(viewer, cesium, entityManager) {
    this.viewer = viewer;
    this.cesium = cesium;
    this.entityManager = entityManager;
    this.handler = new cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.eventRegistry = new Map(); // <eventType, Set<callback>>
    this.hoveredEntity = null;
    this.selectedEntity = null; // Track selected entity
    this._defaultCursor = 'default';
  }

  init() {
    this._setupLeftClick();
    this._setupRightClick();
    this._setupMouseMove();
  }

  on(type, callback) {
    if (!this.eventRegistry.has(type)) {
      this.eventRegistry.set(type, new Set());
    }
    this.eventRegistry.get(type).add(callback);
  }

  off(type, callback) {
    if (this.eventRegistry.has(type)) {
      this.eventRegistry.get(type).delete(callback);
    }
  }

  emit(type, payload) {
    if (this.eventRegistry.has(type)) {
      this.eventRegistry.get(type).forEach(cb => cb(payload));
    }
  }

  _pickEntity(position) {
    const picks = this.viewer.scene.drillPick(position) || [];
    for (const picked of picks) {
      let id = null;
      if (picked && picked.id && picked.id instanceof this.cesium.Entity) {
        id = picked.id.id;
      } else if (picked && typeof picked.id === 'string') {
        id = picked.id;
      }
      
      if (id) return id;
    }
    return null;
  }

  _setupLeftClick() {
    this.handler.setInputAction((movement) => {
      const pickedId = this._pickEntity(movement.position);
      
      // --- Select / Unselect Logic ---
      if (pickedId) {
          if (this.selectedEntity === pickedId) {
              // Clicked the same entity -> Toggle Unselect
              this.emit('unselect', { id: this.selectedEntity });
              this.selectedEntity = null;
          } else {
              // Clicked a different entity
              // Unselect previous if any
              if (this.selectedEntity) {
                  this.emit('unselect', { id: this.selectedEntity });
              }
              // Select new
              this.emit('select', { id: pickedId });
              this.selectedEntity = pickedId;
          }
      } else {
          // Clicked empty space
          if (this.selectedEntity) {
              this.emit('unselect', { id: this.selectedEntity });
              this.selectedEntity = null;
          }
      }
      
      // --- Click Logic ---
      if (pickedId) {
        this.emit('click', { id: pickedId, position: movement.position });
      } else {
        // Click on nothing
        this.emit('click', { id: null, position: movement.position });
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  _setupRightClick() {
    this.handler.setInputAction((movement) => {
      const pickedId = this._pickEntity(movement.position);
      if (pickedId) {
        this.emit('rightClick', { id: pickedId, position: movement.position });
      } else {
        this.emit('rightClick', { id: null, position: movement.position });
      }
    }, this.cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  _setupMouseMove() {
    this.handler.setInputAction((movement) => {
      const pickedId = this._pickEntity(movement.endPosition);
      this._updateCursor(pickedId);
      
      // Hover Logic
      if (pickedId !== this.hoveredEntity) {
        if (this.hoveredEntity) {
          this.emit('hoverOut', { id: this.hoveredEntity });
        }
        if (pickedId) {
          this.emit('hoverIn', { id: pickedId });
        }
        this.hoveredEntity = pickedId;
      }

      this.emit('mouseMove', { 
        position: movement.endPosition, 
        startPosition: movement.startPosition,
        hoveredId: pickedId 
      });

    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  _updateCursor(pickedId) {
    if (!this.viewer || !this.viewer.container) return;

    if (!pickedId || !this.entityManager) {
      this.viewer.container.style.cursor = this._defaultCursor;
      return;
    }

    const entity = this.entityManager.get(pickedId);
    const clickable = entity && typeof entity.hasEvent === 'function' &&
      (entity.hasEvent('click') || entity.hasEvent('select'));
    const draggable = !!(entity && entity.isDraggable);

    if (draggable) {
      this.viewer.container.style.cursor = 'grab';
      return;
    }
    this.viewer.container.style.cursor = clickable ? 'pointer' : this._defaultCursor;
  }

  destroy() {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    if (this.viewer && this.viewer.container) {
      this.viewer.container.style.cursor = this._defaultCursor;
    }
    this.eventRegistry.clear();
  }
}
