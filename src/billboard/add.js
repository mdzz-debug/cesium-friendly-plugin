/**
 * Add billboard functionality
 * 添加广告牌功能
 */

import { Billboard } from './billboard.js';
import pointsManager from '../core/manager.js';

function resolveImageInput(input) {
  if (input == null) return null;
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (typeof input === 'object') {
    if (typeof input.value !== 'undefined') return resolveImageInput(input.value);
    if (typeof input.default === 'string') return input.default;
    if (typeof input.href === 'string') return input.href;
    if (typeof input.src === 'string') return input.src;
  }
  return input;
}

function hasValidImageInput(input) {
  const v = resolveImageInput(input);
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  return true;
}

const TRANSPARENT_1PX_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+K8ZcAAAAASUVORK5CYII=';

/**
 * Add a billboard (Cesium billboard entity)
 * @param {Object} pluginInstance
 * @param {Object} options
 * @param {Array<number>} options.position - [longitude, latitude, height]
 * @param {string} options.imageUrl - Image URL
 * @param {number} options.scale - Scale factor (default 1.0)
 * @param {number} options.rotation - Rotation in degrees (default 0)
 * @param {boolean} options.draggable - Enable dragging (default false)
 * @param {string} options.name
 * @param {string} options.description
 * @param {string} options.id
 * @returns {Object} Billboard instance
 */
export function addBillboard(pluginInstance, options = {}) {
  const viewer = pluginInstance.getViewer();
  const Cesium = pluginInstance.getCesium();
  const heightOffset = typeof options.heightOffset === 'number' ? options.heightOffset : 0;

  const isPositionArrayInput = Array.isArray(options);
  if (isPositionArrayInput) {
    options = { position: options };
  }

  if (!options.position || !Array.isArray(options.position) || options.position.length < 2) {
    throw new Error('Position is required and must be [longitude, latitude, height]');
  }
  
  const inputImage = options.imageUrl !== undefined ? options.imageUrl : options.image;
  const resolvedImage = hasValidImageInput(inputImage)
    ? resolveImageInput(inputImage)
    : (isPositionArrayInput ? TRANSPARENT_1PX_PNG : null);
  if (!hasValidImageInput(resolvedImage)) {
    throw new Error('imageUrl is required for billboard');
  }

  // pointsManager.removeDuplicatesAtPosition(options.position, options.group);

  // Generate ID
  const id = options.id || `billboard-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  if (pointsManager.hasPoint(id)) {
    throw new Error(`Entity with id "${id}" already exists`);
  }

  // Create Billboard instance
  const billboard = new Billboard(id, {
    ...options,
    imageUrl: resolvedImage,
    cesium: Cesium
  });

  // Create Cesium entity
  const entityOptions = {
    id: id,
    name: billboard.name,
    description: billboard.description,
    show: true
  };

  // Height reference
  let heightReference;
  // 智能推断 heightReference
  // 如果用户显式提供了 heightOffset 且 > 0，但未提供 heightReference，则自动设为 RELATIVE_TO_GROUND
  // 如果用户显式设置了 heightReference，则以用户设置为准
  const userHasHeightOffset = typeof options.heightOffset === 'number' && options.heightOffset > 0;
  const userHasHeightRef = options.heightReference !== undefined;

  let targetHr = billboard.heightReference;
  if (userHasHeightOffset && !userHasHeightRef) {
    targetHr = 'relativeToGround';
    // 同步更新实例状态
    billboard.heightReference = 'relativeToGround';
  } else if (userHasHeightRef) {
    targetHr = billboard.heightReference;
  }

  switch (targetHr) {
    case 'none':
      heightReference = Cesium.HeightReference.NONE;
      break;
    case 'relativeToGround':
      heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
      break;
    case 'clampToGround':
    default:
      heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
      break;
  }
  
  // 双重保险：如果是 clampToGround 但又有高度偏移，强制转为 relativeToGround
  if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND && heightOffset > 0) {
    heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    // 同步更新 billboard 实例状态
    billboard.heightReference = 'relativeToGround';
  }
  const heightValue = heightReference === Cesium.HeightReference.RELATIVE_TO_GROUND
      ? heightOffset
      : (billboard.position[2] || 0);

  // 同步更新 billboard 实例的位置数据
  if (billboard.position && billboard.position.length >= 2) {
      billboard.position = [billboard.position[0], billboard.position[1], heightValue];
  }

  entityOptions.position = Cesium.Cartesian3.fromDegrees(
    billboard.position[0],
    billboard.position[1],
    heightValue
  );

  entityOptions.billboard = {
    image: billboard.imageUrl,
    scale: billboard.scale,
    rotation: Cesium.Math.toRadians(billboard.rotation),
    heightReference: heightReference,
    color: Cesium.Color.fromCssColorString(billboard.color).withAlpha(billboard.opacity)
  };

  const entity = viewer.entities.add(entityOptions);
  billboard.setEntity(entity);

  pointsManager.registerPoint(billboard, options);

  // Bind events if provided in options
  if (options.on && typeof options.on === 'object') {
    for (const eventName in options.on) {
      if (typeof options.on[eventName] === 'function') {
        billboard.on(eventName, options.on[eventName]);
      }
    }
  }
  // Support options.onClick shorthand
  if (typeof options.onClick === 'function') {
    billboard.on('click', options.onClick);
  }

  return billboard;
}

export function addMultipleBillboards(pluginInstance, list = [], shared = {}) {
  const events = shared.on || shared.events || null;
  const created = [];
  for (const item of list) {
    let merged;
    if (Array.isArray(item)) {
      // 如果是坐标数组，无法推断图片，除非 shared 里有
      merged = { ...shared, position: item };
    } else {
      merged = { ...shared, ...item };
    }
    
    delete merged.on;
    delete merged.events;
    
    const mergedImage = merged.imageUrl !== undefined ? merged.imageUrl : merged.image;
    if (!hasValidImageInput(mergedImage)) {
      console.warn('Skipping billboard creation: imageUrl is missing', merged);
      continue;
    }

    const p = addBillboard(pluginInstance, merged);
    if (events && typeof events === 'object') {
      for (const k of Object.keys(events)) {
        const fn = events[k];
        if (typeof fn === 'function') p.on(k, fn);
      }
    }
    created.push(p);
  }
  return created;
}
