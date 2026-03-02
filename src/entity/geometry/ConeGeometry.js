import { CylinderGeometry } from './CylinderGeometry.js';

export class ConeGeometry extends CylinderGeometry {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'cone';
    if (this.options.topRadius === undefined) this.options.topRadius = 0;
    if (this.options.bottomRadius === undefined) this.options.bottomRadius = 320;
    if (this.options.length === undefined) this.options.length = 1000;
  }

  _createEntity() {
    if (this.options.topRadius === undefined) this.options.topRadius = 0;
    return super._createEntity();
  }
}
