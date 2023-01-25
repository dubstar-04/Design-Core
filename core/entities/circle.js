import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Intersection} from '../lib/intersect.js';
import {Colours} from '../lib/colours.js';

export class Circle {
  constructor(data) {
    // Define Properties         //Associated DXF Value
    this.type = 'Circle';
    this.family = 'Geometry';
    this.minPoints = 2;
    this.showPreview = true; // show preview of item as its being created
    // this.limitPoints = true;
    // this.allowMultiple = false;
    this.helper_geometry = true; // If true a line will be drawn between points when defining geometry

    this.points = [];
    this.radius = 0;

    this.lineWidth = 2; // Thickness
    this.colour = 'BYLAYER';
    this.layer = '0';
    this.alpha = 1.0; // Transparancy
    // this.lineType
    // this.LinetypeScale
    // this.PlotStyle
    // this.LineWeight


    if (data) {
      if (data.points) {
        this.points = data.points;
        this.calculateRadius();
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
    const command = {command: 'Circle', shortcut: 'C', type: 'Entity'};
    return command;
  }

  calculateRadius() {
    this.radius = Utils.distBetweenPoints(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y);
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = 'Pick the centre point:';

    expectedType[1] = ['object'];
    prompt[1] = 'Pick another point or Enter radius:';

    expectedType[2] = ['object', 'number'];
    prompt[2] = prompt[1];

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
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

    this.calculateRadius(); // is this the most efficient way to update the radius?

    try { // HTML Canvas
      ctx.strokeStyle = colour;
      ctx.lineWidth = this.lineWidth / scale;
      ctx.beginPath();
    } catch { // Cairo
      ctx.setLineWidth(this.lineWidth / scale);
      const rgbColour = Colours.hexToScaledRGB(colour);
      ctx.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
    }

    ctx.arc(this.points[0].x, this.points[0].y, this.radius, 0, 6.283);
    ctx.stroke();
  }

  /* properties(){

        return {  //type: this.type,
            colour: this.colour,
            layer: this.layer,
            lineWidth: this.lineWidth
        }
    }
    */

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'CIRCLE',
        // "\n", "5", //HANDLE
        // "\n", "DA",
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '10', // X
        '\n', this.points[0].x,
        '\n', '20', // Y
        '\n', this.points[0].y,
        '\n', '30', // Z
        '\n', '0.0',
        '\n', '40',
        '\n', this.radius, // DIAMETER
    );
    console.log(' circle.js - DXF Data:' + data);
    return data;
  }

  trim(points, core) {
    console.log('circle.js - Points:', points.length);

    if (points.length > 1) {
      const start = points[0];
      const cen = core.mouse.pointOnScene();
      const end = points[1];

      // console.log("Angle:", a-a, " Angle2: ", b, " centre: ", c)

      const arcPoints = [this.points[0]];

      const dir = (start.x - cen.x) * (end.y - cen.y) - (start.y - cen.y) * (end.x - cen.x);
      if (dir > 0) {
        console.log('Clockwise');
        arcPoints.push(points[0], points[1]);
      } else if (dir < 0) {
        console.log('Counterclockwise');
        arcPoints.push(points[1], points[0]);
      }


      const data = {
        points: arcPoints,
        colour: this.colour,
        layer: this.layer,
        lineWidth: this.lineWidth,
      };

      core.scene.addToScene('Arc', data, false, core.scene.items.indexOf(this));
    }
  }

  intersectPoints() {
    return {
      centre: this.points[0],
      radius: this.radius,
    };
  }

  snaps(mousePoint, delta, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const snaps = [];

    if (core.settings.centreSnap) {
      const centre = new Point(this.points[0].x, this.points[0].y);
      snaps.push(centre);
    }

    if (core.settings.quadrantSnap) {
      const angle0 = new Point(this.points[0].x + this.radius, this.points[0].y);
      const angle90 = new Point(this.points[0].x, this.points[0].y + this.radius);
      const angle180 = new Point(this.points[0].x - this.radius, this.points[0].y);
      const angle270 = new Point(this.points[0].x, this.points[0].y - this.radius);

      snaps.push(angle0, angle90, angle180, angle270);
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
    // find the closest point on the circle
    const length = Utils.distBetweenPoints(this.points[0].x, this.points[0].y, P.x, P.y);
    const Cx = this.points[0].x + this.radius * (P.x - this.points[0].x) / length;
    const Cy = this.points[0].y + this.radius * (P.y - this.points[0].y) / length;
    const closest = new Point(Cx, Cy);
    const distance = Utils.distBetweenPoints(closest.x, closest.y, P.x, P.y);

    return [closest, distance];
  }

  diameter() {
    const diameter = 2 * this.radius;
    return diameter;
  }

  circumference() {
    const circumference = Math.PI * 2 * this.radius;
    return circumference;
  }

  area() {
    const area = Math.pow((Math.PI * this.radius), 2);
    return area;
  }

  extremes() {
    const xmin = this.points[0].x - this.radius;
    const xmax = this.points[0].x + this.radius;
    const ymin = this.points[0].y - this.radius;
    const ymax = this.points[0].y + this.radius;

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
    const output = Intersection.intersectCircleRectangle(this.intersectPoints(), rectPoints);
    console.log(output.status);

    if (output.status === 'Intersection') {
      return true;
    } else {
      return false;
    }
  }
}
