export class DataSourceService {
  constructor(viewer, cesium, app = null) {
    this.viewer = viewer;
    this.cesium = cesium;
    this.app = app;
    this.providers = new Map();
    this.sources = new Map();
    this._registerBuiltins();
  }

  _registerBuiltins() {
    this.registerProvider('geojson', async (input, options = {}) => {
      const Cesium = this.cesium;
      const loadOptions = this._normalizeGeoJSONLoadOptions(options.loadOptions || {});
      return Cesium.GeoJsonDataSource.load(input, loadOptions);
    });

    // Placeholder provider for future geoserver integration.
    this.registerProvider('geoserver', async () => {
      throw new Error('[CesiumFriendly] geoserver provider is not implemented yet. Please register a custom provider.');
    });
  }

  registerProvider(type, loader) {
    if (!type || typeof loader !== 'function') return this;
    this.providers.set(String(type).toLowerCase(), loader);
    return this;
  }

  async load(type, input, options = {}) {
    const key = String(type || '').toLowerCase();
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(`[CesiumFriendly] unknown data provider: ${key}`);
    }
    const ds = await provider(input, options);
    if (!ds) return null;
    await this.viewer.dataSources.add(ds);
    const name = options.name || ds.name || `${key}_${Date.now()}`;
    ds.name = name;
    this.sources.set(name, ds);
    return ds;
  }

  async loadGeoJSON(input, options = {}) {
    return this.load('geojson', input, options);
  }

  remove(nameOrSource) {
    const ds = typeof nameOrSource === 'string' ? this.sources.get(nameOrSource) : nameOrSource;
    if (!ds) return false;
    this.viewer.dataSources.remove(ds, true);
    for (const [k, v] of this.sources.entries()) {
      if (v === ds) this.sources.delete(k);
    }
    return true;
  }

  get(name) {
    return this.sources.get(name);
  }

  getAll() {
    return Array.from(this.sources.values());
  }

  clear() {
    const list = this.getAll();
    list.forEach((ds) => this.viewer.dataSources.remove(ds, true));
    this.sources.clear();
  }

  _normalizeGeoJSONLoadOptions(loadOptions = {}) {
    const out = { ...loadOptions };
    const keys = ['stroke', 'fill', 'markerColor'];
    keys.forEach((k) => {
      if (out[k] === undefined) return;
      out[k] = this._resolveColor(out[k], out[k]);
    });
    return out;
  }

  _resolveColor(value, fallback) {
    if (this.app && typeof this.app.resolveColorToken === 'function') {
      return this.app.resolveColorToken(value, fallback);
    }
    const Cesium = this.cesium;
    if (value instanceof Cesium.Color) return value;
    if (typeof value === 'string') return Cesium.Color.fromCssColorString(value);
    return Cesium.Color.fromCssColorString(typeof fallback === 'string' ? fallback : 'white');
  }
}
