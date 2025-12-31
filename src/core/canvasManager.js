import pointsManager from './manager.js';

class CanvasManager {
  constructor() {
    this.viewer = null;
    this.cesium = null;
    this._dataSources = new Map();
    this._composites = new Map();
  }
  init(cesium, viewer) {
    this.cesium = cesium;
    this.viewer = viewer;
  }
  getDataSource(name = 'cesium-friendly-canvas') {
    if (!this.viewer || !this.cesium) return null;
    if (this._dataSources.has(name)) return this._dataSources.get(name);
    const list = this.viewer.dataSources.getByName(name);
    if (list.length > 0) {
      const ds = list[0];
      this._dataSources.set(name, ds);
      return ds;
    }
    const ds = new this.cesium.CustomDataSource(name);
    this.viewer.dataSources.add(ds);
    this._dataSources.set(name, ds);
    return ds;
  }
  registerComposite(wrapper, options = {}) {
    if (!wrapper || !wrapper.id) return;
    this._composites.set(wrapper.id, wrapper);
    pointsManager.registerEntity(wrapper, options);
  }
  get(id) {
    return this._composites.get(id);
  }
  removeComposite(idOrWrapper) {
    let id = typeof idOrWrapper === 'string' ? idOrWrapper : idOrWrapper && idOrWrapper.id;
    if (!id) return false;
    const wrapper = this._composites.get(id);
    if (wrapper && typeof wrapper.getCollection === 'function') {
      const col = wrapper.getCollection();
      if (col) {
        const e = wrapper.entity || col.getById(id);
        if (e) col.remove(e);
      }
    }
    this._composites.delete(id);
    pointsManager.removeEntity(id);
    return true;
  }
}

const canvasManager = new CanvasManager();
export default canvasManager;
