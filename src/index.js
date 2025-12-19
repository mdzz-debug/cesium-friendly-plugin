import pointsManager from './core/manager.js';
import { addPoint, addMultiple } from './point/add.js';
import { addBillboard, addMultipleBillboards } from './billboard/add.js';

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

// Common Entity Management API (Promoted to top-level)
pluginInstance.get = (id) => pointsManager.getPoint(id);
pluginInstance.getAll = () => pointsManager.getAllPoints();
pluginInstance.remove = (idOrPoint) => pointsManager.removePoint(idOrPoint);
pluginInstance.removeAll = () => pointsManager.removeAllPoints();
pluginInstance.removeGroup = (groupName) => pointsManager.removeGroup(groupName);
pluginInstance.updatePosition = (id, position) => pointsManager.updatePointPosition(id, position);
pluginInstance.select = (idOrPoint) => {
    const point = typeof idOrPoint === 'string' ? pointsManager.getPoint(idOrPoint) : idOrPoint;
    if (point) pointsManager.select(point);
};
pluginInstance.deselect = () => pointsManager.deselect();
pluginInstance.getSelected = () => pointsManager.getSelectedPoint();

pluginInstance.point = {
  add: (options) => addPoint(pluginInstance, options),
  addMultiple: (list, shared) => addMultiple(pluginInstance, list, shared),
  get: (id) => pointsManager.getByType(id, 'point'),
  getAll: () => pointsManager.getAllByType('point'),
  remove: (idOrPoint) => pointsManager.removePoint(idOrPoint, 'point'), // 仅移除点位类型
  removeAll: () => pointsManager.removeAllPoints('point'),
  updatePosition: (id, position) => pointsManager.updatePointPosition(id, position, 'point'),
  removeGroup: (groupName) => pointsManager.removeGroup(groupName, 'point')
};

pluginInstance.billboard = {
  add: (options) => addBillboard(pluginInstance, options),
  addMultiple: (list, shared) => addMultipleBillboards(pluginInstance, list, shared),
  get: (id) => pointsManager.getByType(id, 'billboard'),
  getAll: () => pointsManager.getAllByType('billboard'),
  remove: (idOrPoint) => pointsManager.removePoint(idOrPoint, 'billboard'),
  removeAll: () => pointsManager.removeAllPoints('billboard'),
  updatePosition: (id, position) => pointsManager.updatePointPosition(id, position, 'billboard'),
  removeGroup: (groupName) => pointsManager.removeGroup(groupName, 'billboard')
};

// Export for ES6 modules
export default pluginInstance;

// Global registration (for browser)
if (typeof window !== 'undefined') {
  window.CesiumFriendlyPlugin = pluginInstance;
}

// Export Vue plugin
export { default as VuePlugin } from './vue-plugin.js';
