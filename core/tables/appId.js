import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Property } from '../properties/property.js';

/** AppID Class */
export class AppID {
  /**
   * Create an AppID
   * @param {Object} data
   */
  constructor(data) {
    // DXF Groupcode 5 - Handle
    this.handle = Property.loadValue([data?.handle, data?.[5]]);
    // DXF Groupcode 2 - Name
    this.name = Property.loadValue([data?.name, data?.[2]], '');
    // DXF Groupcode 70 - Flags
    this.flags = Property.loadValue([data?.flags, data?.[70]], 0);
  }

  /**
   * Write the item to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'APPID', DXFFile.Version.R2000);
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbRegAppTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name, DXFFile.Version.R2000);
    file.writeGroupCode('70', this.flags.toString(), DXFFile.Version.R2000);
  }
}
