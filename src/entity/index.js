import { BaseEntity } from './BaseEntity.js';
import { GeometryEntity } from './GeometryEntity.js';
import { PointEntity as PointEntityClass } from './PointEntity.js';
import { BillboardEntity as BillboardEntityClass } from './BillboardEntity.js';
import { LabelEntity as LabelEntityClass } from './LabelEntity.js';
import { SmartGeometryEntity as SmartGeometryEntityClass } from './SmartGeometryEntity.js';
import { EntityGroup } from './EntityGroup.js';
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

  // Helper for query logic
  const matchCriteria = (entity, criteria) => {
      if (!criteria) return true;
      
      // Group check
      if (criteria.group !== undefined && entity.group !== criteria.group) {
          return false;
      }

      // Color check (exact match for now)
      if (criteria.color !== undefined && entity.color !== criteria.color) {
          return false;
      }
      
      // Name check (partial match or exact?) -> let's do partial (includes)
      if (criteria.name !== undefined && (!entity.name || !entity.name.includes(criteria.name))) {
          return false;
      }
      
      // Height check
      if (criteria.minHeight !== undefined || criteria.maxHeight !== undefined) {
          // Try to get height. 
          // For GeometryEntity (Point, etc), it is position[2] or heightOffset.
          // Let's rely on a helper or check props directly.
          let h = 0;
          if (entity.position && entity.position.length > 2) h = entity.position[2];
          if (entity.heightOffset) h += entity.heightOffset;
          
          if (criteria.minHeight !== undefined && h < criteria.minHeight) return false;
          if (criteria.maxHeight !== undefined && h > criteria.maxHeight) return false;
      }
      
      return true;
  };

  const createFactory = (EntityClass, type) => {
      const factory = (arg1, arg2) => {
          const { viewer, cesium } = getContext();
          let options = arg1 || {};
          
          // Legacy support: if first arg is string, ignore it (user cannot set ID)
          if (typeof arg1 === 'string') {
               options = arg2 || {};
          }
          
          const id = generateUUID();
          return new EntityClass(id, viewer, cesium, options);
      };

      // Add Type-Specific Management Methods
      factory.getAll = () => pointsManager.getAllByType(type);
      factory.removeAll = () => pointsManager.removeAllEntities(type);
      factory.remove = (idOrEntity) => pointsManager.removeEntity(idOrEntity);
      factory.get = (id) => {
          const point = pointsManager.getEntity(id);
          return (point && point.type === type) ? point : null;
      };

      factory.getGroup = (groupName) => {
          const groupIds = pointsManager.groups.get(groupName);
          const entities = [];
          
          if (groupIds) {
              for (const id of groupIds) {
                  const p = pointsManager.getEntity(id);
                  if (p && p.type === type) {
                      entities.push(p);
                  }
              }
          }
          return new EntityGroup(entities);
      };
      
      factory.query = (criteria) => {
          const all = pointsManager.getAllByType(type);
          const matches = all.filter(e => matchCriteria(e, criteria));
          return new EntityGroup(matches);
      };

      return new Proxy(factory, {
          get(target, prop, receiver) {
              if (prop in target) {
                  return Reflect.get(target, prop, receiver);
              }
              
              if (EntityClass && EntityClass.prototype && typeof EntityClass.prototype[prop] === 'function') {
                  const { viewer, cesium } = getContext();
                  const id = generateUUID();
                  const entity = new EntityClass(id, viewer, cesium, {});
                  return entity[prop].bind(entity);
              }
              
              return undefined;
          }
      });
  };

  return {
    // Global Accessors
    getAll: () => {
        const all = pointsManager.getAllEntities();
        return new EntityGroup(all);
    },
    
    getGroup: (groupName) => {
        const groupIds = pointsManager.groups.get(groupName);
        const entities = [];
        if (groupIds) {
            for (const id of groupIds) {
                const p = pointsManager.getEntity(id);
                if (p) entities.push(p);
            }
        }
        return new EntityGroup(entities);
    },
    
    query: (criteria) => {
        const all = pointsManager.getAllEntities();
        const matches = all.filter(e => matchCriteria(e, criteria));
        return new EntityGroup(matches);
    },

    point: createFactory(PointEntityClass, 'point'),
    billboard: createFactory(BillboardEntityClass, 'billboard'),
    label: createFactory(LabelEntityClass, 'label'),
    geometry: createFactory(SmartGeometryEntityClass, 'geometry'),
    
    // Future types placeholders
    polyline: (arg1, arg2) => {
        // console.warn('PolylineEntity not yet implemented');
    },
    polygon: (arg1, arg2) => {
        // console.warn('PolygonEntity not yet implemented');
    }
  };
}

// Register Types to BaseEntity for circular dependency resolution in factory methods
BaseEntity.Types = {
    PointEntity: PointEntityClass,
    BillboardEntity: BillboardEntityClass,
    LabelEntity: LabelEntityClass
};

export { BaseEntity, GeometryEntity, PointEntityClass as PointEntity, BillboardEntityClass as BillboardEntity, LabelEntityClass as LabelEntity, SmartGeometryEntityClass as SmartGeometryEntity, EntityGroup };
