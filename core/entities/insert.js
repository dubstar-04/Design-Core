
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
    return data;
  }

  draw(ctx, scale, core, colour) {
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
    return [];
  }

  touched(selectionExtremes, core) {
    // insert cannot be selected
    return false;
  }
}
