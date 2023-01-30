/* eslint-disable require-jsdoc */
import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Intersection} from '../lib/intersect.js';
import {Colours} from '../lib/colours.js';

export class Arc {
  constructor(data) {
    // Define Properties         //Associated DXF Value
    this.type = 'Arc';
    this.family = 'Geometry';
    this.minPoints = 3; // Should match number of cases in prompt
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
        this.radius = this.points[0].distance(this.points[1]);
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
    const command = {command: 'Arc', shortcut: 'A', type: 'Entity'};
    return command;
  }

  startAngle() {
    return this.points[0].angle(this.points[1]);
  }

  endAngle() {
    return this.points[0].angle(this.points[2]);
  }


  direction() {
    let start = this.startAngle();
    let end = this.endAngle();
    // var direction;

    // console.log('Start angle: ', start, ' end angle: ', end);
    end = end - start;
    start = start - start;
    // console.log('Start angle adjusted to zero: ', start, ' end angle: ', end);
    /* if(end < 0){
            end = end + 2 * Math.PI
            // console.log("Start angle corrected for minus: ", start, " end angle: ", end)
        }
        */

    return end < start; // < end;
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
    prompt[1] = 'Pick start point:';

    expectedType[2] = ['object'];
    prompt[2] = 'Pick end point:';

    expectedType[3] = ['object'];
    prompt[3] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    }

    if (core.scene.inputArray.length === this.minPoints) {
      action = true;
      reset = true;
      this.helper_geometry = false;
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

    ctx.arc(this.points[0].x, this.points[0].y, this.radius, this.startAngle(), this.endAngle());

    ctx.stroke();
  }

  properties() {
    return { // type: this.type,
      colour: this.colour,
      layer: this.layer,
      lineWidth: this.lineWidth,
    };
  }

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'ARC',
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '10', // X
        '\n', this.points[0].x,
        '\n', '20', // Y
        '\n', this.points[0].y,
        '\n', '30', // Z
        '\n', '0.0',
        '\n', '40',
        '\n', this.radius, // Radius
        '\n', '50', // START ANGLE
        '\n', Utils.radians2degrees(this.startAngle()), // Radians
        '\n', '51', // END ANGLE
        '\n', Utils.radians2degrees(this.endAngle()), // Radians
    );
    // console.log(' arc.js - DXF Data:' + data);
    return data;
  }

  trim(points, core) {
    // console.log('arc.js - Points:', points.length);
  }

  intersectPoints() {
    return {
      centre: this.points[0],
      radius: this.radius,
      startAngle: this.startAngle(),
      endAngle: this.endAngle(),
    };
  }

  snaps(mousePoint, delta, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const snaps = [];

    if (core.settings.endsnap) {
      // Speed this up by generating the proper start and end points when the arc is initialised
      const startPoint = new Point(this.points[0].x + (this.radius * Math.cos(this.startAngle())),
          this.points[0].y + (this.radius * Math.sin(this.startAngle())));
      const endPoint = new Point(this.points[0].x + (this.radius * Math.cos(this.endAngle())),
          this.points[0].y + (this.radius * Math.sin(this.endAngle())));

      snaps.push(startPoint, endPoint);
    }

    if (core.settings.centresnap) {
      const centre = this.points[0];
      snaps.push(centre);
    }

    if (core.settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint);
      // var snaps = [center, startPoint, endPoint];

      // Crude way to snap to the closest point or a node
      if (closest[2] === true && closest[1] < delta / 10) {
        snaps.push(closest[0]);
      }
    }


    return snaps;
  }

  closestPoint(P) {
    // find the closest point on the Arc
    const length = this.points[0].distance(P); // distBetweenPoints(this.points[0].x, this.points[0].y, P.x, P.y)
    const Cx = this.points[0].x + this.radius * (P.x - this.points[0].x) / length;
    const Cy = this.points[0].y + this.radius * (P.y - this.points[0].y) / length;
    const closest = new Point(Cx, Cy);
    const distance = closest.distance(P); // distBetweenPoints(closest.x, closest.y, P.x, P.y)

    // var A_end = this.points[0].x - closest.x;
    // var O_end = this.points[0].y - closest.y;
    const snapAngle = this.points[0].angle(P); // Math.atan2(O_end,A_end) + Math.PI;

    if (snapAngle > this.startAngle() && snapAngle < this.endAngle()) {
      return [closest, distance, true];
    } else {
      return [closest, distance, false];
    }
  }

  diameter() {
    const diameter = 2 * this.radius;
    return diameter;
  }


  area() {
    const area = Math.pow((Math.PI * this.radius), 2); // not valid for an arc
    return area;
  }

  extremes() {
    const xValues = [];
    const yValues = [];

    // var midAngle = (this.endAngle() - this.startAngle()) / 2 + this.startAngle();

    // console.log(" arc.js - [info] (extremes) radius: " + this.radius + " startAngle: " + this.startAngle() + " endAngle: " + this.endAngle())// + " midAngle: " + midAngle);

    xValues.push(this.radius * Math.cos(this.startAngle()) + this.points[0].x);
    yValues.push(this.radius * Math.sin(this.startAngle()) + this.points[0].y);
    // xValues.push( this.radius * Math.cos(midAngle) + this.points[0].x);
    // yValues.push( this.radius * Math.sin(midAngle) + this.points[0].y);
    xValues.push(this.radius * Math.cos(this.endAngle()) + this.points[0].x);
    yValues.push(this.radius * Math.sin(this.endAngle()) + this.points[0].y);

    xValues.push((xValues[0] + xValues[1]) / 2);
    yValues.push((yValues[0] + yValues[1]) / 2);

    const xmin = Math.min(...xValues);
    const xmax = Math.max(...xValues);
    const ymin = Math.min(...yValues);
    const ymax = Math.max(...yValues);

    // console.log(" arc.js - (Arc Extremes)" + xmin, xmax, ymin, ymax)
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
    const output = Intersection.intersectArcRectangle(this.intersectPoints(), rectPoints);
    // console.log(output.status)

    if (output.status === 'Intersection') {
      return true;
    } else {
      return false;
    }
  }
}
