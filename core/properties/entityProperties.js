import { Property } from './property.js';

/**
 * EntityProperties — typed property store for an entity.
 *
 * Holds a plain-object store of named Property descriptors.
 * Each descriptor owns its value.
 * Using a plain object (rather than a private Map) ensures the store is deep-cloneable by Utils.cloneObject.
 *
 * Computed properties may supply get(entity) and set(entity, value) functions.
 * These are stateless functions (not bound methods) so they survive cloneObject.
 */
export class EntityProperties {
  /** @type {Object.<string, Property>} */
  // Store is a plain object to ensure it is deep-cloneable by Utils.cloneObject.
  _store = {};

  /**
   * Register a property.
   * @param {string} name - property name
   * @param {Object} definition - passed directly to the Property constructor
   * @param {string} definition.type - Property.Type constant
   * @param {any} definition.value - initial value
   * @param {boolean} [definition.readOnly=false]
   * @param {boolean} [definition.visible=true]
   * @param {number} [definition.dxfCode]
   * @param {Function} [definition.get] - computed getter: (entity) => value
   * @param {Function} [definition.set] - computed setter: (entity, value) => void
   */
  add(name, definition) {
    this._store[name] = new Property(definition);
  }

  /**
   * Get the current value of a property.
   * For computed properties, invokes get(entity).
   * For stored properties, reads entity[name] if entity is provided, else prop.value.
   * @param {string} name
   * @param {Object} [entity] - required for computed/stored properties on entity
   * @return {any} value, or undefined if not registered
   */
  get(name, entity) {
    const prop = this._store[name];
    if (!prop) return undefined;
    if (prop.get) return prop.get(entity);
    return prop.value;
  }

  /**
   * Set the value of a property.
   * For computed properties, invokes set(entity, value).
   * For stored properties, writes entity[name] if entity is provided, else updates prop.value.
   * No-op if the property is not registered or is readOnly.
   * @param {string} name
   * @param {any} value
   * @param {Object} [entity] - required for computed/stored properties on entity
   */
  set(name, value, entity) {
    const prop = this._store[name];
    if (!prop) return;
    if (prop.readOnly) return;
    if (prop.set) {
      prop.set(entity, value);
    } else {
      prop.value = value;
    }
  }

  /**
   * Check whether a property is registered.
   * @param {string} name
   * @return {boolean}
   */
  has(name) {
    return name in this._store;
  }

  /**
   * Remove a property from the store.
   * @param {string} name
   */
  remove(name) {
    delete this._store[name];
  }

  /**
   * Return names of all visible properties in registration order.
   * @return {string[]}
   */
  list() {
    return Object.entries(this._store)
        .filter(([, prop]) => prop.visible)
        .map(([name]) => name);
  }

  /**
   * Return the full Property descriptor for a named property.
   * @param {string} name
   * @return {Property|undefined}
   */
  definition(name) {
    return this._store[name];
  }
}
