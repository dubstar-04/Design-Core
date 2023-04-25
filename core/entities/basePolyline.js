import {Point} from './point.js';
import {Strings} from '../lib/strings.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

export class BasePolyline extends Entity {
  constructor(data) {
    super(data);

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
      const op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT]);
      let index;
      while (true) {
        pt2 = await core.scene.inputManager.requestInput(op2);
        this.points.push(pt2);
        // first creation will get a new index, subsequent will use the index to update the original polyline
        index = core.scene.inputManager.actionCommand(this, index);
      }
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview(core) {
    if (this.points.length >= 1) {
      const mousePoint = core.mouse.pointOnScene();
      const points = [...this.points, mousePoint];
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
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    // handle a closed shape
    if (this.flags % 2 === 1) {
      ctx.lineTo(this.points[0].x, this.points[0].y);
    }

    ctx.stroke();
  }

  intersectPoints() {
    return {
      points: this.points,
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
    let distance = Infinity;
    let minPnt = P;

    for (let i = 1; i < this.points.length; i++) {
      const A = this.points[i - 1];
      const B = this.points[i];
      const pnt = P.perpendicular(A, B);

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
