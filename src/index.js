import * as CesiumLib from 'cesium';
import pluginInstance from './core/instance.js';
import pointsManager from './core/manager.js';
import canvasManager from './core/canvasManager.js';
import debuggerManager from './debugger/index.js';
import flyManager from './earth/fly.js';
import { createEntityApi } from './entity/index.js';
import Material from './material/index.js';
import VuePlugin from './vue-plugin.js';



pluginInstance.init = function(arg1, arg2, arg3) {
  console.log('%c 🌍 CesiumFriendlyPlugin Initialized ', 'background: #3b82f6; color: white; padding: 2px 5px; border-radius: 2px; font-weight: bold;');
  console.log('%c 🚀 Ready to fly! ', 'background: #10b981; color: white; padding: 2px 5px; border-radius: 2px; font-weight: bold;');

  // Argument Resolution
  let cesium, viewer, options;

  // Helper to check if an object looks like a Viewer (or Ref<Viewer>)
  const isViewer = (obj) => {
      if (!obj) return false;
      // Direct viewer object (check for typical properties)
      if (obj.scene && obj.entities && obj.camera) return true;
      // Vue Ref
      if (obj.value && obj.value.scene && obj.value.entities && obj.value.camera) return true;
      return false;
  };

  // Case 1: init(viewer, options) - Cesium inferred
  if (isViewer(arg1)) {
      viewer = arg1;
      options = arg2 || {};
      // Try to resolve Cesium from import or global
      if (typeof CesiumLib !== 'undefined' && CesiumLib.Viewer) {
          cesium = CesiumLib;
      } else if (typeof window !== 'undefined' && window.Cesium) {
          cesium = window.Cesium;
      }
  } 
  // Case 2: init(cesium, viewer, options) - Standard
  else {
      cesium = arg1;
      viewer = arg2;
      options = arg3 || {};
  }

  // Final fallback for cesium if passed as null/undefined in standard signature
  if (!cesium) {
      if (typeof CesiumLib !== 'undefined' && CesiumLib.Viewer) {
          cesium = CesiumLib;
      } else if (typeof window !== 'undefined' && window.Cesium) {
          cesium = window.Cesium;
      }
  }

  if (!cesium) {
      console.warn('[CesiumFriendlyPlugin] Cesium object not found. Please pass it to init() or ensure "cesium" is available as an import or global window.Cesium.');
  }

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
  canvasManager.init(cesium, rawViewer);
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
pluginInstance.select = (idOrPointOrQuery) => {
    // 1. If undefined/null/empty, treat as global deselect
    if (!idOrPointOrQuery) {
        pointsManager.deselect();
        return;
    }

    // 2. Handle ID string or Entity object directly
    const point = typeof idOrPointOrQuery === 'string' ? pointsManager.getEntity(idOrPointOrQuery) : idOrPointOrQuery;
    
    // If it's a valid single entity, select it
    if (point && typeof point.select === 'function') {
        point.select();
        return point; // Return for chaining
    }

    // 3. Handle Query Object (e.g. { group: 'myGroup' }) or EntityGroup
    if (typeof idOrPointOrQuery === 'object') {
        // If it's an EntityGroup (array-like), select the first one or iterate?
        // Selection is usually single-target in this manager.
        // But user asked for "traverse selection" or "query selection".
        // If multiple are matched, usually we can only "select" one primarily (highlighted),
        // or we treat "select" on a group as "select the last one" or "highlight all"?
        // The current pointsManager.select() only supports ONE active selection ID.
        
        // Strategy: 
        // If it's a query/group, we might just return the found entities so user can chain .select() on them?
        // BUT user said "trigger selection by query". 
        // If multiple entities match, selecting ALL simultaneously is not supported by current single-select logic.
        // So we will select the FIRST matching entity found.
        
        let target = null;
        
        // If it's an EntityGroup/Array
        if (Array.isArray(idOrPointOrQuery)) {
            if (idOrPointOrQuery.length > 0) target = idOrPointOrQuery[0];
        } 
        // If it's a query object (not an entity)
        else if (!point && idOrPointOrQuery.constructor === Object) {
            // Try to find entities matching query
            // We can reuse entityApi.query() logic if exposed, or manual search
            // For now simple support: { id: 'x' } or { group: 'g' }
            if (idOrPointOrQuery.id) {
                target = pointsManager.getEntity(idOrPointOrQuery.id);
            } else if (idOrPointOrQuery.group) {
                const ids = pointsManager.groups.get(idOrPointOrQuery.group);
                if (ids && ids.size > 0) {
                     const firstId = ids.values().next().value;
                     target = pointsManager.getEntity(firstId);
                }
            }
        }
        
        if (target) {
            pointsManager.select(target);
            return target;
        }
    }
    
    // If nothing found/selected, maybe deselect?
    // User said "unselected can also be done by id or not passing anything (cancel all)"
    // If id passed but not found -> Deselect? Or Warning?
    // Usually safe to deselect if specific target requested but missing.
    // pointsManager.deselect(); 
};
pluginInstance.deselect = (idOrPoint) => {
    if (!idOrPoint) {
        pointsManager.deselect();
        return;
    }
    
    // Support deselecting specific entity only if it is currently selected
    const id = typeof idOrPoint === 'string' ? idOrPoint : idOrPoint.id;
    if (id && pointsManager.getSelectedId() === id) {
        pointsManager.deselect();
    }
};
pluginInstance.getSelected = () => pointsManager.getSelectedEntity();

// Earth / Camera Control API
pluginInstance.flyTo = (position, orientation, duration) => flyManager.flyTo(position, orientation, duration);
pluginInstance.flyAndOrbit = (position, orientation, duration, cycles) => flyManager.flyAndOrbit(position, orientation, duration, cycles);
pluginInstance.getCurrentCamera = () => flyManager.getCurrentCamera();
pluginInstance.setSurfaceOpacity = (opacity) => flyManager.setSurfaceOpacity(opacity);
pluginInstance.setDepthTest = (enabled) => flyManager.setDepthTest(enabled);

// Material API
pluginInstance.Material = Material;

// Attach install method to pluginInstance for Vue.use() support
pluginInstance.install = VuePlugin.install;

// Export for ES6 modules
export default pluginInstance;
export const cf = pluginInstance; // Support named import: import { cf } from ...

// Global registration (for browser)
if (typeof window !== 'undefined') {
  window.cf = pluginInstance;
}

// Export Vue plugin
export { default as VuePlugin } from './vue-plugin.js';
