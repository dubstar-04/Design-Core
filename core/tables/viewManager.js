import { DXFFile } from '../lib/dxf/dxfFile.js';
import { TableManagerBase } from './tableManagerBase.js';
import { View } from './view.js';

/**
 * ViewManager Class
 * @extends TableManagerBase
 */
export class ViewManager extends TableManagerBase {
  /** Create a ViewManager */
  constructor() {
    super();

    this.itemProperty = 'view';
  }

  /**
   * Create a new view item
   * @param {Object} item
   * @return {Object}
   */
  createItem(item) {
    return new View(item);
  }

  /** Add standard items */
  addStandardItems() {
    // No standard view items
  }

  /**
   * Write the table to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'VIEW', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);
  }
}
