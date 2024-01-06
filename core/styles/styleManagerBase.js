import {DesignCore} from '../designCore.js';

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
  addStyle(style, overwrite=false) {
    // Call the subclass to create a new typed style object
    const newStyle = this.createStyle(style);
    const newStyleName = newStyle.name;
    if (!this.styleExists(newStyleName)) {
      this.styles.push(newStyle);
    } else if (overwrite) {
      // Overwrite The style existing style
      // This is used when loading files;
      // Standard styles already exist but should be overwritten by the incoming style
      this.styles.splice(this.getStyleIndex(newStyleName), 1, newStyle);
    }
    // DesignCore.Scene.saveRequired();
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
   * Delete all items that use style
   * @param {string} style
   */
  deleteStyleFromScene(style) {
    const selectionSet = [];

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      if (DesignCore.Scene.items[i][this.styleProperty] === style) {
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

    for (let i = 0; i <DesignCore.Scene.items.length; i++) {
      const style = (items[i].style);
      this.addstyle({
        'name': style,
      });
    }
  }

  /**
   * Clear all existing styles
   */
  clearStyles() {
    this.styles = [];
  }

  /**
   * Find the index of styleName
   * @param {string} styleName
   * @returns index of the style or -1 if style doesn't exist
   */
  getStyleIndex(styleName) {
    return this.styles.findIndex((style) => style.name.toUpperCase() === styleName.toUpperCase());
  }

  /**
   * get a style matching stylename
   * @param {string} styleName
   * @returns style object
   */
  getStyleByName(styleName) {
    for (let i = 0; i < this.styleCount(); i++) {
      if (this.styles[i].name.toUpperCase() === styleName.toUpperCase()) {
        return this.styles[i];
      }
    }

    const msg = 'Invalid Style Name';
    const err = (`${this.type} - ${msg}`);
    throw Error(err);

    // return;
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

    // TODO: update all items using the style
    const currentStyleName = this.styles[styleIndex].name;
    this.styles[styleIndex].name = newUniqueName;

    // if the style to change is the current style, update the currentstyle property
    if (currentStyleName === this.currentstyle) {
      this.setCstyle(newUniqueName);
    }
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
