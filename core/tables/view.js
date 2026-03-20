import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Property } from '../properties/property.js';

/** View Class */
export class View {
  /**
   * Create a View
   * @param {Object} data
   */
  constructor(data) {
    // DXF Groupcode 5 - Handle
    this.handle = Property.loadValue([data?.handle, data?.[5]]);
    // DXF Groupcode 2 - Name
    this.name = Property.loadValue([data?.name, data?.[2]], '');
  }

  /**
   * Write the item to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'VIEW', DXFFile.Version.R2000);
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbViewTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', this.name, DXFFile.Version.R2000);
  }
}
