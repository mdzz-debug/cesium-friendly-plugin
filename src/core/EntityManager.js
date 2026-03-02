import { EntityGroup } from '../entity/EntityGroup.js';
import { Logger } from '../utils/Logger.js';

export class EntityManager {
  constructor(viewer, cesium) {
    this.viewer = viewer;
    this.cesium = cesium;
    this.entities = new Map(); // <id, EntityWrapper>
    this.groups = new Map(); // <groupName, EntityGroup>
    this.dataSources = new Map(); // <name, CustomDataSource>
  }

  add(entityWrapper) {
    if (!entityWrapper || !entityWrapper.id) return;
    
    // Check for duplicates (Same position + Same type + Same group)
    // Note: ID uniqueness is already handled by overwriting below, 
    // but this check is for "logically identical" entities that might have different random IDs.
    const duplicateEntity = this._findDuplicate(entityWrapper);
    if (duplicateEntity) {
        const typeLabel = entityWrapper.type || 'unknown';
        const groupLabel = entityWrapper.options?.group || 'default';
        const posLabel = this._formatPos(entityWrapper.options?.position);

        Logger.warn(
            '检测到重复点位，已拦截本次添加。',
            `类型: ${typeLabel}`,
            `分组: ${groupLabel}`,
            `坐标: ${posLabel}`,
            `新实体ID: ${entityWrapper.id}`,
            `冲突实体ID: ${duplicateEntity.id}`
        );
        return;
    }
    
    // Remove existing if any (ID collision)
    if (this.entities.has(entityWrapper.id)) {
      this.remove(entityWrapper.id);
    }

    this.entities.set(entityWrapper.id, entityWrapper);
    
    if (entityWrapper.onAdd) {
      entityWrapper.onAdd(this.viewer, this.cesium);
    }
    
    // Ensure native entity is added to viewer if wrapper supports addTo
    if (typeof entityWrapper.addTo === 'function') {
        entityWrapper.addTo(this.viewer);
    }
    
    // Auto-grouping
    if (entityWrapper.options && entityWrapper.options.group) {
        this.updateGroup(entityWrapper, entityWrapper.options.group);
    }
  }
  
  _findDuplicate(newEntity) {
      // Rule: Same position + Same type + Same height + Same Group
      // If group is different, it's NOT a duplicate (as per user requirement).
      
      const newPos = newEntity.options.position;
      const newType = newEntity.type;
      const newGroup = newEntity.options.group;
      
      // If no position, skip check (e.g. screen space entity)
      if (!newPos) return null;

      for (const existing of this.entities.values()) {
          // 1. Group check: If groups are different, ignore.
          // User said: "group 如果不同的可以忽略上面的限制" => Different group = Not duplicate.
          // So if (newGroup !== existing.options.group), continue.
          if (newGroup !== existing.options.group) continue;
          
          // 2. Type check
          if (newType !== existing.type) continue;
          
          // 3. Position check
          const exPos = existing.options.position;
          if (!exPos) continue;
          
          if (this._isSamePosition(newPos, exPos)) {
              return existing; // Found duplicate
          }
      }
      return null;
  }
  
  _isSamePosition(pos1, pos2) {
      // Normalize to array or object comparison
      // pos1/pos2 can be [lng, lat, alt] or {lng, lat, alt} or Cartesian3 (unlikely in options, but possible)
      
      const p1 = this._normalizePos(pos1);
      const p2 = this._normalizePos(pos2);
      
      if (!p1 || !p2) return false;
      
      // Tolerance for float comparison
      const epsilon = 0.000001;
      return Math.abs(p1.lng - p2.lng) < epsilon &&
             Math.abs(p1.lat - p2.lat) < epsilon &&
             Math.abs(p1.alt - p2.alt) < epsilon;
  }
  
  _normalizePos(pos) {
      if (Array.isArray(pos)) {
          return { lng: pos[0], lat: pos[1], alt: pos[2] || 0 };
      }
      if (pos.lng !== undefined && pos.lat !== undefined) {
          return { lng: pos.lng, lat: pos.lat, alt: pos.alt || 0 };
      }
      // TODO: Handle Cartesian3 if needed, but options usually store raw coords
      return null;
  }

  _formatPos(pos) {
      const p = this._normalizePos(pos);
      if (!p) return '未知坐标';
      return `${p.lng}, ${p.lat}, ${p.alt}`;
  }

  remove(id) {
    if (this.entities.has(id)) {
      const wrapper = this.entities.get(id);
      if (typeof wrapper.removeFrom === 'function') {
        wrapper.removeFrom(this.viewer);
      } else if (wrapper.onRemove) {
        wrapper.onRemove(this.viewer, this.cesium);
      }
      
      // Remove from group
      // Need to find which group it belongs to if not stored on wrapper
      // BaseEntity now has .group property logic in setGroup, but maybe not initial options
      const groupName = wrapper.group || (wrapper.options ? wrapper.options.group : null);
      if (groupName && this.groups.has(groupName)) {
          this.groups.get(groupName).remove(wrapper);
      }
      
      this.entities.delete(id);
      return true;
    }
    return false;
  }
  
  updateGroup(entity, groupName) {
      if (!groupName) return;
      if (!this.groups.has(groupName)) {
          // Pass context to EntityGroup
          this.groups.set(groupName, new EntityGroup(groupName, { entityManager: this }));
      }
      this.groups.get(groupName).add(entity);
  }
  
  getGroup(name) {
      return this.groups.get(name);
  }
  
  removeGroup(name) {
      if (this.groups.has(name)) {
          const group = this.groups.get(name);
          this.groups.delete(name);
          if (group && typeof group.destroy === 'function') {
              group.destroy();
          }
      }
  }

  get(id) {
    return this.entities.get(id);
  }

  getAll() {
    return Array.from(this.entities.values());
  }

  getGroupEntities(name) {
    const group = this.groups.get(name);
    if (!group) return [];
    return Array.from(group.entities || []);
  }

  queryInfo(query, options = {}) {
    const list = this.getAll();
    return list.filter((entity) => this._matchInfo(entity, query, options));
  }

  removeByQuery(query, options = {}) {
    const list = this.queryInfo(query, options);
    let count = 0;
    list.forEach((e) => {
      if (this.remove(e.id)) count += 1;
    });
    return count;
  }

  _matchInfo(entity, query, options = {}) {
    if (!entity) return false;
    if (typeof query === 'function') {
      return !!query(entity);
    }

    const info = entity.options?.info || {};
    const caseSensitive = !!options.caseSensitive;

    if (typeof query === 'string') {
      const p = query.includes('%') ? query : `%${query}%`;
      return Object.values(info).some((v) => this._likeMatch(v, p, caseSensitive));
    }

    if (query && typeof query === 'object') {
      return Object.keys(query).every((k) => {
        const expected = query[k];
        const actual = info[k];
        if (typeof expected === 'string') {
          const p = expected.includes('%') ? expected : `%${expected}%`;
          return this._likeMatch(actual, p, caseSensitive);
        }
        return actual === expected;
      });
    }

    return false;
  }

  _likeMatch(value, pattern, caseSensitive = false) {
    if (value === undefined || value === null) return false;
    const text = String(value);
    const source = String(pattern ?? '');
    const escaped = source
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/%/g, '.*');
    const flags = caseSensitive ? '' : 'i';
    const re = new RegExp(`^${escaped}$`, flags);
    return re.test(text);
  }

  removeAll() {
    this.entities.forEach((wrapper, id) => {
      this.remove(id);
    });
    this.entities.clear();
    this.groups.clear();
  }

  getDataSource(name) {
    if (this.dataSources.has(name)) {
      return this.dataSources.get(name);
    }
    const ds = new this.cesium.CustomDataSource(name);
    this.viewer.dataSources.add(ds);
    this.dataSources.set(name, ds);
    return ds;
  }
}
