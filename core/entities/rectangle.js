import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Intersection} from '../lib/intersect.js';
import {Colours} from '../lib/colours.js';

export class Rectangle {
  constructor(data) {
    // Define Properties         //Associated DXF Value
    this.type = 'Rectangle';
    this.family = 'Geometry';
    this.minPoints = 2;
    this.showPreview = true; // show preview of item as its being created
    // this.limitPoints = true;
    // this.allowMultiple = false;
    this.helper_geometry = false; // If true a Line will be drawn between points when defining geometry
    this.points = [];
    this.lineWidth = 2; // Thickness
    this.colour = 'BYLAYER';
    this.layer = '0';
    this.alpha = 1.0; // Transparancy
    // this.RectangleType
    // this.RectangletypeScale
    // this.PlotStyle
    // this.RectangleWeight


    if (data) {
      if (data.points) {
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

      if (data.colour) {
        this.colour = data.colour;
      }

      if (data.layer) {
        this.layer = data.layer;
      }
    }
  }

  static register() {
    const command = {command: 'Rectangle', shortcut: 'REC'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = 'Pick the start point:';

    expectedType[1] = ['object'];
    prompt[1] = 'Pick opposite corner:';

    expectedType[2] = ['object'];
    prompt[2] = prompt[1];

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput || num > this.minPoints) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === this.minPoints) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  draw(ctx, scale, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    let colour = this.colour;

    if (this.colour === 'BYLAYER') {
      colour = core.layerManager.getLayerByName(this.layer).colour;
    }

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

  dxf() {
    // Save the rectangle as a polyline as there is no rectangle DXF code
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
        vertices, // Dont use a new line here as the vertix data will start with a new line.
        '\n', '0',
        '\n', 'SEQEND', // END OF SEQUENCE
        '\n', '8', // LAYERNAME
        '\n', this.layer,
    );
    console.log(' rectangle.js - DXF Data:' + data);
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
          // "\n", "0",
          // "\n", "0",
          '\n', '0',
      );
    }

    return verticesData;
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
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const snaps = [];

    if (core.settings.endSnap) {
      // End points for each segment
      for (let i = 0; i < this.points.length; i++) {
        snaps.push(this.points[i]);
      }
    }

    if (core.settings.midSnap) {
      for (let i = 1; i < this.points.length; i++) {
        const start = this.points[i - 1];
        const end = this.points[i];

        snaps.push(this.midPoint(start.x, end.x, start.y, end.y));
      }
    }

    if (core.settings.nearestSnap) {
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
    let distance = 1.65;

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

        const dist = Utils.distBetweenPoints(P.x, P.y, closest.x, closest.y);
        // console.log(" rectangle.js - Dist: " + dist);
        if (dist < distance) {
          distance = dist;
        }
      }
    }

    return [closest, distance];
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

  within(selectionExtremes, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    // determin if this entities is within a the window specified by selectionExtremes
    const extremePoints = this.extremes();
    if (extremePoints[0] > selectionExtremes[0] &&
            extremePoints[1] < selectionExtremes[1] &&
            extremePoints[2] > selectionExtremes[2] &&
            extremePoints[3] < selectionExtremes[3]
    ) {
      return true;
    } else {
      return false;
    }
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

    const output = Intersection.intersectRectangleRectangle(this.intersectPoints(), rectPoints);
    console.log(output.status);

    if (output.status === 'Intersection') {
      return true;
    }
    // no intersection found. return false
    return false;
  }
}
