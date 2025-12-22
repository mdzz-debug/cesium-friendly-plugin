/**
 * Vue Plugin for Cesium Friendly Plugin
 * Supports both Vue 2 and Vue 3
 */

import CesiumFriendlyPlugin from './index.js';

/**
 * Detect Vue version
 */
function getVueVersion(Vue) {
  if (Vue.version) {
    const major = parseInt(Vue.version.split('.')[0]);
    return major;
  }
  // Vue 3 uses app.config.globalProperties
  if (Vue.config && Vue.config.globalProperties) {
    return 3;
  }
  // Vue 2 uses Vue.prototype
  if (Vue.prototype) {
    return 2;
  }
  return 2; // default to Vue 2
}

/**
 * Vue Plugin Installer
 */
const VuePlugin = {
  install(Vue, options = {}) {
    const vueVersion = getVueVersion(Vue);
    
    // Vue 3
    if (vueVersion === 3) {
      Vue.config.globalProperties.$cesiumPlugin = CesiumFriendlyPlugin;
      Vue.provide('cesiumPlugin', CesiumFriendlyPlugin);
    } 
    // Vue 2
    else {
      Vue.prototype.$cesiumPlugin = CesiumFriendlyPlugin;
    }

    // Auto initialize if cesium and viewer are provided
    if (options.cesium && options.viewer) {
      CesiumFriendlyPlugin.init(options.cesium, options.viewer, options);
    }
  }
};

export default VuePlugin;

