import {BasePolyline} from './basePolyline.js';
import {Point} from './point.js';

export class Polyline extends BasePolyline {
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

  static register() {
    const command = {command: 'Polyline', shortcut: 'PL', type: 'Entity'};
    return command;
  }
}
