import * as Cesium from 'cesium';
import BaseMaterial from './BaseMaterial';

export default class ColorMaterial extends BaseMaterial {
  constructor() {
    super();
    this._color = '#ffffff';
    this._alpha = 1;
  }

  /**
   * 设置颜色
   * @param {String} color CSS颜色字符串
   */
  color(color) {
    this._color = color;
    return this;
  }

  /**
   * 设置透明度
   * @param {Number} alpha 
   */
  alpha(alpha) {
    this._alpha = alpha;
    return this;
  }

  /**
   * 创建材质实例
   * @returns {Cesium.Material}
   */
  create() {
    const options = {
      type: 'Color',
      color: this._color,
      alpha: this._alpha
    };

    const cacheKey = BaseMaterial.getCacheKey(options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const color = Cesium.Color.fromCssColorString(this._color).withAlpha(this._alpha);
    const material = Cesium.Material.fromType('Color', { color });

    this.addToCache(cacheKey, material);
    return material;
  }
}
