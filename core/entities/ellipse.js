import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Intersection} from '../lib/intersect.js';
import {Colours} from '../lib/colours.js';
import {Entity} from './entity.js';

export class Ellipse extends Entity {
  constructor(data) {
    super(data);
    this.minPoints = 3;
    this.helper_geometry = true; // If true a line will be drawn between points when defining geometry
    this.width = 0;
    this.height = this.width / 2 || 10;
    this.rotation = 0;

    if (data) {
      if (data.points) {
        this.width = this.points[0].distance(this.points[1]) * 2;
        this.height = this.points[0].distance(this.points[2]) * 2;
      }

      if (data[40]) {
        // DXF Groupcode 40 - Ratio
        // Ratio of minor axis to major axis
      }

      if (data[41]) {
        // DXF Groupcode 41 - Start Parameter
        // 0 radians for full ellipse
      }

      if (data[42]) {
        // DXF Groupcode 42 - End Parameter
        // 2PI radians for full ellipse
      }
    }
  }

  static register() {
    const command = {command: 'Ellipse'}; // , shortcut: 'EL', type: 'Entity'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.CENTER;

    expectedType[1] = ['object'];
    prompt[1] = Strings.Input.START;

    expectedType[2] = ['object'];
    prompt[2] = Strings.Input.END;

    expectedType[3] = ['object'];
    prompt[3] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === this.minPoints) {
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

    const A = this.points[0].x - this.points[1].x;
    const O = this.points[0].y - this.points[1].y;
    const theta = Math.atan2(O, A) + Math.PI;

    for (let i = 0; i < 361; i++) {
      const j = Utils.degrees2radians(i);

      const x = this.points[0].x + (this.width / 2) * Math.cos(j) * Math.cos(theta) - (this.height / 2) * Math.sin(j) * Math.sin(theta);
      const y = this.points[0].y + (this.height / 2) * Math.sin(j) * Math.cos(theta) + (this.width / 2) * Math.cos(j) * Math.sin(theta);


      if (i) {
        ctx.lineTo(x, y);
      } else {
        // if i is 0 degrees move to the start postion
        ctx.moveTo(x, y);
      }
    }

    ctx.stroke();
  }

  dxf() {
    const dxfitem = '';
    const majorAxisX = (this.width > this.height ? this.width / 2 : 0);
    const majorAxisY = (this.width > this.height ? 0 : this.height / 2);
    const ratio = (this.width > this.height ? this.height / this.width : this.width / this.height);
    const data = dxfitem.concat(
        '0',
        '\n', 'ELLIPSE',
        // "\n", "5",        //HANDLE
        // "\n", "DA",
        '\n', '8', // LAYERNAME
        '\n', this.layer,
        '\n', '10', // X
        '\n', this.points[0].x,
        '\n', '20', // Y
        '\n', this.points[0].y,
        '\n', '30', // Z
        '\n', '0.0',
        '\n', '11', // MAJOR AXIS X
        '\n', majorAxisX,
        '\n', '21', // MAJOR AXIS Y
        '\n', majorAxisY,
        '\n', '31', // MAJOR AXIS Z
        '\n', '0.0',
        '\n', '40', // RATIO BETWEEN MAJOR AND MINOR AXIS
        '\n', ratio,
        '\n', '41', // START ANGLE RADIANS
        '\n', Utils.degrees2radians(0),
        '\n', '42', // END ANGLE RADIANS
        '\n', Utils.degrees2radians(360),
    );
    // console.log(' ellipse.js - DXF Data:' + data);
    return data;
  }

  intersectPoints() {
    const A = this.points[1].x - this.points[0].x;
    const O = this.points[1].y - this.points[0].y;
    const theta = Math.atan2(O, A); // + Math.PI ;

    return {
      centre: this.points[0],
      radiusX: this.width / 2,
      radiusY: this.height / 2,
      theta: -theta,
    };
  }

  snaps(mousePoint, delta, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const snaps = [];

    if (core.settings.centresnap) {
      const centre = new Point(this.points[0].x, this.points[0].y);
      snaps.push(centre);
    }


    if (core.settings.quadrantsnap) {
      const A = this.points[0].x - this.points[1].x;
      const O = this.points[0].y - this.points[1].y;
      const theta = Math.atan2(O, A) + Math.PI;
      let j = Utils.degrees2radians(0);

      const angle0 = new Point(this.points[0].x + (this.width / 2) * Math.cos(j) * Math.cos(theta) - (this.height / 2) * Math.sin(j) * Math.sin(theta),
          this.points[0].y + (this.height / 2) * Math.sin(j) * Math.cos(theta) + (this.width / 2) * Math.cos(j) * Math.sin(theta));
      j = Utils.degrees2radians(90);
      const angle90 = new Point(this.points[0].x + (this.width / 2) * Math.cos(j) * Math.cos(theta) - (this.height / 2) * Math.sin(j) * Math.sin(theta),
          this.points[0].y + (this.height / 2) * Math.sin(j) * Math.cos(theta) + (this.width / 2) * Math.cos(j) * Math.sin(theta));
      j = Utils.degrees2radians(180);
      const angle180 = new Point(this.points[0].x + (this.width / 2) * Math.cos(j) * Math.cos(theta) - (this.height / 2) * Math.sin(j) * Math.sin(theta),
          this.points[0].y + (this.height / 2) * Math.sin(j) * Math.cos(theta) + (this.width / 2) * Math.cos(j) * Math.sin(theta));
      j = Utils.degrees2radians(270);
      const angle270 = new Point(this.points[0].x + (this.width / 2) * Math.cos(j) * Math.cos(theta) - (this.height / 2) * Math.sin(j) * Math.sin(theta),
          this.points[0].y + (this.height / 2) * Math.sin(j) * Math.cos(theta) + (this.width / 2) * Math.cos(j) * Math.sin(theta));

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
    // find the closest point on the Ellipse

    const closest = new Point();
    let distance = Infinity;

    const A = this.points[0].x - this.points[1].x;
    const O = this.points[0].y - this.points[1].y;
    const theta = Math.atan2(O, A) + Math.PI;
    for (let i = 0; i < 361; i++) {
      const j = Utils.degrees2radians(i);
      const x = this.points[0].x + (this.width / 2) * Math.cos(j) * Math.cos(theta) - (this.height / 2) * Math.sin(j) * Math.sin(theta);
      const y = this.points[0].y + (this.height / 2) * Math.sin(j) * Math.cos(theta) + (this.width / 2) * Math.cos(j) * Math.sin(theta);

      const dist = Utils.distBetweenPoints(P.x, P.y, x, y);
      if (dist < distance) {
        distance = dist;
        closest.x = x;
        closest.y = y;
      }
    }

    return [closest, distance];
  }

  extremes() {
    const xValues = [];
    const yValues = [];

    const A = this.points[0].x - this.points[1].x;
    const O = this.points[0].y - this.points[1].y;
    const theta = Math.atan2(O, A) + Math.PI;

    for (let i = 0; i < 361; i++) {
      const j = Utils.degrees2radians(i);
      xValues.push(this.points[0].x + (this.width / 2) * Math.cos(j) * Math.cos(theta) - (this.height / 2) * Math.sin(j) * Math.sin(theta));
      yValues.push(this.points[0].y + (this.height / 2) * Math.sin(j) * Math.cos(theta) + (this.width / 2) * Math.cos(j) * Math.sin(theta));
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

    // Extreme of the selection rectangle
    const rP1 = new Point(selectionExtremes[0], selectionExtremes[2]);
    const rP2 = new Point(selectionExtremes[1], selectionExtremes[3]);

    const rectPoints = {
      start: rP1,
      end: rP2,
    };
    const output = Intersection.intersectEllipseRectangle(this.intersectPoints(), rectPoints);

    if (output.status === 'Intersection') {
      return true;
    } else {
      return false;
    }
  }
}
