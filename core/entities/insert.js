import {Point} from './point.js';
// import { Utils } from '../lib/utils.js'
import {Intersection} from '../lib/intersect.js';
// import {Colours} from '../lib/colours.js';

export class Insert {
  constructor(data) {
    this.block = '';
    this.points = [];
    this.colour = 'BYLAYER';
    this.layer = '0';

    if (data) {
      this.block = data.block;

      if (data.points) {
        this.points = data.points;
      }

      if (data.colour) {
        this.colour = data.colour;
      }

      if (data.layer) {
        this.layer = data.layer;
      }
    }
  }

  static register() {
    const command = {command: 'Insert'};
    return command;
  }

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'Insert',
        '\n', '8',
        '\n', 0,
        '\n', '2', // name
        '\n', this.block,
        '\n', '10', // X
        '\n', this.points[0].x,
        '\n', '20', // Y
        '\n', this.points[0].y,
        '\n', '30', // Z
        '\n', '0.0',
    );
    // console.log(' insert.js - DXF Data:' + data);
    return data;
  }

  draw(ctx, scale, core) {
    return;
  }

  snaps(mousePoint, delta, core) {
    snaps = [];
    return snaps;
  }

  within(selectionExtremes, core) {
    // determin if this entities is within a the window specified by selectionExtremes
    const extremePoints = this.extremes();
    if (extremePoints[0] > this.points[0] &&
            extremePoints[1] < this.points[0] &&
            extremePoints[2] > this.points[0] &&
            extremePoints[3] < this.points[0]
    ) {
      return true;
    } else {
      return false;
    }
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

  extremes() {
    return [];
  }

  touched(selectionExtremes, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const rP1 = new Point(selectionExtremes[0], selectionExtremes[2]);
    const rP2 = new Point(selectionExtremes[1], selectionExtremes[3]);

    const rectPoints = {
      start: rP1,
      end: rP2,
    };

    const output = Intersection.intersectRectangleRectangle(this.intersectPoints(), rectPoints);
    // console.log(output.status);

    if (output.status === 'Intersection') {
      return true;
    }
    // no intersection found. return false
    return false;
  }
}
