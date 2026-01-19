import * as Cesium from 'cesium';

export default class BaseMaterial {
  constructor() {
    this._useCache = true;
  }

  /**
   * 设置是否使用缓存
   * @param {Boolean} enable 
   * @returns {BaseMaterial}
   */
  useCache(enable) {
    this._useCache = enable;
    return this;
  }

  /**
   * 生成缓存key
   * @param {Object} options 
   * @returns {String}
   */
  static getCacheKey(options) {
    // 简单按key排序保证一致性，或者直接stringify（如果顺序可控）
    // 为了简单起见，遵循 markdown 示例直接 stringify
    // 但实际生产中最好对 key 排序
    return JSON.stringify(options);
  }

  /**
   * 获取缓存
   * @param {String} key 
   * @returns {Cesium.Material|null}
   */
  getFromCache(key) {
    if (this._useCache && BaseMaterial.CACHE.has(key)) {
      return BaseMaterial.CACHE.get(key);
    }
    return null;
  }

  /**
   * 设置缓存
   * @param {String} key 
   * @param {Cesium.Material} material 
   */
  addToCache(key, material) {
    if (this._useCache) {
      BaseMaterial.CACHE.set(key, material);
    }
  }

  /**
   * 清除所有缓存
   */
  static clearCache() {
    BaseMaterial.CACHE.clear();
  }

  /**
   * 动态更新材质参数
   * @param {Cesium.Material} material 
   * @param {Object} uniforms 
   */
  static update(material, uniforms) {
    if (!material || !material.uniforms) return;
    Object.keys(uniforms).forEach(key => {
      if (material.uniforms.hasOwnProperty(key)) {
        material.uniforms[key] = uniforms[key];
      }
    });
  }
}

// 静态缓存池
BaseMaterial.CACHE = new Map();
