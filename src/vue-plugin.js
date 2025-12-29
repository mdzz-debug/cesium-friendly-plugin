/**
 * Vue Plugin for Cesium Friendly Plugin
 * Supports both Vue 2 and Vue 3
 */

import pluginInstance from './core/instance.js';

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
    const alias = options.alias || '$cf';
    
    // Vue 3
    if (vueVersion === 3) {
      Vue.config.globalProperties[alias] = pluginInstance;
      // Also provide for composition API (inject)
      Vue.provide('cf', pluginInstance);
    } 
    // Vue 2
    else {
      Vue.prototype[alias] = pluginInstance;
    }

    // Auto initialize if cesium and viewer are provided
    if (options.cesium && options.viewer) {
      pluginInstance.init(options.cesium, options.viewer, options);
    }
  }
};

export default VuePlugin;

