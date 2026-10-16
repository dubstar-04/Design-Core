import { DesignCore } from '../designCore.js';
// import {Strings} from '../lib/strings.js';
import { TableManagerBase } from './tableManagerBase.js';

/**
 * StyleManagerBase Class
 * @extends TableManagerBase
 */
export class StyleManagerBase extends TableManagerBase {
  /**
   * Create Style Manager
   */
  constructor() {
    super();

    // set the current style to the first available style
    this.currentstyle = this.items[0].name;
  }

  /**
   * Delete a style using the style index
   * @param {number} itemIndex
   * @param {boolean} showWarning
   */
  deleteStyle(itemIndex, showWarning = true) {
    // deleteItem returns the spliced array, or undefined when nothing was deleted
    const deletedItem = this.deleteItem(itemIndex, showWarning)?.[0];

    if (deletedItem) {
      // delete all item using the selected style
      this.deleteStyleFromScene(deletedItem.name);

      // the current style no longer exists, fall back to the first available style
      if (this.currentstyle?.toUpperCase() === deletedItem.name.toUpperCase()) {
        this.currentstyle = this.items[0]?.name;
      }
    }
  }

  /**
   * Delete all items that use style
   * @param {string} style
   */
  deleteStyleFromScene(style) {
    if (typeof style !== 'string') {
      return;
    }

    const target = style.toUpperCase();
    const selectionSet = [];

    for (let i = 0; i < DesignCore.Scene.entities.count(); i++) {
      const entity = DesignCore.Scene.entities.get(i);
      // entities without the property (e.g. a line has no dimensionStyle) are not dependent
      const value = entity.getProperty?.(this.itemProperty) ?? entity[this.itemProperty];

      if (typeof value === 'string' && value.toUpperCase() === target) {
        selectionSet.push(i);
      }
    }

    // sort the selection in descending order
    selectionSet.sort((a, b) => b - a);

    for (let j = 0; j < selectionSet.length; j++) {
      DesignCore.Scene.entities.remove((selectionSet[j]));
    }
  }

  /**
   * Get the name of the current style
   * @return {Object}
   */
  getCstyle() {
    return this.currentstyle;
  }

  /**
   * Set the current style
   * @param {string} cstyle
   */
  setCstyle(cstyle) {
    if (this.getItemByName(cstyle) !== undefined) {
      this.currentstyle = cstyle;
    }
  }


  /**
   * Ensure that used styles and default styles exist
   */
  checkStyles() {
    this.addStandardItems();

    for (let i = 0; i < DesignCore.Scene.entities.count(); i++) {
      const entity = DesignCore.Scene.entities.get(i);
      const style = entity.getProperty?.(this.itemProperty) ?? entity[this.itemProperty];
      this.addItem({
        'name': style,
      });
    }
  }

  /**
   * Rename the style at index with newName
   * @param {number} styleIndex
   * @param {string} newName
   */
  renameStyle(styleIndex, newName) {
    // get the existing name
    const currentStyleName = this.items[styleIndex].name;

    // call the super class rename
    const newUniqueName = this.renameItem(styleIndex, newName);

    if (newUniqueName === undefined) {
      return;
    }

    // if the style to change is the current style, update the currentstyle property
    if (currentStyleName === this.currentstyle) {
      this.setCstyle(newUniqueName);
    }
  }
}
