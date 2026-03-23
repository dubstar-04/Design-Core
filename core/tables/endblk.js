import { Entity } from '../entities/entity.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';

/**
 * EndBlock Entity Class
 * @extends Entity
 */
export class EndBlock extends Entity {
  /**
   * Create an EndBlock Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'ENDBLK');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    // file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbBlockEnd', DXFFile.Version.R2000);
  }
}
