import { Logger } from '../utils/Logger.js';

export class BaseEntity {
  constructor(id, app, options = {}) {
    this.id = id;
    this.app = app;
    this.viewer = app.viewer;
    this.cesium = app.cesium;
    this.options = this._cloneOptionValue(options);
    if (this.options.info === undefined || this.options.info === null) {
      this.options.info = {};
    }
    if (this.options.depthTest === undefined) {
      this.options.depthTest = false; // default: disable depth test
    }
    this.isDraggable = !!options.draggable;
    
    this.entity = null; // Native Cesium Entity
    this._show = true;
    this._eventHandlers = new Map();
    
    // Animation State
    this._animating = false;
    this._animationPaused = false;
    this._animContext = null;
    this._savedState = null;
    this._pendingAnimations = [];
  }

  _isPlainObject(value) {
      if (!value || typeof value !== 'object') return false;
      const proto = Object.getPrototypeOf(value);
      return proto === Object.prototype || proto === null;
  }

  _cloneOptionValue(value) {
      if (Array.isArray(value)) {
          return value.map((item) => this._cloneOptionValue(item));
      }
      if (this._isPlainObject(value)) {
          const cloned = {};
          Object.keys(value).forEach((key) => {
              cloned[key] = this._cloneOptionValue(value[key]);
          });
          return cloned;
      }
      return value;
  }
  
  get position() {
      return this.options.position;
  }

  // --- Lifecycle ---

  addTo(viewer) {
    // This is called by EntityManager usually
    const nativeEntity = this._createEntity();
    if (nativeEntity) {
      if (nativeEntity instanceof this.cesium.Entity) {
        this.entity = this.viewer.entities.add(nativeEntity);
      } else {
        // Configuration object
        this.entity = this.viewer.entities.add(nativeEntity);
      }
      this.onAdd();
      this._flushPendingAnimations();
    }
    return this;
  }
  
  add() {
      if (this.app && this.app.entityManager) {
          this.app.entityManager.add(this);
      }
      return this;
  }

  removeFrom(viewer) {
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
    this.onRemove();
    return this;
  }
  
  remove() {
      if (this.app && this.app.entityManager) {
          this.app.entityManager.remove(this.id);
      }
      return this;
  }
  
  destroy() {
      return this.remove();
  }

  onAdd() {}
  onRemove() {}

  // --- Aliases for Chainable API ---
  
  setDraggable(enable = true) {
      this.isDraggable = !!enable;
      this.options.draggable = this.isDraggable;
      return this;
  }

  draggable(enable = true) {
      return this.setDraggable(enable);
  }

  enableDrag() {
      return this.setDraggable(true);
  }

  disableDrag() {
      return this.setDraggable(false);
  }

  // --- Public API (Chainable via return this) ---

  setVisible(show) {
    this._show = show;
    if (this.entity) {
      this.entity.show = show;
    }
    return this;
  }
  
  show() {
      return this.setVisible(true);
  }
  
  hide() {
      return this.setVisible(false);
  }
  
  setGroup(groupName) {
      this.group = groupName;
      if (this.app && this.app.entityManager) {
          this.app.entityManager.updateGroup(this, groupName);
      }
      return this;
  }

  setPosition(position) {
    this.options.position = position;
    this._updatePosition();
    return this;
  }

  setInfo(info = {}) {
      this.options.info = this._cloneOptionValue(info) || {};
      return this;
  }

  patchInfo(partial = {}) {
      const next = this._isPlainObject(partial) ? partial : {};
      const current = this._isPlainObject(this.options.info) ? this.options.info : {};
      this.options.info = { ...current, ...this._cloneOptionValue(next) };
      return this;
  }

  getInfo() {
      return this.options.info || {};
  }

  clearInfo() {
      this.options.info = {};
      return this;
  }
  
  // --- Common Configuration ---
  
  setOpacity(opacity) {
      this.options.opacity = opacity;
      return this;
  }

  setMaterial(material) {
      this.options.material = material;
      return this;
  }
  
  setPixelOffset(x, y) {
      this.options.pixelOffset = { x, y };
      return this;
  }

  setEyeOffset(x, y, z) {
      if (Array.isArray(x)) {
          this.options.eyeOffset = { x: x[0] || 0, y: x[1] || 0, z: x[2] || 0 };
          return this;
      }
      if (x && typeof x === 'object') {
          this.options.eyeOffset = { x: x.x || 0, y: x.y || 0, z: x.z || 0 };
          return this;
      }
      this.options.eyeOffset = { x: x || 0, y: y || 0, z: z || 0 };
      return this;
  }

  setDepthTest(enable = false) {
      this.options.depthTest = !!enable;
      return this;
  }

  setDisableDepthTestDistance(distance) {
      this.options.disableDepthTestDistance = distance;
      return this;
  }

  setHorizontalOrigin(origin) {
      this.options.horizontalOrigin = origin;
      return this;
  }

  setVerticalOrigin(origin) {
      this.options.verticalOrigin = origin;
      return this;
  }
  
  setVisibleRange(options) {
      if (options === null) {
          this.options.distanceDisplayCondition = undefined;
          return this;
      }
      const { near, far } = options || {};
      const current = this.options.distanceDisplayCondition || {};
      
      const n = near !== undefined ? near : (current.near !== undefined ? current.near : 0);
      
      // Default far to near * 10
      let defaultFar = (n > 0) ? n * 10 : 100000;
      let f = far !== undefined ? far : (current.far !== undefined ? current.far : defaultFar);
      
      // Ensure far > near
      if (f <= n) {
          f = (n > 0) ? n * 10 : n + 10000;
      }
      
      // Let's store as near/far in options to match user input.
      this.options.distanceDisplayCondition = { near: n, far: f };
      return this;
  }

  setDistanceDisplayCondition(options) {
      // Backward-compatible alias
      return this.setVisibleRange(options);
  }

  setScaleByDistance(options) {
      if (options === null) {
          this.options.scaleByDistance = undefined;
          return this;
      }

      const current = this.options.scaleByDistance || {};
      const near = options?.near !== undefined ? options.near : (current.near !== undefined ? current.near : 0);
      const far = options?.far !== undefined ? options.far : (current.far !== undefined ? current.far : near + 100000);

      this.options.scaleByDistance = {
          near,
          far: far > near ? far : near + 10000,
          nearValue: options?.nearValue !== undefined ? options.nearValue : (current.nearValue !== undefined ? current.nearValue : 1.0),
          farValue: options?.farValue !== undefined ? options.farValue : (current.farValue !== undefined ? current.farValue : 0.2)
      };
      return this;
  }

  setTranslucencyByDistance(options) {
      if (options === null) {
          this.options.translucencyByDistance = undefined;
          return this;
      }

      const current = this.options.translucencyByDistance || {};
      const near = options?.near !== undefined ? options.near : (current.near !== undefined ? current.near : 0);
      const far = options?.far !== undefined ? options.far : (current.far !== undefined ? current.far : near + 100000);

      this.options.translucencyByDistance = {
          near,
          far: far > near ? far : near + 10000,
          nearValue: options?.nearValue !== undefined ? options.nearValue : (current.nearValue !== undefined ? current.nearValue : 1.0),
          farValue: options?.farValue !== undefined ? options.farValue : (current.farValue !== undefined ? current.farValue : 0.0)
      };
      return this;
  }
  
  setHeight(height) {
      const pos = this.options.position;
      if (Array.isArray(pos)) {
          // [lng, lat] or [lng, lat, alt]
          this.options.position = [pos[0], pos[1], height];
      } else if (pos && typeof pos === 'object') {
          if (pos.lng !== undefined) {
              this.options.position = { ...pos, alt: height };
          }
      }
      // If position is not set yet, we can't really set height easily without lng/lat.
      // We'll assume position is set first.
      return this;
  }
  
  setHeightReference(reference) {
      // reference: 'NONE' | 'CLAMP_TO_GROUND' | 'RELATIVE_TO_GROUND'
      this.options.heightReference = reference;
      return this;
  }
  
  setClampToGround(enable) {
      this.options.heightReference = enable ? 'CLAMP_TO_GROUND' : 'NONE';
      return this;
  }

  flyTo(options = {}) {
      if (!this.viewer || !this.viewer.camera) return this;

      const destination = this._resolveFlyToDestination();
      if (!destination) return this;

      const duration = options.duration !== undefined ? options.duration : 2;
      const orientation = options.orientation || undefined;
      const heading = options.heading !== undefined ? options.heading : 0;
      const pitch = options.pitch !== undefined ? options.pitch : -0.6;
      const range = options.range;
      const height = options.height;

      // Preferred: use range to avoid "贴脸飞过去".
      // 1) If native entity exists, let viewer compute its bounding sphere.
      if (range !== undefined && this.entity && typeof this.viewer.flyTo === 'function') {
        this.viewer.flyTo(this.entity, {
          duration,
          offset: new this.cesium.HeadingPitchRange(heading, pitch, range)
        });
        return this;
      }

      // 2) Fallback: fly to a synthetic sphere around destination.
      if (range !== undefined && this.viewer.camera && typeof this.viewer.camera.flyToBoundingSphere === 'function') {
          const sphere = new this.cesium.BoundingSphere(destination, 1.0);
          this.viewer.camera.flyToBoundingSphere(sphere, {
              duration,
              offset: new this.cesium.HeadingPitchRange(heading, pitch, range)
          });
          return this;
      }

      let finalDestination = destination;
      if (height !== undefined) {
          const c = this.cesium.Cartographic.fromCartesian(destination);
          finalDestination = this.cesium.Cartesian3.fromRadians(
              c.longitude,
              c.latitude,
              Number(height) || 0
          );
      }

      this.viewer.camera.flyTo({
          destination: finalDestination,
          duration,
          orientation
      });
      return this;
  }

  // --- Events ---

  on(type, callback) {
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, new Set());
    }
    this._eventHandlers.get(type).add(callback);
    return this;
  }

  hasEvent(type) {
    if (!this._eventHandlers.has(type)) return false;
    return this._eventHandlers.get(type).size > 0;
  }

  off(type, callback) {
    if (this._eventHandlers.has(type)) {
      this._eventHandlers.get(type).delete(callback);
    }
    return this;
  }

  trigger(type, payload) {
    if (this._eventHandlers.has(type)) {
      this._eventHandlers.get(type).forEach(cb => cb(payload));
    }
    return this;
  }

  // --- Animation Support (Called by UpdateSystem) ---

  tick(time) {
    if (this._animating && !this._animationPaused && this._animContext) {
      this._processAnimation(time);
    }
  }
  
  // Public update method for lifecycle (add -> update -> remove)
  update(options) {
      if (options) {
          // Apply options if provided
          Object.assign(this.options, options);
      }
      
      // Sync visibility
      if (this.entity) {
          this.entity.show = this._show;
      }
      
      // Subclass update logic
      if (typeof this._updateEntity === 'function') {
          this._updateEntity();
      } else {
           // Fallback for position if subclass doesn't implement full _updateEntity
           this._updatePosition();
      }
      
      return this;
  }

  // --- Internal ---

  _createEntity() {
    throw new Error('_createEntity must be implemented');
  }

  _updatePosition() {
    // Override
  }

  _isDebugEnabled(namespace) {
      if (!this.app || typeof this.app.isDebugEnabled !== 'function') return false;
      return !!this.app.isDebugEnabled(namespace);
  }

  _getDebugOptions(namespace) {
      if (!this.app || typeof this.app.getDebugOptions !== 'function') return undefined;
      return this.app.getDebugOptions(namespace);
  }

  _debugInfo(namespace, ...args) {
      if (!this._isDebugEnabled(namespace)) return;
      Logger.info(`[debug:${namespace}]`, ...args);
  }

  _debugWarn(namespace, ...args) {
      if (!this._isDebugEnabled(namespace)) return;
      Logger.warn(`[debug:${namespace}]`, ...args);
  }
  
  // Animation Logic (Simplified from old BaseEntity)
  animate(props, duration = 1, options = {}) {
     const hasConfigShape = props && typeof props === 'object' && (props.to || props.from);
     const to = hasConfigShape ? props.to : props;
     const fromInput = hasConfigShape ? props.from : options?.from;
     const config = hasConfigShape
         ? props
         : (typeof options === 'function' ? { onComplete: options } : (options || {}));
     const durationSeconds = hasConfigShape
         ? (props.duration !== undefined ? props.duration : 1)
         : duration;

     if ((!to || typeof to !== 'object') && (!fromInput || typeof fromInput !== 'object')) {
         return this;
     }

     const keys = Array.from(new Set([
         ...Object.keys(to || {}),
         ...Object.keys(fromInput || {})
     ]));
     if (keys.length === 0) return this;

     // Ensure animation runs on mounted entities; if not yet mounted, queue it.
     if (!this.entity && this.app && this.app.entityManager) {
         const managed = this.app.entityManager.get(this.id);
         if (managed && managed.entity) {
             this.entity = managed.entity;
         }
     }
     if (!this.entity) {
         this._pendingAnimations.push({ props, duration, options });
         this._debugWarn('animation', 'queue animate: entity is not mounted yet', {
             id: this.id,
             type: this.type || 'entity',
             keys
         });
         return this;
     }

     // Avoid stacking multiple active animations on one entity by default.
     if (this._animating) {
         this.stopAnimation(false);
     }

     const previousState = this._captureAnimStateByKeys(keys);
     this._savedState = this._cloneAnimState(previousState);

     const from = fromInput
         ? this._normalizeAnimEndpoint(fromInput, keys, previousState)
         : this._cloneAnimState(previousState);
     const toState = this._normalizeAnimEndpoint(to || {}, keys, from);

     this._debugInfo('animation', 'start', {
         id: this.id,
         type: this.type || 'entity',
         keys,
         duration: durationSeconds,
         from: this._cloneAnimState(from),
         to: this._cloneAnimState(toState)
     });

     // Apply start state immediately to avoid a visible "jump" before first tick.
     // Path is sensitive during the mount tick; defer implicit from-state to the first animation frame.
     const shouldApplyStartStateImmediately = !(this.type === 'path' && !fromInput);
     if (shouldApplyStartStateImmediately) {
         this._applyAnimState(from);
     }

     const completeCallback =
         (typeof config.onComplete === 'function' && config.onComplete) ||
         (typeof config.complete === 'function' && config.complete) ||
         (typeof config.onDone === 'function' && config.onDone) ||
         (typeof config.done === 'function' && config.done) ||
         null;
     const updateCallback =
         (typeof config.onUpdate === 'function' && config.onUpdate) ||
         null;
     const loopCallback =
         (typeof config.onLoop === 'function' && config.onLoop) ||
         (typeof config.loopCallback === 'function' && config.loopCallback) ||
         null;

     this._animContext = {
         fromBase: this._cloneAnimState(from),
         toBase: this._cloneAnimState(toState),
         from: this._cloneAnimState(from),
         to: this._cloneAnimState(toState),
         durationMs: Math.max(0.001, Number(durationSeconds || 1)) * 1000,
         delayMs: Math.max(0, Number(config.delay || 0)) * 1000,
         elapsedMs: 0,
         lastTimeMs: null,
         started: false,
         loop: !!config.loop,
         yoyo: !!config.yoyo,
         repeat: Number.isFinite(config.repeat) ? Math.max(0, Math.floor(config.repeat)) : 0,
         iteration: 0,
         useSceneTime: !!config.useSceneTime,
         triggerComplete: !config.loop,
         easing: this._resolveEasing(config.easing),
         onStart: typeof config.onStart === 'function' ? config.onStart : null,
         onUpdate: updateCallback,
         onLoop: loopCallback,
         onComplete: completeCallback
     };

     // Geometry safety: keep fill enabled during animation unless explicitly turned off.
     if (this.type && this.type !== 'point' && this.type !== 'billboard' && this.type !== 'label' && this.type !== 'canvas') {
         if (this.options.fill === undefined) {
             this.options.fill = true;
         }
     }

     this._animating = true;
     this._animationPaused = false;
     return this;
  }

  _flushPendingAnimations() {
      if (!this.entity) return;
      if (!Array.isArray(this._pendingAnimations) || this._pendingAnimations.length === 0) return;
      const queue = this._pendingAnimations.slice();
      this._pendingAnimations.length = 0;
      queue.forEach((item) => {
          this.animate(item.props, item.duration, item.options);
      });
  }

  restoreSavedState() {
      if (this._savedState) {
          this._applyAnimState(this._savedState);
      }
      return this;
  }

  pauseAnimation() {
      this._animationPaused = true;
      return this;
  }

  resumeAnimation() {
      if (this._animating) {
          this._animationPaused = false;
          if (this._animContext) {
              this._animContext.lastTimeMs = null;
          }
      }
      return this;
  }

  stopAnimation(applyFinal = false) {
      if (applyFinal && this._animContext) {
          this._applyAnimState(this._animContext.toBase);
      }
      this._animating = false;
      this._animationPaused = false;
      this._animContext = null;
      return this;
  }

  _processAnimation(time) {
      const ctx = this._animContext;
      if (!ctx) return;

      if (!this.entity) {
          if (this.app && this.app.entityManager) {
              const managed = this.app.entityManager.get(this.id);
              if (managed && managed.entity) {
                  this.entity = managed.entity;
              }
          }
      }
      if (!this.entity) {
          this._debugWarn('animation', 'stop animate: entity unmounted during animation', {
              id: this.id,
              type: this.type || 'entity'
          });
          this.stopAnimation(false);
          return;
      }

      const nowMs = ctx.useSceneTime ? this._toMs(time) : Date.now();
      if (ctx.lastTimeMs === null) {
          ctx.lastTimeMs = nowMs;
          return;
      }

      const delta = Math.max(0, nowMs - ctx.lastTimeMs);
      ctx.lastTimeMs = nowMs;

      if (ctx.delayMs > 0) {
          ctx.delayMs = Math.max(0, ctx.delayMs - delta);
          return;
      }

      if (!ctx.started) {
          ctx.started = true;
          if (ctx.onStart) ctx.onStart(this);
      }

      ctx.elapsedMs += delta;
      const progress = Math.min(1, ctx.elapsedMs / ctx.durationMs);
      const eased = ctx.easing(progress);

      const state = this._interpolateAnimState(ctx.from, ctx.to, eased);
      this._applyAnimState(state);
      if (this.viewer && this.viewer.scene && typeof this.viewer.scene.requestRender === 'function') {
          this.viewer.scene.requestRender();
      }
      if (!ctx._loggedFirstFrame) {
          ctx._loggedFirstFrame = true;
          this._debugInfo('animation', 'first-frame', {
              id: this.id,
              type: this.type || 'entity',
              progress
          });
      }
      if (ctx.onUpdate) ctx.onUpdate(this, state, progress);

      if (progress < 1) return;

      const shouldContinue = ctx.loop || ctx.iteration < ctx.repeat;
      if (shouldContinue) {
          ctx.iteration += 1;
          if (ctx.onLoop) {
              ctx.onLoop(this, ctx.iteration);
          }
          ctx.elapsedMs = 0;
          ctx.lastTimeMs = nowMs;
          if (ctx.yoyo) {
              const prevFrom = ctx.from;
              ctx.from = ctx.to;
              ctx.to = prevFrom;
          } else {
              ctx.from = ctx.fromBase;
              ctx.to = ctx.toBase;
          }
          return;
      }

      this._animating = false;
      this._animationPaused = false;
      // Clear current context before onComplete so callback can safely start a new animation.
      if (this._animContext === ctx) {
          this._animContext = null;
      }
      if (ctx.triggerComplete && ctx.onComplete) ctx.onComplete(this);
  }

  _captureAnimStateByKeys(keys) {
      const state = {};
      keys.forEach((key) => {
          if (this.options[key] !== undefined) {
              state[key] = this._cloneAnimValue(this.options[key]);
          } else {
              state[key] = this._getAnimFallbackValue(key, undefined);
          }
      });
      return state;
  }

  _normalizeAnimEndpoint(input, keys, fallbackState) {
      const endpoint = {};
      keys.forEach((key) => {
          if (input[key] !== undefined) {
              if (this._isPlainObject(input[key]) && this._isPlainObject(fallbackState?.[key])) {
                  endpoint[key] = this._mergeAnimObject(fallbackState[key], input[key]);
              } else {
                  endpoint[key] = this._cloneAnimValue(input[key]);
              }
          } else if (fallbackState && fallbackState[key] !== undefined) {
              endpoint[key] = this._cloneAnimValue(fallbackState[key]);
          } else {
              endpoint[key] = this._getAnimFallbackValue(key, undefined);
          }
      });
      return endpoint;
  }

  _mergeAnimObject(base, patch) {
      const merged = this._cloneAnimValue(base);
      Object.keys(patch || {}).forEach((key) => {
          const patchValue = patch[key];
          const baseValue = merged ? merged[key] : undefined;
          if (this._isPlainObject(baseValue) && this._isPlainObject(patchValue)) {
              merged[key] = this._mergeAnimObject(baseValue, patchValue);
          } else {
              merged[key] = this._cloneAnimValue(patchValue);
          }
      });
      return merged;
  }

  _cloneAnimState(state) {
      const cloned = {};
      Object.keys(state || {}).forEach((key) => {
          cloned[key] = this._cloneAnimValue(state[key]);
      });
      return cloned;
  }

  _cloneAnimValue(value) {
      if (Array.isArray(value)) return value.map((item) => this._cloneAnimValue(item));
      if (value instanceof this.cesium.Color) {
          return new this.cesium.Color(value.red, value.green, value.blue, value.alpha);
      }
      if (this._isPlainObject(value)) {
          const out = {};
          Object.keys(value).forEach((key) => {
              out[key] = this._cloneAnimValue(value[key]);
          });
          return out;
      }
      return value;
  }

  _getAnimFallbackValue(key, toValue) {
      if (key === 'opacity') {
          return this.options.opacity !== undefined ? this.options.opacity : 1;
      }
      if (key === 'position') {
          return this.options.position || [0, 0, 0];
      }
      if (key === 'height') {
          const pos = this.options.position;
          if (Array.isArray(pos)) return pos[2] || 0;
          if (pos && typeof pos === 'object' && pos.alt !== undefined) return pos.alt || 0;
          return 0;
      }
      if (key === 'material') {
          if (this.options.material !== undefined) {
              return this._cloneAnimValue(this.options.material);
          }
          return this._cloneAnimValue(toValue);
      }
      if (typeof toValue === 'number') return 0;
      return toValue;
  }

  _interpolateAnimState(fromState, toState, t) {
      const state = {};
      Object.keys(toState).forEach((key) => {
          state[key] = this._interpolateAnimValue(fromState[key], toState[key], t);
      });
      return state;
  }

  _interpolateAnimValue(from, to, t) {
      if (from === undefined && to === undefined) {
          return undefined;
      }

      if (from === undefined && typeof to === 'number') {
          return to * t;
      }
      if (to === undefined && typeof from === 'number') {
          return from + (0 - from) * t;
      }

      if (from === undefined && this._isPositionLike(to)) {
          const e = this._normalizePositionLike(to);
          return [e[0] * t, e[1] * t, e[2] * t];
      }
      if (to === undefined && this._isPositionLike(from)) {
          const f = this._normalizePositionLike(from);
          return [
              f[0] + (0 - f[0]) * t,
              f[1] + (0 - f[1]) * t,
              f[2] + (0 - f[2]) * t
          ];
      }

      if (from === undefined && this._isPlainObject(to)) {
          const out = {};
          Object.keys(to).forEach((key) => {
              out[key] = this._interpolateAnimValue(undefined, to[key], t);
          });
          return out;
      }
      if (to === undefined && this._isPlainObject(from)) {
          const out = {};
          Object.keys(from).forEach((key) => {
              out[key] = this._interpolateAnimValue(from[key], undefined, t);
          });
          return out;
      }

      if (typeof from === 'number' && typeof to === 'number') {
          return from + (to - from) * t;
      }

      if (this._isPositionLike(from) && this._isPositionLike(to)) {
          const f = this._normalizePositionLike(from);
          const e = this._normalizePositionLike(to);
          return [
              f[0] + (e[0] - f[0]) * t,
              f[1] + (e[1] - f[1]) * t,
              f[2] + (e[2] - f[2]) * t
          ];
      }

      const cFrom = this._toColorLike(from);
      const cTo = this._toColorLike(to);
      if (cFrom && cTo) {
          const c = new this.cesium.Color(
              cFrom.red + (cTo.red - cFrom.red) * t,
              cFrom.green + (cTo.green - cFrom.green) * t,
              cFrom.blue + (cTo.blue - cFrom.blue) * t,
              cFrom.alpha + (cTo.alpha - cFrom.alpha) * t
          );
          return c;
      }

      if (this._isPlainObject(from) && this._isPlainObject(to)) {
          const merged = {};
          const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
          keys.forEach((key) => {
              merged[key] = this._interpolateAnimValue(from[key], to[key], t);
          });
          return merged;
      }

      return t < 1 ? from : to;
  }

  _stripUndefined(value) {
      if (Array.isArray(value)) {
          return value.map((item) => this._stripUndefined(item));
      }
      if (this._isPlainObject(value)) {
          const out = {};
          Object.keys(value).forEach((key) => {
              const next = this._stripUndefined(value[key]);
              if (next !== undefined) out[key] = next;
          });
          return out;
      }
      return value;
  }

  _sanitizeAnimState(value, path = '') {
      if (Array.isArray(value)) {
          return value.map((item, index) => this._sanitizeAnimState(item, `${path}[${index}]`));
      }
      if (this._isPlainObject(value)) {
          const out = {};
          Object.keys(value).forEach((key) => {
              const nextPath = path ? `${path}.${key}` : key;
              const next = this._sanitizeAnimState(value[key], nextPath);
              if (next !== undefined) out[key] = next;
          });
          return out;
      }
      if (typeof value === 'number' && !Number.isFinite(value)) {
          this._debugWarn('animation', 'skip non-finite value', { id: this.id, path, value });
          return undefined;
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
          const key = path.split('.').pop() || '';
          if (key === 'opacity') {
              return Math.min(1, Math.max(0, value));
          }
          if (
              key === 'radius' ||
              key === 'topRadius' ||
              key === 'bottomRadius' ||
              key === 'length' ||
              key === 'width' ||
              key === 'height' ||
              key === 'outlineWidth' ||
              key === 'pixelSize' ||
              key === 'semiMajorAxis' ||
              key === 'semiMinorAxis' ||
              key === 'extrudedHeight'
          ) {
              return Math.max(0, value);
          }
      }
      return value;
  }

  _isPositionLike(value) {
      return Array.isArray(value) || (value && typeof value === 'object' && value.lng !== undefined && value.lat !== undefined);
  }

  _normalizePositionLike(value) {
      if (Array.isArray(value)) {
          return [value[0] || 0, value[1] || 0, value[2] || 0];
      }
      return [value.lng || 0, value.lat || 0, value.alt || 0];
  }

  _toColorLike(value) {
      if (!value) return null;
      if (value instanceof this.cesium.Color) return value;
      if (typeof value === 'string') {
          return this.cesium.Color.fromCssColorString(value);
      }
      if (value && typeof value === 'object' &&
          value.red !== undefined && value.green !== undefined &&
          value.blue !== undefined && value.alpha !== undefined) {
          return new this.cesium.Color(value.red, value.green, value.blue, value.alpha);
      }
      return null;
  }

  _applyAnimState(state) {
      const next = this._stripUndefined(this._sanitizeAnimState(this._cloneAnimValue(state) || {}));
      if (next.height !== undefined) {
          this.setHeight(next.height);
          delete next.height;
      }
      try {
          Object.assign(this.options, next);
          this.update();
      } catch (err) {
          this._debugWarn('animation', 'apply state failed, stop animation', {
              id: this.id,
              type: this.type || 'entity',
              error: err?.message || String(err),
              state: next
          });
          this.stopAnimation(false);
      }
  }

  _resolveEasing(easing) {
      if (typeof easing === 'function') return easing;
      const name = easing || 'linear';
      const map = {
          linear: (t) => t,
          easeInQuad: (t) => t * t,
          easeOutQuad: (t) => t * (2 - t),
          easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
      };
      return map[name] || map.linear;
  }

  _toMs(time) {
      if (time && this.cesium && this.cesium.JulianDate && this.cesium.JulianDate.toDate) {
          return this.cesium.JulianDate.toDate(time).getTime();
      }
      return Date.now();
  }

  _resolveFlyToDestination() {
      if (this.entity && this.entity.position && this.entity.position.getValue) {
          return this.entity.position.getValue(this.cesium.JulianDate.now());
      }

      const pos = this.options.position;
      if (!pos) return null;

      if (pos instanceof this.cesium.Cartesian3) {
          return pos;
      }
      if (Array.isArray(pos)) {
          return this.cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0);
      }
      if (pos.lng !== undefined && pos.lat !== undefined) {
          return this.cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt || 0);
      }
      return null;
  }

  _resolveHorizontalOrigin(origin, fallback = 'CENTER') {
      const Cesium = this.cesium;
      if (typeof origin === 'number') return origin;
      const key = (origin || fallback || 'CENTER').toString().toUpperCase();
      return Cesium.HorizontalOrigin[key] ?? Cesium.HorizontalOrigin.CENTER;
  }

  _resolveVerticalOrigin(origin, fallback = 'CENTER') {
      const Cesium = this.cesium;
      if (typeof origin === 'number') return origin;
      const key = (origin || fallback || 'CENTER').toString().toUpperCase();
      return Cesium.VerticalOrigin[key] ?? Cesium.VerticalOrigin.CENTER;
  }

  _resolveDisableDepthTestDistance(localOptions = {}) {
      if (localOptions.disableDepthTestDistance !== undefined) {
          return localOptions.disableDepthTestDistance;
      }
      if (localOptions.depthTest !== undefined) {
          return localOptions.depthTest ? 0 : Number.POSITIVE_INFINITY;
      }
      return this.options.depthTest ? 0 : Number.POSITIVE_INFINITY;
  }

  _resolveEyeOffset(localOptions = {}) {
      const eo = localOptions.eyeOffset !== undefined ? localOptions.eyeOffset : this.options.eyeOffset;
      if (eo === undefined || eo === null) return undefined;

      let x = 0;
      let y = 0;
      let z = 0;
      if (Array.isArray(eo)) {
          x = Number(eo[0] || 0);
          y = Number(eo[1] || 0);
          z = Number(eo[2] || 0);
      } else if (typeof eo === 'object') {
          x = Number(eo.x || 0);
          y = Number(eo.y || 0);
          z = Number(eo.z || 0);
      }
      return new this.cesium.Cartesian3(x, y, z);
  }
}
