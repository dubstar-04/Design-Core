
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
    // console.log('Property Manager - Selection Set Changed');

    // If a callback is set - signal that a change has been made
    if (this.updateCallbackFunction) {
      this.updateCallbackFunction();
    }
  }

  setItemProperties(property, newPropertyValue) {
    // console.log('Property Manager - setItemProperties');
    for (let i = 0; i < this.core.scene.selectionSet.length; i++) {
      // check if the item has the selected property
      if (!this.core.scene.items[this.core.scene.selectionSet[i]].hasOwnProperty(property)) {
        continue;
      }

      if (typeof(this.core.scene.items[this.core.scene.selectionSet[i]][property]) !== typeof(newPropertyValue)) {
        this.core.notify('Incorrect input type');
      } else {
        this.core.scene.items[this.core.scene.selectionSet[i]][property] = newPropertyValue;
        this.core.scene.reloadSelectedItems();
      }
    }
  }

  getItemTypes() {
    // Loop through the items and get a list of item types.
    const itemTypes = [];

    if (this.core.scene.selectionSet.length > 0) {
      for (let i = 0; i < this.core.scene.selectionSet.length; i++) {
        const itemType = this.core.scene.items[this.core.scene.selectionSet[i]].type;
        // console.log(this.core.scene.items[this.core.scene.selectionSet[i]].type);

        if (itemTypes.indexOf(itemType, 0) === -1) {
          itemTypes.push(itemType);
          // console.log("ItemTypes: " + itemTypes.length)
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
    // console.log('Properties Manage - getItemProperties Item Type: ' + itemType);
    const propertiesList = [];

    if (this.core.scene.selectionSet.length > 0) {
      for (let i = 0; i < this.core.scene.selectionSet.length; i++) {
        // console.log("[propertiesManager.js - getItemProperties()] type:", items[selectionSet[i]].type)
        if (this.core.scene.items[this.core.scene.selectionSet[i]].type === itemType) {
          const properties = this.core.scene.items[this.core.scene.selectionSet[i]];
          for (const prop in properties) {
            // console.log("Property: " + prop)
            if (propertiesList.indexOf(prop, 0) === -1) {
              if (typeof properties[prop] !== 'function') {
                // TODO: Make these properties non-enumerable
                const excludeProps = ['type', 'family', 'minPoints', 'limitPoints', 'helper_geometry', 'points', 'alpha', 'showPreview'];
                if (excludeProps.indexOf(prop) === -1) {
                  propertiesList.push(prop);
                }
              }
            }
          }
        }
      }

      return propertiesList;
    }
  }


  getItemPropertyValue(itemType, property) {
    // Loop through the items and get a list the property values
    const propertiesValueList = [];
    // const propertyValue = '';
    if (this.core.scene.selectionSet.length > 0) {
      for (let i = 0; i < this.core.scene.selectionSet.length; i++) {
        if (this.core.scene.items[this.core.scene.selectionSet[i]].type === itemType) {
          const prop = this.core.scene.items[this.core.scene.selectionSet[i]][property];
          propertiesValueList.push(prop);
        }
      }
    }

    // console.log('[propertiesManager.getItemProperyValue()]', propertiesValueList);
    if (propertiesValueList.every(function(prop) {
      return prop === propertiesValueList[0];
    })) {
      return propertiesValueList[0];
    } else {
      return 'varies';
    }
  }
}
