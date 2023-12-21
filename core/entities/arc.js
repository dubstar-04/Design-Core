import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';

import {Core} from '../core.js';


export class Arc extends Entity {
  constructor(data) {
    super(data);
    this.radius = 1;

    // direction: - ccw > 0, cw < 0
    Object.defineProperty(this, 'direction', {
      // enumerable: false,
      value: 1,
      writable: true,
    });

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

      if (data.hasOwnProperty('direction')) {
        // No DXF Groupcode - Arc Direction
        const direction = data.direction;
        this.direction = direction;
      }
    }
  }

  static register() {
    const command = {command: 'Arc', shortcut: 'A', type: 'Entity'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.CENTER, [Input.Type.POINT]);
      const pt = await Core.Scene.inputManager.requestInput(op);
      this.points.push(pt);

      const op1 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await Core.Scene.inputManager.requestInput(op1);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.ANGLE, [Input.Type.POINT, Input.Type.NUMBER]);
      const pt2 = await Core.Scene.inputManager.requestInput(op2);

      if (Input.getType(pt2) === Input.Type.POINT) {
        this.points.push(pt2);
      } else if (Input.getType(pt2) === Input.Type.NUMBER) {
        const basePoint = this.points.at(0);
        const startPoint = this.points.at(1);
        const angle = Utils.degrees2radians(pt2);
        const point = startPoint.rotate(basePoint, angle);
        this.points.push(point);
      }

      Core.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    if (this.points.length >= 1) {
      const mousePoint = Core.Mouse.pointOnScene();
      const points = [this.points.at(0), mousePoint];
      Core.Scene.createTempItem('Line', {points: points});
    }

    if (this.points.length >= 2) {
      const mousePoint = Core.Mouse.pointOnScene();
      const points = [...this.points, mousePoint];
      Core.Scene.createTempItem(this.type, {points: points});
    }
  }

  startAngle() {
    return this.points[0].angle(this.points[1]);
  }

  endAngle() {
    return this.points[0].angle(this.points[2]);
  }

  getRadius() {
    return this.radius;
  }

  draw(ctx, scale) {
    ctx.arc(this.points[0].x, this.points[0].y, this.radius, this.startAngle(), this.endAngle());
    ctx.stroke();
  }

  dxf(file) {
    file.writeGroupCode('0', 'ARC');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbCircle', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer); // LAYERNAME
    file.writeGroupCode('10', this.points[0].x); // X
    file.writeGroupCode('20', this.points[0].y); // Y
    file.writeGroupCode('30', '0.0'); // Z
    file.writeGroupCode('40', this.radius); // Radius
    file.writeGroupCode('100', 'AcDbArc', DXFFile.Version.R2000);
    file.writeGroupCode('50', Utils.radians2degrees(this.startAngle())); // Start Angle
    file.writeGroupCode('51', Utils.radians2degrees(this.endAngle())); // End Angle
  }

  intersectPoints() {
    return {
      centre: this.points[0],
      startPoint: this.points[1],
      endPoint: this.points[2],
      radius: this.radius,
      direction: this.direction,
    };
  }

  snaps(mousePoint, delta) {
    const snaps = [];

    if (Core.Settings.endsnap) {
      // Speed this up by generating the proper start and end points when the arc is initialised
      const startPoint = new Point(this.points[0].x + (this.radius * Math.cos(this.startAngle())),
          this.points[0].y + (this.radius * Math.sin(this.startAngle())));
      const endPoint = new Point(this.points[0].x + (this.radius * Math.cos(this.endAngle())),
          this.points[0].y + (this.radius * Math.sin(this.endAngle())));

      snaps.push(startPoint, endPoint);
    }

    if (Core.Settings.centresnap) {
      const centre = this.points[0];
      snaps.push(centre);
    }

    if (Core.Settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint);

      // Crude way to snap to the closest point or a node
      if (closest[2] === true && closest[1] < delta / 10) {
        snaps.push(closest[0]);
      }
    }


    return snaps;
  }

  closestPoint(P) {
    const startPoint = this.points[1];
    const endPoint = this.points[2];
    const centerPoint = this.points[0];
    // TODO: enable defining clockwise arcs
    const direction = 1;
    const pnt = P.closestPointOnArc(startPoint, endPoint, centerPoint, direction);

    if (pnt !== null) {
      const distance = P.distance(pnt);
      return [pnt, distance];
    }

    // closest point not on the arc
    return [P, Infinity, false];
  }

  /**
   * Return boundingbox
   * @returns BoundingBox
   */
  boundingBox() {
    return BoundingBox.arcBoundingBox(this.points[0], this.points[1], this.points[2], this.direction);
  }
}
