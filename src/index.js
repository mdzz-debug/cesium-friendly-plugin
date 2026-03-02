import { CesiumApp } from './core/CesiumApp.js';
import VuePlugin from './vue/plugin.js';
import * as Materials from './material/index.js';

// Attach Materials to Class for static access if needed
CesiumApp.Material = Materials;

// Attach install method to CesiumApp class to support app.use(CesiumApp)
// Vue checks for .install property first, even if it is a function/class
CesiumApp.install = VuePlugin.install;

export default CesiumApp;
export { CesiumApp, VuePlugin, Materials };
