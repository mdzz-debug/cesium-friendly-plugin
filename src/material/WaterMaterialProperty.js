import * as Cesium from 'cesium';

/**
 * 2D 水面材质属性
 * 支持多种预设shader：calm(平静), normal(普通), rough(粗糙), turbulent(湍急)
 */
export default class WaterMaterialProperty {
  constructor(options = {}) {
    this._definitionChanged = new Cesium.Event();
    
    this._baseWaterColor = undefined;
    this._blendColor = undefined;
    this._specularIntensity = undefined;
    this._normalMap = undefined;
    this._frequency = undefined;
    this._animationSpeed = undefined;
    this._amplitude = undefined;
    this._specularMap = undefined;
    this._reflectionIntensity = undefined;
    this._shaderType = undefined;

    const validShaderTypes = ['calm', 'normal', 'rough', 'turbulent'];
    const shaderType = options.shaderType || 'normal';
    const resolvedShaderType = validShaderTypes.includes(shaderType) ? shaderType : 'normal';
    this.shaderType = resolvedShaderType;

    const defaultParamsByType = {
      calm: { frequency: 250.0, animationSpeed: 0.003, amplitude: 3.0, specularIntensity: 0.25 },
      normal: { frequency: 450.0, animationSpeed: 0.006, amplitude: 5.0, specularIntensity: 0.4 },
      rough: { frequency: 650.0, animationSpeed: 0.01, amplitude: 7.0, specularIntensity: 0.55 },
      turbulent: { frequency: 850.0, animationSpeed: 0.014, amplitude: 9.0, specularIntensity: 0.65 }
    };
    const defaults = defaultParamsByType[resolvedShaderType] || defaultParamsByType.normal;

    this.baseWaterColor = options.baseWaterColor || new Cesium.Color(0.2, 0.3, 0.6, 1.0);
    this.blendColor = options.blendColor || new Cesium.Color(0.0, 1.0, 0.699, 1.0);
    this.specularIntensity = options.specularIntensity !== undefined ? options.specularIntensity : defaults.specularIntensity;
    this.normalMap = options.normalMap || 'assets/material/waterNormals.jpg';
    this.frequency = options.frequency !== undefined ? options.frequency : defaults.frequency;
    this.animationSpeed = options.animationSpeed !== undefined ? options.animationSpeed : defaults.animationSpeed;
    this.amplitude = options.amplitude !== undefined ? options.amplitude : defaults.amplitude;
    this.specularMap = options.specularMap;
    this.reflectionIntensity = options.reflectionIntensity !== undefined ? options.reflectionIntensity : 1.0;

    this._registerMaterial();
  }

  get isConstant() {
    return Cesium.Property.isConstant(this._baseWaterColor) &&
           Cesium.Property.isConstant(this._blendColor) &&
           Cesium.Property.isConstant(this._specularIntensity) &&
           Cesium.Property.isConstant(this._normalMap) &&
           Cesium.Property.isConstant(this._frequency) &&
           Cesium.Property.isConstant(this._animationSpeed) &&
           Cesium.Property.isConstant(this._amplitude) &&
           Cesium.Property.isConstant(this._reflectionIntensity) &&
           Cesium.Property.isConstant(this._specularMap) &&
           Cesium.Property.isConstant(this._shaderType);
  }

  get definitionChanged() {
    return this._definitionChanged;
  }

  getType(time) {
    let shaderType = 'normal';
    if (this._shaderType) {
      shaderType = Cesium.Property.getValueOrDefault(this._shaderType, time, 'normal');
    }
    const validShaderTypes = ['calm', 'normal', 'rough', 'turbulent'];
    const type = validShaderTypes.includes(shaderType) ? shaderType : 'normal';
    return `Water${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }

  getValue(time, result) {
    if (!result) {
      result = {};
    }
    const shaderType = Cesium.Property.getValueOrDefault(this._shaderType, time, 'normal');
    const validShaderTypes = ['calm', 'normal', 'rough', 'turbulent'];
    const resolvedShaderType = validShaderTypes.includes(shaderType) ? shaderType : 'normal';
    const defaultParamsByType = {
      calm: { frequency: 250.0, animationSpeed: 0.003, amplitude: 3.0, specularIntensity: 0.25 },
      normal: { frequency: 450.0, animationSpeed: 0.006, amplitude: 5.0, specularIntensity: 0.4 },
      rough: { frequency: 650.0, animationSpeed: 0.01, amplitude: 7.0, specularIntensity: 0.55 },
      turbulent: { frequency: 850.0, animationSpeed: 0.014, amplitude: 9.0, specularIntensity: 0.65 }
    };
    const defaults = defaultParamsByType[resolvedShaderType] || defaultParamsByType.normal;

    result.baseWaterColor = Cesium.Property.getValueOrClonedDefault(this._baseWaterColor, time, Cesium.Color.WHITE, result.baseWaterColor);
    result.blendColor = Cesium.Property.getValueOrClonedDefault(this._blendColor, time, Cesium.Color.WHITE, result.blendColor);
    result.specularIntensity = Cesium.Property.getValueOrDefault(this._specularIntensity, time, defaults.specularIntensity);
    result.normalMap = Cesium.Property.getValueOrDefault(this._normalMap, time, 'assets/material/waterNormals.jpg');
    result.frequency = Cesium.Property.getValueOrDefault(this._frequency, time, defaults.frequency);
    result.animationSpeed = Cesium.Property.getValueOrDefault(this._animationSpeed, time, defaults.animationSpeed);
    result.amplitude = Cesium.Property.getValueOrDefault(this._amplitude, time, defaults.amplitude);
    result.reflectionIntensity = Cesium.Property.getValueOrDefault(this._reflectionIntensity, time, 1.0);
    result.shaderType = resolvedShaderType;
    return result;
  }

  equals(other) {
    return (
      this === other ||
      (other instanceof WaterMaterialProperty &&
        Cesium.Property.equals(this._baseWaterColor, other._baseWaterColor) &&
        Cesium.Property.equals(this._blendColor, other._blendColor) &&
        Cesium.Property.equals(this._specularIntensity, other._specularIntensity) &&
        Cesium.Property.equals(this._normalMap, other._normalMap) &&
        Cesium.Property.equals(this._frequency, other._frequency) &&
        Cesium.Property.equals(this._animationSpeed, other._animationSpeed) &&
        Cesium.Property.equals(this._amplitude, other._amplitude) &&
        Cesium.Property.equals(this._reflectionIntensity, other._reflectionIntensity) &&
        Cesium.Property.equals(this._shaderType, other._shaderType))
    );
  }

  _registerMaterial() {
    if (!Cesium.Material) return;

    // 注册 Calm (平静水面) shader
    if (!Cesium.Material._materialCache.getMaterial('WaterCalm')) {
      Cesium.Material._materialCache.addMaterial('WaterCalm', {
        fabric: {
          type: 'WaterCalm',
          uniforms: {
            baseWaterColor: new Cesium.Color(0.2, 0.3, 0.6, 1.0),
            blendColor: new Cesium.Color(0.0, 1.0, 0.699, 1.0),
            specularIntensity: 0.25,
            normalMap: 'assets/material/waterNormals.jpg',
            frequency: 250.0,
            animationSpeed: 0.003,
            amplitude: 3.0,
            reflectionIntensity: 1.0
          },
          source: `
            uniform vec4 baseWaterColor;
            uniform vec4 blendColor;
            uniform float specularIntensity;
            uniform sampler2D normalMap;
            uniform float frequency;
            uniform float animationSpeed;
            uniform float amplitude;
            uniform float reflectionIntensity;

            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                
                float time = czm_frameNumber * animationSpeed;
                vec2 st = materialInput.st;
                
                // 单层缓慢波浪，使用fract确保纹理重复
                float freqScale = frequency / 100.0;
                vec2 uv = fract(st * freqScale + vec2(time * 0.3, time * 0.2));
                vec4 noiseTex = texture(normalMap, uv);
                vec3 noise = noiseTex.rgb;
                vec3 normalPerturbation = (noise * 2.0 - 1.0) * 0.3;
                
                // 增强颜色混合，让水面波纹更明显
                float noiseIntensity = length(normalPerturbation.xy);
                float blendFactor = clamp(noiseIntensity * 0.6, 0.0, 1.0);
                vec4 color = mix(baseWaterColor, blendColor, blendFactor);
                
                // 计算视角方向（用于高光计算）
                vec3 viewDir = normalize(materialInput.positionToEyeEC);
                vec3 normal = normalize(materialInput.normalEC);
                
                // 添加波光粼粼的高光效果
                // 使用扰动后的法线计算反射
                vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), normal));
                vec3 bitangent = normalize(cross(normal, tangent));
                if (length(tangent) < 0.001) {
                    tangent = normalize(cross(vec3(0.0, 0.0, 1.0), normal));
                    bitangent = normalize(cross(normal, tangent));
                }
                vec3 perturbedNormal = normalize(normal + normalPerturbation.x * tangent * 0.15 + normalPerturbation.y * bitangent * 0.15);
                
                // 计算反射向量和高光
                vec3 reflectDir = reflect(-viewDir, perturbedNormal);
                float specular = pow(max(dot(reflectDir, normalize(vec3(1.0, 1.0, 1.0))), 0.0), 30.0);
                
                // 添加闪烁效果（基于噪声和时间）
                float sparkle = pow(noiseIntensity, 2.0) * (0.5 + 0.5 * sin(time * 4.0 + st.x * 6.0 + st.y * 6.0));
                specular += sparkle * 0.5;
                specular *= reflectionIntensity;
                
                // 菲涅尔效果，边缘更亮
                float fresnel = pow(1.0 - max(dot(viewDir, perturbedNormal), 0.0), 2.0);
                
                // 组合高光效果
                vec3 specularColor = vec3(1.0, 1.0, 1.0) * specularIntensity;
                color.rgb += specularColor * specular * 1.5;
                color.rgb += vec3(1.0, 1.0, 0.9) * fresnel * 0.2;
                
                // 添加基于纹理的亮度变化
                float brightness = 1.0 + noiseIntensity * 0.08 + specular * 0.25;
                color.rgb *= brightness;
                
                // 确保 alpha 使用 baseWaterColor 的 alpha
                color.a = baseWaterColor.a;
                
                material.diffuse = color.rgb;
                material.alpha = color.a;
                material.specular = specularIntensity * 1.2;
                material.shininess = 30.0;
                
                // 轻微的法线扰动
                vec3 bump = normalPerturbation.x * tangent + normalPerturbation.y * bitangent;
                material.normal = normalize(materialInput.normalEC + bump * amplitude * 0.03);

                return material;
            }
          `
        }
      });
    }

    // 注册 Normal (普通水面) shader
    if (!Cesium.Material._materialCache.getMaterial('WaterNormal')) {
      Cesium.Material._materialCache.addMaterial('WaterNormal', {
        fabric: {
          type: 'WaterNormal',
          uniforms: {
            baseWaterColor: new Cesium.Color(0.2, 0.3, 0.6, 1.0),
            blendColor: new Cesium.Color(0.0, 1.0, 0.699, 1.0),
            specularIntensity: 0.4,
            normalMap: 'assets/material/waterNormals.jpg',
            frequency: 450.0,
            animationSpeed: 0.006,
            amplitude: 5.0,
            reflectionIntensity: 1.0
          },
          source: `
            uniform vec4 baseWaterColor;
            uniform vec4 blendColor;
            uniform float specularIntensity;
            uniform sampler2D normalMap;
            uniform float frequency;
            uniform float animationSpeed;
            uniform float amplitude;
            uniform float reflectionIntensity;

            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                
                float time = czm_frameNumber * animationSpeed;
                vec2 st = materialInput.st;
                
                // 确保纹理坐标在有效范围内，使用fract实现重复
                // 双层波浪，标准配置
                // frequency 通常很大（如1000），需要缩放以适应纹理坐标范围
                float freqScale = frequency / 100.0; // 将1000缩放到10左右
                vec2 uv1 = fract(st * freqScale + vec2(time, time * 0.5));
                vec2 uv2 = fract(st * freqScale * 0.8 - vec2(time * 0.5, time));
                
                vec4 noiseTex1 = texture(normalMap, uv1);
                vec4 noiseTex2 = texture(normalMap, uv2);
                vec3 noise1 = noiseTex1.rgb;
                vec3 noise2 = noiseTex2.rgb;
                vec3 normalPerturbation = (((noise1 + noise2) * 0.5) * 2.0 - 1.0) * 0.6;
                
                // 使用纹理强度来增强颜色变化，让水面效果更明显
                float noiseIntensity = length(normalPerturbation.xy);
                float blendFactor = clamp(noiseIntensity * 0.8, 0.0, 1.0);
                
                // 增强颜色混合，让水面波纹更明显
                vec4 color = mix(baseWaterColor, blendColor, blendFactor);
                
                // 计算视角方向（用于高光计算）
                vec3 viewDir = normalize(materialInput.positionToEyeEC);
                vec3 normal = normalize(materialInput.normalEC);
                
                // 添加波光粼粼的高光效果
                vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), normal));
                vec3 bitangent = normalize(cross(normal, tangent));
                if (length(tangent) < 0.001) {
                    tangent = normalize(cross(vec3(0.0, 0.0, 1.0), normal));
                    bitangent = normalize(cross(normal, tangent));
                }
                vec3 perturbedNormal = normalize(normal + normalPerturbation.x * tangent * 0.25 + normalPerturbation.y * bitangent * 0.25);
                
                // 计算反射向量和高光
                vec3 reflectDir = reflect(-viewDir, perturbedNormal);
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float specular = pow(max(dot(reflectDir, lightDir), 0.0), 20.0);
                
                // 添加闪烁效果（多层波浪产生更复杂的光影）
                float sparkle1 = pow(noise1.r, 2.0) * (0.5 + 0.5 * sin(time * 4.0 + st.x * 8.0));
                float sparkle2 = pow(noise2.g, 2.0) * (0.5 + 0.5 * sin(time * 6.0 + st.y * 8.0));
                specular += (sparkle1 + sparkle2) * 0.2;
                specular *= reflectionIntensity;
                
                // 菲涅尔效果
                float fresnel = pow(1.0 - max(dot(viewDir, perturbedNormal), 0.0), 2.0);
                
                // 组合高光效果
                vec3 specularColor = vec3(1.0, 1.0, 1.0) * specularIntensity;
                color.rgb += specularColor * specular * 1.8;
                color.rgb += vec3(1.0, 1.0, 0.95) * fresnel * 0.25;
                
                // 添加基于纹理的亮度变化
                float brightness = 1.0 + noiseIntensity * 0.15 + specular * 0.35;
                color.rgb *= brightness;
                
                // 确保 alpha 使用 baseWaterColor 的 alpha
                color.a = baseWaterColor.a;
                
                material.diffuse = color.rgb;
                material.alpha = color.a;
                material.specular = specularIntensity * 1.3;
                material.shininess = 25.0;
                
                vec3 bump = normalPerturbation.x * tangent + normalPerturbation.y * bitangent;
                material.normal = normalize(materialInput.normalEC + bump * amplitude * 0.05);

                return material;
            }
          `
        }
      });
    }

    // 注册 Rough (粗糙水面) shader
    if (!Cesium.Material._materialCache.getMaterial('WaterRough')) {
      Cesium.Material._materialCache.addMaterial('WaterRough', {
        fabric: {
          type: 'WaterRough',
          uniforms: {
            baseWaterColor: new Cesium.Color(0.2, 0.3, 0.6, 1.0),
            blendColor: new Cesium.Color(0.0, 1.0, 0.699, 1.0),
            specularIntensity: 0.55,
            normalMap: 'assets/material/waterNormals.jpg',
            frequency: 650.0,
            animationSpeed: 0.01,
            amplitude: 7.0,
            reflectionIntensity: 1.0
          },
          source: `
            uniform vec4 baseWaterColor;
            uniform vec4 blendColor;
            uniform float specularIntensity;
            uniform sampler2D normalMap;
            uniform float frequency;
            uniform float animationSpeed;
            uniform float amplitude;
            uniform float reflectionIntensity;

            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                
                float time = czm_frameNumber * animationSpeed;
                vec2 st = materialInput.st;
                
                // 三层波浪，产生更复杂的扰动，使用fract确保纹理重复
                float freqScale = frequency / 100.0;
                vec2 uv1 = fract(st * freqScale + vec2(time, time * 0.7));
                vec2 uv2 = fract(st * freqScale * 0.6 - vec2(time * 0.8, time * 0.3));
                vec2 uv3 = fract(st * freqScale * 1.2 + vec2(time * 0.4, -time * 0.6));
                
                vec4 noiseTex1 = texture(normalMap, uv1);
                vec4 noiseTex2 = texture(normalMap, uv2);
                vec4 noiseTex3 = texture(normalMap, uv3);
                vec3 noise1 = noiseTex1.rgb;
                vec3 noise2 = noiseTex2.rgb;
                vec3 noise3 = noiseTex3.rgb;
                vec3 normalPerturbation = (((noise1 + noise2 * 0.7 + noise3 * 0.5) / 2.2) * 2.0 - 1.0) * 0.7;
                
                // 更强的颜色对比
                float noiseIntensity = length(normalPerturbation.xy);
                float blendFactor = clamp(pow(noiseIntensity, 0.9) * 0.9, 0.0, 1.0);
                vec4 color = mix(baseWaterColor, blendColor, blendFactor);
                
                // 计算视角方向（用于高光计算）
                vec3 viewDir = normalize(materialInput.positionToEyeEC);
                vec3 normal = normalize(materialInput.normalEC);
                
                // 添加波光粼粼的高光效果（粗糙水面，高光更强）
                vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), normal));
                vec3 bitangent = normalize(cross(normal, tangent));
                if (length(tangent) < 0.001) {
                    tangent = normalize(cross(vec3(0.0, 0.0, 1.0), normal));
                    bitangent = normalize(cross(normal, tangent));
                }
                vec3 perturbedNormal = normalize(normal + normalPerturbation.x * tangent * 0.35 + normalPerturbation.y * bitangent * 0.35);
                
                // 计算反射向量和高光
                vec3 reflectDir = reflect(-viewDir, perturbedNormal);
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float specular = pow(max(dot(reflectDir, lightDir), 0.0), 15.0);
                
                // 多层闪烁效果
                float sparkle = (pow(noise1.r, 2.0) + pow(noise2.g, 2.0) + pow(noise3.b, 2.0)) / 3.0;
                sparkle *= (0.6 + 0.4 * sin(time * 8.0 + st.x * 12.0 + st.y * 12.0));
                specular += sparkle * 0.3;
                specular *= reflectionIntensity;
                
                // 菲涅尔效果
                float fresnel = pow(1.0 - max(dot(viewDir, perturbedNormal), 0.0), 1.5);
                
                // 组合高光效果
                vec3 specularColor = vec3(1.0, 1.0, 1.0) * specularIntensity;
                color.rgb += specularColor * specular * 2.2;
                color.rgb += vec3(1.0, 1.0, 0.9) * fresnel * 0.35;
                
                // 添加基于纹理的亮度变化
                float brightness = 1.0 + noiseIntensity * 0.2 + specular * 0.5;
                color.rgb *= brightness;
                
                // 确保 alpha 使用 baseWaterColor 的 alpha
                color.a = baseWaterColor.a;
                
                material.diffuse = color.rgb;
                material.alpha = color.a;
                material.specular = specularIntensity * 1.5;
                material.shininess = 18.0;
                
                vec3 bump = normalPerturbation.x * tangent + normalPerturbation.y * bitangent;
                material.normal = normalize(materialInput.normalEC + bump * amplitude * 0.08);

                return material;
            }
          `
        }
      });
    }

    // 注册 Turbulent (湍急水面) shader
    if (!Cesium.Material._materialCache.getMaterial('WaterTurbulent')) {
      Cesium.Material._materialCache.addMaterial('WaterTurbulent', {
        fabric: {
          type: 'WaterTurbulent',
          uniforms: {
            baseWaterColor: new Cesium.Color(0.2, 0.3, 0.6, 1.0),
            blendColor: new Cesium.Color(0.0, 1.0, 0.699, 1.0),
            specularIntensity: 0.6,
            normalMap: 'assets/material/waterNormals.jpg',
            frequency: 720.0,
            animationSpeed: 0.012,
            amplitude: 8.0,
            reflectionIntensity: 1.0
          },
          source: `
            uniform vec4 baseWaterColor;
            uniform vec4 blendColor;
            uniform float specularIntensity;
            uniform sampler2D normalMap;
            uniform float frequency;
            uniform float animationSpeed;
            uniform float amplitude;
            uniform float reflectionIntensity;

            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                
                float time = czm_frameNumber * animationSpeed;
                vec2 st = materialInput.st;
                
                // 四层波浪，快速动画，产生湍急效果，使用fract确保纹理重复
                float freqScale = frequency / 100.0;
                vec2 uv1 = fract((st + vec2(time * 0.18, time * 0.23)) * freqScale);
                vec2 uv2 = fract((st.yx + vec2(-time * 0.21, time * 0.17)) * (freqScale * 0.8));
                vec2 uv3 = fract((st + st.yx * 0.5 + vec2(time * 0.15, -time * 0.19)) * (freqScale * 1.1));
                vec2 uv4 = fract((st * mat2(0.707, -0.707, 0.707, 0.707) + vec2(-time * 0.13, time * 0.16)) * (freqScale * 0.9));
                
                vec4 noiseTex1 = texture(normalMap, uv1);
                vec4 noiseTex2 = texture(normalMap, uv2);
                vec4 noiseTex3 = texture(normalMap, uv3);
                vec4 noiseTex4 = texture(normalMap, uv4);
                vec3 noise1 = noiseTex1.rgb;
                vec3 noise2 = noiseTex2.rgb;
                vec3 noise3 = noiseTex3.rgb;
                vec3 noise4 = noiseTex4.rgb;
                
                // 复杂的混合，产生湍急感
                vec3 normalPerturbation = (((noise1 + noise2 + noise3 + noise4) * 0.25) * 2.0 - 1.0) * 0.8;
                
                // 强烈的颜色变化
                float noiseIntensity = length(normalPerturbation.xy);
                float blendFactor = clamp(pow(noiseIntensity, 0.8) * 0.9, 0.0, 1.0);
                vec4 color = mix(baseWaterColor, blendColor, blendFactor);
                
                // 计算视角方向（用于高光计算）
                vec3 viewDir = normalize(materialInput.positionToEyeEC);
                vec3 normal = normalize(materialInput.normalEC);
                
                // 添加波光粼粼的高光效果（湍急水面，高光最强烈）
                vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), normal));
                vec3 bitangent = normalize(cross(normal, tangent));
                if (length(tangent) < 0.001) {
                    tangent = normalize(cross(vec3(0.0, 0.0, 1.0), normal));
                    bitangent = normalize(cross(normal, tangent));
                }
                vec3 perturbedNormal = normalize(normal + normalPerturbation.x * tangent * 0.45 + normalPerturbation.y * bitangent * 0.45);
                
                // 计算反射向量和高光
                vec3 reflectDir = reflect(-viewDir, perturbedNormal);
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float specular = pow(max(dot(reflectDir, lightDir), 0.0), 11.0);
                
                // 强烈的多层闪烁效果（湍急水面）
                float sparkle = (pow(noise1.r, 1.1) + pow(noise2.g, 1.1) + pow(noise3.b, 1.1) + pow(noise4.r, 1.1)) * 0.25;
                sparkle *= (0.55 + 0.45 * sin(time * 6.0 + st.x * 6.0 + st.y * 7.0));
                specular += sparkle * 0.28;
                specular *= reflectionIntensity;
                
                // 菲涅尔效果
                float fresnel = pow(1.0 - max(dot(viewDir, perturbedNormal), 0.0), 1.3);
                
                // 组合高光效果
                vec3 specularColor = vec3(1.0, 1.0, 1.0) * specularIntensity;
                color.rgb += specularColor * specular * 2.0;
                color.rgb += vec3(1.0, 1.0, 0.95) * fresnel * 0.35;
                
                // 添加基于纹理的亮度变化，湍急水面更亮
                float brightness = 1.0 + noiseIntensity * 0.22 + specular * 0.5;
                color.rgb *= brightness;
                
                // 确保 alpha 使用 baseWaterColor 的 alpha
                color.a = baseWaterColor.a;
                
                material.diffuse = color.rgb;
                material.alpha = color.a;
                material.specular = specularIntensity * 1.8;
                material.shininess = 12.0;
                
                vec3 bump = normalPerturbation.x * tangent + normalPerturbation.y * bitangent;
                material.normal = normalize(materialInput.normalEC + bump * amplitude * 0.1);

                return material;
            }
          `
        }
      });
    }
  }

  _createProperty(value) {
    if (value && typeof value === 'object' && typeof value.default === 'string') {
      value = value.default;
    }
    if (value instanceof Cesium.Property) {
      return value;
    }
    return new Cesium.ConstantProperty(value);
  }

  _createColorProperty(value) {
    if (value instanceof Cesium.Property) {
      return value;
    }
    if (value && typeof value === 'object' && typeof value.default === 'string') {
      value = value.default;
    }
    if (typeof value === 'string') {
      return new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(value));
    }
    if (value instanceof Cesium.Cartesian4) {
      return new Cesium.ConstantProperty(Cesium.Color.fromCartesian4(value));
    }
    return new Cesium.ConstantProperty(value);
  }

  set baseWaterColor(value) {
    const property = this._createColorProperty(value);
    if (this._baseWaterColor !== property) {
      this._baseWaterColor = property;
      this._definitionChanged.raiseEvent(this);
    }
  }
  
  get baseWaterColor() {
    return this._baseWaterColor;
  }

  set blendColor(value) {
    const property = this._createColorProperty(value);
    if (this._blendColor !== property) {
      this._blendColor = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get blendColor() {
    return this._blendColor;
  }

  set specularIntensity(value) {
    const property = this._createProperty(value);
    if (this._specularIntensity !== property) {
      this._specularIntensity = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get specularIntensity() {
    return this._specularIntensity;
  }

  set normalMap(value) {
    const property = this._createProperty(value);
    if (this._normalMap !== property) {
      this._normalMap = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get normalMap() {
    return this._normalMap;
  }

  set frequency(value) {
    const property = this._createProperty(value);
    if (this._frequency !== property) {
      this._frequency = property;
      this._definitionChanged.raiseEvent(this);
    }
  }
  
  get frequency() {
    return this._frequency;
  }

  set animationSpeed(value) {
    const property = this._createProperty(value);
    if (this._animationSpeed !== property) {
      this._animationSpeed = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get animationSpeed() {
    return this._animationSpeed;
  }

  set amplitude(value) {
    const property = this._createProperty(value);
    if (this._amplitude !== property) {
      this._amplitude = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get amplitude() {
    return this._amplitude;
  }

  set specularMap(value) {
    const property = this._createProperty(value);
    if (this._specularMap !== property) {
      this._specularMap = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get specularMap() {
    return this._specularMap;
  }

  set reflectionIntensity(value) {
    const property = this._createProperty(value);
    if (this._reflectionIntensity !== property) {
      this._reflectionIntensity = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get reflectionIntensity() {
    return this._reflectionIntensity;
  }

  set shaderType(value) {
    const property = this._createProperty(value);
    if (this._shaderType !== property) {
      this._shaderType = property;
      this._definitionChanged.raiseEvent(this);
    }
  }

  get shaderType() {
    return this._shaderType;
  }
}
