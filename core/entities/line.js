import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';

export class Line extends Entity {
  constructor(data) {
    super(data);

    if (data) {
      if (data.points) {
        // clear points
        this.points = [];

        const startPoint = data.points.at(-2);
        const endPoint = data.points.at(-1);
        this.points.push(new Point(startPoint.x, startPoint.y));
        this.points.push(new Point(endPoint.x, endPoint.y));
      }
    }
  }


  static register() {
    const command = {command: 'Line', shortcut: 'L', type: 'Entity'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op);
      this.points.push(pt1);

      let pt2;
      const op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT, Input.Type.NUMBER]);
      while (true) {
        pt2 = await core.scene.inputManager.requestInput(op2);
        if (Input.getType(pt2) === Input.Type.POINT) {
          this.points.push(pt2);
        } else if (Input.getType(pt2) === Input.Type.NUMBER) {
          const basePoint = this.points.at(-1);
          const angle = Utils.degrees2radians(core.mouse.inputAngle());
          const point = basePoint.project(angle, pt2);
          this.points.push(point);
        }

        core.scene.inputManager.actionCommand(this);
      }
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

  draw(ctx, scale) {
    ctx.moveTo(this.points[0].x, this.points[0].y);
    ctx.lineTo(this.points[1].x, this.points[1].y);
    ctx.stroke();
  }

  dxf(file) {
    file.writeGroupCode('0', 'LINE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbLine', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');
    file.writeGroupCode('11', this.points[1].x);
    file.writeGroupCode('21', this.points[1].y);
    file.writeGroupCode('31', '0.0');
  }

  trim(points, core) {
    function trimOneEnd(intersectPnts, line) {
      let originPoint;
      let destinationPoint;
      const validPoints = [];

      for (let i = 0; i < line.points.length; i++) {
        for (let j = 0; j < intersectPnts.length; j++) {
          if (betweenPoints(core.mouse.pointOnScene(), [intersectPnts[j], line.points[i]], false)) {
            if (Math.round(intersectPnts[j].distance(line.points[i]) * 100) / 100 < Math.round(line.points[0].distance(line.points[1]) * 100) / 100) {
              originPoint = i;
              validPoints.push(j);
            }
          }
        }
      }

      if (typeof validPoints !== 'undefined') {
        let dist = Number.POSITIVE_INFINITY;

        for (let j = 0; j < validPoints.length; j++) {
          if (line.points[originPoint].distance(intersectPnts[validPoints[j]]) < dist) {
            dist = line.points[originPoint].distance(intersectPnts[validPoints[j]]);
            destinationPoint = validPoints[j];
          }
        }
      }

      if (typeof destinationPoint !== 'undefined') {
        line.points[originPoint] = intersectPnts[destinationPoint];
      }
    }

    function trimBetween(pnts, line) {
      const a = Math.round(line.points[0].distance(pnts[0]));
      const b = Math.round(line.points[0].distance(pnts[1]));
      const c = Math.round(line.points[1].distance(pnts[0]));
      const d = Math.round(line.points[1].distance(pnts[1]));

      if (a === 0 && d === 0 || b === 0 && c === 0) {
      } else {
        const data = {
          points: [pnts[a < b ? 1 : 0], line.points[1]],
          colour: line.colour,
          layer: line.layer,
          lineWidth: line.lineWidth,
        };

        core.scene.addToScene('Line', data);

        if (a < b) {
          line.points[1] = pnts[0];
        } else {
          line.points[1] = pnts[1];
        }
      }
    }

    function betweenPoints(mousePnt, pntsArray, returnPoints) {
      for (let i = 0; i < pntsArray.length - 1; i++) {
        const a = pntsArray[i].distance(mousePnt);
        const b = pntsArray[i + 1].distance(mousePnt);
        const c = pntsArray[i].distance(pntsArray[i + 1]);

        if (Math.round(a + b) === Math.round(c)) {
          if (returnPoints) {
            return [pntsArray[i], pntsArray[i + 1]];
          }

          return true;
        }
      }
    }

    if (points.length > 1) {
      // is the mouse between two points
      const pnts = betweenPoints(core.mouse.pointOnScene(), points, true);

      if (typeof pnts !== 'undefined') {
        trimBetween(pnts, this);
      } else {
        trimOneEnd(points, this);
      }
    } else {
      trimOneEnd(points, this);
    }
  }

  extend(points, core) {
    let originPoint;
    let destinationPoint;

    // Find which end is closer to the mouse
    // ToDo: Pass the mouse location in rather than needing a ref to core.
    if (this.points[0].distance(core.mouse.pointOnScene()) < this.points[1].distance(core.mouse.pointOnScene())) {
      originPoint = 0;
    } else {
      originPoint = 1;
    }

    // check if any of the points are valid
    const validPoints = [];

    for (let i = 0; i < points.length; i++) {
      if (Math.round(this.points[originPoint].angle(points[i])) === Math.round(this.points[originPoint ? 0 : 1].angle(this.points[originPoint]))) {
        // if the destination point is different than the origin add it to the array of valid points
        if (Math.round(this.points[originPoint].distance(points[i])) !== 0) {
          validPoints.push(i);
        }
      }
    }

    if (validPoints.length > 1) {
      let dist = Number.POSITIVE_INFINITY;

      for (let j = 0; j < validPoints.length; j++) {
        if (this.points[originPoint].distance(points[validPoints[j]]) < dist) {
          dist = this.points[originPoint].distance(points[validPoints[j]]);
          destinationPoint = validPoints[j];
        }
      }
    } else if (validPoints.length === 1) {
      // only one valid point
      destinationPoint = validPoints[0];
    }

    if (destinationPoint !== undefined) {
      this.points[originPoint] = points[destinationPoint];
    }
  }

  intersectPoints() {
    return {
      start: this.points[0],
      end: this.points[1],
    };
  }

  length() {
    const A = (this.points[0].x - this.points[1].x);
    const B = (this.points[0].y - this.points[1].y);
    const ASQ = Math.pow(A, 2);
    const BSQ = Math.pow(B, 2);
    const dist = Math.sqrt(ASQ + BSQ);

    return dist;
  }

  midPoint() {
    const midPoint = this.points[0].midPoint(this.points[1]);
    return midPoint;
  }

  snaps(mousePoint, delta, core) {
    const snaps = [];

    if (core.settings.endsnap) {
      const start = new Point(this.points[0].x, this.points[0].y);
      const end = new Point(this.points[1].x, this.points[1].y);
      snaps.push(start, end);
    }

    if (core.settings.midsnap) {
      snaps.push(this.midPoint());
    }

    if (core.settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint, start, end);

      // Crude way to snap to the closest point or a node
      if (closest[1] < delta / 10) {
        snaps.push(closest[0]);
      }
    }

    return snaps;
  }

  closestPoint(P) {
    // find the closest point on the straight line
    const A = new Point(this.points[0].x, this.points[0].y);
    const B = new Point(this.points[1].x, this.points[1].y);

    const pnt = P.perpendicular(A, B);
    if (pnt === null) {
      return [P, Infinity];
    }

    const distance = P.distance(pnt);
    return [pnt, distance];
  }

  boundingBox() {
    return BoundingBox.lineBoundingBox(this.points[0], this.points[1]);
  }
}
