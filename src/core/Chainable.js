import { Point } from '../entity/Point.js';
import { Billboard } from '../entity/Billboard.js';
import { Label } from '../entity/Label.js';
import { CanvasEntity } from '../entity/CanvasEntity.js';
import { CircleGeometry } from '../entity/geometry/CircleGeometry.js';
import { RectangleGeometry } from '../entity/geometry/RectangleGeometry.js';
import { PathGeometry } from '../entity/geometry/PathGeometry.js';
import { BoxGeometry } from '../entity/geometry/BoxGeometry.js';
import { CylinderGeometry } from '../entity/geometry/CylinderGeometry.js';
import { ConeGeometry } from '../entity/geometry/ConeGeometry.js';
import { Model } from '../entity/Model.js';

export class Chainable {
  constructor(app, options = {}) {
    this.app = app;
    this.options = options;
    this._currentEntity = null;

    // Auto-create if type is provided in options
    if (options && options.type) {
        const type = options.type;
        // Check if we have a factory method for this type (e.g., this.point(options))
        // Note: The factory method might be on the prototype or added dynamically
        // Since we are inside the constructor, we can access methods.
        if (typeof this[type] === 'function') {
            this[type](options);
        } else {
             console.warn(`[CesiumFriendly] Unknown entity type: ${type}`);
        }
    }
    
    // Proxy to forward calls to the underlying Entity
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        
        // Forward to entity
        if (target._currentEntity && typeof target._currentEntity[prop] === 'function') {
          return (...args) => {
            const result = target._currentEntity[prop](...args);
            // If entity method returns itself (chaining), we return the Chainable wrapper instead
            if (result === target._currentEntity) {
              return receiver; // Return Proxy
            }
            return result;
          };
        }
        
        return undefined;
      }
    });
  }

  // --- Creation Methods ---

  point(options = {}) {
    const id = options.id || this._generateId('point');
    this._currentEntity = new Point(id, this.app, options);
    return this;
  }

  billboard(options = {}) {
    const id = options.id || this._generateId('billboard');
    this._currentEntity = new Billboard(id, this.app, options);
    return this;
  }

  label(options = {}) {
    const id = options.id || this._generateId('label');
    this._currentEntity = new Label(id, this.app, options);
    return this;
  }

  canvas(options = {}) {
    const id = options.id || this._generateId('canvas');
    this._currentEntity = new CanvasEntity(id, this.app, options);
    return this;
  }

  circle(options = {}) {
    const id = options.id || this._generateId('circle');
    this._currentEntity = new CircleGeometry(id, this.app, options);
    return this;
  }

  rectangle(options = {}) {
    const id = options.id || this._generateId('rectangle');
    this._currentEntity = new RectangleGeometry(id, this.app, options);
    return this;
  }

  path(options = {}) {
    const id = options.id || this._generateId('path');
    this._currentEntity = new PathGeometry(id, this.app, options);
    return this;
  }

  box(options = {}) {
    const id = options.id || this._generateId('box');
    this._currentEntity = new BoxGeometry(id, this.app, options);
    return this;
  }

  cylinder(options = {}) {
    const id = options.id || this._generateId('cylinder');
    this._currentEntity = new CylinderGeometry(id, this.app, options);
    return this;
  }

  cone(options = {}) {
    const id = options.id || this._generateId('cone');
    this._currentEntity = new ConeGeometry(id, this.app, options);
    return this;
  }

  model(options = {}) {
    const id = options.id || this._generateId('model');
    this._currentEntity = new Model(id, this.app, options);
    return this;
  }

  // --- Lifecycle Methods ---

  add() {
    // This method commits the changes/creation to the app (Mount)
    if (this._currentEntity) {
      this.app.entityManager.add(this._currentEntity);
    }
    return this;
  }
  
  show() {
      if (this._currentEntity) {
          // Check if method exists on entity (BaseEntity has show())
          if (typeof this._currentEntity.show === 'function') {
              this._currentEntity.show();
          } else {
              // Fallback if not function
              this._currentEntity.show = true;
          }
      }
      return this;
  }
  
  hide() {
      if (this._currentEntity) {
          if (typeof this._currentEntity.hide === 'function') {
              this._currentEntity.hide();
          } else {
              this._currentEntity.show = false;
          }
      }
      return this;
  }
  
  update(options) {
      // Trigger modification
      if (this._currentEntity && typeof this._currentEntity.update === 'function') {
          this._currentEntity.update(options);
      }
      return this;
  }
  
  remove() {
      if (this._currentEntity) {
          this.app.entityManager.remove(this._currentEntity.id);
      }
      return this;
  }

  // --- Helper ---

  _generateId(prefix) {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
