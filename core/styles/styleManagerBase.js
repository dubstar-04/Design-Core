export class StyleManagerBase {
  constructor(core) {
    this.styles = [];
    this.currentstyle = 'STANDARD';
    this.core = core;
    this.addStandardStyles();
  }


  getStyles() {
    return this.styles;
  }

  styleCount() {
    return this.styles.length;
  }

  newStyle() {
    this.addStyle({
      'name': this.getUniqueName('NEW_STYLE'),
    });
  }

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

  addStyle(style) {
    // Call the subclass to create a new typed style object
    const newstyle = this.createStyle(style);
    if (!this.styleExists(newstyle.name)) {
      this.styles.push(newstyle);
      // this.core.scene.saveRequired();
    }
  }

  /**
   * Delete all items that use style
   * @param {string} style
   */
  deleteStyleFromScene(style) {
    const selectionSet = [];

    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (this.core.scene.items[i].style === style) {
        selectionSet.push(i);
      }
    }

    // sort the selection in descending order
    selectionSet.sort((a, b)=>b-a);

    for (let j = 0; j < selectionSet.length; j++) {
      this.core.scene.items.splice((selectionSet[j]), 1);
    }
  }

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

  checkStyles() {
    if (!this.styleCount()) {
      this.addStandardStyles();
    }

    for (let i = 0; i < this.core.scene.items.length; i++) {
      const style = (items[i].style);
      this.addstyle({
        'name': style,
      });
    }
  }

  addStandardStyles() {
    this.addStyle({
      'name': 'STANDARD',
    });
    /*
    this.addStyle({
      'name': 'ANNOTATIVE',
    });
    */
    // this.core.scene.saveRequired();
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

  getStyleByIndex(styleIndex) {
    return this.styles[styleIndex];
  }


  renameStyle(styleIndex, newName) {
    // can't rename the STANDARD style
    if (this.getStyleByIndex(styleIndex).name.toUpperCase() === 'STANDARD') {
      return;
    }

    // can't rename styles to STANDARD
    if (newName.toUpperCase() === 'STANDARD') {
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
}
