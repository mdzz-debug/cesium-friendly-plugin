import * as Cesium from 'cesium';
import { WaterMaterial } from './WaterMaterial.js';
import { Logger } from '../utils/Logger.js';

export class MaterialRegistry {
  constructor(app) {
    this.app = app;
    this._factories = new Map();
    this._schemas = this._createSchemas();
    this._registerBuiltins();
  }

  register(type, factory) {
    const key = this._normalizeType(type);
    if (!key) throw new Error('[CesiumFriendly] material type is required');
    if (typeof factory !== 'function') {
      throw new Error(`[CesiumFriendly] material factory for "${key}" must be a function`);
    }
    this._factories.set(key, factory);
    return this;
  }

  has(type) {
    return this._factories.has(this._normalizeType(type));
  }

  create(input, context = {}) {
    if (input === undefined || input === null) return null;
    if (this._isDirectMaterial(input)) return input;

    if (typeof input === 'string') {
      const type = this._normalizeType(input);
      const factory = this._factories.get(type);
      if (!factory) return null;
      const normalized = this._validateAndNormalizeOptions({ type }, context);
      const created = factory(normalized, context, this.app);
      this._debug('create', { id: context.entity?.id, type: context.geometryType, materialType: type });
      return created;
    }

    if (typeof input === 'object') {
      const merged = this._normalizeMaterialOptions(input);
      const type = this._normalizeType(merged.type);
      if (!type) {
        if (this._isDirectMaterial(input)) return input;
        this._warn('材质配置缺少 type 字段，已忽略该材质配置。', { id: context.entity?.id, input });
        return null;
      }
      const factory = this._factories.get(type);
      if (!factory) {
        this._warn(`未注册材质类型 "${type}"，已忽略该材质配置。`, { id: context.entity?.id, input });
        return null;
      }
      const normalized = this._validateAndNormalizeOptions({ ...merged, type }, context);
      const created = factory(normalized, context, this.app);
      this._debug('create', {
        id: context.entity?.id,
        type: context.geometryType,
        materialType: type,
        keys: Object.keys(normalized || {})
      });
      return created;
    }

    this._warn('材质配置格式不正确，必须是字符串或对象。', { id: context.entity?.id, inputType: typeof input });
    return null;
  }

  update(material, input, context = {}) {
    if (!material || !input || typeof input !== 'object') return material;
    const merged = this._normalizeMaterialOptions(input);
    const materialType = this._normalizeType(merged.type);
    if (!materialType) return material;
    const normalized = this._validateAndNormalizeOptions({ ...merged, type: materialType }, context);

    if (materialType === 'water' && material instanceof WaterMaterial) {
      this._applyWaterMaterial(material, normalized, context);
      this._debug('update', {
        id: context.entity?.id,
        type: context.geometryType,
        materialType,
        keys: Object.keys(normalized || {})
      });
      return material;
    }

    if (materialType === 'flow') {
      this._applyFlowMaterial(material, normalized, context);
      this._debug('update', {
        id: context.entity?.id,
        type: context.geometryType,
        materialType,
        keys: Object.keys(normalized || {})
      });
      return material;
    }

    if (materialType === 'solid' && material instanceof Cesium.Color) {
      const fallback = context.defaultColor || '#3fa7ff';
      const colorInput = normalized.color !== undefined ? normalized.color : (context.options?.color ?? fallback);
      const opacityInput = normalized.opacity !== undefined ? normalized.opacity : context.options?.opacity;
      const color = this.app.resolveColorToken(colorInput, fallback);
      const alpha = opacityInput !== undefined ? this._clamp01(opacityInput) : color.alpha;
      const next = color.withAlpha(alpha);
      material.red = next.red;
      material.green = next.green;
      material.blue = next.blue;
      material.alpha = next.alpha;
      this._debug('update', {
        id: context.entity?.id,
        type: context.geometryType,
        materialType,
        keys: Object.keys(normalized || {})
      });
      return material;
    }

    return material;
  }

  dispose(material, context = {}) {
    if (!material) return;
    try {
      const CesiumApi = this.app?.cesium || Cesium;
      if (material._tickListener && context?.entity?.viewer?.clock?.onTick) {
        context.entity.viewer.clock.onTick.removeEventListener(material._tickListener);
        material._tickListener = null;
      }
      if (material._tickListener && this.app?.viewer?.clock?.onTick) {
        this.app.viewer.clock.onTick.removeEventListener(material._tickListener);
        material._tickListener = null;
      }
      if (material instanceof CesiumApi.Material && typeof material.destroy === 'function' && !material.isDestroyed?.()) {
        material.destroy();
      }
      this._debug('dispose', {
        id: context.entity?.id,
        type: context.geometryType,
        materialType: context.materialType || 'unknown'
      });
    } catch (err) {
      this._warn('材质销毁时发生异常，已忽略。', {
        id: context?.entity?.id,
        error: err?.message || String(err)
      });
    }
  }

  _normalizeType(type) {
    return String(type || '').trim().toLowerCase();
  }

  _isDirectMaterial(value) {
    if (!value) return false;
    if (value instanceof Cesium.Color) return true;
    if (value instanceof Cesium.MaterialProperty) return true;
    if (value instanceof Cesium.Material) return true;
    return typeof value.getType === 'function' || typeof value.getValue === 'function';
  }

  _normalizeMaterialOptions(input = {}) {
    if (!input || typeof input !== 'object') return input;
    const out = { ...input };
    if (input.uniforms && typeof input.uniforms === 'object') {
      Object.assign(out, input.uniforms);
    }
    return out;
  }

  _registerBuiltins() {
    this.register('solid', (options = {}, context = {}, app) => {
      const fallback = context.defaultColor || '#3fa7ff';
      const colorInput = options.color !== undefined ? options.color : (context.options?.color ?? fallback);
      const opacityInput = options.opacity !== undefined ? options.opacity : context.options?.opacity;
      const color = app.resolveColorToken(colorInput, fallback);
      const alpha = opacityInput !== undefined ? this._clamp01(opacityInput) : color.alpha;
      return color.withAlpha(alpha);
    });

    this.register('flow', (options = {}, context = {}, app) => {
      const CesiumApi = app.cesium || Cesium;
      const fallback = context.defaultColor || '#00e5ff';
      const colorInput = options.color !== undefined ? options.color : (context.options?.color ?? fallback);
      const opacityInput = options.opacity !== undefined ? options.opacity : (context.options?.opacity ?? 0.88);
      const glowPower = options.glowPower !== undefined ? Number(options.glowPower) : 0.2;
      const taperPower = options.taperPower !== undefined ? Number(options.taperPower) : 1.0;
      const color = app.resolveColorToken(colorInput, fallback).withAlpha(this._clamp01(opacityInput));

      if (context.geometryType === 'path') {
        return new CesiumApi.PolylineGlowMaterialProperty({
          glowPower: Number.isFinite(glowPower) ? glowPower : 0.2,
          taperPower: Number.isFinite(taperPower) ? taperPower : 1.0,
          color
        });
      }

      const evenColor = color;
      const oddColor = app.resolveColorToken(options.altColor || '#ffffff', '#ffffff').withAlpha(
        this._clamp01(options.altOpacity !== undefined ? options.altOpacity : 0.15)
      );
      return new CesiumApi.StripeMaterialProperty({
        orientation: CesiumApi.StripeOrientation.HORIZONTAL,
        evenColor,
        oddColor,
        repeat: Math.max(1, Number(options.repeat) || 16),
        offset: Number(options.offset) || 0
      });
    });

    this.register('water', (options = {}, context = {}, app) => {
      const CesiumApi = app.cesium || Cesium;
      const defaultNormalMap = CesiumApi.buildModuleUrl
        ? CesiumApi.buildModuleUrl('Assets/Textures/waterNormals.jpg')
        : 'Assets/Textures/waterNormals.jpg';
      const baseWaterColor = options.baseWaterColor || context.options?.color || '#2f7fd3';
      const blendColor = options.blendColor || '#4ad7ff';
      const opacity = this._clamp01(options.opacity !== undefined ? options.opacity : (context.options?.opacity ?? 0.9));

      return new WaterMaterial({
        ...options,
        baseWaterColor: app.resolveColorToken(baseWaterColor, '#2f7fd3').withAlpha(opacity),
        blendColor: app.resolveColorToken(blendColor, '#4ad7ff').withAlpha(opacity),
        normalMap: options.normalMap || defaultNormalMap
      });
    });

    this.register('pulse', (options = {}, context = {}, app) => {
      const CesiumApi = app.cesium || Cesium;
      const fallback = context.defaultColor || '#00e5ff';
      const speed = Number(options.speed ?? 2.2);
      const minOpacity = this._clamp01(options.minOpacity ?? 0.2);
      const maxOpacity = this._clamp01(options.maxOpacity ?? 0.92);
      const baseColor = app.resolveColorToken(options.color || context.options?.color || fallback, fallback);

      if (context.geometryType === 'path') {
        const colorProp = new CesiumApi.CallbackProperty(() => {
          const t = Date.now() * 0.001 * speed;
          const a = minOpacity + (maxOpacity - minOpacity) * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
          return baseColor.withAlpha(a);
        }, false);
        return new CesiumApi.PolylineGlowMaterialProperty({
          glowPower: Number(options.glowPower ?? 0.35),
          taperPower: Number(options.taperPower ?? 0.85),
          color: colorProp
        });
      }

      const colorProp = new CesiumApi.CallbackProperty(() => {
        const t = Date.now() * 0.001 * speed;
        const a = minOpacity + (maxOpacity - minOpacity) * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
        return baseColor.withAlpha(a);
      }, false);
      return new CesiumApi.ColorMaterialProperty(colorProp);
    });

    this.register('radar', (options = {}, context = {}, app) => {
      const CesiumApi = app.cesium || Cesium;
      const fallback = context.defaultColor || '#38e0ff';
      const speed = Number(options.speed ?? 0.9);
      const lineCountNum = Math.max(1, Number(options.lineCount ?? 18));
      const lineThicknessNum = Math.max(0.1, Number(options.lineThickness ?? 2.2));
      const cellAlpha = this._clamp01(options.cellAlpha ?? 0.08);
      const color = app.resolveColorToken(options.color || fallback, fallback).withAlpha(this._clamp01(options.opacity ?? 0.92));

      if (context.geometryType === 'path') {
        const rotatePattern16 = (pattern, shift) => {
          const s = ((shift % 16) + 16) % 16;
          return ((pattern << s) | (pattern >> (16 - s))) & 0xffff;
        };
        return new CesiumApi.PolylineDashMaterialProperty({
          color,
          gapColor: color.withAlpha(this._clamp01(options.gapOpacity ?? 0.04)),
          dashLength: Number(options.dashLength ?? 120),
          dashPattern: new CesiumApi.CallbackProperty(() => {
            const step = Math.floor(Date.now() * 0.001 * speed * 32);
            return rotatePattern16(0xfff0, step);
          }, false)
        });
      }

      return new CesiumApi.GridMaterialProperty({
        color,
        cellAlpha,
        lineCount: new CesiumApi.Cartesian2(lineCountNum, lineCountNum),
        lineThickness: new CesiumApi.Cartesian2(lineThicknessNum, lineThicknessNum),
        lineOffset: new CesiumApi.CallbackProperty(() => {
          const flow = (Date.now() * 0.001 * speed * 0.4) % 1;
          return new CesiumApi.Cartesian2(flow, flow * 0.5);
        }, false)
      });
    });
  }

  _applyWaterMaterial(material, options = {}, context = {}) {
    const CesiumApi = this.app.cesium || Cesium;
    const defaultNormalMap = CesiumApi.buildModuleUrl
      ? CesiumApi.buildModuleUrl('Assets/Textures/waterNormals.jpg')
      : 'Assets/Textures/waterNormals.jpg';
    const baseWaterColor = options.baseWaterColor || context.options?.color;
    if (baseWaterColor !== undefined) {
      material.baseWaterColor = this.app.resolveColorToken(baseWaterColor, '#2f7fd3');
    }
    if (options.blendColor !== undefined) material.blendColor = this.app.resolveColorToken(options.blendColor, '#4ad7ff');
    if (options.opacity !== undefined) {
      const alpha = this._clamp01(options.opacity);
      const base = material.baseWaterColor?.getValue ? material.baseWaterColor.getValue(CesiumApi.JulianDate.now()) : null;
      const blend = material.blendColor?.getValue ? material.blendColor.getValue(CesiumApi.JulianDate.now()) : null;
      if (base) material.baseWaterColor = base.withAlpha(alpha);
      if (blend) material.blendColor = blend.withAlpha(alpha);
    }
    if (options.specularIntensity !== undefined) material.specularIntensity = options.specularIntensity;
    if (options.frequency !== undefined) material.frequency = options.frequency;
    if (options.animationSpeed !== undefined) material.animationSpeed = options.animationSpeed;
    if (options.amplitude !== undefined) material.amplitude = options.amplitude;
    if (options.reflectionIntensity !== undefined) material.reflectionIntensity = options.reflectionIntensity;
    if (options.shaderType !== undefined) material.shaderType = options.shaderType;
    if (options.normalMap !== undefined) {
      material.normalMap = options.normalMap || defaultNormalMap;
    }
  }

  _applyFlowMaterial(material, options = {}, context = {}) {
    const CesiumApi = this.app.cesium || Cesium;
    const fallback = context.defaultColor || '#00e5ff';
    const colorInput = options.color !== undefined ? options.color : context.options?.color;
    const opacityInput = options.opacity !== undefined ? options.opacity : context.options?.opacity;
    const color = this.app.resolveColorToken(colorInput || fallback, fallback).withAlpha(this._clamp01(opacityInput ?? 1));

    if (material instanceof CesiumApi.PolylineGlowMaterialProperty) {
      if (options.glowPower !== undefined) material.glowPower = Math.max(0, Number(options.glowPower) || 0);
      if (options.taperPower !== undefined) material.taperPower = Math.max(0, Number(options.taperPower) || 0);
      material.color = color;
      return;
    }

    if (material instanceof CesiumApi.StripeMaterialProperty) {
      material.evenColor = color;
      if (options.altColor !== undefined || options.altOpacity !== undefined) {
        const alt = this.app.resolveColorToken(options.altColor || '#ffffff', '#ffffff').withAlpha(
          this._clamp01(options.altOpacity !== undefined ? options.altOpacity : 0.15)
        );
        material.oddColor = alt;
      }
      if (options.repeat !== undefined) material.repeat = Math.max(1, Number(options.repeat) || 1);
      if (options.offset !== undefined) material.offset = Number(options.offset) || 0;
    }
  }

  _createSchemas() {
    return {
      solid: {
        opacity: { type: 'number', min: 0, max: 1, default: 1 }
      },
      flow: {
        opacity: { type: 'number', min: 0, max: 1, default: 0.88 },
        glowPower: { type: 'number', min: 0, max: 1, default: 0.2 },
        taperPower: { type: 'number', min: 0, max: 2, default: 1.0 },
        repeat: { type: 'number', min: 1, max: 512, default: 16 },
        altOpacity: { type: 'number', min: 0, max: 1, default: 0.15 }
      },
      water: {
        opacity: { type: 'number', min: 0, max: 1, default: 0.9 },
        frequency: { type: 'number', min: 1, max: 3000, default: 450 },
        animationSpeed: { type: 'number', min: 0, max: 0.2, default: 0.006 },
        amplitude: { type: 'number', min: 0, max: 50, default: 5 },
        specularIntensity: { type: 'number', min: 0, max: 2, default: 0.4 },
        reflectionIntensity: { type: 'number', min: 0, max: 5, default: 1.0 },
        shaderType: { type: 'enum', values: ['calm', 'normal', 'rough', 'turbulent'], default: 'normal' }
      },
      pulse: {
        speed: { type: 'number', min: 0.1, max: 20, default: 2.2 },
        minOpacity: { type: 'number', min: 0, max: 1, default: 0.2 },
        maxOpacity: { type: 'number', min: 0, max: 1, default: 0.92 },
        glowPower: { type: 'number', min: 0, max: 1, default: 0.35 },
        taperPower: { type: 'number', min: 0, max: 2, default: 0.85 }
      },
      radar: {
        speed: { type: 'number', min: 0.1, max: 20, default: 0.9 },
        lineCount: { type: 'number', min: 1, max: 256, default: 18 },
        lineThickness: { type: 'number', min: 0.1, max: 20, default: 2.2 },
        cellAlpha: { type: 'number', min: 0, max: 1, default: 0.08 },
        opacity: { type: 'number', min: 0, max: 1, default: 0.92 },
        gapOpacity: { type: 'number', min: 0, max: 1, default: 0.04 },
        dashLength: { type: 'number', min: 1, max: 2000, default: 120 }
      }
    };
  }

  _validateAndNormalizeOptions(options = {}, context = {}) {
    const out = { ...options };
    const type = this._normalizeType(out.type);
    const schema = this._schemas[type];
    if (!schema) return out;

    Object.keys(schema).forEach((field) => {
      if (out[field] === undefined || out[field] === null) return;
      const rule = schema[field];
      if (rule.type === 'enum') {
        const val = String(out[field] || '').trim().toLowerCase();
        if (!rule.values.includes(val)) {
          this._warn(
            `材质参数 "${field}" 值 "${out[field]}" 不合法，已回退为 "${rule.default}"。`,
            { id: context.entity?.id, materialType: type }
          );
          out[field] = rule.default;
        } else {
          out[field] = val;
        }
        return;
      }

      if (rule.type === 'number') {
        const n = Number(out[field]);
        if (!Number.isFinite(n)) {
          this._warn(
            `材质参数 "${field}" 不是有效数字，已回退为 ${rule.default}。`,
            { id: context.entity?.id, materialType: type }
          );
          out[field] = rule.default;
          return;
        }
        if (n < rule.min || n > rule.max) {
          const clamped = Math.max(rule.min, Math.min(rule.max, n));
          this._warn(
            `材质参数 "${field}" 超出范围 [${rule.min}, ${rule.max}]，已自动修正为 ${clamped}。`,
            { id: context.entity?.id, materialType: type }
          );
          out[field] = clamped;
          return;
        }
        out[field] = n;
      }
    });

    if (type === 'pulse') {
      if (out.minOpacity !== undefined && out.maxOpacity !== undefined && out.minOpacity > out.maxOpacity) {
        this._warn('材质参数 minOpacity 不应大于 maxOpacity，已自动交换。', {
          id: context.entity?.id,
          materialType: type
        });
        const tmp = out.minOpacity;
        out.minOpacity = out.maxOpacity;
        out.maxOpacity = tmp;
      }
    }

    return out;
  }

  _warn(message, payload = {}) {
    Logger.warn(message, payload);
  }

  _debug(action, payload = {}) {
    if (!this.app || typeof this.app.isDebugEnabled !== 'function') return;
    if (!this.app.isDebugEnabled('material')) return;
    Logger.info('[debug:material]', { action, ...payload });
  }

  _clamp01(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(0, Math.min(1, n));
  }
}
