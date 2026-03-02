import * as Cesium from 'cesium';
import { BaseMaterial } from './BaseMaterial.js';

export class FlowMaterial extends BaseMaterial {
  constructor() {
    super();
    this._url = '';
    this._speed = 0.1;
    this._alpha = 1;
    this._repeat = 1;
  }

  url(url) {
    this._url = url;
    return this;
  }

  speed(speed) {
    this._speed = speed;
    return this;
  }

  alpha(alpha) {
    this._alpha = alpha;
    return this;
  }

  repeat(repeat) {
    this._repeat = repeat;
    return this;
  }

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
      const tickListener = () => {
        if (material && material.uniforms && material.uniforms.offset) {
            material.uniforms.offset.x += this._speed * (viewer.clock.tickDelta || 0.016);
            if (material.uniforms.offset.x > 1) {
              material.uniforms.offset.x -= 1;
            }
        }
      };
      viewer.clock.onTick.addEventListener(tickListener);
      material._tickListener = tickListener;
    }

    this.addToCache(cacheKey, material);
    return material;
  }
}
