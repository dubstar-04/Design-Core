import {Strings} from '../lib/strings.js';
import {DesignCore} from '../designCore.js';

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
   */
  setItemProperties(property, newPropertyValue) {
    for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      // check if the item has the selected property
      if (!DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].hasOwnProperty(property)) {
        continue;
      }

      if (typeof(DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]][property]) !== typeof(newPropertyValue)) {
        DesignCore.Core.notify(Strings.Error.INPUT);
      } else {
        DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]][property] = newPropertyValue;
        DesignCore.Scene.selectionManager.reloadSelectedItems();
      }
    }
  }

  /**
   * Get the types of items selected
   * @return {Array}
   */
  getItemTypes() {
    // Loop through the items and get a list of item types.
    const itemTypes = [];

    if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i <DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const itemType = DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].type;

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
   * Get a list of common propertie
   * @param {string} itemType
   * @return {Array}
   */
  getItemProperties(itemType) {
    // Loop through the items and get a list of common properties.

    // check for valid itemType and selectionSet
    if (itemType === undefined || itemType === null ||DesignCore.Scene.selectionManager.selectionSet.selectionSet.length <= 0) {
      return;
    }

    let subset = [];

    // create subset array of selectionSet
    DesignCore.Scene.selectionManager.selectionSet.selectionSet.forEach((index) => {
      subset.push(DesignCore.Scene.items[index]);
    });

    // get a subset of the selectionSet
    if (itemType !== 'All') {
      subset = subset.filter((el) => el.type === itemType);
    }

    const propertiesList = [];

    subset.forEach((el) => {
      // get list of keys
      Object.keys(el).forEach( (key) => {
        // check if the key is already in the propertiesList
        if (propertiesList.includes(key) === false) {
        // check if all subset items contain the key
          if (subset.every((el) => el.hasOwnProperty(key))) {
            propertiesList.push(key);
          }
        }
      });
    });

    return propertiesList;
  }


  /**
   * Get a list the property values
   * @param {string} itemType
   * @param {string} property
   * @return {Array}
   */
  getItemPropertyValue(itemType, property) {
    // Loop through the items and get a list the property values
    const propertiesValueList = [];
    if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].type === itemType || itemType === 'All') {
          const prop = DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]][property];
          propertiesValueList.push(prop);
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
