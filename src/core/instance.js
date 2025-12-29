/**
 * Singleton instance of the plugin
 * This is separated to avoid circular dependencies
 */
const pluginInstance = {
  version: '1.0.0',
  _cesium: null,
  _viewer: null
};

export default pluginInstance;
