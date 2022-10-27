import {Point} from './point.js';
import {Utils} from '../lib/utils.js';
import {Intersection} from '../lib/intersect.js';
import {Colours} from '../lib/colours.js';

export class Line {
  constructor(data) {
    // Define Properties         //Associated DXF Value
    this.type = 'Line';
    this.family = 'Geometry';
    this.minPoints = 2;
    this.showPreview = true; // show preview of item as its being created
    // this.limitPoints = false;
    // this.allowMultiple = true;
    this.helper_geometry = false; // If true a line will be drawn between points when defining geometry
    this.points = [];
    this.lineWidth = 2; // Thickness
    this.colour = 'BYLAYER';
    this.layer = '0';
    this.alpha = 1.0; // Transparancy
    // this.lineType
    // this.LinetypeScale
    // this.PlotStyle
    // this.LineWeight

    if (data) {
      // console.log(data.points, data.colour, data.layer)

      const startPoint = new Point(data.points[data.points.length - 2].x, data.points[data.points.length - 2].y);
      const endPoint = new Point(data.points[data.points.length - 1].x, data.points[data.points.length - 1].y);

      this.points.push(startPoint);
      this.points.push(endPoint);
      // this.points = [points[points.length-2], points[points.length-1]];

      if (data.colour) {
        this.colour = data.colour;
      }

      if (data.layer) {
        this.layer = data.layer;
      }
    }
  }


  static register() {
    const command = {command: 'Line', shortcut: 'L'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    const reset = false;
    let action = false;
    let validInput = true;
    const prompt = [];

    // console.log("inputArray: ", inputArray)

    expectedType[0] = ['undefined'];
    prompt[0] = 'Pick start point:';

    expectedType[1] = ['object'];
    prompt[1] = 'Pick another point or press ESC to quit:';

    expectedType[2] = ['object', 'number'];
    prompt[2] = prompt[1];

    expectedType[3] = ['object', 'number'];
    prompt[3] = prompt[1];

    validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput || num > this.minPoints) {
      core.scene.inputArray.pop();
    }

    if (core.scene.inputArray.length === this.minPoints) {
      action = true;
      // reset = true
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
    ctx.stroke();
  }

  dxf() {
    const dxfitem = '';
    const data = dxfitem.concat(
        '0',
        '\n', 'LINE',
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
        '\n', '11', // X
        '\n', this.points[1].x,
        '\n', '21', // Y
        '\n', this.points[1].y, // Y
        '\n', '31', // Z
        '\n', '0.0',
    );
    console.log(' line.js - DXF Data:' + data);
    return data;
  }

  trim(points, core) {
    console.log('line.js - Points:', points.length);

    function trimOneEnd(intersectPnts, line) {
      console.log('line.js - trimOneEnd');

      let originPoint;
      let destinationPoint;
      const validPoints = [];

      // Find which end is closer to the mouse
      // if(line.points[0].distance(mouse) < line.points[1].distance(mouse)){
      //     originPoint = 0;
      // }else{
      //     originPoint = 1;
      // }

      for (let i = 0; i < line.points.length; i++) {
        for (let j = 0; j < intersectPnts.length; j++) {
          if (betweenPoints(core.mouse, [intersectPnts[j], line.points[i]], false)) {
            // console.log("Trimmed Length:", Math.round(intersectPnts[j].distance(line.points[i]) * 100) / 100, "Line length: ", Math.round(line.points[0].distance(line.points[1]) * 100) / 100)
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
            console.log('line.js - trim - Valid Point:', validPoints[j], 'distance:', dist);
          }
        }
      }

      if (typeof destinationPoint !== 'undefined') {
        console.log('destination point:', destinationPoint);
        line.points[originPoint] = intersectPnts[destinationPoint];
      }
    }

    function trimBetween(pnts, line) {
      console.log('line.js - trimBetween');

      const a = Math.round(line.points[0].distance(pnts[0]));
      const b = Math.round(line.points[0].distance(pnts[1]));
      const c = Math.round(line.points[1].distance(pnts[0]));
      const d = Math.round(line.points[1].distance(pnts[1]));

      if (a === 0 && d === 0 || b === 0 && c === 0) {
        console.log('line.js -  trim() - Line Already Trimmed');
      } else {
        const data = {
          points: [pnts[a < b ? 1 : 0], line.points[1]],
          colour: line.colour,
          layer: line.layer,
          lineWidth: line.lineWidth,
        };

        core.scene.addToScene('Line', data, false);

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
          console.log('line.js - trim() - mouse is between two other points');
          if (returnPoints) {
            return [pntsArray[i], pntsArray[i + 1]];
          }

          return true;
        }
      }
    }

    if (points.length > 1) {
      // is the mouse between two points
      const pnts = betweenPoints(core.mouse, points, true);

      if (typeof pnts !== 'undefined') {
        trimBetween(pnts, this);
      } else {
        console.log('line.js - trim() - multiple intersection & mouse is at one end');
        trimOneEnd(points, this);
      }
    } else {
      console.log('line.js - trim() - single intersection & mouse is at one end');
      trimOneEnd(points, this);
    }
  }

  extend(points, core) {
    let originPoint;
    let destinationPoint;

    // Find which end is closer to the mouse
    // ToDo: Pass the mouse location in rather than needing a ref to core.
    if (this.points[0].distance(core.mouse) < this.points[1].distance(core.mouse)) {
      originPoint = 0;
    } else {
      originPoint = 1;
    }

    // check if any of the points are valid
    const validPoints = [];

    for (let i = 0; i < points.length; i++) {
      console.log('line.js - extend - intersection point:', i);

      console.log('line.js - extend - origin to dest:', Math.round(this.points[originPoint].angle(points[i])));
      console.log('line.js - extend - origin angle:', Math.round(this.points[originPoint ? 0 : 1].angle(this.points[originPoint])));

      if (Math.round(this.points[originPoint].angle(points[i])) === Math.round(this.points[originPoint ? 0 : 1].angle(this.points[originPoint]))) {
        // if the destination point is different than the origin add it to the array of valid points
        if (Math.round(this.points[originPoint].distance(points[i])) !== 0) {
          validPoints.push(i);
        }
      }
    }

    console.log('line.js - extend - Valid Points:', validPoints.length);

    if (validPoints.length > 1) {
      let dist = Number.POSITIVE_INFINITY;

      for (let j = 0; j < validPoints.length; j++) {
        if (this.points[originPoint].distance(points[validPoints[j]]) < dist) {
          dist = this.points[originPoint].distance(points[validPoints[j]]);
          destinationPoint = validPoints[j];
          console.log('line.js - extend - Valid Point:', validPoints[j], 'distance:', dist);
        }
      }
    } else if (validPoints.length === 1) {
      // only one valid point
      destinationPoint = validPoints[0];
    }

    if (destinationPoint !== undefined) {
      console.log('destination point:', destinationPoint);
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
    // var midX = (this.points[0].x + this.points[1].x) / 2
    // var midY = (this.points[0].y + this.points[1].y) / 2

    const midPoint = this.points[0].midPoint(this.points[1]); // new Point(midX, midY);

    return midPoint;
  }

  angle() {
    const angle = 180;
    return angle;
  }

  snaps(mousePoint, delta, core) {
    if (!core.layerManager.layerVisible(this.layer)) {
      return;
    }

    const snaps = [];

    if (core.settings.endSnap) {
      const start = new Point(this.points[0].x, this.points[0].y);
      const end = new Point(this.points[1].x, this.points[1].y);
      snaps.push(start, end);
    }

    if (core.settings.midSnap) {
      snaps.push(this.midPoint());
    }

    if (core.settings.nearestSnap) {
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

    const distance = Utils.distBetweenPoints(P.x, P.y, pnt.x, pnt.y);
    // console.log(distance);
    return [pnt, distance];
  }

  extremes() {
    const xmin = Math.min(this.points[0].x, this.points[1].x);
    const xmax = Math.max(this.points[0].x, this.points[1].x);
    const ymin = Math.min(this.points[0].y, this.points[1].y);
    const ymax = Math.max(this.points[0].y, this.points[1].y);

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

    // var lP1 = new Point(this.points[0].x, this.points[0].y);
    // var lP2 = new Point(this.points[1].x, this.points[1].y);

    const output = Intersection.intersectLineRectangle(this.intersectPoints(), rectPoints);
    console.log(output.status);

    if (output.status === 'Intersection') {
      return true;
    } else {
      return false;
    }
  }
}
