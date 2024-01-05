import {Entity} from './entity.js';
import {BoundingBox} from '../lib/boundingBox.js';

import {DesignCore} from '../designCore.js';

export class Insert extends Entity {
  constructor(data) {
    super(data);

    // add block property
    Object.defineProperty(this, 'block', {
      value: '',
      writable: true,
    });

    if (data) {
      if (data.block || data[2]) {
        // DXF Groupcode 2 - Block name
        this.block = data.block || data[2];
      }

      if (data[41]) {
        // DXF Groupcode 41 - X Scale Factor (optional, default = 1)
        const err = 'Groupcode 41 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[42]) {
        // DXF Groupcode 42 - Y Scale Factor (optional, default = 1)
        const err = 'Groupcode 42 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[43]) {
        // DXF Groupcode 43 - Z Scale Factor (optional, default = 1)
        const err = 'Groupcode 43 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[44]) {
        // DXF Groupcode 44 - Column Spacing (optional, default = 0)
        const err = 'Groupcode 44 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[45]) {
        // DXF Groupcode 45 - Row Spacing (optional, default = 0)
        const err = 'Groupcode 45 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[50]) {
        // DXF Groupcode 50 - Rotation Angle (optional, default = 0)
        const err = 'Groupcode 50 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[70]) {
        // DXF Groupcode 70 - Column Count (optional, default = 1)
        const err = 'Groupcode 70 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }

      if (data[71]) {
        // DXF Groupcode 71 - Row Count(optional, default = 1)
        const err = 'Groupcode 71 not implemented';
        Logging.instance.warn(`${this.type} - ${err}`);
      }
    }
  }

  static register() {
    const command = {command: 'Insert'};
    return command;
  }

  dxf(file) {
    file.writeGroupCode('0', 'INSERT');
    // file.writeGroupCode('5', ''); // Handle
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('2', this.block);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
  }

  draw(ctx, scale) {
    return;
  }

  snaps(mousePoint, delta) {
    snaps = [];
    return snaps;
  }

  within(selectionExtremes) {
    // insert cannot be selected
    return false;
  }

  intersectPoints() {
    return {
      start: this.points[0],
      end: this.points[0],
    };
  }

  closestPoint(P) {
    const distance = P.distance(this.points[0]);
    const minPnt = this.points[0];

    return [minPnt, distance];
  }

  boundingBox() {
    return new BoundingBox();
  }

  touched(selectionExtremes) {
    // insert cannot be selected
    return false;
  }
}
