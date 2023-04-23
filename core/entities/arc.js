import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';


export class Arc extends Entity {
  constructor(data) {
    super(data);
    this.radius = 1;

    if (data) {
      if (data.points || data[40]) {
        // DXF Groupcode 40 - Radius
        // get the radius from the points or the incoming dxf groupcode
        const radius = this.points[1] ? this.points[0].distance(this.points[1]) : data[40];

        if (radius !== undefined) {
          this.radius = radius;
        }
      }

      if (data.hasOwnProperty('startAngle') || data[50]) {
        // DXF Groupcode 50 - Start Angle
        const angle = Utils.degrees2radians(data.startAngle || data[50]);
        this.points[1] = this.points[0].project(angle, this.radius);
      }

      if (data.hasOwnProperty('endAngle') || data[51]) {
        // DXF Groupcode 51 - End Angle
        const angle = Utils.degrees2radians(data.endAngle || data[51]);
        this.points[2] = this.points[0].project(angle, this.radius);
      }
    }
  }

  static register() {
    const command = {command: 'Arc', shortcut: 'A', type: 'Entity'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.CENTER, [Input.Type.POINT]);
      const pt = await core.scene.inputManager.requestInput(op);
      this.points.push(pt);

      const op1 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op1);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT, Input.Type.NUMBER]);
      const pt2 = await core.scene.inputManager.requestInput(op2);

      if (Input.getType(pt2) === Input.Type.POINT) {
        this.points.push(pt2);
      } else if (Input.getType(pt2) === Input.Type.NUMBER) {
        const basePoint = this.points.at(0);
        const startPoint = this.points.at(1);
        const angle = Utils.degrees2radians(pt2);
        const point = startPoint.rotate(basePoint, angle);
        this.points.push(point);
      }

      core.scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview(core) {
    if (this.points.length >= 1) {
      const mousePoint = core.mouse.pointOnScene();
      const points = [this.points.at(0), mousePoint];
      core.scene.createTempItem('Line', {points: points});
    }

    if (this.points.length >= 2) {
      const mousePoint = core.mouse.pointOnScene();
      const points = [...this.points, mousePoint];
      core.scene.createTempItem(this.type, {points: points});
    }
  }

  startAngle() {
    return this.points[0].angle(this.points[1]);
  }

  endAngle() {
    return this.points[0].angle(this.points[2]);
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

    ctx.arc(this.points[0].x, this.points[0].y, this.radius, this.startAngle(), this.endAngle());

    ctx.stroke();
  }

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'ARC',
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '10', // X
        '\n', this.points[0].x,
        '\n', '20', // Y
        '\n', this.points[0].y,
        '\n', '30', // Z
        '\n', '0.0',
        '\n', '40',
        '\n', this.radius, // Radius
        '\n', '50', // START ANGLE
        '\n', Utils.radians2degrees(this.startAngle()), // Radians
        '\n', '51', // END ANGLE
        '\n', Utils.radians2degrees(this.endAngle()), // Radians
    );
    return data;
  }

  intersectPoints() {
    return {
      centre: this.points[0],
      radius: this.radius,
      startAngle: this.startAngle(),
      endAngle: this.endAngle(),
    };
  }

  snaps(mousePoint, delta, core) {
    const snaps = [];

    if (core.settings.endsnap) {
      // Speed this up by generating the proper start and end points when the arc is initialised
      const startPoint = new Point(this.points[0].x + (this.radius * Math.cos(this.startAngle())),
          this.points[0].y + (this.radius * Math.sin(this.startAngle())));
      const endPoint = new Point(this.points[0].x + (this.radius * Math.cos(this.endAngle())),
          this.points[0].y + (this.radius * Math.sin(this.endAngle())));

      snaps.push(startPoint, endPoint);
    }

    if (core.settings.centresnap) {
      const centre = this.points[0];
      snaps.push(centre);
    }

    if (core.settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint);

      // Crude way to snap to the closest point or a node
      if (closest[2] === true && closest[1] < delta / 10) {
        snaps.push(closest[0]);
      }
    }


    return snaps;
  }

  closestPoint(P) {
    // find the closest point on the Arc
    const length = this.points[0].distance(P);
    const Cx = this.points[0].x + this.radius * (P.x - this.points[0].x) / length;
    const Cy = this.points[0].y + this.radius * (P.y - this.points[0].y) / length;
    const closest = new Point(Cx, Cy);
    const distance = closest.distance(P);

    const snapAngle = this.points[0].angle(P);

    if (this.startAngle() < this.endAngle()) {
      // Arc scenario 1 - start angle < end angle
      // if the intersection angle is > start angle AND < end angle the point in on the arc
      if (snapAngle > this.startAngle() && snapAngle < this.endAngle()) {
        return [closest, distance, true];
      }
    } else if (this.startAngle() > this.endAngle()) {
      // Arc scenario 2 - start angle > end angle
      // if the intersection angle is > start angle AND < 0 radians OR
      // the intersection angle is < end angle AND > 0 radians the point in on the arc
      if (snapAngle > this.startAngle() && snapAngle <= (Math.PI * 2) ||
          snapAngle < this.endAngle() && snapAngle > 0) {
        return [closest, distance, true];
      }
    }

    // closest point not on the arc
    return [closest, Infinity, false];
  }

  extremes() {
    const xValues = [];
    const yValues = [];

    xValues.push(this.radius * Math.cos(this.startAngle()) + this.points[0].x);
    yValues.push(this.radius * Math.sin(this.startAngle()) + this.points[0].y);
    xValues.push(this.radius * Math.cos(this.endAngle()) + this.points[0].x);
    yValues.push(this.radius * Math.sin(this.endAngle()) + this.points[0].y);

    xValues.push((xValues[0] + xValues[1]) / 2);
    yValues.push((yValues[0] + yValues[1]) / 2);

    const xmin = Math.min(...xValues);
    const xmax = Math.max(...xValues);
    const ymin = Math.min(...yValues);
    const ymax = Math.max(...yValues);

    return [xmin, xmax, ymin, ymax];
  }
}
