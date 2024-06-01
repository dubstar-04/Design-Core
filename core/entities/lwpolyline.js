import {Logging} from '../lib/logging.js';
import {BasePolyline} from './basePolyline.js';

/**
 * LWPolyline Entity Class
 * @extends BasePolyline
 */
export class Lwpolyline extends BasePolyline {
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

  static register() {
    const command = {command: 'Lwpolyline'};
    return command;
  }
}
