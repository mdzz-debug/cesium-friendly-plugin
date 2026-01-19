import BaseMaterial from './BaseMaterial';
import ImageMaterial from './ImageMaterial';
import ColorMaterial from './ColorMaterial';
import WireframeMaterial from './WireframeMaterial';
import FlowMaterial from './FlowMaterial';
import WaterMaterialProperty from './WaterMaterialProperty';
import GridWaterSurface from './GridWaterSurface';

/**
 * 材质工厂类，提供链式调用入口
 */
class Material {
  /**
   * 创建图片材质构建器
   * @returns {ImageMaterial}
   */
  static image() {
    return new ImageMaterial();
  }

  /**
   * 创建纯色材质构建器
   * @returns {ColorMaterial}
   */
  static color() {
    return new ColorMaterial();
  }

  /**
   * 创建线框材质构建器
   * @returns {WireframeMaterial}
   */
  static wireframe() {
    return new WireframeMaterial();
  }

  /**
   * 创建流动材质构建器
   * @returns {FlowMaterial}
   */
  static flow() {
    return new FlowMaterial();
  }

  static water(options) {
    return new WaterMaterialProperty(options);
  }

  static gridWater(options) {
    return new GridWaterSurface(options);
  }

  /**
   * 清除所有材质缓存
   */
  static clearCache() {
    BaseMaterial.clearCache();
  }
}

export {
  Material as default,
  BaseMaterial,
  ImageMaterial,
  ColorMaterial,
  WireframeMaterial,
  FlowMaterial,
  WaterMaterialProperty,
  GridWaterSurface
};
