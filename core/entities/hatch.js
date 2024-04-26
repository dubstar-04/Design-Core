import {Entity} from './entity.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';

import {Strings} from '../lib/strings.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {Point} from './point.js';

import {Utils} from '../lib/utils.js';
import {Patterns} from '../lib/patterns.js';

import {DesignCore} from '../designCore.js';
import {Intersection} from '../lib/intersect.js';

// import Cairo from 'cairo';

export class Hatch extends Entity {
  constructor(data) {
    super(data);

    Object.defineProperty(this, 'patternName', {
      value: 'SOLID',
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('patternName') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - Hatch pattern name
        this.patternName = data.patternName || data[2];
      }
    }

    // console.log(data);
  }

  static register() {
    const command = {command: 'Hatch', shortcut: 'H'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.POINT, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      this.points.push(pt1);

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    // const mousePoint = DesignCore.Mouse.pointOnScene();
    // console.log(mousePoint);
    // const points = [this.points.at(-1), mousePoint];
    // DesignCore.Scene.createTempItem(this.type, {points: points});
  }

  draw(ctx, scale) {
    ctx.save();
    // copy this.point and remove first and last points
    const points = this.points.slice(1, -1);

    for (let i = 0; i < points.length; i++) {
      if (points[i].bulge === 0) {
        ctx.lineTo(points[i].x, points[i].y);
      } else {
        // define the next point or the first point for closed shapes
        const nextPoint = points[i + 1] || points[0];
        const centerPoint = points[i].bulgeCentrePoint(nextPoint);
        const radius = points[i].bulgeRadius(nextPoint);

        if (points[i].bulge > 0) {
          // TODO: make this work with canvas
          ctx.arc(centerPoint.x, centerPoint.y, radius, centerPoint.angle(points[i]), centerPoint.angle(nextPoint));
        } else {
          try { // HTML
            ctx.arc(centerPoint.x, centerPoint.y, radius, centerPoint.angle(points[i]), centerPoint.angle(nextPoint), true);
          } catch { // Cairo
            ctx.arcNegative(centerPoint.x, centerPoint.y, radius, centerPoint.angle(points[i]), centerPoint.angle(nextPoint));
          }
        }
      }
    }

    if (Patterns.patternExists(this.patternName)) {
      ctx.clip();
      this.createPattern(ctx, scale);
    } else {
      ctx.fill();
    }


    ctx.restore();
  }

  createPattern(ctx, scale) {
    ctx.save();
    const boundingBox = this.boundingBox();

    const patternString = Patterns.getPattern(this.patternName);

    // split the pattern into seperate lines
    const patternLines = patternString.pattern.split('\n');
    // process each pattern line
    patternLines.forEach((line)=>{
      const patternArray = line.split(',');

      if (!patternArray.length) {
        return;
      }

      // Each pattern line is considered to be the first member of a line family,
      // Patterns are created by applying the delta offsets in both directions to generate an infinite family of parallel lines.
      // originX and originY values are the offsets of the line from the origin and are applied without rotation
      // The delta-x value indicates the displacement between members of the family in the direction of the line. It is used only for dashed lines.
      // The delta-y value indicates the spacing between members of the family; that is, it is measured perpendicular to the lines.
      // A line is considered to be of infinite length.
      // A dash pattern is superimposed on the line.

      const angle = parseFloat(patternArray[0]);
      const originX = parseFloat(patternArray[1]);
      const originY = parseFloat(patternArray[2]);
      const deltaX = parseFloat(patternArray[3]);
      const deltaY = parseFloat(patternArray[4]);

      // get dash pattern from the end of the array
      const lineDash = patternArray.splice(5);
      const dashPattern = lineDash.map((x) => Math.abs(x) + 0.001);

      // define dashlength - i.e. the length of each dash summed
      // where there is no dash defined use half the boundingbox xlength
      let dashLength = boundingBox.xLength / 2;
      if (lineDash.length) {
        // sum the length of all the dashes
        dashLength = dashPattern.reduce((accumulator, currentValue) => accumulator + currentValue);
      }

      // ctx.setLineCap(Cairo.LineCap.SQUARE);
      ctx.setDash(dashPattern, 0);
      ctx.setLineWidth(1/scale);

      const rotation = Utils.degrees2radians(angle);
      const centerPoint = boundingBox.centerPoint;

      const xIncrement = Math.abs(Math.ceil((boundingBox.xLength) / dashLength));
      const yIncrement = Math.abs(Math.ceil((boundingBox.yLength / 1.75) / deltaY));

      for (let i = -yIncrement; i < yIncrement; i++) {
        ctx.save();
        // translate to the center of the shape
        // apply the origin offsets without rotation
        ctx.translate(centerPoint.x + originX, centerPoint.y + originY);
        // rotate the context
        ctx.rotate(rotation);
        // determin in the current iteration is odd or even
        const oddEven = Math.abs(i) % 2;
        // apply the deltaX offset for odd iterations
        const dashOffset = deltaX * oddEven;
        // define offsets for the current iteration
        const xOffset = (dashLength * xIncrement) + dashOffset;
        const yOffset = deltaY * i;

        ctx.moveTo(-xOffset, yOffset);
        ctx.lineTo(xOffset, yOffset);

        ctx.stroke();
        ctx.restore();
      }
    });
    ctx.restore();
  }

  dxf(file) {
    file.writeGroupCode('0', 'HATCH');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbHatch', DXFFile.Version.R2000);
    file.writeGroupCode('10', this.points[0].x);
    file.writeGroupCode('20', this.points[0].y);
    file.writeGroupCode('30', '0.0');

    file.writeGroupCode('210', '0.0'); // Extrusion Direction X
    file.writeGroupCode('220', '0.0'); // Extrusion Direction Y
    file.writeGroupCode('230', '1.0'); // Extrusion Direction Z

    file.writeGroupCode('2', 'SOLID'); // Hatch pattern name
    file.writeGroupCode('70', '1'); // Solid Fill Flag (1 = solid, 0 = pattern)
    file.writeGroupCode('71', '1'); // Associativity flag (associative = 1; non-associative = 0); for MPolygon, solid-fill flag (has solidfill = 1; lacks solid fill = 0)
    file.writeGroupCode('91', '1'); // Number of boundary path loops
    file.writeGroupCode('73', '1'); // For MPolygon, boundary annotation flag (boundary is an annotated boundary = 1; boundary is not an annotated boundary = 0)
    file.writeGroupCode('75', '1'); // Hatch style: 0 = Hatch “odd parity” area (Normal style) 1 = Hatch outermost area only (Outer style) 2 = Hatch through entire area (Ignore style)
    file.writeGroupCode('76', '1'); // Hatch pattern type: 0 = User-defined; 1 = Predefined; 2 = Custom
    file.writeGroupCode('47', '0.5'); // pixel size
    file.writeGroupCode('98', '1'); // Number of seed points

    for (let i = 1; i < this.points.length; i++) {
      file.writeGroupCode('10', this.points[i].x); // X
      file.writeGroupCode('20', this.points[i].y); // Y
    }
    // Boundary path data
    file.writeGroupCode('92', '7'); // Boundary path type flag (bit coded): 0 = Default; 1 = External; 2 = Polyline 4 = Derived; 8 = Textbox; 16 = Outermost
    file.writeGroupCode('93', '3'); // Number of edges in this boundary path (only if boundary is not a polyline)
    file.writeGroupCode('72', '0'); // Edge type (only if boundary is not a polyline): 1 = Line; 2 = Circular arc; 3 = Elliptic arc; 4 = Spline
    file.writeGroupCode('97', '1'); // Number of source boundary objects

    // Pattern data
    file.writeGroupCode('53', '45'); // Pattern line angle
    file.writeGroupCode('43', '0.0'); // Pattern line base X
    file.writeGroupCode('44', '0.0'); // Pattern line base y
    file.writeGroupCode('45', '-2.2'); // Pattern line offset x
    file.writeGroupCode('46', '2.2'); // Pattern line offset y
    file.writeGroupCode('79', '0'); // Number of dash length items
    file.writeGroupCode('49', ''); // Dash length
  }

  snaps(mousePoint, delta) {
    const snaps = [];
    return snaps;
  }

  closestPoint(P) {
    if (this.isInside(P)) {
      return [P, 0];
    }
    return [P, Infinity];
  }

  isInside(P) {
    const points = this.points.slice(1, -1);

    if (!points[0].isSame(points[points.length-1])) {
      points.push(points[0]);
    }

    const polyline = {points: points};
    // create a line from P, twice the length of the bounding box
    const line = {start: P, end: new Point(P.x + this.boundingBox().xLength * 2, P.y)};

    const intersect = Intersection.intersectPolylineLine(polyline, line);
    const intersects = intersect.points.length;
    // console.log('intersects', intersects);
    return Math.abs(intersects % 2) == 1;
  }

  boundingBox() {
    // TODO: Move this to the bounding box class

    const points = this.points.slice(1, -1);
    // return BoundingBox.fromPoints(points);

    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (let i = 0; i < points.length; i++) {
      const nextPoint = points[i + 1] || points[0];

      let boundingBox = BoundingBox.lineBoundingBox(points[i], nextPoint);

      if (points[i].bulge !== 0) {
        const centerPoint = points[i].bulgeCentrePoint(nextPoint);
        boundingBox = BoundingBox.arcBoundingBox(centerPoint, points[i], nextPoint, points[i].bulge);
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
}
