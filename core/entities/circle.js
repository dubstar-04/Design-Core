import {Point} from './point.js';
import {Strings} from '../lib/strings.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';

export class Circle extends Entity {
  constructor(data) {
    super(data);

    // add radius property with getter and setter
    // needs to be enumberable to appear in the object props
    Object.defineProperty(this, 'radius', {
      get: this.getRadius,
      set: this.setRadius,
      enumerable: true,
    });

    // ensure a radius is set
    // this.setRadius(1);

    if (data) {
      if (data.radius || data[40]) {
        // DXF Groupcode 40 - Radius
        const radius = data.radius || data[40];
        this.setRadius(radius);
      }
    }
  }

  static register() {
    const command = {command: 'Circle', shortcut: 'C', type: 'Entity'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.RADIUS, [Input.Type.POINT, Input.Type.NUMBER]);
      const pt2 = await core.scene.inputManager.requestInput(op2);
      if (Input.getType(pt2) === Input.Type.POINT) {
        this.points.push(pt2);
      }

      if (Input.getType(pt2) === Input.Type.NUMBER) {
        this.setRadius(pt2);
      }
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

  getRadius() {
    return this.points[0].distance(this.points[1]);
  }

  setRadius(rad) {
    this.points[1] = this.points[0].project(0, rad);
  }

  draw(ctx, scale) {
    ctx.arc(this.points[0].x, this.points[0].y, this.radius, 0, 6.283);
    ctx.stroke();
  }

  dxf(file) {
    file.writeGroupCode('0', 'CIRCLE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbCircle', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('40', this.radius);
  }

  trim(points, core) {
    if (points.length > 1) {
      const start = points[0];
      const cen = core.mouse.pointOnScene();
      const end = points[1];

      const arcPoints = [this.points[0]];

      const dir = (start.x - cen.x) * (end.y - cen.y) - (start.y - cen.y) * (end.x - cen.x);
      if (dir > 0) {
        arcPoints.push(points[0], points[1]);
      } else if (dir < 0) {
        arcPoints.push(points[1], points[0]);
      }


      const data = {
        points: arcPoints,
        colour: this.colour,
        layer: this.layer,
        lineWidth: this.lineWidth,
      };

      core.scene.addToScene('Arc', data, core.scene.items.indexOf(this));
    }
  }

  intersectPoints() {
    return {
      centre: this.points[0],
      radius: this.radius,
    };
  }

  snaps(mousePoint, delta, core) {
    const snaps = [];

    if (core.settings.centresnap) {
      const centre = new Point(this.points[0].x, this.points[0].y);
      snaps.push(centre);
    }

    if (core.settings.quadrantsnap) {
      const angle0 = new Point(this.points[0].x + this.radius, this.points[0].y);
      const angle90 = new Point(this.points[0].x, this.points[0].y + this.radius);
      const angle180 = new Point(this.points[0].x - this.radius, this.points[0].y);
      const angle270 = new Point(this.points[0].x, this.points[0].y - this.radius);

      snaps.push(angle0, angle90, angle180, angle270);
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
    // find the closest point on the circle
    const length = this.points[0].distance(P);
    const Cx = this.points[0].x + this.radius * (P.x - this.points[0].x) / length;
    const Cy = this.points[0].y + this.radius * (P.y - this.points[0].y) / length;
    const closest = new Point(Cx, Cy);
    const distance = closest.distance(P);

    return [closest, distance];
  }

  boundingBox() {
    const xmin = this.points[0].x - this.radius;
    const xmax = this.points[0].x + this.radius;
    const ymin = this.points[0].y - this.radius;
    const ymax = this.points[0].y + this.radius;

    const topLeft = new Point(xmin, ymax);
    const bottomRight = new Point(xmax, ymin);

    return new BoundingBox(topLeft, bottomRight);
  }
}
