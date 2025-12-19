import pointsManager from './point/manager.js';
import { addPoint, addMultiple } from './point/add.js';

const pluginInstance = {
  version: '1.0.0',
  _cesium: null,
  _viewer: null
};

pluginInstance.init = function(cesium, viewer) {
  this._cesium = cesium;
  this._viewer = viewer;
  pointsManager.init(cesium, viewer);
  return { cesium, viewer };
};
pluginInstance.getCesium = function() {
  return this._cesium;
};
pluginInstance.getViewer = function() {
  return this._viewer;
};

pluginInstance.point = {
  add: (options) => addPoint(pluginInstance, options),
  addMultiple: (list, shared) => addMultiple(pluginInstance, list, shared),
  get: (id) => pointsManager.getPoint(id),
  getAll: () => pointsManager.getAllPoints(),
  remove: (idOrPoint) => pointsManager.removePoint(idOrPoint), // 支持 id 或 point 对象
  removeAll: () => pointsManager.removeAllPoints(),
  updatePosition: (id, position) => pointsManager.updatePointPosition(id, position),
  removeGroup: (groupName) => pointsManager.removeGroup(groupName)
};

// Export for ES6 modules
export default pluginInstance;

// Global registration (for browser)
if (typeof window !== 'undefined') {
  window.CesiumFriendlyPlugin = pluginInstance;
}

// Export Vue plugin
export { default as VuePlugin } from './vue-plugin.js';
