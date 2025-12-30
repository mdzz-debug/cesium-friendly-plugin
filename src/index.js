import pluginInstance from './core/instance.js';
import pointsManager from './core/manager.js';
import debuggerManager from './debugger/index.js';
import flyManager from './earth/fly.js';
import { createEntityApi } from './entity/index.js';



pluginInstance.init = function(cesium, viewer, options = {}) {
  console.log('%c 🌍 CesiumFriendlyPlugin Initialized ', 'background: #3b82f6; color: white; padding: 2px 5px; border-radius: 2px; font-weight: bold;');
  console.log('%c 🚀 Ready to fly! ', 'background: #10b981; color: white; padding: 2px 5px; border-radius: 2px; font-weight: bold;');

  this._cesium = cesium;
  
  // Handle Vue Ref or direct object
  // If user passes a Ref (e.g. from Vue setup), we need to unwrap it
  let rawViewer = viewer;
  if (viewer) {
      if (viewer.entities) {
          rawViewer = viewer;
      } else if (viewer.value && viewer.value.entities) {
          // It's likely a Ref
          rawViewer = viewer.value;
      }
  }

  this._viewer = rawViewer;
  pointsManager.init(cesium, rawViewer);
  flyManager.init(cesium, rawViewer);
  
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
const entityApi = createEntityApi(pluginInstance);
pluginInstance.entity = entityApi;
Object.assign(pluginInstance, entityApi);

// Common Entity Management API (Promoted to top-level)
pluginInstance.get = (id) => pointsManager.getEntity(id);
// pluginInstance.getAll is now provided by entityApi (returning EntityGroup)
pluginInstance.remove = (idOrPoint) => pointsManager.removeEntity(idOrPoint);
pluginInstance.delete = (idOrPoint) => pointsManager.removeEntity(idOrPoint); // Alias for consistency
pluginInstance.removeAll = () => pointsManager.removeAllEntities();

// Note: Group operations are now handled via EntityGroup chains.
// e.g. cf.getGroup('myGroup').hide()
// Old removeGroup/showGroup/hideGroup methods are removed to encourage chaining.

pluginInstance.updatePosition = (id, position) => pointsManager.updateEntityPosition(id, position);
pluginInstance.select = (idOrPoint) => {
    const point = typeof idOrPoint === 'string' ? pointsManager.getEntity(idOrPoint) : idOrPoint;
    if (point) pointsManager.select(point);
};
pluginInstance.deselect = () => pointsManager.deselect();
pluginInstance.getSelected = () => pointsManager.getSelectedEntity();

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
