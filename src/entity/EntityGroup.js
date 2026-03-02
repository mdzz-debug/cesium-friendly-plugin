export class EntityGroup {
  constructor(name, app) {
    this.name = name;
    this.app = app;
    this.entities = new Set();
  }

  add(entity) {
    this.entities.add(entity);
    entity.group = this.name;
    return this;
  }

  remove(entity) {
    this.entities.delete(entity);
    if (entity.group === this.name) {
      entity.group = null;
    }
    return this;
  }

  show() {
    this.entities.forEach(e => e.show());
    return this;
  }

  hide() {
    this.entities.forEach(e => e.hide());
    return this;
  }

  destroy() {
    const entities = Array.from(this.entities);
    this.entities.clear();
    entities.forEach((e) => e.remove());
  }
}
