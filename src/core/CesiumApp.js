import { EventSystem } from './EventSystem.js';
import { EntityManager } from './EntityManager.js';
import { DragSystem } from './DragSystem.js';
import { Engine } from './Engine.js';
import { Chainable } from './Chainable.js';
import { DataSourceService } from './DataSourceService.js';
import { DEFAULT_COLOR_TOKENS, resolveColorInput } from '../utils/colorResolver.js';
import { normalizeAngleInput, toDegrees, toRadians } from '../utils/angle.js';
import { MaterialRegistry } from '../material/MaterialRegistry.js';

export class CesiumApp {
  constructor(viewer, cesium, options = {}) {
    if (!viewer || !cesium) {
      throw new Error('CesiumApp requires viewer and cesium instance');
    }
    this.viewer = viewer;
    this.cesium = cesium;
    this._runtimeOptions = options || {};
    this._debug = this._normalizeDebugConfig(this._runtimeOptions.debug);
    this._colorTokens = { ...DEFAULT_COLOR_TOKENS, ...(this._runtimeOptions.colors || {}) };
    this.materialRegistry = new MaterialRegistry(this);

    // Initialize Systems
    this.entityManager = new EntityManager(viewer, cesium);
    this.eventSystem = new EventSystem(viewer, cesium, this.entityManager);
    this.dragSystem = new DragSystem(viewer, cesium, this.entityManager);
    this.engine = new Engine(viewer, cesium, this.entityManager);
    this.dataSourceService = new DataSourceService(viewer, cesium, this);
    this.angle = {
      toRadians: (v) => toRadians(this.cesium, v),
      toDegrees: (v) => toDegrees(this.cesium, v),
      normalize: (v, unit = 'auto') => normalizeAngleInput(this.cesium, v, unit)
    };

    // Boot
    this.eventSystem.init();
    this.dragSystem.init();
    this.engine.start();
    
    // Bind Events
    this._bindEvents();
  }

  _normalizeDebugConfig(debug) {
    if (debug === true) {
      return {
        enabled: true,
        all: true,
        animation: true,
        material: true
      };
    }
    if (!debug) {
      return { enabled: false };
    }
    if (typeof debug === 'object') {
      return {
        enabled: debug.enabled !== undefined ? !!debug.enabled : true,
        ...debug
      };
    }
    return { enabled: !!debug };
  }

  setDebug(debug) {
    this._debug = this._normalizeDebugConfig(debug);
    return this;
  }

  setColorPalette(tokens = {}) {
    this._colorTokens = { ...this._colorTokens, ...(tokens || {}) };
    return this;
  }

  getColorPalette() {
    return { ...this._colorTokens };
  }

  resolveColorToken(value, fallback = 'white') {
    return resolveColorInput(this.cesium, value, fallback, this._colorTokens);
  }

  color(value, alpha) {
    const c = this.resolveColorToken(value, 'white');
    if (alpha === undefined) return c;
    const a = Math.max(0, Math.min(1, Number(alpha) || 0));
    return c.withAlpha(a);
  }

  registerMaterial(type, factory) {
    this.materialRegistry.register(type, factory);
    return this;
  }

  createMaterial(input, context = {}) {
    return this.materialRegistry.create(input, context);
  }

  disposeMaterial(material, context = {}) {
    if (!this.materialRegistry || typeof this.materialRegistry.dispose !== 'function') return;
    this.materialRegistry.dispose(material, context);
  }

  toRadians(value) {
    return toRadians(this.cesium, value);
  }

  toDegrees(value) {
    return toDegrees(this.cesium, value);
  }

  normalizeAngle(value, unit = 'auto') {
    return normalizeAngleInput(this.cesium, value, unit);
  }

  getDebug() {
    return { ...this._debug };
  }

  getDebugOptions(namespace) {
    if (!this._debug) return undefined;
    return this._debug[namespace];
  }

  isDebugEnabled(namespace) {
    const d = this._debug || {};
    if (!d.enabled) return false;
    if (d.all === true) return true;
    const item = d[namespace];
    if (item === undefined) return false;
    if (typeof item === 'boolean') return item;
    if (typeof item === 'object') return item.enabled !== false;
    return !!item;
  }

  _bindEvents() {
    // Event Forwarding
    this.eventSystem.on('click', (e) => this._forwardEvent('click', e));
    this.eventSystem.on('rightClick', (e) => this._forwardEvent('rightClick', e));
    this.eventSystem.on('hoverIn', (e) => this._forwardEvent('hoverIn', e));
    this.eventSystem.on('hoverOut', (e) => this._forwardEvent('hoverOut', e));
    this.eventSystem.on('select', (e) => this._forwardEvent('select', e));
    this.eventSystem.on('unselect', (e) => this._forwardEvent('unselect', e));
    
    // Global Event Listeners
    this._globalListeners = new Map();
  }
  
  _forwardEvent(type, payload) {
      if (!payload || !payload.id) return;
      
      const entity = this.entityManager.get(payload.id);
      if (entity && typeof entity.trigger === 'function') {
          entity.trigger(type, entity); // Pass entity itself as payload for chainable convenience
      }
      
      // Also trigger global listeners if any (not implemented yet)
  }

  // --- Public API ---

  create(options) {
      // Factory method delegating to Chainable or direct creation
      // This is where 'object style' comes in
      // e.g. cf.create({ type: 'point', ... })
      return new Chainable(this, options);
  }
  
  // Chainable Entry Points
  point(options) {
      return new Chainable(this).point(options);
  }

  billboard(options) {
      return new Chainable(this).billboard(options);
  }

  label(options) {
      return new Chainable(this).label(options);
  }

  canvas(options) {
      return new Chainable(this).canvas(options);
  }

  circle(options) {
      return new Chainable(this).circle(options);
  }

  rectangle(options) {
      return new Chainable(this).rectangle(options);
  }

  path(options) {
      return new Chainable(this).path(options);
  }

  box(options) {
      return new Chainable(this).box(options);
  }

  cylinder(options) {
      return new Chainable(this).cylinder(options);
  }

  cone(options) {
      return new Chainable(this).cone(options);
  }

  model(options) {
      return new Chainable(this).model(options);
  }

  registerDataProvider(type, loader) {
      this.dataSourceService.registerProvider(type, loader);
      return this;
  }

  loadData(type, input, options = {}) {
      return this.dataSourceService.load(type, input, options);
  }

  loadGeoJSON(input, options = {}) {
      return this.dataSourceService.loadGeoJSON(input, options);
  }

  removeDataSource(nameOrSource) {
      return this.dataSourceService.remove(nameOrSource);
  }

  getDataSource(name) {
      return this.dataSourceService.get(name);
  }

  getEntity(id) {
      return this.entityManager.get(id);
  }

  get(id) {
      return this.getEntity(id);
  }

  getAllEntities() {
      return this.entityManager.getAll();
  }

  getAll() {
      return this.getAllEntities();
  }

  getEntitiesByGroup(name) {
      return this.entityManager.getGroupEntities(name);
  }

  getByGroup(name) {
      return this.getEntitiesByGroup(name);
  }

  queryInfo(query, options = {}) {
      return this.entityManager.queryInfo(query, options);
  }

  removeByQuery(query, options = {}) {
      return this.entityManager.removeByQuery(query, options);
  }

  removeEntity(id) {
      return this.entityManager.remove(id);
  }
  
  // Group API
  getGroup(name) {
      return this.entityManager.getGroup(name);
  }
  
  removeGroup(name) {
      this.entityManager.removeGroup(name);
  }

  removeAll() {
      this.entityManager.removeAll();
  }

  // ... other entry points like label(), model(), etc. will be added dynamically or here
  
  destroy() {
    this.eventSystem.destroy();
    this.dragSystem.destroy();
    this.engine.stop();
    if (this.dataSourceService) this.dataSourceService.clear();
    this.removeAll();
  }
}
