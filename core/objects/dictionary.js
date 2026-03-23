import { DXFFile } from '../lib/dxf/dxfFile.js';
import { Property } from '../properties/property.js';

/** Dictionary Class */
export class Dictionary {
  /**
   * Create a Dictionary
   * @param {Object} data
   */
  constructor(data) {
    // DXF Groupcode 5 - Handle
    this.handle = Property.loadValue([data?.handle, data?.[5]]);
    this.name = Property.loadValue([data?.name, data?.[3]], '');
    this.duplicateRecordCloning = Property.loadValue([data?.duplicateRecordCloning, data?.[281]], 1);
    this.entries = Property.loadValue([data?.entries], []);

    // Build entries from DXF group codes 3 (name) and 350 (handle)
    if (!this.entries.length && data?.[3] !== undefined && data?.[350] !== undefined) {
      const names = Array.isArray(data[3]) ? data[3] : [data[3]];
      const handles = Array.isArray(data[350]) ? data[350] : [data[350]];

      for (let i = 0; i < names.length && i < handles.length; i++) {
        this.entries.push({ 'name': names[i], 'handle': handles[i] });
      }
    }
  }

  /**
   * Write the item to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'DICTIONARY', DXFFile.Version.R2000);
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbDictionary', DXFFile.Version.R2000);
    file.writeGroupCode('281', this.duplicateRecordCloning.toString(), DXFFile.Version.R2000);

    for (let i = 0; i < this.entries.length; i++) {
      file.writeGroupCode('3', this.entries[i].name, DXFFile.Version.R2000);
      file.writeGroupCode('350', this.entries[i].handle, DXFFile.Version.R2000);
    }
  }
}
