import {Strings} from '../lib/strings.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {Utils} from '../lib/utils.js';

export class BasePolyline extends Entity {
  constructor(data) {
    super(data);

    const modes = {
      LINE: 'Line',
      ARC: 'Arc',
    };

    Object.defineProperty(this, 'modes', {
      enumerable: false,
      value: modes,
      writable: true,
    });

    Object.defineProperty(this, 'inputMode', {
      enumerable: false,
      value: this.modes.LINE,
      writable: true,
    });

    Object.defineProperty(this, 'flags', {
      enumerable: false,
      value: 0,
      writable: true,
    });

    if (data) {
      if (data[40]) {
        // DXF Groupcode 40 - Start Width
      }

      if (data[41]) {
        // DXF Groupcode 41 - End Width
      }

      if (data[43]) {
        // DXF Groupcode 43 - Constant Width
      }

      if (data.flags || data[70]) {
        // DXF Groupcode 70 - Polyline flag (bit-coded; default = 0):
        // 1 = This is a closed polyline (or a polygon mesh closed in the M direction)
        // 2 = Curve-fit vertices have been added
        // 4 = Spline-fit vertices have been added
        // 8 = This is a 3D polyline
        // 16 = This is a 3D polygon mesh
        // 32 = The polygon mesh is closed in the N direction
        // 64 = The polyline is a polyface mesh
        // 128 = The linetype pattern is generated continuously around the vertices of this polyline

        this.flags = data.flags || data[70];
      }
    }
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op);
      this.points.push(pt1);

      let pt2;
      let op2;
      let index;
      while (true) {
        let options;
        if (this.points.length >= 2) {
          options = this.inputMode === this.modes.LINE ? [this.modes.ARC] : [this.modes.LINE];
        }

        op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT], options);
        pt2 = await core.scene.inputManager.requestInput(op2);

        if (Input.getType(pt2) === Input.Type.POINT) {
          if (this.inputMode === this.modes.ARC) {
            this.points.at(-1).bulge = this.getBulgeFromSegment(pt2);
          }

          this.points.push(pt2);
          // first creation will get a new index, subsequent will use the index to update the original polyline
          index = core.scene.inputManager.actionCommand(this, index);
        } else if (Input.getType(pt2) === Input.Type.STRING) {
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

  preview(core) {
    const mousePoint = core.mouse.pointOnScene();

    if (this.points.length >= 1) {
      const points = [...this.points, mousePoint];
      core.scene.createTempItem(this.type, {points: points});
    }

    if (this.inputMode === this.modes.ARC) {
      const arcpoints = Utils.cloneObject(core, this.points);
      arcpoints.at(-1).bulge = this.getBulgeFromSegment(mousePoint);
      const points = [...arcpoints, mousePoint];
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

    for (let i = 1; i < this.points.length; i++) {
      if (this.points[i].bulge === 0) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      } else {
        const centerPoint = this.points[i].bulgeCentrePoint(this.points[i + 1]);
        const radius = this.points[i].bulgeRadius(this.points[i + 1]);


        if (this.points[i].bulge > 0) {
          // TODO: make this work with canvas
          ctx.arc(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(this.points[i + 1]));
        } else {
          ctx.arcNegative(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(this.points[i + 1]));
        }

        // debug centerpoint
        // ctx.arc(centerPoint.x, centerPoint.y, 3, 0, 2 * Math.PI);
      }
    }

    // handle a closed shape
    if (this.flags % 2 === 1) {
      ctx.lineTo(this.points[0].x, this.points[0].y);
    }

    ctx.stroke();
  }

  dxf() {
    const vertices = this.vertices();
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'POLYLINE',
        // "\n", "5", //HANDLE
        // "\n", "DA",
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '10', // X
        '\n', '0',
        '\n', '20', // Y
        '\n', '0',
        '\n', '30', // Z
        '\n', '0',
        '\n', '39', // Line Width
        '\n', this.lineWidth,
        '\n', '70', // Flags
        '\n', this.flags,
        // "\n", "100", //Subclass marker
        // "\n", "AcDb2dPolyline",
        '\n', '66', // Vertices follow: required for R12, optional for R2000+
        '\n', '1',
        vertices, // Dont use a new line here as the vertex data will start with a new line.
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
          '\n', '0',
          '\n', '42',
          '\n', this.points[i].bulge,
      );
    }

    return verticesData;
  }

  intersectPoints() {
    return {
      points: this.points,
    };
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
        if (this.points[i-1].bulge === 0) {
          snaps.push( this.points[i - 1].midPoint(this.points[i]));
        }
      }
    }

    if (core.settings.centresnap) {
      for (let i = 1; i < this.points.length; i++) {
        if (this.points[i-1].bulge !== 0) {
          snaps.push( this.points[i - 1].bulgeCentrePoint(this.points[i]));
        }
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
