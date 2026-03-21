import { Entity } from './entity.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';

/**
 * SeqEnd Entity Class
 * @extends Entity
 */
export class SeqEnd extends Entity {
  /**
   * Create a SeqEnd Entity
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
    file.writeGroupCode('0', 'SEQEND');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
  }
}
