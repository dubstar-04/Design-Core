import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Intersection} from '../lib/intersect.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';

export class Polyline extends Entity {
  constructor(data) {
    super(data);
    this.minPoints = 2;
  }

  static register() {
    const command = {command: 'Polyline', shortcut: 'PL', type: 'Entity'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    const reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.START;

    expectedType[1] = ['object'];
    prompt[1] = Strings.Input.POINTORQUIT;

    expectedType[2] = ['object', 'number'];
    prompt[2] = prompt[1];

    expectedType[3] = ['object', 'number'];
    prompt[3] = prompt[1];

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput || num > this.minPoints) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === this.minPoints) {
      action = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  draw(ctx, scale, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    let colour = this.colour;

    if (this.colour === 'BYLAYER') {
      const layer =core.layerManager.getLayerByName(this.layer);
      colour = layer.getColour();
    }


    try { // HTML Canvas
      ctx.strokeStyle = colour;
      ctx.lineWidth = this.lineWidth / scale;
      ctx.beginPath();
    } catch { // Cairo
      ctx.setLineWidth(this.lineWidth / scale);
      const rgbColour = Colours.getScaledRGBColour(colour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
    }

    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.stroke();
  }


  dxf() {
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
        vertices, // Dont use a new line here as the vertex data will start with a new line.
        '\n', '0',
        '\n', 'SEQEND', // END OF SEQUENCE
        '\n', '8', // LAYERNAME
        '\n', this.layer,
    );
    // console.log(' polyline.js - DXF Data:' + data);
    return data;
  }

  intersectPoints() {
    return {
      points: this.points,
    };
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

  length() { }

  midPoint(x, x1, y, y1) {
    const midX = (x + x1) / 2;
    const midY = (y + y1) / 2;
    const midPoint = new Point(midX, midY);

    return midPoint;
  }


  snaps(mousePoint, delta, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

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
        const pntDist = Utils.distBetweenPoints(P.x, P.y, pnt.x, pnt.y);

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

  touched(selectionExtremes, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const rP1 = new Point(selectionExtremes[0], selectionExtremes[2]);
    const rP2 = new Point(selectionExtremes[1], selectionExtremes[3]);

    const rectPoints = {
      start: rP1,
      end: rP2,
    };

    const output = Intersection.intersectPolylineRectangle(this.intersectPoints(), rectPoints);

    if (output.status === 'Intersection') {
      return true;
    } else {
      return false;
    }
  }
}
