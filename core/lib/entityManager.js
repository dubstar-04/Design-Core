
import { DesignCore } from '../designCore.js';

/**
 * Entity Manager Class
 * Holds all entity instances and manages all changes to them
 */
export class EntityManager {
  #entities = [];

  /**
   * Create EntityManager
   */
  constructor() {

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
    this.#entities.push(entity);
  }

  /**
   * Remove entity at index
   * @param {number} index
   */
  remove(index) {
    this.#entities.splice(index, 1);
  }

  /**
   * Get entity at index
   * @param {number} index
   * @return {object} entity
   */
  get(index) {
    return this.#entities[index];
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
   * Find items in scene
   * @param {string} type - entity type or "ANY"
   * @param {string} prop - object of entity parameters
   * @param {any} value - value of the property
   * @return {number} - index of items
   */
  find(type, prop, value) {
    const filteredItems = [];

    this.#entities.forEach((item, index) => {
      if ((type.toUpperCase() === 'ANY' || item.type.toUpperCase() === type.toUpperCase()) && item.hasOwnProperty(prop) && item[prop] === value) {
        filteredItems.push(index);
      }
    });

    return filteredItems;
  }

  /** Get index of entity
   * @param {object} entity
   * @return {number} index
   */
  indexOf(entity) {
    return this.#entities.indexOf(entity);
  }


  /**
   * Find closest item to point
   * @param  {Point} point
   * @return {number} - return index of closest item or undefined
   */
  findClosest(point) {
    let delta = 1.65 / DesignCore.Core.canvas.getScale(); // find a more suitable starting value
    let closestItemIndex;

    for (let i = 0; i < this.#entities.length; i++) {
      // check the items layer is selectable - i.e. on, thawed, etc...
      const layer = DesignCore.LayerManager.getItemByName(this.#entities[i].layer);

      if (!layer.isSelectable) {
        continue;
      }

      const distance = this.#entities[i].closestPoint(point)[1]; // ClosestPoint()[1] returns a distance to the closest point

      if (distance < delta) {
        delta = distance;
        closestItemIndex = i;
      }
    }

    return closestItemIndex;
  }

  /**
   * Update entity at index with data
   * @param {number} index
   * @param {object} data
   */
  update(index, data) {
    const item = this.get(index);

    if (!item) {
      throw Error('Item not found in scene');
    }

    for (const property of Object.getOwnPropertyNames(data)) {
      if (item.hasOwnProperty(property)) {
        item.setProperty(property, data[property]);
      }
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
