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
   * Set item properties
   * @param {string} property
   * @param {any} newPropertyValue
   * @param {string} itemType
   */
  setEntityProperties(property, newPropertyValue, itemType='All') {
    const stateChanges = [];
    for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      const index = DesignCore.Scene.selectionManager.selectionSet.selectionSet[i];

      const item = DesignCore.Scene.entities.get(index);

      // check if the item is of the selected type
      if (itemType !== 'All' && item.type !== itemType) {
        continue;
      }

      // check if the item has the selected property
      if (!item.properties?.has(property)) {
        continue;
      }

      const currentValue = item.getProperty(property);

      if (typeof (currentValue) !== typeof (newPropertyValue)) {
        DesignCore.Core.notify(Strings.Error.INPUT);
      } else {
        // update the item property
        const update = {};
        update[property] = newPropertyValue;
        const stateChange = new UpdateState(item, update);
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
    // Loop through the items and get a list of item types.
    const itemTypes = [];

    if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const item = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
        const itemType = item.type;

        if (itemTypes.indexOf(itemType, 0) === -1) {
          itemTypes.push(itemType);
        }
      }

      // if there is more that one type add an option for all
      if (itemTypes.length > 1) {
        itemTypes.unshift('All');
      }
    }

    return itemTypes;
  }

  /**
   * Get a list of common properties
   * @param {string} itemType
   * @return {Array}
   */
  getEntityProperties(itemType) {
    // Loop through the items and get a list of common properties.

    // check for valid itemType and selectionSet
    if (itemType === undefined || itemType === null || DesignCore.Scene.selectionManager.selectionSet.selectionSet.length <= 0) {
      return;
    }

    let subset = [];

    // create subset array of selectionSet
    DesignCore.Scene.selectionManager.selectionSet.selectionSet.forEach((index) => {
      subset.push(DesignCore.Scene.entities.get(index));
    });

    // get a subset of the selectionSet
    if (itemType !== 'All') {
      subset = subset.filter((el) => el.type === itemType);
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
   * @param {string} itemType
   * @param {string} property
   * @return {Property|undefined}
   */
  getEntityPropertyDefinition(itemType, property) {
    const index = DesignCore.Scene.selectionManager.selectionSet.selectionSet.find((i) => {
      const item = DesignCore.Scene.entities.get(i);
      return (itemType === 'All' || item.type === itemType) && item.properties?.has(property);
    });
    if (index === undefined) return undefined;
    return DesignCore.Scene.entities.get(index).properties.definition(property);
  }

  /**
   * Get a list the property values
   * @param {string} itemType
   * @param {string} property
   * @return {Array}
   */
  getEntityPropertyValue(itemType, property) {
    // Loop through the items and get a list the property values
    const propertiesValueList = [];
    if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]).type === itemType || itemType === 'All') {
          const entity = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
          propertiesValueList.push(entity.getProperty(property));
        }
      }
    }

    // Check if every item in the selection set has the same value for the property
    if (propertiesValueList.every((prop) => {
      return prop === propertiesValueList[0];
    })) {
      return propertiesValueList[0];
    } else {
      return Strings.Strings.VARIES;
    }
  }
}
