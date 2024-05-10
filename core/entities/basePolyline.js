import {Strings} from '../lib/strings.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {Utils} from '../lib/utils.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';
import {Point} from './point.js';
import {Flags} from '../properties/flags.js';

import {DesignCore} from '../designCore.js';

export class BasePolyline extends Entity {
  constructor(data) {
    super(data);

    const modes = {
      LINE: 'Line',
      ARC: 'Arc',
    };

    Object.defineProperty(this, 'modes', {
      value: modes,
      writable: true,
    });

    Object.defineProperty(this, 'inputMode', {
      value: this.modes.LINE,
      writable: true,
    });

    Object.defineProperty(this, 'flags', {
      value: new Flags(),
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('40')) {
        // DXF Groupcode 40 - Start Width
      }

      if (data.hasOwnProperty('41')) {
        // DXF Groupcode 41 - End Width
      }

      if (data.hasOwnProperty('43')) {
        // DXF Groupcode 43 - Constant Width
      }

      if (data.hasOwnProperty('flags') || data.hasOwnProperty('70')) {
        // DXF Groupcode 70 - Polyline flag (bit-coded; default = 0):
        // 1 = This is a closed polyline (or a polygon mesh closed in the M direction)
        // 2 = Curve-fit vertices have been added
        // 4 = Spline-fit vertices have been added
        // 8 = This is a 3D polyline
        // 16 = This is a 3D polygon mesh
        // 32 = The polygon mesh is closed in the N direction
        // 64 = The polyline is a polyface mesh
        // 128 = The linetype pattern is generated continuously around the vertices of this polyline

        this.flags.setFlagValue(data.flags || data[70]);
      }
    }
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      this.points.push(pt1);

      let pt2;
      let op2;
      let index;
      while (true) {
        let options;
        if (this.points.length >= 2) {
          options = this.inputMode === this.modes.LINE ? [this.modes.ARC] : [this.modes.LINE];
        }

        op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT, Input.Type.DYNAMIC], options);
        pt2 = await DesignCore.Scene.inputManager.requestInput(op2);

        if (Input.getType(pt2) === Input.Type.POINT) {
          if (this.inputMode === this.modes.ARC) {
            this.points.at(-1).bulge = this.getBulgeFromSegment(pt2);
          }

          this.points.push(pt2);
          // first creation will get a new index, subsequent will use the index to update the original polyline
          index = DesignCore.Scene.inputManager.actionCommand(this, index);
        } else if (Input.getType(pt2) === Input.Type.STRING) {
          // options are converted to input in the prompt options class
          if (pt2 === this.modes.ARC) {
            this.inputMode = this.modes.ARC;
          }
          if (pt2 === this.modes.LINE) {
            this.inputMode = this.modes.LINE;
          }
        }
      }
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    const mousePoint = DesignCore.Mouse.pointOnScene();

    if (this.points.length >= 1) {
      const points = [...this.points, mousePoint];
      DesignCore.Scene.createTempItem(this.type, {points: points});
    }

    if (this.inputMode === this.modes.ARC) {
      const arcpoints = Utils.cloneObject( this.points);
      arcpoints.at(-1).bulge = this.getBulgeFromSegment(mousePoint);
      const points = [...arcpoints, mousePoint];
      DesignCore.Scene.createTempItem(this.type, {points: points});
    }
  }

  draw(ctx, scale) {
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      if (this.points[i].bulge === 0) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      } else {
        // define the next point or the first point for closed shapes
        const nextPoint = this.points[i + 1] || this.points[0];
        const centerPoint = this.points[i].bulgeCentrePoint(nextPoint);
        const radius = this.points[i].bulgeRadius(nextPoint);

        if (this.points[i].bulge > 0) {
          // TODO: make this work with canvas
          ctx.arc(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(nextPoint));
        } else {
          try { // HTML
            ctx.arc(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(nextPoint), true);
          } catch { // Cairo
            ctx.arcNegative(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(nextPoint));
          }
        }

        // debug centerpoint
        // ctx.arc(centerPoint.x, centerPoint.y, 3, 0, 2 * Math.PI);
      }
    }

    // handle a closed shape
    if (this.flags.hasFlag(1)) {
      ctx.lineTo(this.points[0].x, this.points[0].y);
    }

    ctx.stroke();
  }

  dxf(file) {
    file.writeGroupCode('0', 'POLYLINE');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDb2dPolyline', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer); // LAYERNAME
    file.writeGroupCode('10', '0');
    file.writeGroupCode('20', '0');
    file.writeGroupCode('30', '0');
    file.writeGroupCode('39', this.lineWidth);
    file.writeGroupCode('70', this.flags.getFlagValue());
    file.writeGroupCode('66', '1'); // Vertices follow: required for R12, optional for R2000+
    this.vertices(file);
    file.writeGroupCode('0', 'SEQEND');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
  }

  vertices(file) {
    for (let i = 0; i < this.points.length; i++) {
      file.writeGroupCode('0', 'VERTEX');
      file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
      file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
      file.writeGroupCode('100', 'AcDbVertex', DXFFile.Version.R2000);
      file.writeGroupCode('100', 'AcDb2dVertex', DXFFile.Version.R2000);
      file.writeGroupCode('8', this.layer);
      file.writeGroupCode('10', this.points[i].x); // X
      file.writeGroupCode('20', this.points[i].y); // Y
      file.writeGroupCode('30', '0.0');
      file.writeGroupCode('42', this.points[i].bulge);
    }
  }

  /**
   * Return a list of points representing a polyline version of this entity
   */
  decompose() {
    return this.points;
  }

  intersectPoints() {
    return {
      points: this.points,
    };
  }

  snaps(mousePoint, delta) {
    const snaps = [];

    if (DesignCore.Settings.endsnap) {
      // End points for each segment
      for (let i = 0; i < this.points.length; i++) {
        snaps.push(this.points[i]);
      }
    }

    if (DesignCore.Settings.midsnap) {
      for (let i = 1; i < this.points.length; i++) {
        if (this.points[i-1].bulge === 0) {
          snaps.push( this.points[i - 1].midPoint(this.points[i]));
        }
      }
    }

    if (DesignCore.Settings.centresnap) {
      for (let i = 1; i < this.points.length; i++) {
        if (this.points[i-1].bulge !== 0) {
          snaps.push( this.points[i - 1].bulgeCentrePoint(this.points[i]));
        }
      }
    }

    if (DesignCore.Settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint);

      // Crude way to snap to the closest point or a node
      if (closest[1] < delta / 10) {
        snaps.push(closest[0]);
      }
    }

    return snaps;
  }

  closestPoint(P) {
    let distance = Infinity;
    let minPnt = P;

    for (let i = 1; i < this.points.length; i++) {
      const A = this.points[i - 1];
      const B = this.points[i];

      let pnt;
      if (A.bulge !== 0) {
        const C = A.bulgeCentrePoint(B);
        const direction = A.bulge;
        pnt = P.closestPointOnArc(A, B, C, direction);
      } else {
        pnt = P.closestPointOnLine(A, B);
      }

      if (pnt !== null) {
        const pntDist = P.distance(pnt);

        if (pntDist < distance) {
          distance = pntDist;
          minPnt = pnt;
        }
      }
    }

    return [minPnt, distance];
  }

  boundingBox() {
    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (let i = 0; i < this.points.length; i++) {
      const nextPoint = this.points[i + 1] || this.points[0];

      let boundingBox = BoundingBox.lineBoundingBox(this.points[i], nextPoint);

      if (this.points[i].bulge !== 0) {
        const centerPoint = this.points[i].bulgeCentrePoint(nextPoint);
        boundingBox = BoundingBox.arcBoundingBox(centerPoint, this.points[i], nextPoint, this.points[i].bulge);
      }

      xmin = Math.min(xmin, boundingBox.xMin);
      xmax = Math.max(xmax, boundingBox.xMax);
      ymin = Math.min(ymin, boundingBox.yMin);
      ymax = Math.max(ymax, boundingBox.yMax);
    }


    const topLeft = new Point(xmin, ymax);
    const bottomRight = new Point(xmax, ymin);

    return new BoundingBox(topLeft, bottomRight);
  }

  /**
   * Get the bulge value from the previous segment and the selected point
   * @param {point} point
   * @returns polyline bulge value
   */
  getBulgeFromSegment(point) {
    const lastSegBulge = this.points.at(-2).bulge;
    const lastSegIsArc = lastSegBulge !== 0;

    // get the angle at the end of the previous segment
    let lastSegAngle;
    if (lastSegIsArc) {
      const centerPoint = this.points.at(-2).bulgeCentrePoint(this.points.at(-1));
      // angle is perpendicular to the center-to-end point ray, in the direction of the bulge
      lastSegAngle = centerPoint.angle(this.points.at(-1)) + (Math.PI / 2) * Math.sign(lastSegBulge);
    } else {
      // line segment angle is the angle from point 0 to to point 1
      lastSegAngle = this.points.at(-2).angle(this.points.at(-1));
    }

    const mouseAngle = this.points.at(-1).angle(point) % (2 * Math.PI);
    // get the angle delta between point and the previous segment
    // ensure that the angle is always less than 2 * Math.PI
    const angleDelta = ((mouseAngle - lastSegAngle) + 3 * Math.PI) % (2*Math.PI) - Math.PI;
    // angleDelta is 1/2 the included angle
    // bulge is tan of (included angle * 0.25)
    const bulge = Math.tan((angleDelta * 2) / 4);
    return bulge;
  }
}
