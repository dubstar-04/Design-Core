import {Point} from './point.js';
import {Strings} from '../lib/strings.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

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

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt2 = await core.scene.inputManager.requestInput(op2);
      this.points.push(pt2);

      core.scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview(core) {
    if (this.points.length >= 1) {
      const mousePoint = core.mouse.pointOnScene();
      const points = [this.points.at(-1), mousePoint];
      core.scene.createTempItem(this.type, {points: points});
    }
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

  dxf(file) {
    // TODO: duplicated code - store the rect as a polyline internally
    file.writeGroupCode('0', 'POLYLINE');
    // file.writeGroupCode('5', ''); //Handle
    file.writeGroupCode('8', this.layer); // LAYERNAME
    file.writeGroupCode('10', '0');
    file.writeGroupCode('20', '0');
    file.writeGroupCode('30', '0');
    file.writeGroupCode('39', this.lineWidth);
    const closed = (this.points[0].x === this.points[this.points.length - 1].x && this.points[0].y === this.points[this.points.length - 1].y);
    file.writeGroupCode('70', closed ? '1' : '0');
    // file.writeGroupCode('100', 'AcDb2dPolyline');
    file.writeGroupCode('66', '1'); // Vertices follow: required for R12, optional for R2000+
    this.vertices(file);
    file.writeGroupCode('0', 'SEQEND');
    file.writeGroupCode('8', this.layer);
  }

  vertices(file) {
    for (let i = 0; i < this.points.length; i++) {
      file.writeGroupCode('0', 'VERTEX');
      // file.writeGroupCode('5', ''); //Handle
      file.writeGroupCode('8', this.layer);
      // file.writeGroupCode('100', 'AcDbVertex');
      // file.writeGroupCode('100', 'AcDb2dVertex');
      file.writeGroupCode('10', this.points[i].x); // X
      file.writeGroupCode('20', this.points[i].y); // Y
      file.writeGroupCode('30', '0.0');
      file.writeGroupCode('42', this.points[i].bulge);
    }
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

        const dist = P.distance(closest);
        if (dist < distance) {
          distance = dist;
        }
      }
    }

    return [closest, distance];
  }

  boundingBox() {
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
