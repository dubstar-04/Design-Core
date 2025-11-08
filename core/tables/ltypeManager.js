import { DXFFile } from '../lib/dxf/dxfFile.js';
import { StyleManagerBase } from './styleManagerBase.js';
import { LType } from './ltype.js';

/**
 * Line Type Manager Class
 * @extends StyleManagerBase
 */
export class LTypeManager extends StyleManagerBase {
  /** Create a LTypeManager */
  constructor() {
    super();

    this.indelibleItems.push('CONTINUOUS', 'ByLayer', 'ByBlock');
    this.itemProperty = 'lineType';
  }

  /**
   * Create a new LineType
   * @param {Object} style
   * @return {Object}
   */
  createItem(style) {
    return new LType(style);
  }

  /** Add standard line types */
  addStandardItems() {
    this.addItem({ 'name': 'CONTINUOUS', 'description': 'Solid Line ________________________________________' });
    this.addItem({ 'name': 'ByLayer' });
    this.addItem({ 'name': 'ByBlock' });
  }

  /**
   * Get a list of optional line types
   * @return {Array}
   */
  getOptionalStyles() {
    const styles = [];
    styles.push({ 'name': 'CONTINUOUS', 'description': 'Solid Line ________________________________________' });
    styles.push({ 'name': 'CENTER', 'pattern': [31.75, -6.35, 6.35, -6.35], 'description': 'Center ____ _ ____ _ ____ _ ____ _ ____ _ ____' });
    styles.push({ 'name': 'DASHDOT', 'pattern': [12.7, -6.345, 0, -6.345], 'description': 'Dash dot __ . __ . __ . __ . __ . __ . __ . __' });
    styles.push({ 'name': 'DOT', 'pattern': [0, -6.35], 'description': 'Dot . . . . . . . . . . . . . . . . . . . . . .' });
    styles.push({ 'name': 'DASHED', 'pattern': [12.7, -6.35], 'description': 'Dashed __ __ __ __ __ __ __ __ __ __ __ __ __ _' });
    styles.push({ 'name': 'HIDDEN', 'pattern': [6.35, -3.175], 'description': 'Hidden __ __ __ __ __ __ __ __ __ __ __ __ __ _' });
    return styles;
  }

  /**
   * Write the table to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    // Create table data for ltype styles
    // The LTYPE Table must preceed the LAYER table
    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'LTYPE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', this.itemCount());


    for (let i = 0; i < this.itemCount(); i++) {
      this.getItemByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB');
  }
}
