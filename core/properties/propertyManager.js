import { Strings } from '../lib/strings.js';
import { DesignCore } from '../designCore.js';
import { UpdateState } from '../lib/stateManager.js';

/** Property Manager Class */
export class PropertyManager {
  /** Create Property Manager */
  constructor() {
    this.updateCallbackFunction; // set to external callback function
  }

  /**
   * Set the property callback function
   * @param {Object} callback
   */
  setPropertyCallbackFunction(callback) {
    // set the call
    this.updateCallbackFunction = callback;
  }


  /** Signal the selection set has changed */
  selectionSetChanged() {
    // If a callback is set - signal that a change has been made
    if (this.updateCallbackFunction) {
      this.updateCallbackFunction();
    }
  }

  /**
   * Set entity properties
   * @param {string} property
   * @param {any} newPropertyValue
   * @param {string} entityType
   */
  setEntityProperties(property, newPropertyValue, entityType='All') {
    const stateChanges = [];
    for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      const index = DesignCore.Scene.selectionManager.selectionSet.selectionSet[i];

      const entity = DesignCore.Scene.entities.get(index);

      // check if the entity is of the selected type
      if (entityType !== 'All' && entity.type !== entityType) {
        continue;
      }

      // check if the entity has the selected property
      if (!entity.properties?.has(property)) {
        continue;
      }

      const currentValue = entity.getProperty(property);

      if (typeof (currentValue) !== typeof (newPropertyValue)) {
        DesignCore.Core.notify(Strings.Error.INPUT);
      } else {
        // update the entity property
        const update = {};
        update[property] = newPropertyValue;
        const stateChange = new UpdateState(entity, update);
        stateChanges.push(stateChange);
      }
    }
    DesignCore.Scene.commit(stateChanges);
    DesignCore.Scene.selectionManager.reloadSelectedEntities();
  }

  /**
   * Get the types of items selected
   * @return {Array}
   */
  getEntityTypes() {
    // Loop through the items and get a list of entity types.
    const entityTypes = [];

    if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const entity = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
        const entityType = entity.type;

        if (entityTypes.indexOf(entityType, 0) === -1) {
          entityTypes.push(entityType);
        }
      }

      // if there is more that one type add an option for all
      if (entityTypes.length > 1) {
        entityTypes.unshift('All');
      }
    }

    return entityTypes;
  }

  /**
   * Get a list of common properties
   * @param {string} entityType
   * @return {Array}
   */
  getEntityProperties(entityType) {
    // Loop through the items and get a list of common properties.

    // check for valid entityType and selectionSet
    if (entityType === undefined || entityType === null || DesignCore.Scene.selectionManager.selectionSet.selectionSet.length <= 0) {
      return;
    }

    let subset = [];

    // create subset array of selectionSet
    DesignCore.Scene.selectionManager.selectionSet.selectionSet.forEach((index) => {
      subset.push(DesignCore.Scene.entities.get(index));
    });

    // get a subset of the selectionSet
    if (entityType !== 'All') {
      subset = subset.filter((el) => el.type === entityType);
    }

    const propertiesList = [];

    subset.forEach((el) => {
      if (el.properties) {
        el.properties.list().forEach((key) => {
          if (propertiesList.includes(key) === false) {
            if (subset.every((sub) => sub.properties?.has(key))) {
              propertiesList.push(key);
            }
          }
        });
      }
    });

    return propertiesList;
  }


  /**
   * Get the Property descriptor for a named property from a representative selected entity.
   * @param {string} entityType
   * @param {string} property
   * @return {Property|undefined}
   */
  getEntityPropertyDefinition(entityType, property) {
    const index = DesignCore.Scene.selectionManager.selectionSet.selectionSet.find((i) => {
      const entity = DesignCore.Scene.entities.get(i);
      return (entityType === 'All' || entity.type === entityType) && entity.properties?.has(property);
    });
    if (index === undefined) return undefined;
    return DesignCore.Scene.entities.get(index).properties.definition(property);
  }

  /**
   * Get a list the property values
   * @param {string} entityType
   * @param {string} property
   * @return {Array}
   */
  getEntityPropertyValue(entityType, property) {
    // Loop through the items and get a list the property values
    const propertiesValueList = [];
    if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]).type === entityType || entityType === 'All') {
          const entity = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
          propertiesValueList.push(entity.getProperty(property));
        }
      }
    }

    // Check if every entity in the selection set has the same value for the property
    if (propertiesValueList.every((prop) => {
      return prop === propertiesValueList[0];
    })) {
      return propertiesValueList[0];
    } else {
      return Strings.Strings.VARIES;
    }
  }
}
