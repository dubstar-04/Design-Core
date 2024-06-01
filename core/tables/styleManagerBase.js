import {DesignCore} from '../designCore.js';
// import {Strings} from '../lib/strings.js';
import {TableManagerBase} from './tableManagerBase.js';

/**
 * StyleManagerBase Class
 * @extends TableManagerBase
 */
export class StyleManagerBase extends TableManagerBase {
  /** Create Style Manager */
  constructor() {
    super();

    // set the current style to the first available style
    this.currentstyle = this.items[0].name;
  }

  /**
   * Delete a style using the style index
   * @param {Number} itemIndex
   * @param {Boolean} showWarning
   */
  deleteStyle(itemIndex, showWarning=true) {
    // call the super class delete
    const deletedItem = this.deleteItem(itemIndex, showWarning);

    if (deletedItem) {
    // delete all item using the selected style
      this.deleteStyleFromScene(deletedItem.name);
    }
  }

  /**
   * Delete all items that use style
   * @param {String} style
   */
  deleteStyleFromScene(style) {
    const selectionSet = [];

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      if (DesignCore.Scene.items[i][this.itemProperty] === style) {
        selectionSet.push(i);
      }
    }

    // sort the selection in descending order
    selectionSet.sort((a, b)=>b-a);

    for (let j = 0; j < selectionSet.length; j++) {
      DesignCore.Scene.items.splice((selectionSet[j]), 1);
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
   * @param {String} cstyle
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
    if (!this.itemCount()) {
      this.addStandardItems();
    }

    for (let i = 0; i < DesignCore.Scene.items.length; i++) {
      const style = (DesignCore.Scene.getItem(i)[this.itemProperty]);
      this.addItem({
        'name': style,
      });
    }
  }

  /**
   * Rename the style at index with newName
   * @param {Number} styleIndex
   * @param {String} newName
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
