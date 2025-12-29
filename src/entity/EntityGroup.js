export class EntityGroup extends Array {
  constructor(items) {
    // Handle construction via new EntityGroup([a, b])
    if (Array.isArray(items)) {
      super(...items);
    } else if (typeof items === 'number') {
      super(items);
    } else {
      super();
    }

    // Explicitly bind methods to instance for robustness
    this.setColor = this.setColor.bind(this);
    this.setPixelSize = this.setPixelSize.bind(this);
    this.setOpacity = this.setOpacity.bind(this);
    this.setOutline = this.setOutline.bind(this);
    this.setImage = this.setImage.bind(this);
    this.setScale = this.setScale.bind(this);
    this.setRotation = this.setRotation.bind(this);
    this.setText = this.setText.bind(this);
    this.setFont = this.setFont.bind(this);
    this.setFillColor = this.setFillColor.bind(this);
    this.setBackgroundColor = this.setBackgroundColor.bind(this);
    this.flash = this.flash.bind(this);
    this.setGroup = this.setGroup.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.add = this.add.bind(this);
    this.delete = this.delete.bind(this);
    this.draggable = this.draggable.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);

    return new Proxy(this, {
        get(target, prop, receiver) {
            // 0. Explicitly handle common methods to bypass any prototype/instance issues
            const explicitMethods = [
                'setColor', 'setPixelSize', 'setOpacity', 'setOutline',
                'setImage', 'setScale', 'setRotation',
                'setText', 'setFont', 'setFillColor', 'setBackgroundColor',
                'flash', 'setGroup', 'show', 'hide', 'add', 'delete', 'draggable', 'on', 'off'
            ];
            
            if (typeof prop === 'string' && explicitMethods.includes(prop)) {
                return (...args) => {
                     // Ensure we call _broadcast on the target (the array instance)
                     // Use prototype method if instance method is missing
                     if (typeof target._broadcast === 'function') {
                         return target._broadcast(prop, ...args);
                     }
                     // Fallback to manual broadcast if _broadcast is missing (paranoid)
                     Array.prototype.forEach.call(target, entity => {
                        if (entity && typeof entity[prop] === 'function') {
                            entity[prop](...args);
                        }
                     });
                     return receiver;
                };
            }

            // 1. Prefer existing properties/methods on EntityGroup or Array
            if (prop in target) {
                return Reflect.get(target, prop, receiver);
            }

            // 2. Fallback: Broadcast method call to all children
            // We only support string properties that look like method calls
            // REMOVED target.length > 0 check to prevent undefined on empty groups
            if (typeof prop === 'string') {
                 return (...args) => {
                     for (const entity of target) {
                         if (entity && typeof entity[prop] === 'function') {
                             entity[prop](...args);
                         }
                     }
                     return receiver; // Return the proxy (group) for chaining
                 };
            }

            return undefined;
        }
    });
  }

  // --- Explicit Delegated Methods (Robustness) ---
  // Explicitly defining common methods ensures they work even if Proxy fails 
  // or in strict environments, and improves IDE autocompletion/docs.

  // PointEntity Methods
  setColor(color) { return this._broadcast('setColor', color); }
  setPixelSize(size) { return this._broadcast('setPixelSize', size); }
  setOpacity(opacity) { return this._broadcast('setOpacity', opacity); }
  setOutline(enabled, color, width) { return this._broadcast('setOutline', enabled, color, width); }
  
  // BillboardEntity Methods
  setImage(url) { return this._broadcast('setImage', url); }
  setScale(scale) { return this._broadcast('setScale', scale); }
  setRotation(rotation) { return this._broadcast('setRotation', rotation); }
  
  // LabelEntity Methods
  setText(text) { return this._broadcast('setText', text); }
  setFont(font) { return this._broadcast('setFont', font); }
  setFillColor(color) { return this._broadcast('setFillColor', color); }
  setBackgroundColor(color) { return this._broadcast('setBackgroundColor', color); }
  
  // General
  flash(enable, duration, options) { return this._broadcast('flash', enable, duration, options); }
  setGroup(name) { return this._broadcast('setGroup', name); }
  draggable(enable) { return this._broadcast('draggable', enable); }
  
  _broadcast(methodName, ...args) {
      Array.prototype.forEach.call(this, entity => {
          if (entity && typeof entity[methodName] === 'function') {
              entity[methodName](...args);
          }
      });
      return this;
  }

  // Core requirement: update triggers modification for all entities in group
  update(options, duration) {
    // Use native forEach to iterate over self
    Array.prototype.forEach.call(this, entity => {
      if (typeof entity.update === 'function') {
        entity.update(options, duration);
      }
    });
    return this;
  }

  // Override forEach to support chaining: group.forEach(...).hide()
  forEach(callback) {
    Array.prototype.forEach.call(this, callback);
    return this;
  }

  // Override filter to return EntityGroup instance instead of plain Array
  filter(callback) {
    const filtered = Array.prototype.filter.call(this, callback);
    return new EntityGroup(filtered);
  }

  // Common delegation methods
  show() {
    Array.prototype.forEach.call(this, e => e.show && e.show());
    return this;
  }

  hide() {
    Array.prototype.forEach.call(this, e => e.hide && e.hide());
    return this;
  }

  add() {
      Array.prototype.forEach.call(this, e => e.add && e.add());
      return this;
  }

  delete() {
    // Iterate over a copy to avoid modification issues during iteration
    [...this].forEach(e => e.delete && e.delete());
    // Clear the array
    this.length = 0;
    return this;
  }
  
  on(type, handler) {
      Array.prototype.forEach.call(this, e => e.on && e.on(type, handler));
      return this;
  }
  
  off(type, handler) {
      Array.prototype.forEach.call(this, e => e.off && e.off(type, handler));
      return this;
  }
  
  // Note: No need for [Symbol.iterator], get length(), or get(index)
  // because we extend Array directly.
}
