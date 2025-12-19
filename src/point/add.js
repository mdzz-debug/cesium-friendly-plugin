/**
 * Add point functionality
 * 添加点位功能
 */

import { Point } from './point.js';
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

/**
 * Add a point (Cesium point entity, screen-pixel sized)
 * @param {Object} pluginInstance
 * @param {Object} options
 * @param {Array<number>} options.position - [longitude, latitude, height]
 * @param {string} options.name
 * @param {string} options.description
 * @param {string} options.color
 * @param {number} options.pixelSize
 * @param {string} options.heightReference - 'none' | 'clampToGround' | 'relativeToGround' (default: 'clampToGround')
 * @param {number} options.heightOffset - relative-to-ground offset (meters)
 * @param {Function} options.onClick
 * @param {string} options.id
 * @returns {Object} Point instance
 */
export function addPoint(pluginInstance, options = {}) {
  const viewer = pluginInstance.getViewer();
  const Cesium = pluginInstance.getCesium();
  const heightOffset = typeof options.heightOffset === 'number' ? options.heightOffset : 0;

  // 兼容传入数组：points.add([lng, lat, h])
  if (Array.isArray(options)) {
    options = { position: options };
  }

  if (!options.position || !Array.isArray(options.position) || options.position.length < 2) {
    throw new Error('Position is required and must be [longitude, latitude, height]');
  }

  // pointsManager.removeDuplicatesAtPosition(options.position, options.group);

  // Generate ID if not provided
  const id = options.id || `point-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  // Check if point already exists
  if (pointsManager.hasPoint(id)) {
    throw new Error(`Point with id "${id}" already exists`);
  }

  // Create point instance
  const point = new Point(id, {
    ...options,
    cesium: Cesium // Pass Cesium object for color operations
  });
  if (point.imageUrl !== null && point.imageUrl !== undefined) {
    point.imageUrl = resolveImageInput(point.imageUrl);
  }

  // Create Cesium entity
  const entityOptions = {
    id: id,
    name: point.name,
    description: point.description,
    show: true // 确保实体可见
  };

  // 转换高度参考配置
  let heightReference;
  // 智能推断 heightReference
  // 如果用户显式提供了 heightOffset 且 > 0，但未提供 heightReference，则自动设为 RELATIVE_TO_GROUND
  // 如果用户显式设置了 heightReference，则以用户设置为准
  const userHasHeightOffset = typeof options.heightOffset === 'number' && options.heightOffset > 0;
  const userHasHeightRef = options.heightReference !== undefined;

  let targetHr = point.heightReference;
  if (userHasHeightOffset && !userHasHeightRef) {
    targetHr = 'relativeToGround';
    // 同步更新实例状态
    point.heightReference = 'relativeToGround';
  } else if (userHasHeightRef) {
    targetHr = point.heightReference;
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
    point.heightReference = 'relativeToGround';
  }
  const heightValue =
    heightReference === Cesium.HeightReference.RELATIVE_TO_GROUND
      ? heightOffset
      : (point.position[2] || 0);

  // 根据是否有 imageUrl 决定创建点或图片点
  const isImage = hasValidImageInput(point.imageUrl);
  if (isImage) {
    entityOptions.position = Cesium.Cartesian3.fromDegrees(
      point.position[0],
      point.position[1],
      heightValue
    );
    entityOptions.billboard = {
      image: resolveImageInput(point.imageUrl),
      heightReference
    };
    if (options.width != null) {
      entityOptions.billboard.width = options.width;
    }
    if (options.height != null) {
      entityOptions.billboard.height = options.height;
    }
  } else {
    entityOptions.point = {
      pixelSize: point.pixelSize,
      color: Cesium.Color.fromCssColorString(point.color),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      heightReference: heightReference,
      sizeInMeters: false
    };
    entityOptions.position = Cesium.Cartesian3.fromDegrees(
      point.position[0],
      point.position[1],
      heightValue
    );
  }
  const entity = viewer.entities.add(entityOptions);
  point.setEntity(entity);
  // console.log('点位渲染类型', { id, type: isImage ? 'billboard' : 'point' });
  if (!isImage && entity.point) {
    const psProp = entity.point.pixelSize;
    const now = viewer.clock?.currentTime;
    const ps = psProp && typeof psProp.getValue === 'function' ? psProp.getValue(now) : psProp;
    const simProp = entity.point.sizeInMeters;
    const sim = simProp && typeof simProp.getValue === 'function' ? simProp.getValue(now) : simProp;
    // console.log('点位像素大小', { id, pixelSize: ps, sizeInMeters: sim });
  }
  if (isImage && entity.billboard) {
    const wProp = entity.billboard.width;
    const hProp = entity.billboard.height;
    const now = viewer.clock?.currentTime;
    const w = wProp && typeof wProp.getValue === 'function' ? wProp.getValue(now) : wProp;
    const h = hProp && typeof hProp.getValue === 'function' ? hProp.getValue(now) : hProp;
    // console.log('图片点位尺寸', { id, width: w === undefined ? 'auto' : w, height: h === undefined ? 'auto' : h });
  }

  pointsManager.registerPoint(point, options);

  // Bind events if provided in options
  if (options.on && typeof options.on === 'object') {
    for (const eventName in options.on) {
      if (typeof options.on[eventName] === 'function') {
        point.on(eventName, options.on[eventName]);
      }
    }
  }
  // Support options.onClick shorthand
  if (typeof options.onClick === 'function') {
    point.on('click', options.onClick);
  }

  return point;
}

export function addMultiple(pluginInstance, list = [], shared = {}) {
  const events = shared.on || shared.events || null;
  const created = [];
  for (const item of list) {
    let merged;
    if (Array.isArray(item)) {
      // 如果是坐标数组 [lng, lat, height?]，转换为对象
      merged = { ...shared, position: item };
    } else {
      // 正常对象
      merged = { ...shared, ...item };
    }
    
    delete merged.on;
    delete merged.events;
    const p = addPoint(pluginInstance, merged);
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
