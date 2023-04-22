import {Strings} from '../lib/strings.js';
export class PropertyManager {
  constructor(core) {
    this.core = core;
    this.updateCallbackFunction; // set to external callback function
  }

  setPropertyCallbackFunction(callback) {
    // set the call
    this.updateCallbackFunction = callback;
  }


  selectionSetChanged() {
    // If a callback is set - signal that a change has been made
    if (this.updateCallbackFunction) {
      this.updateCallbackFunction();
    }
  }

  setItemProperties(property, newPropertyValue) {
    for (let i = 0; i < this.core.scene.selectionManager.selectionSet.selectionSet.length; i++) {
      // check if the item has the selected property
      if (!this.core.scene.items[this.core.scene.selectionManager.selectionSet.selectionSet[i]].hasOwnProperty(property)) {
        continue;
      }

      if (typeof(this.core.scene.items[this.core.scene.selectionManager.selectionSet.selectionSet[i]][property]) !== typeof(newPropertyValue)) {
        this.core.notify(Strings.Error.INPUT);
      } else {
        this.core.scene.items[this.core.scene.selectionManager.selectionSet.selectionSet[i]][property] = newPropertyValue;
        this.core.scene.selectionManager.reloadSelectedItems();
      }
    }
  }

  getItemTypes() {
    // Loop through the items and get a list of item types.
    const itemTypes = [];

    if (this.core.scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i < this.core.scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const itemType = this.core.scene.items[this.core.scene.selectionManager.selectionSet.selectionSet[i]].type;

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

  getItemProperties(itemType) {
    // Loop through the items and get a list of common properties.

    // check for valid itemType and selectionSet
    if (itemType === undefined || itemType === null || this.core.scene.selectionManager.selectionSet.selectionSet.length <= 0) {
      return;
    }

    let subset = [];

    // create subset array of selectionSet
    this.core.scene.selectionManager.selectionSet.selectionSet.forEach((index) => {
      subset.push(this.core.scene.items[index]);
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


  getItemPropertyValue(itemType, property) {
    // Loop through the items and get a list the property values
    const propertiesValueList = [];
    if (this.core.scene.selectionManager.selectionSet.selectionSet.length > 0) {
      for (let i = 0; i < this.core.scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (this.core.scene.items[this.core.scene.selectionManager.selectionSet.selectionSet[i]].type === itemType || itemType === 'All') {
          const prop = this.core.scene.items[this.core.scene.selectionManager.selectionSet.selectionSet[i]][property];
          propertiesValueList.push(prop);
        }
      }
    }

    if (propertiesValueList.every(function(prop) {
      return prop === propertiesValueList[0];
    })) {
      return propertiesValueList[0];
    } else {
      return Strings.Strings.VARIES;
    }
  }
}
