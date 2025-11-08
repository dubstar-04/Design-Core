import { DesignCore } from '../designCore.js';
import { Strings } from '../lib/strings.js';

/**
 * Table Manager Base Class
 */
export class TableManagerBase {
  /** Create a Table Manager */
  constructor() {
    this.items = [];
    this.addStandardItems();

    // list of mandatory items that cannot be deleted
    this.indelibleItems = [];
  }

  /**
   * Get items
   * @return {Array} list of items
   */
  getItems() {
    return this.items;
  }

  /**
   * Get item count
   * @return {number} number of items
   */
  itemCount() {
    return this.items.length;
  }

  /**
   * Adds a new item to the list of active items
   */
  newItem() {
    this.addItem({
      'name': this.getUniqueName(`NEW_${this.itemProperty}`.toUpperCase()),
    });
  }

  /**
   * Generate a unique name
   * @param {string} name
   * @return {string} unique name
   */
  getUniqueName(name) {
    let count = 0;
    let styStr = name.replace(/ /g, '_'); // .toUpperCase();
    for (let i = 0; i < this.itemCount(); i++) {
      const itemName = this.items[i].name.toUpperCase();
      if (itemName.includes(styStr.toUpperCase())) {
        count = count + 1;
      }
    }
    if (count > 0) {
      styStr = styStr + '_' + count;
    }

    return styStr;
  };

  /**
   * Add a item to the list of items
   * @param {item} item
   * @param {boolean} overwrite
   * @return {Objects}
   */
  addItem(item, overwrite = false) {
    // Call the subclass to create a new typed item object
    const newItem = this.createItem(item);
    const newItemName = newItem.name;
    if (!this.itemExists(newItemName)) {
      this.items.push(newItem);
    } else if (overwrite) {
      // Overwrite The item existing item
      // This is used when loading files;
      // Standard items already exist but should be overwritten by the incoming item
      this.items.splice(this.getItemIndex(newItemName), 1, newItem);
    }
    // DesignCore.Scene.saveRequired();
    return newItem;
  }

  /**
   * Delete a item using the item index
   * @param {number} itemIndex
   * @param {boolean} showWarning
   * @return {Array} array containing deleted item or undefined
   */
  deleteItem(itemIndex, showWarning = true) {
    if (this.items[itemIndex] === undefined) {
      return;
    }

    const itemToDelete = this.getItemByIndex(itemIndex).name;

    // Can't delete indelible items (Standard Text Item, Layer 0)
    if (this.indelibleItems.some((item) => item.toUpperCase() === itemToDelete.toUpperCase())) {
      if (showWarning) {
        DesignCore.Core.notify(`${itemToDelete} ${Strings.Message.CANNOTBEDELETED}`);
      }
      return;
    }

    // Delete The item
    return this.items.splice(itemIndex, 1);
  }


  /**
   * Check if a item with itemName exists
   * @param {string} itemName
   * @return {boolean}
   */
  itemExists(itemName) {
    const itemExists = this.items.some((el) => el.name.toUpperCase() === itemName.toUpperCase());
    return itemExists;
  }

  /**
   * Ensure that used items and default items exist
   */
  checkItems() {
    if (!this.itemCount()) {
      this.addStandardItems();
    }

    for (let i = 0; i < DesignCore.Scene.items.length; i++) {
      const item = (DesignCore.Scene.getItem(i)[this.itemProperty]);
      this.addItem({
        'name': item,
      });
    }
  }

  /**
   * Clear all existing items
   */
  clearItems() {
    this.items = [];
  }

  /**
   * Find the index of itemName
   * @param {string} itemName
   * @return {number} index of the item or -1 if item doesn't exist
   */
  getItemIndex(itemName) {
    return this.items.findIndex((item) => item.name.toUpperCase() === itemName.toUpperCase());
  }

  /**
   * Get the item from an index
   * @param {number} itemIndex
   * @return {number}
   */
  getItemByIndex(itemIndex) {
    return this.items[itemIndex];
  }

  /**
   * get a item matching itemname
   * @param {string} itemName
   * @return {Object}
   */
  getItemByName(itemName) {
    for (let i = 0; i < this.itemCount(); i++) {
      if (this.items[i].name.toUpperCase() === itemName.toUpperCase()) {
        return this.items[i];
      }
    }

    const msg = 'Invalid Item Name';
    const err = (`${this.constructor.name} - ${msg}: ${itemName}`);
    throw Error(err);

    // return;
  }

  /**
   * Get the item from an index
   * @param {number} itemIndex
   * @return {Object}
   */
  getItemByIndex(itemIndex) {
    return this.items[itemIndex];
  }


  /**
   * Rename the item at index with newName
   * @param {number} itemIndex
   * @param {string} newName
   * @return {string} new name or undefined
   */
  renameItem(itemIndex, newName) {
    const itemToRename = this.getItemByIndex(itemIndex).name;

    // make sure it is a new name
    if (itemToRename.toUpperCase() === newName.toUpperCase()) {
      return;
    }

    // Can't rename indelible items (Standard Text Item, Layer 0)
    if (this.indelibleItems.some((item) => item.toUpperCase() === itemToRename.toUpperCase())) {
      DesignCore.Core.notify(`${itemToRename} ${Strings.Message.CANNOTBERENAMED}`);
      return;
    }

    // Can't use the name of indelible items (Standard Text Item, Layer 0)
    if (this.indelibleItems.some((item) => item.toUpperCase() === newName.toUpperCase())) {
      DesignCore.Core.notify(`${newName} ${Strings.Message.CANNOTBERENAMED}`);
      return;
    }

    const newUniqueName = this.getUniqueName(newName);
    const currentItemName = this.items[itemIndex].name;
    this.items[itemIndex].name = newUniqueName;

    // update all scene items with the new item value
    this.updateSceneItem(currentItemName, newUniqueName);

    return newUniqueName;
  }

  /**
   * Update all items that use item
   * @param {string} oldItemName
   * @param {string} newItemName
   */
  updateSceneItem(oldItemName, newItemName) {
    for (let i = 0; i < DesignCore.Scene.items.length; i++) {
      if (DesignCore.Scene.items[i][this.itemProperty] === oldItemName) {
        DesignCore.Scene.items[i][this.itemProperty] = newItemName;
      }
    }
  }

  /**
   * Update the item property with value
   * @param {number} itemIndex
   * @param {string} property
   * @param {any} value
   */
  updateItem(itemIndex, property, value) {
    // check of the index exists
    if (this.items[itemIndex] === undefined) {
      const msg = 'Invalid Item Index';
      const err = (`${this.type} - ${msg}`);
      throw Error(err);
    }

    if (this.items[itemIndex][property] === undefined) {
      const msg = 'Invalid Item Property';
      const err = (`${this.type} - ${msg}`);
      throw Error(err);
    }

    if (property.toUpperCase() === 'NAME') {
      this.renameItem(itemIndex, value);
    } else {
      this.items[itemIndex][property] = value;
    }
  }

  /** Purge unused items */
  purge() {
    const itemsToPurge = [];
    this.items.forEach((item, index) => {
      const searchTerm = this.itemProperty === 'block' ? item : item.name;
      const items = DesignCore.Scene.findItem('ANY', this.itemProperty, searchTerm);
      if (items.length === 0) {
        itemsToPurge.push(index);
      }
    });

    // sort the selection in descending order
    itemsToPurge.sort((a, b) => b - a);
    itemsToPurge.forEach((itemIndex) => this.deleteItem(itemIndex, false));
  }
}
