import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Property } from '../properties/property.js';

/** UCS Class */
export class UCS {
  /**
   * Create a UCS
   * @param {Object} data
   */
  constructor(data) {
    this.name = '';

    // DXF Groupcode 5 - Handle
    this.handle = Property.loadValue([data?.handle, data?.[5]]);

    if (data) {
      if (data.hasOwnProperty('name') || data.hasOwnProperty('2')) {
        this.name = data.name || data[2];
      }
    }
  }

  /**
   * Write the item to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'UCS', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbUCSTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name, DXFFile.Version.R2000);
  }
}
