import { Entity } from './entity.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';

/**
 * Vertex Entity Class
 * @extends Entity
 */
export class Vertex extends Entity {
  /**
   * Create a Vertex Entity
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
    file.writeGroupCode('0', 'VERTEX');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbVertex', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDb2dVertex', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('42', this.points[0].bulge);
  }
}
