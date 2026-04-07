import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BasePolyline } from './basePolyline.js';
import { Point } from './point.js';

/**
 * Polyline Entity Class
 * @extends BasePolyline
 */
export class Polyline extends BasePolyline {
  static type = 'Polyline';

  /**
   * Create a Polyline
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    if (data) {
      if (data.hasOwnProperty('children')) {
        // remove any points
        // point data comes from the vertices
        if (data.hasOwnProperty('points')) {
          this.points = [];
        }

        data.children.forEach((child) => {
          if (child[0] === 'VERTEX') {
            child.points.forEach((point) => {
              const pt = new Point(point.x, point.y);
              if (point.hasOwnProperty('bulge')) {
                pt.bulge = point.bulge;
              }
              this.points.push(pt);
            });
          }
        });
      }
    }
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    if (file.version < DXFFile.Version.R2000) {
      // POLYLINE/VERTEX/SEQEND format for R12
      file.writeGroupCode('0', 'POLYLINE');
      file.writeGroupCode('8', this.layer);
      file.writeGroupCode('6', this.lineType);
      file.writeGroupCode('66', 1); // vertices-follow flag
      file.writeGroupCode('70', this.flags.getFlagValue());

      for (let i = 0; i < this.points.length; i++) {
        file.writeGroupCode('0', 'VERTEX');
        file.writeGroupCode('8', this.layer);
        file.writeGroupCode('10', this.points[i].x);
        file.writeGroupCode('20', this.points[i].y);
        file.writeGroupCode('30', '0.0');
        file.writeGroupCode('42', this.points[i].bulge);
      }

      file.writeGroupCode('0', 'SEQEND');
      file.writeGroupCode('8', this.layer);
      return;
    }

    // Default to LWPOLYLINE output for R2000 and later
    super.dxf(file);
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Polyline', shortcut: 'PL', type: 'Entity' };
    return command;
  }
}
