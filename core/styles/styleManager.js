import {Style} from './style.js';

export class StyleManager {
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
    let styStr = name.replace(/ /g, '_').toUpperCase();
    for (let i = 0; i < this.styleCount(); i++) {
      if (this.styles[i].name.includes(styStr)) {
        count = count + 1;
      }
    }
    if (count > 0) {
      styStr = styStr + '_' + count;
    }

    return styStr;
  };

  addStyle(style) {
    const newstyle = new Style(style);
    if (!this.styleExists(style)) {
      this.styles.push(newstyle);
      this.core.scene.saveRequired();
    }
  }

  deleteStyle(styleIndex) {
    const styleToDelete = this.getStyleByIndex(styleIndex).name;

    if (styleToDelete.toUpperCase() === 'STANDARD') {
      return;
    }

    const selectionSet = [];

    for (let i = 0; i < this.core.scene.items.length; i++) {
      if (items[i].style === styleToDelete) {
        selectionSet.push(i);
      }
    }

    selectionSet.sort();
    for (let j = 0; j < selectionSet.length; j++) {
      items.splice((selectionSet[j] - j), 1);
    }

    // Delete The style
    this.styles.splice(styleIndex, 1);
  }

  getCstyle() {
    return this.currentstyle;
  }

  setCstyle(cstyle) {
    this.currentstyle = cstyle;
  }

  styleExists(style) {
    let i = this.styleCount();
    while (i--) {
      if (this.styles[i].name === style.name) {
        return true;
      }
    }
    return false;
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
    this.addStyle({
      'name': 'ANNOTATIVE',
    });
    this.core.scene.saveRequired();
  }

  getStyleByName(styleName) {
    for (let i = 0; i < this.styleCount(); i++) {
      if (this.styles[i].name === styleName) {
        return this.styles[i];
      }
    }
  }

  getStyleByIndex(styleIndex) {
    return this.styles[styleIndex];
  }


  renameStyle(styleIndex, newName) {
    const newUniqueName = this.getUniqueName(newName);

    if (this.getStyleByIndex(styleIndex).name.toUpperCase() !== 'STANDARD') {
      if (this.getStyleByIndex(styleIndex).name === this.getCStyle()) {
        this.setCStyle(newUniqueName);
      }

      this.styles[styleIndex].name = newUniqueName;
    }
  }
}
