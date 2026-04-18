import { Logging } from '../lib/logging.js';
import { Polyline } from './polyline.js';

/**
 * LWPolyline Entity Class
 * LWPolyline is a DXF import-only entity. The constructor pre-processes the
 * raw DXF data and returns a {@link Polyline} instance. It is never
 * instantiated as a standalone entity within the application.
 */
export class Lwpolyline {
  static type = 'Lwpolyline';

  /**
   * Create an LW Polyline
   * @param {Array} data
   */
  constructor(data) {
    if (data?.hasOwnProperty('90')) {
      // DXF Groupcode 90 - Number of vertices
      if (data.points.length !== data[90]) {
        Logging.instance.error(`LWPOLYLINE Vertices Count`);
      }
    }

    if (data?.points?.length >= 4 && data.points[0].isSame(data.points.at(-1))) {
      data.points.pop();
      data[70] = (data[70] ?? 0) | 1;
    }

    return new Polyline(data);
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
