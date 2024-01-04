import {Core} from '../core.js';

export class StyleManagerBase {
  constructor() {
    this.styles = [];
    this.currentstyle = 'STANDARD';
    this.addStandardStyles();
  }


  /**
   * Get styles
   * @returns list of styles
   */
  getStyles() {
    return this.styles;
  }

  /**
   * Get style count
   * @returns number of styles
   */
  styleCount() {
    return this.styles.length;
  }

  /**
   * Adds a new style to the list of active styles
   */
  newStyle() {
    this.addStyle({
      'name': this.getUniqueName('NEW_STYLE'),
    });
  }

  /**
   * Generate a unique name
   * @param {string} name
   * @returns unique name
   */
  getUniqueName(name) {
    let count = 0;
    let styStr = name.replace(/ /g, '_'); // .toUpperCase();
    for (let i = 0; i < this.styleCount(); i++) {
      const styleName = this.styles[i].name.toUpperCase();
      if (styleName.includes(styStr.toUpperCase())) {
        count = count + 1;
      }
    }
    if (count > 0) {
      styStr = styStr + '_' + count;
    }

    return styStr;
  };

  /**
   * Add a style to the list of styles
   * @param {style} style
   */
  addStyle(style) {
    // Call the subclass to create a new typed style object
    const newstyle = this.createStyle(style);
    if (!this.styleExists(newstyle.name)) {
      this.styles.push(newstyle);
      // Core.Scene.saveRequired();
    }
  }

  /**
   * Delete all items that use style
   * @param {string} style
   */
  deleteStyleFromScene(style) {
    const selectionSet = [];

    for (let i = 0; i < Core.Scene.items.length; i++) {
      if (Core.Scene.items[i].style === style) {
        selectionSet.push(i);
      }
    }

    // sort the selection in descending order
    selectionSet.sort((a, b)=>b-a);

    for (let j = 0; j < selectionSet.length; j++) {
      Core.Scene.items.splice((selectionSet[j]), 1);
    }
  }

  /**
   * Delete a style using the style index
   * @param {number} styleIndex
   * @returns undefined
   */
  deleteStyle(styleIndex) {
    if (this.styles[styleIndex] === undefined) {
      return;
    }

    const styleToDelete = this.getStyleByIndex(styleIndex).name;

    // Can't delete STANDARD style
    if (styleToDelete.toUpperCase() === 'STANDARD') {
      return;
    }

    // Can't delete current style
    if (styleToDelete.toUpperCase() === this.currentstyle.toUpperCase()) {
      return;
    }

    // delete all item using the selected style
    this.deleteStyleFromScene(styleToDelete);

    // Delete The style
    this.styles.splice(styleIndex, 1);
  }

  /**
   * Get the name of the current style
   */
  getCstyle() {
    return this.currentstyle;
  }

  /**
   * Set the current style
   * @param {string} cstyle
   */
  setCstyle(cstyle) {
    if (this.getStyleByName(cstyle) !== undefined) {
      this.currentstyle = cstyle;
    }
  }

  /**
   * Check if a style with styleName exists
   * @param {string} styleName
   * @returns true or false
   */
  styleExists(styleName) {
    const styleExists = this.styles.some((el) => el.name.toUpperCase() === styleName.toUpperCase());
    return styleExists;
  }

  /**
   * Ensure that used styles and default styles exist
   */
  checkStyles() {
    if (!this.styleCount()) {
      this.addStandardStyles();
    }

    for (let i = 0; i < Core.Scene.items.length; i++) {
      const style = (items[i].style);
      this.addstyle({
        'name': style,
      });
    }
  }

  /**
   * get a style matching stylename
   * @param {string} styleName
   * @returns style object
   */
  getStyleByName(styleName) {
    for (let i = 0; i < this.styleCount(); i++) {
      if (this.styles[i].name === styleName) {
        return this.styles[i];
      }
    }

    return;
  }

  /**
   * Get the style from an index
   * @param {number} styleIndex
   * @returns
   */
  getStyleByIndex(styleIndex) {
    return this.styles[styleIndex];
  }


  /**
   * Rename the style at index with newName
   * @param {number} styleIndex
   * @param {string} newName
   * @returns undefined
   */
  renameStyle(styleIndex, newName) {
    // can't rename the STANDARD style
    if (this.getStyleByIndex(styleIndex).name.toUpperCase() === 'STANDARD') {
      return;
    }

    // can't rename styles to STANDARD
    if (newName.toUpperCase() === 'STANDARD') {
      return;
    }

    // make sure it is a new new name
    if (this.getStyleByIndex(styleIndex).name.toUpperCase() === newName.toUpperCase()) {
      return;
    }

    const newUniqueName = this.getUniqueName(newName);

    // if the style to change is the current style, update the currentstyle property
    if (this.getStyleByIndex(styleIndex).name === this.currentstyle) {
      this.setCstyle(newUniqueName);
    }

    // TODO: update all items using the stle
    this.styles[styleIndex].name = newUniqueName;
  }

  /**
   * Update the style property with value
   * @param {number} styleIndex
   * @param {string} property
   * @param {any} value
   */
  updateStyle(styleIndex, property, value) {
    // check of the index exists
    if (this.styles[styleIndex] === undefined) {
      const msg = 'Invalid Style Index';
      const err = (`${this.type} - ${msg}`);
      throw Error(err);
    }

    if (this.styles[styleIndex][property] === undefined) {
      const msg = 'Invalid Style Property';
      const err = (`${this.type} - ${msg}`);
      throw Error(err);
    }

    if (property.toUpperCase() === 'NAME') {
      this.renameStyle(styleIndex, value);
    } else {
      this.styles[styleIndex][property] = value;
    }
  }
}
