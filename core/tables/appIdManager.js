import { DXFFile } from '../lib/dxf/dxfFile.js';
import { TableManagerBase } from './tableManagerBase.js';
import { AppID } from './appId.js';

/**
 * AppIDManager Class
 * @extends TableManagerBase
 */
export class AppIDManager extends TableManagerBase {
  /** Create an AppIDManager */
  constructor() {
    super();

    this.indelibleItems.push('ACAD');
    this.itemProperty = 'appid';
  }

  /** @type {typeof AppID} */
  get itemClass() {
    return AppID;
  }

  /** Add standard items */
  addStandardItems() {
    this.addItem({ 'name': 'ACAD' });
  }

  /**
   * Write the table to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'TABLE', DXFFile.Version.R2000);
    file.writeGroupCode('2', 'APPID', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);

    for (let i = 0; i < this.itemCount(); i++) {
      this.getItemByIndex(i).dxf(file);
    }

    file.writeGroupCode('0', 'ENDTAB', DXFFile.Version.R2000);
  }
}
