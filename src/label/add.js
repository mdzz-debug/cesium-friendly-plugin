/**
 * Add label functionality
 * 添加文字标签功能
 */

import { Label } from './label.js';
import pointsManager from '../core/manager.js';

export function createLabelEntityOptions(Cesium, id, options) {
  const heightOffset = typeof options.heightOffset === 'number' ? options.heightOffset : 0;
  const isRelative = options.heightReference === 'relativeToGround' || heightOffset !== 0;
  const positionVal = Cesium.Cartesian3.fromDegrees(
    options.position[0], 
    options.position[1], 
    isRelative ? heightOffset : (options.position[2] || 0)
  );
  
  // Font handling
  const fontSize = options.fontSize || 14;
  const bold = options.bold ? 'bold ' : '';
  const font = options.font || `${bold}${fontSize}px sans-serif`;

  const entityOptions = {
    id: id,
    position: positionVal,
    label: {
      text: options.text,
      font: font,
      style: Cesium.LabelStyle[options.style || 'FILL'],
      fillColor: Cesium.Color.fromCssColorString(options.color || '#FFFFFF'),
      scale: options.scale || 1.0,
      pixelOffset: new Cesium.Cartesian2(
        options.pixelOffset ? options.pixelOffset[0] : 0, 
        options.pixelOffset ? options.pixelOffset[1] : 0
      ),
      eyeOffset: new Cesium.Cartesian3(
        options.eyeOffset ? options.eyeOffset[0] : 0,
        options.eyeOffset ? options.eyeOffset[1] : 0,
        options.eyeOffset ? options.eyeOffset[2] : 0
      ),
      horizontalOrigin: Cesium.HorizontalOrigin[options.horizontalOrigin || 'CENTER'],
      verticalOrigin: Cesium.VerticalOrigin[options.verticalOrigin || 'CENTER'],
      heightReference: Cesium.HeightReference[options.heightReference || 'CLAMP_TO_GROUND'],
      disableDepthTestDistance: options.disableDepthTestDistance === false ? undefined : Number.POSITIVE_INFINITY,
    }
  };

  if (options.backgroundColor) {
    entityOptions.label.showBackground = true;
    entityOptions.label.backgroundColor = Cesium.Color.fromCssColorString(options.backgroundColor);
  }

  if (options.distanceDisplayCondition) {
    entityOptions.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
      options.distanceDisplayCondition[0], 
      options.distanceDisplayCondition[1]
    );
  }
  
  if (options.translucencyByDistance) {
      entityOptions.label.translucencyByDistance = new Cesium.NearFarScalar(
          options.translucencyByDistance[0],
          options.translucencyByDistance[1],
          options.translucencyByDistance[2],
          options.translucencyByDistance[3]
      );
  }
  
  if (options.scaleByDistance) {
      entityOptions.label.scaleByDistance = new Cesium.NearFarScalar(
          options.scaleByDistance[0],
          options.scaleByDistance[1],
          options.scaleByDistance[2],
          options.scaleByDistance[3]
      );
  }
  
  return entityOptions;
}

/**
 * Add a label (Cesium label entity)
 * @param {Object} pluginInstance
 * @param {Object} options
 * @param {Array<number>} options.position - [longitude, latitude, height]
 * @param {string} options.text - Label text
 * @param {string} options.color - Text color (CSS string)
 * @param {string} options.backgroundColor - Background color (CSS string)
 * @param {number} options.fontSize - Font size in pixels (default 14)
 * @param {number} options.scale - Scale factor (default 1.0)
 * @param {number} options.minDisplayHeight - Min camera height to show
 * @param {number} options.maxDisplayHeight - Max camera height to show
 * @param {string} options.id
 * @returns {Object} Label instance
 */
export function addLabel(pluginInstance, options = {}) {
  const viewer = pluginInstance.getViewer();
  const Cesium = pluginInstance.getCesium();
  
  const isPositionArrayInput = Array.isArray(options);
  if (isPositionArrayInput) {
    // If input is just array, we can't really create a meaningful label without text
    // But maybe default text?
    throw new Error('Options object with position and text is required for label');
  }

  if (!options.position || !Array.isArray(options.position) || options.position.length < 2) {
    throw new Error('Position is required and must be [longitude, latitude, height]');
  }
  
  if (options.text === undefined || options.text === null) {
      // Allow empty string
      options.text = '';
  }

  const id = options.id || Cesium.createGuid();
  
  // Create Label Wrapper Instance
  const labelObj = new Label(id, {
    ...options,
    cesium: Cesium,
    viewer: viewer
  });

  // Create Cesium Entity
  const entityOptions = createLabelEntityOptions(Cesium, id, options);

  const entity = viewer.entities.add(entityOptions);
  labelObj.setEntity(entity);
  
  // Register with Manager
  pointsManager.registerPoint(labelObj, options);

  // Bind Events
  if (options.on) {
    for (const eventName in options.on) {
      if (typeof options.on[eventName] === 'function') {
        labelObj.on(eventName, options.on[eventName]);
      }
    }
  }

  return labelObj;
}

export function addMultipleLabels(pluginInstance, list = [], shared = {}) {
  const events = shared.on || shared.events || null;
  const created = [];
  for (const item of list) {
    const merged = { ...shared, ...item };
    delete merged.on;
    delete merged.events;
    
    try {
        const l = addLabel(pluginInstance, merged);
        if (events && typeof events === 'object') {
            for (const k of Object.keys(events)) {
                const fn = events[k];
                if (typeof fn === 'function') l.on(k, fn);
            }
        }
        created.push(l);
    } catch (e) {
        console.warn('Skipping label creation:', e);
    }
  }
  return created;
}
