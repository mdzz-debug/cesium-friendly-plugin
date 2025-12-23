import { BaseEntity } from './BaseEntity.js';
import { GeometryEntity } from './GeometryEntity.js';
import { PointEntity as PointEntityClass } from './PointEntity.js';
import { BillboardEntity as BillboardEntityClass } from './BillboardEntity.js';
import { LabelEntity as LabelEntityClass } from './LabelEntity.js';
import pointsManager from '../core/manager.js';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Factory function to bind with plugin context
export function createEntityApi(pluginInstance) {
  
  const getContext = () => {
      const viewer = pluginInstance.getViewer();
      const cesium = pluginInstance.getCesium();
      if (!viewer || !cesium) {
          throw new Error('Cesium Friendly Plugin not initialized. Call .init() first.');
      }
      return { viewer, cesium };
  };

  const createFactory = (EntityClass, type) => {
      const factory = (arg1, arg2) => {
          const { viewer, cesium } = getContext();
          let options = arg1 || {};
          
          // Legacy support: if first arg is string, ignore it (user cannot set ID)
          if (typeof arg1 === 'string') {
               console.warn('CesiumFriendlyPlugin: ID is now auto-allocated. The provided ID will be ignored.');
               options = arg2 || {};
          }
          
          const id = generateUUID();
          return new EntityClass(id, viewer, cesium, options);
      };

      // Add Type-Specific Management Methods
      factory.getAll = () => pointsManager.getAllByType(type);
      factory.removeAll = () => pointsManager.removeAllPoints(type);
      factory.remove = (idOrEntity) => pointsManager.removePoint(idOrEntity);
      factory.get = (id) => {
          const point = pointsManager.getPoint(id);
          return (point && point.type === type) ? point : null;
      };

      return factory;
  };

  return {
    point: createFactory(PointEntityClass, 'point'),
    billboard: createFactory(BillboardEntityClass, 'billboard'),
    label: createFactory(LabelEntityClass, 'label'),
    
    // Future types placeholders
    polyline: (arg1, arg2) => {
        console.warn('PolylineEntity not yet implemented');
    },
    polygon: (arg1, arg2) => {
        console.warn('PolygonEntity not yet implemented');
    }
  };
}

// Register Types to BaseEntity for circular dependency resolution in factory methods
BaseEntity.Types = {
    PointEntity: PointEntityClass,
    BillboardEntity: BillboardEntityClass,
    LabelEntity: LabelEntityClass
};

export { BaseEntity, GeometryEntity, PointEntityClass as PointEntity, BillboardEntityClass as BillboardEntity, LabelEntityClass as LabelEntity };
