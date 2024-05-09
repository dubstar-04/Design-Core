import {Entity} from './entity.js';
import {DXFFile} from '../lib/dxf/dxfFile.js';
import {BoundingBox} from '../lib/boundingBox.js';

import {Strings} from '../lib/strings.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {Point} from './point.js';
import {Flags} from '../properties/flags.js';

import {Utils} from '../lib/utils.js';
import {Patterns} from '../lib/patterns.js';

import {DesignCore} from '../designCore.js';
import {Intersection} from '../lib/intersect.js';

class BoundaryPathPolyline {
  constructor() {
    this.edgeType = 0;
    this.points = [];
  }

  draw(ctx, scale) {
    for (let i = 0; i < this.points.length; i++) {
      if (this.points[i].bulge === 0) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      } else {
        // define the next point or the first point for closed shapes
        const nextPoint = this.points[i + 1] || this.points[0];
        const centerPoint = this.points[i].bulgeCentrePoint(nextPoint);
        const radius = this.points[i].bulgeRadius(nextPoint);

        if (this.points[i].bulge > 0) {
          // TODO: make this work with canvas
          ctx.arc(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(nextPoint));
        } else {
          try { // HTML
            ctx.arc(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(nextPoint), true);
          } catch { // Cairo
            ctx.arcNegative(centerPoint.x, centerPoint.y, radius, centerPoint.angle(this.points[i]), centerPoint.angle(nextPoint));
          }
        }
      }
    }
  }

  boundingBox() {
    // TODO: Move this to the bounding box class
    // return BoundingBox.fromPoints(points);

    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (let i = 0; i < this.points.length; i++) {
      const nextPoint = this.points[i + 1] || this.points[0];

      let boundingBox = BoundingBox.lineBoundingBox(this.points[i], nextPoint);

      if (this.points[i].bulge !== 0) {
        const centerPoint = this.points[i].bulgeCentrePoint(nextPoint);
        boundingBox = BoundingBox.arcBoundingBox(centerPoint, this.points[i], nextPoint, this.points[i].bulge);
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

class BoundaryPathLine {
  constructor() {
    this.edgeType = 1;
    this.points = [];
  }

  draw(ctx, scale) {
    ctx.lineTo(this.points[1].x, this.points[1].y);
  }

  boundingBox() {
    return BoundingBox.lineBoundingBox(this.points[0], this.points[1]);
  }
}

class BoundaryPathArc {
  constructor() {
    this.edgeType = 2;
    this.points = [];
    this.radius = 1;
    this.startAngle = 0;
    this.endAngle = 360;
    this.direction = 1;
  }

  draw(ctx, scale) {
    const sA = Utils.degrees2radians(this.startAngle);
    const eA = Utils.degrees2radians(this.endAngle);
    if (this.direction) {
      ctx.arc(this.points[0].x, this.points[0].y, this.radius, sA, eA);
    } else {
      const circle = Math.PI * 2;
      ctx.arcNegative(this.points[0].x, this.points[0].y, this.radius, circle - sA, circle - eA);
    }
  }

  boundingBox() {
    const startPoint = this.points[0].project(Utils.degrees2radians(this.startAngle), this.radius);
    const endPoint = this.points[0].project(Utils.degrees2radians(this.endAngle), this.radius);

    return BoundingBox.arcBoundingBox(this.points[0], startPoint, endPoint, this.direction);
  }
}

export class Hatch extends Entity {
  constructor(data) {
    super(data);

    // store the boundary shapes
    Object.defineProperty(this, 'boundaryShapes', {
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'patternName', {
      value: 'ANSI31',
      writable: true,
      enumerable: true,
    });

    if (data) {
      if (data.hasOwnProperty('patternName') || data.hasOwnProperty('2')) {
        // DXF Groupcode 2 - Hatch pattern name
        this.patternName = data.patternName || data[2];
      }

      if (data.hasOwnProperty('boundaryShapes')) {
        this.boundaryShapes = data.boundaryShapes;
      }

      // 70 - Solid Fill - (solid fill = 1; pattern fill = 0);
      // 71 - Associativity flag (associative = 1; non-associative = 0); for MPolygon, solid-fill flag (has solid fill= 1; lacks solid fill = 0)
      // 91 - Boundary Path Count
      // 92 - Boundary path type flag (bit coded): 0 = Default; 1 = External; 2 = Polyline 4 = Derived; 8 = Textbox; 16 = Outermost
      // 72 - Edge Type (only if boundary is not a polyline): 1 = Line; 2 = Circular arc; 3 = Elliptic arc; 4 = Spline
      // 93 - Number of Edges
      // 97 - Number of souce objects

      this.processBoundaryData(data);
    }
  }

  processBoundaryData(data) {
    if (!data.hasOwnProperty('points')) {
      return;
    }

    // copy this.points and remove first and last points
    const points = data.points.slice(1, -1);

    // Process the boundary paths into objects
    if (data.hasOwnProperty('91')) {
      // DXF Groupcode 91 - Number of boundary paths (loops)
      const boundaryPathCount = data[91];
      // 92 - Boundary path type flag (bit coded): 0 = Default; 1 = External; 2 = Polyline 4 = Derived; 8 = Textbox; 16 = Outermost
      const boundaryPathType = this.getDataValue(data, 92);

      for (let i=0; i < boundaryPathCount; i++) {
        // check if boundary path is polyline
        const boundaryPathTypeFlag = new Flags();
        boundaryPathTypeFlag.setFlagValue(boundaryPathType);
        const isPolyline = boundaryPathTypeFlag.hasFlag(2);

        if (data.hasOwnProperty('93')) {
          // DXF Groupcode 93 - Number of edges in this boundary path (only if boundary is not a polyline)
          // const edgeCountData = data[93];
          const edgeCount = this.getDataValue(data, 93);

          for (let edgeNum=0; edgeNum < edgeCount; edgeNum++) {
            if (data.hasOwnProperty('72')) {
              // DXF Groupcode 72 - Edge type (only if boundary is not a polyline):
              // 1 = Line; 2 = Circular arc; 3 = Elliptic arc; 4 = Spline
              // const edgeTypeData = data[72];
              const edgeType = this.getDataValue(data, 72);

              if (isPolyline) {
                // Polyline
                // 72 - Has Bulge Flag
                // 73 - Is Closed Flag
                // 93 - Number of vertices
                // 10 - X
                // 20 - Y
                // 42 - Bulge
                const shape = new BoundaryPathPolyline();
                // dxf code 93 reprensents the number of points in the polyline
                // collect all the polyline points
                for (let pointNum=0; pointNum < edgeCount; pointNum++) {
                  shape.points.push(points.shift());
                  edgeNum++;
                }
                this.boundaryShapes.push(shape);
              } else if (edgeType === 1) {
                // Line
                // 10 - X
                // 20 - Y
                // 11 - X
                // 21 - Y
                const shape = new BoundaryPathLine();
                shape.points.push(points.shift());
                shape.points.push(points.shift());
                this.boundaryShapes.push(shape);
              } else if (edgeType === 2) {
                // ARC
                // 10 - X
                // 20 - Y
                // 40 - Radius
                // 50 - Start Angle
                // 51 - End Angle
                // 73 - Is Counter Clockwise
                const shape = new BoundaryPathArc();
                shape.points.push(points.shift());
                shape.radius = this.getDataValue(data, 40);
                shape.startAngle = this.getDataValue(data, 50);
                shape.endAngle = this.getDataValue(data, 51);
                shape.direction = this.getDataValue(data, 73);
                this.boundaryShapes.push(shape);
              } else if (edge.edgeType === 3) {
                // Ellipse
                // 10 - X
                // 20 - Y
                // 11 - X
                // 21 - Y
                // 40 - Length of minor axis (percentage of major axis length)
                // 50 - Start angle
                // 51 - End angle
                // 73 - Is counterclockwise flag
                const msg = 'Ellipse not supported';
                const err = (`${this.type} - ${msg}`);
                throw Error(err);
              } else if (edgeType === 4) {
                // Spline
                // 94 - Degree
                // 73 - Rational
                // 74 - Periodic
                // 95 - Number of knots
                // 96 - Number of control points
                // 40 - Knot values (multiple entries)
                // 10 - X of Control Point
                // 20 - Y of Control Point
                // 42 - Weights (optional, default = 1)
                // 97 - Number of fit data
                // 11 - X of Fit datum
                // 21 - Y of Fit datum
                // 12 - X of Start Tangent
                // 22 - Y of Start Tangent
                // 13 - X of End tangent
                // 23 - Y of End tangent
                const msg = 'Spline not supported';
                const err = (`${this.type} - ${msg}`);
                throw Error(err);
              }
            }
          }
        }
      }
    }
  }

  // get value from incomming data
  // handle arrays and single values
  getDataValue(data, dxfCode) {
    let value;
    if (Array.isArray(data[dxfCode])) {
      value = data[dxfCode].shift();
    } else {
      value = data[dxfCode];
    }
    return value;
  }

  static register() {
    const command = {command: 'Hatch', shortcut: 'H'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      this.boundaryShapes = this.processSelection();

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    const shapes = this.processSelection();
    if (shapes.length) {
      DesignCore.Scene.createTempItem(this.type, {boundaryShapes: this.processSelection()});
    }
  }

  processSelection() {
    const selectedBoundaryShapes = [];

    // get a copy of the selected items
    let selectedItemIndicies = DesignCore.Scene.selectionManager.selectionSet.selectionSet.slice(0);

    let iterationPoints = [];

    // track the last index count to make sure the loop is closed
    let lastIndexCount = selectedItemIndicies.length + 1;

    while (selectedItemIndicies.length) {
      if (selectedItemIndicies.length === lastIndexCount) {
        const msg = `${this.type} - Invalid boundary`;
        DesignCore.Core.notify(msg);
        return [];
      }

      lastIndexCount = selectedItemIndicies.length;

      for (let i = 0; i < selectedItemIndicies.length; i++) {
        // no points collected - get the first index from selected items
        if (!iterationPoints.length) {
          const item = DesignCore.Scene.items[selectedItemIndicies.shift()];
          iterationPoints.push(...item.decompose());
          break;
        }

        const currentItem = DesignCore.Scene.items[selectedItemIndicies[i]];
        let currentPoints = currentItem.decompose();

        // check if the start or end point of the item are connected to the end of the iteration points
        if (currentPoints.at(0).isSame(iterationPoints.at(-1)) || currentPoints.at(-1).isSame(iterationPoints.at(-1))) {
          // check if the item is reversed
          if (currentPoints.at(-1).isSame(iterationPoints.at(-1))) {
            currentPoints = currentPoints.reverse();
          }

          iterationPoints.push(...currentPoints);
          // remove the index from selected items
          selectedItemIndicies = selectedItemIndicies.filter((index) => index !== selectedItemIndicies[i]);

          if (iterationPoints.at(0).isSame(iterationPoints.at(-1)) ) {
            const shape = new BoundaryPathPolyline();
            shape.points = iterationPoints;
            selectedBoundaryShapes.push(shape);
            iterationPoints = [];
            break;
          }
        }
      }
    }

    return selectedBoundaryShapes;
  }

  draw(ctx, scale) {
    ctx.save();
    for (let i = 0; i < this.boundaryShapes.length; i++) {
      const shape = this.boundaryShapes[i];
      shape.draw(ctx, scale);
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
    return Math.abs(intersects % 2) == 1;
  }

  boundingBox() {
    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (let i = 0; i < this.boundaryShapes.length; i++) {
      const shape = this.boundaryShapes[i];

      const boundingBox = shape.boundingBox();

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
