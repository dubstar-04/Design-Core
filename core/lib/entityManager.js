
import { DesignCore } from '../designCore.js';
import { Property } from '../properties/property.js';

/**
 * Entity Manager Class
 * Holds all entity instances and manages all changes to them
 */
export class EntityManager {
  #entities = [];
  #trackHandles;

  /**
   * Create EntityManager
   * @param {boolean} [trackHandles=true] - whether to track handles for entities
   */
  constructor(trackHandles = true) {
    this.#trackHandles = trackHandles;
  }

  /**
   * Create and add new entity
   * @param {string} type
   * @param {object} data
   */
  create(type, data) {
    data.layer = DesignCore.LayerManager.getCstyle();
    const entity = DesignCore.CommandManager.createNew(type, data);
    this.add(entity);
  }

  /**
   * Add entity to manager
   * @param {object} entity
   */
  add(entity) {
    if (!entity) return;

    if (this.#trackHandles) {
      const existingHandle = entity.getProperty?.(Property.Names.HANDLE) ?? entity.handle;
      if (existingHandle === undefined) {
        if (entity.setProperty) {
          entity.setProperty(Property.Names.HANDLE, DesignCore.HandleManager.next());
        }
      } else {
        DesignCore.HandleManager.checkHandle(existingHandle);
      }
    }

    this.#entities.push(entity);
  }

  /**
   * Remove entity at index
   * @param {number} index
   */
  remove(index) {
    if (this.#trackHandles) {
      const entity = this.#entities[index];
      const handle = entity?.getProperty?.(Property.Names.HANDLE) ?? entity?.handle;
      if (handle !== undefined) {
        DesignCore.HandleManager.releaseHandle(handle);
      }
    }
    this.#entities.splice(index, 1);
  }

  /**
   * Get entity at index
   * @param {number} index
   * @return {object} entity
   */
  get(index) {
    return this.#entities.at(index);
  }

  /**
   * Return all entities
   * @return {Array} all entities
   */
  getAll() {
    return this.#entities;
  }

  /**
   * Replace entity at index
   * @param {number} index
   * @param {object} entity
   */
  replace(index, entity) {
    this.#entities.splice(index, 1, entity);
  }

  /**
   * Find entitys in scene
   * @param {string} type - entity type or "ANY"
   * @param {string} prop - object of entity parameters
   * @param {any} value - value of the property
   * @return {number} - index of entitys
   */
  find(type, prop, value) {
    const filteredEntities = [];

    this.#entities.forEach((entity, index) => {
      if (type.toUpperCase() === 'ANY' || entity.type.toUpperCase() === type.toUpperCase()) {
        const inStore = entity.properties?.has(prop);
        const propValue = inStore ? entity.getProperty(prop) : (Object.prototype.hasOwnProperty.call(entity, prop) ? entity[prop] : undefined);
        if (propValue !== undefined && propValue === value) {
          filteredEntities.push(index);
        }
      }
    });

    return filteredEntities;
  }

  /** Get index of entity
   * @param {object} entity
   * @return {number} index
   */
  indexOf(entity) {
    return this.#entities.indexOf(entity);
  }


  /**
   * Find closest entity to point
   * @param  {Point} point
   * @return {number} - return index of closest entity or undefined
   */
  findClosest(point) {
    let delta = 1.65 / DesignCore.Core.canvas.getScale(); // find a more suitable starting value
    let closestEntityIndex;

    for (let i = 0; i < this.#entities.length; i++) {
      // check the entitys layer is selectable - i.e. on, thawed, etc...
      const layer = DesignCore.LayerManager.getItemByName(this.#entities[i].getProperty(Property.Names.LAYER));

      if (!layer?.isSelectable) {
        continue;
      }

      const distance = this.#entities[i].closestPoint(point)[1]; // ClosestPoint()[1] returns a distance to the closest point

      if (distance < delta) {
        delta = distance;
        closestEntityIndex = i;
      }
    }

    return closestEntityIndex;
  }

  /**
   * Update entity at index with data
   * @param {number} index
   * @param {object} data
   */
  update(index, data) {
    const entity = this.get(index);

    if (!entity) {
      throw Error('Entity not found in scene');
    }

    for (const property of Object.keys(data)) {
      entity.setProperty(property, data[property]);
    }
  }

  /**
   * Get count of entities
   * @return {number}
   */
  count() {
    return this.#entities.length;
  }

  /**
   * Clear all entities
   */
  clear() {
    this.#entities = [];
  }
}
