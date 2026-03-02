export class UpdateSystem {
  constructor(viewer, cesium, entityManager) {
    this.viewer = viewer;
    this.cesium = cesium;
    this.entityManager = entityManager;
    this._removeListener = null;
  }

  init() {
    if (this._removeListener) return;
    this._removeListener = this.viewer.clock.onTick.addEventListener((clock) => {
      this._onUpdate(clock.currentTime);
    });
  }

  _onUpdate(time) {
    const entities = this.entityManager.getAll();
    entities.forEach(entity => {
      if (entity.tick && typeof entity.tick === 'function') {
        entity.tick(time);
      }
    });
  }

  destroy() {
    if (this._removeListener) {
      this._removeListener();
      this._removeListener = null;
    }
  }
}
