import * as Cesium from 'cesium';
import BaseMaterial from './BaseMaterial';

export default class ImageMaterial extends BaseMaterial {
  constructor() {
    super();
    this._url = '';
    this._repeat = 1; // 默认重复次数
    this._alpha = 1;
  }

  /**
   * 设置图片地址
   * @param {String} url 
   */
  url(url) {
    this._url = url;
    return this;
  }

  /**
   * 设置纹理重复次数
   * @param {Number} repeat 
   */
  repeat(repeat) {
    this._repeat = repeat;
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
      type: 'Image',
      url: this._url,
      repeat: this._repeat,
      alpha: this._alpha
    };

    const cacheKey = BaseMaterial.getCacheKey(options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const material = new Cesium.Material({
      fabric: {
        type: 'Image',
        uniforms: {
          image: this._url,
          repeat: new Cesium.Cartesian2(this._repeat, this._repeat),
          alpha: this._alpha
        }
      }
    });

    this.addToCache(cacheKey, material);
    return material;
  }
}
