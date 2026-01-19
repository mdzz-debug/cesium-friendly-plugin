import * as Cesium from 'cesium';
import BaseMaterial from './BaseMaterial';

export default class FlowMaterial extends BaseMaterial {
  constructor() {
    super();
    this._url = '';
    this._speed = 0.1;
    this._alpha = 1;
    this._repeat = 1;
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
   * 设置流动速度
   * @param {Number} speed 
   */
  speed(speed) {
    this._speed = speed;
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
   * 设置重复次数
   * @param {Number} repeat
   */
  repeat(repeat) {
    this._repeat = repeat;
    return this;
  }

  /**
   * 创建材质实例
   * @param {Cesium.Viewer} viewer 需要传入viewer以绑定帧更新事件
   * @returns {Cesium.Material}
   */
  create(viewer) {
    if (!viewer) {
      console.warn('FlowMaterial requires a viewer instance to animate.');
    }

    const options = {
      type: 'Flow',
      url: this._url,
      speed: this._speed,
      alpha: this._alpha,
      repeat: this._repeat
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
          offset: new Cesium.Cartesian2(0, 0),
          alpha: this._alpha
        }
      }
    });

    if (viewer) {
      // 绑定更新逻辑
      const tickListener = () => {
        // 简单的线性流动，假设向x方向流动
        // 注意：如果材质被销毁，这里可能会报错，实际使用需注意解绑
        if (material && material.uniforms && material.uniforms.offset) {
            material.uniforms.offset.x += this._speed * (viewer.clock.tickDelta || 0.016);
            // 保持在 0-1 之间防止溢出 (可选)
            if (material.uniforms.offset.x > 1) {
              material.uniforms.offset.x -= 1;
            }
        }
      };
      viewer.clock.onTick.addEventListener(tickListener);
      
      // 也可以将 listener 挂载到 material 上以便后续移除
      material._tickListener = tickListener;
    }

    this.addToCache(cacheKey, material);
    return material;
  }
}
