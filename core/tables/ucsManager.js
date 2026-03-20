import { DXFFile } from '../lib/dxf/dxfFile.js';
import { TableManagerBase } from './tableManagerBase.js';
import { UCS } from './ucs.js';

/**
 * UCSManager Class
 * @extends TableManagerBase
 */
export class UCSManager extends TableManagerBase {
  /** Create a UCSManager */
  constructor() {
    super();

    this.itemProperty = 'ucs';
  }

  /** Get the item class */
  get itemClass() {
    return UCS;
  }

  /** Add standard items */
  addStandardItems() {
    // No standard UCS items
  }

  /**
   * Write the table to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'UCS', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);
  }
}
