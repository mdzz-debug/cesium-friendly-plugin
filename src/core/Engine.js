import { UpdateSystem } from './UpdateSystem.js';

export class Engine {
  constructor(viewer, cesium, entityManager) {
    this.updateSystem = new UpdateSystem(viewer, cesium, entityManager);
  }

  start() {
    this.updateSystem.init();
  }

  stop() {
    this.updateSystem.destroy();
  }
}
