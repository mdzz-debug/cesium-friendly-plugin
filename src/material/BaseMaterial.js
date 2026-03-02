import * as Cesium from 'cesium';

export class BaseMaterial {
  constructor() {
    this._useCache = true;
  }

  useCache(enable) {
    this._useCache = enable;
    return this;
  }

  static getCacheKey(options) {
    return JSON.stringify(options);
  }

  getFromCache(key) {
    if (this._useCache && BaseMaterial.CACHE.has(key)) {
      return BaseMaterial.CACHE.get(key);
    }
    return null;
  }

  addToCache(key, material) {
    if (this._useCache) {
      BaseMaterial.CACHE.set(key, material);
    }
  }

  static clearCache() {
    BaseMaterial.CACHE.clear();
  }
}

BaseMaterial.CACHE = new Map();
