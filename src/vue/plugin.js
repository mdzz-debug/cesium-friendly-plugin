import { CesiumApp } from '../core/CesiumApp.js';

let instance = null;
let installOptions = {};
let pendingDebug = undefined;

export default {
  install(Vue, options = {}) {
    installOptions = options || {};
    pendingDebug = installOptions.debug;
    const { cesium, viewer, alias = '$cf' } = installOptions;
    
    if (cesium && viewer) {
        instance = new CesiumApp(viewer, cesium, { debug: pendingDebug });
    }
    
    const $cf = {
        init(viewer, cesium, runtimeOptions = {}) {
            const mergedDebug = runtimeOptions.debug !== undefined ? runtimeOptions.debug : pendingDebug;
            instance = new CesiumApp(viewer, cesium, { ...runtimeOptions, debug: mergedDebug });
            return instance;
        },
        configure(config = {}) {
            if (config && config.debug !== undefined) {
                pendingDebug = config.debug;
                if (instance && typeof instance.setDebug === 'function') {
                    instance.setDebug(config.debug);
                }
            }
            return instance;
        },
        get debug() {
            if (instance && typeof instance.getDebug === 'function') {
                return instance.getDebug();
            }
            return pendingDebug;
        },
        get instance() {
            return instance;
        }
    };
    
    const proxy = new Proxy($cf, {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (instance) {
                // Check Chainable factory methods
                if (typeof instance[prop] === 'function') {
                    return instance[prop].bind(instance);
                }
                return instance[prop];
            }
            return undefined;
        }
    });

    const version = Vue.version ? Number(Vue.version.split('.')[0]) : 2;

    if (version === 3) {
      Vue.config.globalProperties[alias] = proxy;
      Vue.provide('cf', proxy);
    } else {
      Vue.prototype[alias] = proxy;
    }
  }
};
