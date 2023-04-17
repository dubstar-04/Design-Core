import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';

export class Rectangle extends Entity {
  constructor(data) {
    super(data);

    if (data) {
      if (data.points) {
        // TODO: Rectangles should only store two points, but these are
        // currently used to support rotation
        this.points = [];
        const point1 = new Point(data.points[0].x, data.points[0].y);
        const point2 = new Point(data.points[1].x, data.points[0].y);
        const point3 = new Point(data.points[1].x, data.points[1].y);
        const point4 = new Point(data.points[0].x, data.points[1].y);
        const point5 = new Point(data.points[0].x, data.points[0].y);

        this.points.push(point1);
        this.points.push(point2);
        this.points.push(point3);
        this.points.push(point4);
        this.points.push(point5);
      }
    }
  }

  static register() {
    const command = {command: 'Rectangle', shortcut: 'REC', type: 'Entity'};
    return command;
  }

  processInput(num, input, inputType, core) {
    const expectedType = [];
    const prompt = [];

    prompt[1] = Strings.Input.START;
    expectedType[1] = ['Point'];

    prompt[2] = Strings.Input.END;
    expectedType[2] = ['Point'];

    return {expectedType: expectedType, prompt: prompt, reset: (num === prompt.length-1), action: num === this.minPoints};
  }

  draw(ctx, scale, core, colour) {
    try { // HTML Canvas
      ctx.strokeStyle = colour;
      ctx.lineWidth = this.lineWidth / scale;
      ctx.beginPath();
    } catch { // Cairo
      ctx.setLineWidth(this.lineWidth / scale);
      const rgbColour = Colours.hexToScaledRGB(colour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
    }

    ctx.moveTo(this.points[0].x, this.points[0].y);
    ctx.lineTo(this.points[1].x, this.points[1].y);
    ctx.lineTo(this.points[2].x, this.points[2].y);
    ctx.lineTo(this.points[3].x, this.points[3].y);
    ctx.lineTo(this.points[4].x, this.points[4].y);
    ctx.stroke();
  }

  dxf() {
    // Save the rectangle as a polyline as there is no rectangle DXF code
    const closed = (this.points[0].x === this.points[this.points.length - 1].x && this.points[0].y === this.points[this.points.length - 1].y);
    const vertices = this.vertices();
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'POLYLINE',
        // "\n", "5", //HANDLE
        // "\n", "DA",
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '66',
        '\n', '1',
        '\n', '10', // X
        '\n', '0',
        '\n', '20', // Y
        '\n', '0',
        '\n', '30', // Z
        '\n', '0',
        '\n', '39', // Line Width
        '\n', this.lineWidth,
        '\n', '70', // Flags
        '\n', closed ? '1' : '0',
        // "\n", "100", //Subclass marker
        // "\n", "AcDb2dPolyline",
        vertices, // Dont use a new line here as the vertix data will start with a new line.
        '\n', '0',
        '\n', 'SEQEND', // END OF SEQUENCE
        '\n', '8', // LAYERNAME
        '\n', this.layer,
    );
    return data;
  }

  vertices() {
    let verticesData = '';
    for (let i = 0; i < this.points.length; i++) {
      verticesData = verticesData.concat(
          '\n', '0',
          '\n', 'VERTEX',
          // "\n", "5", //HANDLE
          // "\n", "DA",
          '\n', '8', // LAYERNAME
          '\n', '0',
          // "\n", "100",
          // "\n", "AcDbVertex",
          // "\n", "100",
          // "\n", "AcDb2dVertex",
          '\n', '10', // X
          '\n', this.points[i].x,
          '\n', '20', // Y
          '\n', this.points[i].y,
          '\n', '30', // Z
          // "\n", "0",
          // "\n", "0",
          '\n', '0',
      );
    }

    return verticesData;
  }

  intersectPoints() {
    return {
      start: this.points[0],
      end: this.points[2],
    };
  }


  midPoint(x, x1, y, y1) {
    const midX = (x + x1) / 2;
    const midY = (y + y1) / 2;

    const midPoint = new Point(midX, midY);

    return midPoint;
  }


  snaps(mousePoint, delta, core) {
    const snaps = [];

    if (core.settings.endsnap) {
      // End points for each segment
      for (let i = 0; i < this.points.length; i++) {
        snaps.push(this.points[i]);
      }
    }

    if (core.settings.midsnap) {
      for (let i = 1; i < this.points.length; i++) {
        const start = this.points[i - 1];
        const end = this.points[i];

        snaps.push(this.midPoint(start.x, end.x, start.y, end.y));
      }
    }

    if (core.settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint);

      // Crude way to snap to the closest point or a node
      if (closest[1] < delta / 10) {
        snaps.push(closest[0]);
      }
    }

    return snaps;
  }

  closestPoint(P) {
    const closest = new Point();
    let distance = Infinity;


    for (let i = 1; i < this.points.length; i++) {
      const A = this.points[i - 1];
      const B = this.points[i];

      // find the closest point on the straight line
      const APx = P.x - A.x;
      const APy = P.y - A.y;
      const ABx = B.x - A.x;
      const ABy = B.y - A.y;

      const magAB2 = ABx * ABx + ABy * ABy;
      const ABdotAP = ABx * APx + ABy * APy;
      const t = ABdotAP / magAB2;


      // check if the point is < start or > end
      if (t > 0 && t < 1) {
        closest.x = A.x + ABx * t;
        closest.y = A.y + ABy * t;

        const dist = Utils.distBetweenPoints(P.x, P.y, closest.x, closest.y);
        if (dist < distance) {
          distance = dist;
        }
      }
    }

    return [closest, distance];
  }

  extremes() {
    const xValues = [];
    const yValues = [];

    for (let i = 0; i < this.points.length; i++) {
      xValues.push(this.points[i].x);
      yValues.push(this.points[i].y);
    }

    const xmin = Math.min(...xValues);
    const xmax = Math.max(...xValues);
    const ymin = Math.min(...yValues);
    const ymax = Math.max(...yValues);

    return [xmin, xmax, ymin, ymax];
  }
}
