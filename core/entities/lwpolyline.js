import { Logging } from '../lib/logging.js';
import { BasePolyline } from './basePolyline.js';

/**
 * LWPolyline Entity Class
 * @extends BasePolyline
 */
export class Lwpolyline extends BasePolyline {
  /**
   * Create an LW Polyline
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    if (data) {
      if (data.hasOwnProperty('90')) {
        // DXF Groupcode 90 - Number of vertices
        if (this.points.length !== data[90]) {
          Logging.instance.error(`LWPOLYLINE Vertices Count`);
        }
      }
    }
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Lwpolyline' };
    return command;
  }
}
