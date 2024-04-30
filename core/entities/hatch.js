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

export class Hatch extends Entity {
  constructor(data) {
    super(data);

    Object.defineProperty(this, 'patternName', {
      value: 'SOLID',
      writable: true,
      enumerable: true,
    });

    if (data) {
      if (data.hasOwnProperty('patternName') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - Hatch pattern name
        this.patternName = data.patternName || data[2];
      }
    }

    console.log(data);
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

    const pattern = Patterns.getPattern(this.patternName);

    pattern.forEach((patternLine)=>{
      // Each pattern line is considered to be the first member of a line family,
      // Patterns are created by applying the delta offsets in both directions to generate an infinite family of parallel lines.
      // originX and originY values are the offsets of the line from the origin and are applied without rotation
      // The delta-x value indicates the displacement between members of the family in the direction of the line. It is used only for dashed lines.
      // The delta-y value indicates the spacing between members of the family; that is, it is measured perpendicular to the lines.
      // A line is considered to be of infinite length.
      // A dash pattern is superimposed on the line.

      // define dashlength - i.e. the length of each dash summed
      // where there is no dash defined use half the boundingbox xlength
      let dashLength = boundingBox.xLength / 2;
      if (patternLine.dashes.length) {
        dashLength = patternLine.getDashLength();
      }

      let dashes = patternLine.dashes;
      let dashOffset = 0;

      if (dashes[0] < 0) {
        // if the first dash is negative move it to the end
        const firstIndex = dashes.shift();
        dashOffset = Math.abs(firstIndex);
        dashes.push(firstIndex);
      }

      dashes = dashes.map((x) => Math.abs(x) + 0.00001);

      ctx.setDash(dashes, 0);
      ctx.setLineWidth(1/scale);

      const rotation = Utils.degrees2radians(patternLine.angle);
      const centerPoint = boundingBox.centerPoint;

      const xIncrement = Math.abs(Math.ceil((boundingBox.xLength) / dashLength));
      const yIncrement = Math.abs(Math.ceil((boundingBox.yLength / 1.75) / patternLine.yDelta));

      for (let i = -yIncrement; i < yIncrement; i++) {
        ctx.save();
        // translate to the center of the shape
        // apply the origin offsets without rotation
        ctx.translate(centerPoint.x + patternLine.xOrigin, centerPoint.y + patternLine.yOrigin);
        // rotate the context
        ctx.rotate(rotation);
        // apply the deltaX offset for odd iterations
        // define offsets for the current iteration
        const xOffset = patternLine.xDelta * Math.abs(i) + dashLength * xIncrement;
        const yOffset = patternLine.yDelta * i;

        ctx.moveTo(-xOffset+dashOffset, yOffset);
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

    file.writeGroupCode('2', this.patternName); // Hatch pattern name
    file.writeGroupCode('70', '0'); // Solid Fill Flag (1 = solid, 0 = pattern)
    file.writeGroupCode('71', '1'); // Associativity flag (associative = 1; non-associative = 0); for MPolygon, solid-fill flag (has solidfill = 1; lacks solid fill = 0)
    file.writeGroupCode('91', '1'); // Number of boundary path loops
    file.writeGroupCode('92', '7'); // Boundary path type flag (bit coded): 0 = Default; 1 = External; 2 = Polyline 4 = Derived; 8 = Textbox; 16 = Outermost
    file.writeGroupCode('72', '1'); // Edge type (only if boundary is not a polyline): 1 = Line; 2 = Circular arc; 3 = Elliptic arc; 4 = Spline
    file.writeGroupCode('73', '1'); // For MPolygon, boundary annotation flag (boundary is an annotated boundary = 1; boundary is not an annotated boundary = 0)
    file.writeGroupCode('93', '2'); // Number of edges in this boundary path (only if boundary is not a polyline)


    for (let i = 1; i < this.points.length - 1; i++) {
      file.writeGroupCode('10', this.points[i].x); // X
      file.writeGroupCode('20', this.points[i].y); // Y
      if (this.points[i].bulge) {
        file.writeGroupCode('42', this.points[i].bulge);
      }
    }

    file.writeGroupCode('97', '0'); // Number of source boundary objects
    // file.writeGroupCode('330', '25'); // Handle of source boundary objects
    file.writeGroupCode('75', '1'); // Hatch style: 0 = Hatch “odd parity” area (Normal style) 1 = Hatch outermost area only (Outer style) 2 = Hatch through entire area (Ignore style)
    file.writeGroupCode('76', '1'); // Hatch pattern type: 0 = User-defined; 1 = Predefined; 2 = Custom
    file.writeGroupCode('52', '0'); // Hatch Pattern angle
    file.writeGroupCode('41', '1.0'); // Hatch Pattern scale
    file.writeGroupCode('77', '0'); // Hatch pattern double flag(pattern fill only): 0 = not double; 1 = double
    file.writeGroupCode('78', Patterns.getPatternLineCount(this.patternName)); // Number of pattern definition lines

    // Pattern data
    const pattern = Patterns.getPattern(this.patternName);
    pattern.forEach((patternLine)=>{
      file.writeGroupCode('53', patternLine.angle); // Pattern line angle
      file.writeGroupCode('43', patternLine.xOrigin); // Pattern line base X
      file.writeGroupCode('44', patternLine.yOrigin); // Pattern line base y
      file.writeGroupCode('45', patternLine.xDelta); // Pattern line offset x
      file.writeGroupCode('46', patternLine.yDelta); // Pattern line offset y
      file.writeGroupCode('79', patternLine.dashes.length); // Number of dash length items
      patternLine.dashes.forEach((dash) =>{
        file.writeGroupCode('49', dash); // Dash length
      });
    });

    file.writeGroupCode('47', '0.5'); // pixel size
    file.writeGroupCode('98', '1'); // Number of seed points
    // seed points
    file.writeGroupCode('10', '1');
    file.writeGroupCode('20', '1');
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
