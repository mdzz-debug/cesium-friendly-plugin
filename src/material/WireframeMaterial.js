import * as Cesium from 'cesium';
import BaseMaterial from './BaseMaterial';

export default class WireframeMaterial extends BaseMaterial {
  constructor() {
    super();
    this._color = '#ffffff';
    this._lineWidth = 1;
  }

  /**
   * 设置线框颜色
   * @param {String} color 
   */
  color(color) {
    this._color = color;
    return this;
  }

  /**
   * 设置线宽
   * @param {Number} width 
   */
  lineWidth(width) {
    this._lineWidth = width;
    return this;
  }

  /**
   * 创建材质实例
   * @returns {Cesium.Material}
   */
  create() {
    const options = {
      type: 'Wireframe',
      color: this._color,
      lineWidth: this._lineWidth
    };

    const cacheKey = BaseMaterial.getCacheKey(options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const material = new Cesium.Material({
      fabric: {
        type: 'Wireframe',
        uniforms: {
          color: Cesium.Color.fromCssColorString(this._color),
          lineWidth: this._lineWidth
        }
      }
    });

    this.addToCache(cacheKey, material);
    return material;
  }
}
