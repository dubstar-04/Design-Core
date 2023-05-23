import {BoundingBox} from '../lib/boundingBox.js';

export class Insert {
  constructor(data) {
    this.block = '';

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

  snaps(mousePoint, delta, core) {
    snaps = [];
    return snaps;
  }

  within(selectionExtremes, core) {
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

  touched(selectionExtremes, core) {
    // insert cannot be selected
    return false;
  }
}
