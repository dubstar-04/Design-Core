import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Property } from '../properties/property.js';

/** AppID Class */
export class AppID {
  /**
   * Create an AppID
   * @param {Object} data
   */
  constructor(data) {
    this.name = '';
    this.flags = 0;

    // DXF Groupcode 5 - Handle
    this.handle = Property.loadValue([data?.handle, data?.[5]]);

    if (data) {
      if (data.hasOwnProperty('name') || data.hasOwnProperty('2')) {
        this.name = data.name || data[2];
      }

      if (data.hasOwnProperty('flags') || data.hasOwnProperty('70')) {
        this.flags = data.flags || data[70] || 0;
      }
    }
  }

  /**
   * Write the item to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'APPID', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbRegAppTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name, DXFFile.Version.R2000);
    file.writeGroupCode('70', this.flags.toString(), DXFFile.Version.R2000);
  }
}
