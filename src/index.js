import pointsManager from './core/manager.js';
import debuggerManager from './debugger/index.js';
import flyManager from './earth/fly.js';
import { createEntityApi } from './entity/index.js';

const pluginInstance = {
  version: '1.0.0',
  _cesium: null,
  _viewer: null
};

pluginInstance.init = function(cesium, viewer, options = {}) {
  this._cesium = cesium;
  this._viewer = viewer;
  pointsManager.init(cesium, viewer);
  flyManager.init(cesium, viewer);
  
  if (options && options.debug) {
    debuggerManager.init();
    debuggerManager.enable();
  }

  return { cesium, viewer };
};
pluginInstance.getCesium = function() {
  return this._cesium;
};
pluginInstance.getViewer = function() {
  return this._viewer;
};

// Initialize Entity API (Exposed immediately for destructuring)
pluginInstance.entity = createEntityApi(pluginInstance);

// Common Entity Management API (Promoted to top-level)
pluginInstance.get = (id) => pointsManager.getPoint(id);
pluginInstance.getAll = () => pointsManager.getAllPoints();
pluginInstance.remove = (idOrPoint) => pointsManager.removePoint(idOrPoint);
pluginInstance.removeAll = () => pointsManager.removeAllPoints();
pluginInstance.removeGroup = (groupName) => pointsManager.removeGroup(groupName);
pluginInstance.showGroup = (groupName) => pointsManager.showGroup(groupName);
pluginInstance.hideGroup = (groupName) => pointsManager.hideGroup(groupName);
pluginInstance.updatePosition = (id, position) => pointsManager.updatePointPosition(id, position);
pluginInstance.select = (idOrPoint) => {
    const point = typeof idOrPoint === 'string' ? pointsManager.getPoint(idOrPoint) : idOrPoint;
    if (point) pointsManager.select(point);
};
pluginInstance.deselect = () => pointsManager.deselect();
pluginInstance.getSelected = () => pointsManager.getSelectedPoint();

// Earth / Camera Control API
pluginInstance.flyTo = (position, orientation, duration) => flyManager.flyTo(position, orientation, duration);
pluginInstance.flyAndOrbit = (position, orientation, duration, cycles) => flyManager.flyAndOrbit(position, orientation, duration, cycles);
pluginInstance.getCurrentCamera = () => flyManager.getCurrentCamera();
pluginInstance.setSurfaceOpacity = (opacity) => flyManager.setSurfaceOpacity(opacity);
pluginInstance.setDepthTest = (enabled) => flyManager.setDepthTest(enabled);

// Export for ES6 modules
export default pluginInstance;

// Global registration (for browser)
if (typeof window !== 'undefined') {
  window.CesiumFriendlyPlugin = pluginInstance;
}

// Export Vue plugin
export { default as VuePlugin } from './vue-plugin.js';
