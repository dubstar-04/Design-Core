import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';

import {DesignCore} from '../designCore.js';
import {Property} from '../properties/property.js';

/**
 * Arc Entity Class
 * @extends Entity
 * */
export class Arc extends Entity {
  constructor(data) {
    super(data);
    this.radius = 1;

    // direction: - ccw > 0, cw <= 0
    // default to 1 - counter clockwise
    Object.defineProperty(this, 'direction', {
      value: 1,
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('points') || data.hasOwnProperty('40')) {
        // DXF Groupcode 40 - Radius
        // get the radius from the points or the incoming dxf groupcode
        const radius = this.points[1] ? this.points[0].distance(this.points[1]) : data[40];

        if (radius !== undefined) {
          this.radius = radius;
        }
      }

      if (data.hasOwnProperty('startAngle') || data.hasOwnProperty('50')) {
        // DXF Groupcode 50 - Start Angle

        const angle = Property.loadValue([data.startAngle, data[50]], 0);
        const projectionAngle = Utils.degrees2radians(angle);
        this.points[1] = this.points[0].project(projectionAngle, this.radius);
      }

      if (data.hasOwnProperty('endAngle') || data.hasOwnProperty('51')) {
        // DXF Groupcode 51 - End Angle
        const angle = Property.loadValue([data.endAngle, data[51]], 0);
        const projectionAngle = Utils.degrees2radians(angle);
        this.points[2] = this.points[0].project(projectionAngle, this.radius);
      }

      if (data.hasOwnProperty('direction')|| data.hasOwnProperty('73')) {
        // No DXF Groupcode - Arc Direction
        this.direction = Property.loadValue([data.direction, data[73]], 1);
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
      const pt = await DesignCore.Scene.inputManager.requestInput(op);
      this.points.push(pt);

      const op1 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op1);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.ANGLE, [Input.Type.POINT, Input.Type.NUMBER]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);

      if (Input.getType(pt2) === Input.Type.POINT) {
        this.points.push(pt2);
      } else if (Input.getType(pt2) === Input.Type.NUMBER) {
        const basePoint = this.points.at(0);
        const startPoint = this.points.at(1);
        const angle = Utils.degrees2radians(pt2);
        const point = startPoint.rotate(basePoint, angle);
        this.points.push(point);
      }

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    if (this.points.length >= 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const points = [this.points.at(0), mousePoint];
      DesignCore.Scene.createTempItem('Line', {points: points});
    }

    if (this.points.length >= 2) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const points = [...this.points, mousePoint];
      DesignCore.Scene.createTempItem(this.type, {points: points});
    }
  }

  startAngle() {
    return this.points[0].angle(this.points[1]);
  }

  endAngle() {
    const endAngle = this.points[0].angle(this.points[2]);
    return endAngle;
  }

  /**
   * Calculate the angle between the start and end of the arc
   * Clockwise returns positive angle
   * Counter clockwise returns negtive
   * @returns angle in degrees
   */
  get totalAngle() {
    let startAngle = this.startAngle();
    let endAngle = this.endAngle();


    if (this.direction > 0) {
      if (startAngle > endAngle || startAngle === endAngle) {
        endAngle += (Math.PI * 2);
      }
    } else {
      startAngle += (Math.PI * 2);
    }

    const totalAngle = (startAngle - endAngle);
    return Utils.radians2degrees(totalAngle);
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

  /**
   * Return a list of points representing a polyline version of this entity
   */
  decompose() {
    // counter clockwise bulge = +ve, clockwise bulge = -ve,
    // ccw arc = 0, clockwise arc = 1

    // If the arc forms a complete circle
    // Split into two seperate polyline arcs
    if (Math.abs(this.totalAngle) === 360) {
      const startPoint = this.points[0].project(0, this.radius);
      startPoint.bulge = 1;
      const endPoint = this.points[0].project(0, -this.radius);
      endPoint.bulge = 1;
      const closurePoint = this.points[0].project(0, this.radius);
      return [startPoint, endPoint, closurePoint];
    }

    const startPoint = this.points[0].project(this.startAngle(), this.radius);
    const bulge = Math.tan(Utils.degrees2radians(-this.totalAngle % 360) / 4);
    startPoint.bulge = bulge;
    const endPoint = this.points[0].project(this.endAngle(), this.radius);
    return [startPoint, endPoint];
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

    if (DesignCore.Settings.endsnap) {
      // Speed this up by generating the proper start and end points when the arc is initialised
      const startPoint = new Point(
          this.points[0].x + (this.radius * Math.cos(this.startAngle())),
          this.points[0].y + (this.radius * Math.sin(this.startAngle())),
      );
      const endPoint = new Point(
          this.points[0].x + (this.radius * Math.cos(this.endAngle())),
          this.points[0].y + (this.radius * Math.sin(this.endAngle())),
      );

      snaps.push(startPoint, endPoint);
    }

    if (DesignCore.Settings.centresnap) {
      const centre = this.points[0];
      snaps.push(centre);
    }

    if (DesignCore.Settings.nearestsnap) {
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

    const pnt = P.closestPointOnArc(startPoint, endPoint, centerPoint, this.direction);

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
