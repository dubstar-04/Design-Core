import { Entity } from './entity.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';

import { Strings } from '../lib/strings.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';

import { Point } from './point.js';
import { Flags } from '../properties/flags.js';

import { Utils } from '../lib/utils.js';
import { Patterns } from '../lib/patterns.js';
import { Intersection } from '../lib/intersect.js';

import { DesignCore } from '../designCore.js';

import { Line } from './line.js';
import { Arc } from './arc.js';
import { Polyline } from './polyline.js';
import { Property } from '../properties/property.js';

/**
 * Hatch Entity Class
 * @extends Entity
 */
export class Hatch extends Entity {
  /**
   * Create a Hatch Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // store the boundary shapes
    Object.defineProperty(this, 'childEntities', {
      value: [],
      writable: true,
    });

    Object.defineProperty(this, 'pattern', {
      value: 'ANSI31',
      writable: true,
    });

    Object.defineProperty(this, 'solid', {
      value: false,
      writable: true,
    });

    Object.defineProperty(this, 'patternName', {
      // value: 'ANSI31',
      // writable: true,
      enumerable: true,
      get: this.getPatternName,
      set: this.setPatternName,
    });

    Object.defineProperty(this, 'angle', {
      value: 0,
      writable: true,
      enumerable: true,
    });

    Object.defineProperty(this, 'scale', {
      value: 1,
      writable: true,
      enumerable: true,
    });

    // hide inherited properties
    // needs to be enumerable=false to not appear in the object props
    Object.defineProperty(this, 'lineType', {
      enumerable: false,
    });

    Object.defineProperty(this, 'lineWidth', {
      enumerable: false,
    });

    // add a single point to this.points if no other points exist
    if (!this.points.length) {
      this.points.push(new Point());
    }

    // DXF Groupcode 70 - Solid Fill Flag (1 = solid, 0 = pattern)
    this.solid = Boolean(Property.loadValue([data?.solid, data?.[70]], 0));
    // DXF Groupcode 2 - Hatch pattern name
    this.patternName = Property.loadValue([data?.patternName, data?.[2]], 'ANSI31');
    // DXF Groupcode 41 - Hatch pattern scale
    this.scale = Property.loadValue([data?.scale, data?.[41]], 1);
    // DXF Groupcode 52 - Hatch pattern angle
    this.angle = Property.loadValue([data?.angle, data?.[52]], 0);

    if (data) {
      if (data.hasOwnProperty('childEntities')) {
        if (Array.isArray(data.childEntities)) {
          this.childEntities = data.childEntities;
        }
      } else {
        const shapes = this.processBoundaryData(data);
        if (shapes.length) {
          this.childEntities = shapes;
        }
      }
    }

    // ensure first point is 0,0 and last point is 1,1
    if (this.points.at(0).x !== 0 || this.points.at(0).y !== 0) {
      this.points[0] = new Point(0, 0);
    }

    if (this.points.length < 2 || (this.points.at(-1).x !== 1 || this.points.at(-1).y !== 1)) {
      this.points.push(new Point(1, 1));
    }
  }

  /**
   * Get the hatch pattern name
   * @return {string}
   */
  getPatternName() {
    return this.pattern;
  }

  /**
   * Set the hatch pattern name
   * @param {string} name
   */
  setPatternName(name) {
    this.pattern = name.toUpperCase();
    this.solid = this.pattern === 'SOLID';
  }

  /**
   * Process the dxf data, creating hatch boundaries
   * @param {Array} data
   * @return {Array} - Array of boundary items
   */
  processBoundaryData(data) {
    if (!data.hasOwnProperty('points')) {
      return [];
    }

    const childEntities = [];

    // copy this.points and remove first point
    // First and last points define the hatch, not the hatch boundary
    // Some CAD systems don't include the last point so leave it in place
    const points = data.points.slice(1);

    // Process the boundary paths into objects
    if (data.hasOwnProperty('91')) {
      // DXF Groupcode 91 - Number of boundary paths (loops)
      const boundaryPathCount = data[91];
      // 92 - Boundary path type flag (bit coded): 0 = Default; 1 = External; 2 = Polyline 4 = Derived; 8 = Textbox; 16 = Outermost
      const boundaryPathType = this.getDataValue(data, 92);

      for (let i = 0; i < boundaryPathCount; i++) {
        // check if boundary path is polyline
        const boundaryPathTypeFlag = new Flags();
        boundaryPathTypeFlag.setFlagValue(boundaryPathType);
        const isPolyline = boundaryPathTypeFlag.hasFlag(2);

        if (data.hasOwnProperty('93')) {
          // DXF Groupcode 93 - Number of edges in this boundary path (only if boundary is not a polyline)
          // const edgeCountData = data[93];
          const edgeCount = this.getDataValue(data, 93);

          const shape = new Polyline();

          for (let edgeNum = 0; edgeNum < edgeCount; edgeNum++) {
            if (data.hasOwnProperty('72')) {
              // DXF Groupcode 72 - Edge type (only if boundary is not a polyline):
              // 1 = Line; 2 = Circular arc; 3 = Elliptic arc; 4 = Spline
              // const edgeTypeData = data[72];
              const edgeType = this.getDataValue(data, 72);

              if (isPolyline) {
                // Polyline
                // 72 - Has Bulge Flag; 73 - Is Closed Flag; 93 - Number of vertices; 10 - X; 20 - Y; 42 - Bulge
                const polyPoint = points.shift();
                if (polyPoint.sequence !== undefined && polyPoint.sequence !== 10) {
                  const msg = 'Invalid point sequence';
                  const err = (`${this.type} - ${msg}`);
                  throw Error(err);
                }

                shape.points.push(polyPoint);
              } else if (edgeType === 1) {
                // Line
                // 10 - X; 20 - Y; 11 - X; 21 - Y
                const shapePoints = [];
                const startPoint = points.shift();
                if (startPoint.sequence !== undefined && startPoint.sequence !== 10) {
                  const msg = 'Invalid point sequence';
                  const err = (`${this.type} - ${msg}`);
                  throw Error(err);
                }

                const endPoint = points.shift();
                if (endPoint.sequence !== undefined && endPoint.sequence !== 11) {
                  const msg = 'Invalid point sequence';
                  const err = (`${this.type} - ${msg}`);
                  throw Error(err);
                }

                shapePoints.push(startPoint);
                shapePoints.push(endPoint);
                const line = new Line({ points: shapePoints });
                shape.points.push(...line.toPolylinePoints());
              } else if (edgeType === 2) {
                // ARC
                // 10 - X; 20 - Y;  40 - Radius;  50 - Start Angle;  51 - End Angle; 73 - Is Counter Clockwise
                const shapeData = { points: [] };

                const centerPoint = points.shift();
                if (centerPoint.sequence !== undefined && centerPoint.sequence !== 10) {
                  const msg = 'Invalid point sequence';
                  const err = (`${this.type} - ${msg}`);
                  throw Error(err);
                }
                shapeData.points.push(centerPoint);
                shapeData[40] = this.getDataValue(data, 40);
                shapeData.startAngle = this.getDataValue(data, 50);
                shapeData.endAngle = this.getDataValue(data, 51);
                // arc direction: - ccw > 0, cw <= 0 default 1
                shapeData.direction = this.getDataValue(data, 73);

                if (shapeData.direction === 0) {
                  const circle = 360;
                  shapeData.startAngle = circle - shapeData.startAngle;
                  shapeData.endAngle = circle - shapeData.endAngle;
                }

                const arc = new Arc(shapeData);
                shape.points.push(...arc.toPolylinePoints());
              } else if (edge.edgeType === 3) {
                // Ellipse
                // 10 - X; 20 - Y; 11 - X; 21 - Y; 40 - Length of minor axis (percentage of major axis length);
                // 50 - Start angle; 51 - End angle; 73 - Is counterclockwise flag
                const msg = 'Ellipse not supported';
                const err = (`${this.type} - ${msg}`);
                throw Error(err);
              } else if (edgeType === 4) {
                // Spline
                // 94 - Degree; 73 - Rational; 74 - Periodic; 95 - Number of knots; 96 - Number of control points; 40 - Knot values (multiple entries)
                // 10 - X of Control Point; 20 - Y of Control Point; 42 - Weights (optional, default = 1); 97 - Number of fit data
                // 11 - X of Fit datum; 21 - Y of Fit datum; 12 - X of Start Tangent; 22 - Y of Start Tangent
                // 13 - X of End tangent; 23 - Y of End tangent
                const msg = 'Spline not supported';
                const err = (`${this.type} - ${msg}`);
                throw Error(err);
              }
            }
          }

          childEntities.push(shape);
        }
      }
    }

    return childEntities;
  }


  /**
   * Get value from incoming data
   * handle arrays and single values
   * @param {any} data
   * @param {number} dxfCode
   * @return {any}
   */
  getDataValue(data, dxfCode) {
    let value;
    if (Array.isArray(data[dxfCode])) {
      value = data[dxfCode].shift();
    } else {
      value = data[dxfCode];
    }
    return value;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Hatch', shortcut: 'H' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);
      let validBoundary = false;

      while (!validBoundary) {
        const result = await DesignCore.Scene.inputManager.requestInput(op);
        if (result === undefined) return;

        const selectedItems = DesignCore.Scene.selectionManager.selectedItems.slice(0);
        const boundary = this.processSelection(selectedItems);

        if (boundary.length) {
          this.childEntities = boundary;
          validBoundary = true;
        } else {
        // reset selection
          DesignCore.Scene.selectionManager.reset();
          const msg = `${this.type} - ${Strings.Error.SELECTION}`;
          DesignCore.Core.notify(msg);
        }
      }

      DesignCore.Scene.inputManager.executeCommand(this);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    const selectedItems = DesignCore.Scene.selectionManager.selectedItems.slice(0);
    const shapes = this.processSelection(selectedItems);
    if (shapes.length) {
      DesignCore.Scene.tempEntities.create(this.type, { points: this.points, childEntities: shapes });
    }
  }

  /**
   * Convert the selection to boundary items
   * @param {Array} selectedItems
   * @return {Array} - Array of boundary items
   */
  processSelection(selectedItems) {
    const selectedchildEntities = [];

    let iterationPoints = [];

    // track the last index count to make sure the loop is closed
    let lastIndexCount = selectedItems.length + 1;

    while (selectedItems.length) {
      if (selectedItems.length === lastIndexCount) {
        return [];
      }

      lastIndexCount = selectedItems.length;

      for (let i = 0; i < selectedItems.length; i++) {
        // no points collected - get the first index from selected items

        const currentItem = selectedItems[i];
        // if the item can't be converted to polyline points, remove from selected items and go again
        if (typeof currentItem.toPolylinePoints === 'undefined' || currentItem.type === 'Text' || currentItem.type === 'ArcAlignedText') {
          selectedItems.splice(i, 1);
          break;
        }

        let currentPoints = currentItem.toPolylinePoints();

        // check if the start or end point of the item are connected to the end of the iteration points
        if (!iterationPoints.length || currentPoints.at(0).isSame(iterationPoints.at(-1)) || currentPoints.at(-1).isSame(iterationPoints.at(-1))) {
          // check if the item is reversed
          if (iterationPoints.length && currentPoints.at(-1).isSame(iterationPoints.at(-1))) {
            currentPoints = currentPoints.reverse();

            // Reverse the bulge for arcs
            const startBulge = currentPoints.at(0).bulge;
            const endBulge = currentPoints.at(-1).bulge;

            currentPoints.at(0).bulge = endBulge * -1;
            currentPoints.at(-1).bulge = startBulge * -1;
          }

          // Merge the shared connection point rather than pushing a duplicate.
          // Arc.toPolylinePoints() stores the outgoing arc bulge on its start
          // point; the previous entity left that slot with bulge=0 (destination
          // only). Transfer the bulge and skip the duplicate so that:
          //   - arc geometry is preserved exactly
          //   - floating-point trig differences (e.g. Math.cos(3π/2) ≈ -1.8e-16
          //     instead of 0) cannot produce a spurious near-zero segment
          if (iterationPoints.length && currentPoints[0].isSame(iterationPoints.at(-1))) {
            if (currentPoints[0].bulge !== 0) {
              iterationPoints.at(-1).bulge = currentPoints[0].bulge;
            }
            iterationPoints.push(...currentPoints.slice(1));
          } else {
            iterationPoints.push(...currentPoints);
          }

          // remove the index from selected items
          selectedItems = selectedItems.filter((index) => index !== selectedItems[i]);

          if (iterationPoints.at(0).isSame(iterationPoints.at(-1))) {
            const shape = new Polyline();
            // Drop the redundant closure point — the first point already records
            // the same position; keeping it would create a zero-length segment
            shape.points.push(...iterationPoints.slice(0, -1));
            selectedchildEntities.push(shape);
            iterationPoints = [];
            break;
          }
        }
      }
    }

    return selectedchildEntities;
  }

  /**
   * Draw the entity
   * @param {Object} ctx - context
   * @param {number} scale
   */
  draw(ctx, scale) {
    // ensure the scale is valid
    if (this.scale < 0.01) {
      this.scale = 1;
    }

    if (!this.childEntities.length) return;

    ctx.save();

    // Start a new composite path for all boundary loops
    try {
      ctx.beginPath();
    } catch { // Cairo
      ctx.newPath();
    }

    // Trace all boundary paths as sub-paths in a single composite path
    // Using even-odd fill rule, islands are automatically handled:
    // areas enclosed by an odd number of boundaries are filled,
    // areas enclosed by an even number are left empty
    for (let i = 0; i < this.childEntities.length; i++) {
      const shape = this.childEntities[i];
      if (!shape.points.length) continue;

      // Start a new sub-path for this boundary
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      // Trace the boundary path (without stroking)
      shape.draw(ctx, scale, false);
      // Close the sub-path
      ctx.closePath();
    }

    // Clip using even-odd rule
    try { // Cairo - clip() takes no arguments, uses the fill rule set above
      ctx.setFillRule(1); // Cairo.FillRule.EVEN_ODD
      ctx.clip();
    } catch { // HTML Canvas
      ctx.clip('evenodd');
    }

    // Start a new path for the pattern/fill area
    try {
      ctx.beginPath();
    } catch { // Cairo
      ctx.newPath();
    }

    // Create an oversized rectangle covering all boundaries
    const bb = this.boundingBox();
    try {
      ctx.rect(bb.xMin - bb.xLength, bb.yMin - bb.yLength, bb.xLength * 3, bb.yLength * 3);
    } catch { // Cairo
      ctx.rectangle(bb.xMin - bb.xLength, bb.yMin - bb.yLength, bb.xLength * 3, bb.yLength * 3);
    }

    // Draw the pattern/fill once over the composite clipped region
    this.createPattern(ctx, scale, bb);

    ctx.restore();
  }

  /**
   * Draw the hatch pattern to the context
   * @param {Object} ctx
   * @param {number} scale
   * @param {BoundingBox} boundingbox - bounding box of the hatch boundaries, used to size the pattern
   */
  createPattern(ctx, scale, boundingbox) {
    if (!Patterns.patternExists(this.patternName) || this.solid) {
      ctx.fill();
      return;
    }

    const boundingBox = boundingbox;
    const centerPoint = boundingBox.centerPoint;
    const bbXLength = boundingBox.xLength;
    const bbYLength = boundingBox.yLength;

    const pattern = Patterns.getPattern(this.patternName);
    pattern.forEach((patternLine) => {
      // Each pattern line is considered to be the first member of a line family,
      // Patterns are created by applying the delta offsets in both directions to generate an infinite family of parallel lines.
      // originX and originY values are the offsets of the line from the origin and are applied without rotation
      // The delta-x value indicates the displacement between members of the family in the direction of the line. It is used only for dashed lines.
      // The delta-y value indicates the spacing between members of the family; that is, it is measured perpendicular to the lines.
      // A line is considered to be of infinite length.
      // A dash pattern is superimposed on the line.

      // define dashlength - i.e. the length of each dash summed
      // where there is no dash defined use half the boundingbox xlength
      let dashLength = bbXLength / 2;
      if (patternLine.dashes.length) {
        dashLength = patternLine.getDashLength();
      }

      // copy dashes to avoid mutating the pattern line
      let dashes = [...patternLine.dashes];
      let dashOffset = 0;

      if (dashes[0] < 0) {
        // if the first dash is negative move it to the end
        const firstIndex = dashes.shift();
        dashOffset = Math.abs(firstIndex);
        dashes.push(firstIndex);
      }

      dashes = dashes.map((x) => Math.abs(x) + 0.00001);

      try {
        ctx.setLineDash(dashes, 0);
        ctx.lineWidth = (1 / scale / this.scale);
        ctx.beginPath();
      } catch { // Cairo
        ctx.setDash(dashes, 0);
        ctx.setLineWidth(1 / scale / this.scale);
        ctx.newPath();
      }

      const rotation = Utils.degrees2radians(patternLine.angle + this.angle);

      // Project the bounding box onto the pattern's rotated local axes
      // to compute tight line counts instead of using the worst-case max dimension.
      const halfW = bbXLength / (2 * this.scale);
      const halfH = bbYLength / (2 * this.scale);
      const sinR = Math.abs(Math.sin(rotation));
      const cosR = Math.abs(Math.cos(rotation));

      // Half-extent along the line direction (X in local frame)
      const halfX = halfW * cosR + halfH * sinR;
      // Half-extent perpendicular to lines (Y in local frame)
      const halfY = halfW * sinR + halfH * cosR;

      const xIncrement = Math.ceil(halfX / dashLength);
      const yIncrement = Math.ceil(halfY / Math.abs(patternLine.yDelta));

      // Set transform once for all lines in this pattern line family
      ctx.save();
      // translate to the center of the shape
      // apply the origin offsets without rotation
      ctx.translate(centerPoint.x + patternLine.xOrigin * this.scale, centerPoint.y + patternLine.yOrigin * this.scale);
      // scale the context
      ctx.scale(this.scale, this.scale);
      // rotate the context
      ctx.rotate(rotation);

      for (let i = -yIncrement; i < yIncrement; i++) {
        // apply the deltaX offset for odd iterations
        // define offsets for the current iteration
        const xOffset = patternLine.xDelta * Math.abs(i) + dashLength * xIncrement;
        const yOffset = patternLine.yDelta * i;

        ctx.moveTo(-xOffset + dashOffset, yOffset);
        ctx.lineTo(xOffset, yOffset);
      }

      ctx.stroke();
      ctx.restore();
    });
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    // skip if no boundary shapes
    if (!this.childEntities.length) {
      return;
    }

    file.writeGroupCode('0', 'HATCH');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer);
    file.writeGroupCode('100', 'AcDbHatch', DXFFile.Version.R2000);
    file.writeGroupCode('10', '0.0');
    file.writeGroupCode('20', '0.0');
    file.writeGroupCode('30', '0.0');

    file.writeGroupCode('210', '0.0'); // Extrusion Direction X
    file.writeGroupCode('220', '0.0'); // Extrusion Direction Y
    file.writeGroupCode('230', '1.0'); // Extrusion Direction Z

    file.writeGroupCode('2', this.patternName); // Hatch pattern name
    file.writeGroupCode('70', this.solid ? 1 : 0); // Solid Fill Flag (1 = solid, 0 = pattern)
    file.writeGroupCode('71', '0'); // Associativity flag (associative = 1; non-associative = 0); for MPolygon, solid-fill flag (has solidfill = 1; lacks solid fill = 0)


    file.writeGroupCode('91', this.childEntities.length); // Number of boundary path loops

    for (let i = 0; i < this.childEntities.length; i++) {
      const shape = this.childEntities[i];
      file.writeGroupCode('92', '7'); // Boundary path type flag (bit coded): 0 = Default; 1 = External; 2 = Polyline 4 = Derived; 8 = Textbox; 16 = Outermost
      file.writeGroupCode('72', '1'); // Edge type (only if boundary is not a polyline): 1 = Line; 2 = Circular arc; 3 = Elliptic arc; 4 = Spline
      file.writeGroupCode('73', '1'); // For MPolygon, boundary annotation flag (boundary is an annotated boundary = 1; boundary is not an annotated boundary = 0)
      file.writeGroupCode('93', shape.points.length); // Number of edges in this boundary path / number of points in polyline


      for (let j = 0; j < shape.points.length; j++) {
        file.writeGroupCode('10', shape.points[j].x); // X
        file.writeGroupCode('20', shape.points[j].y); // Y
        file.writeGroupCode('42', shape.points[j].bulge);
      }

      file.writeGroupCode('97', '0'); // Number of source boundary objects
    }
    file.writeGroupCode('75', '1'); // Hatch style: 0 = Hatch “odd parity” area (Normal style) 1 = Hatch outermost area only (Outer style) 2 = Hatch through entire area (Ignore style)
    file.writeGroupCode('76', '1'); // Hatch pattern type: 0 = User-defined; 1 = Predefined; 2 = Custom

    if (!this.solid) {
      file.writeGroupCode('52', this.angle); // Hatch Pattern angle
      file.writeGroupCode('41', this.scale); // Hatch Pattern scale
      file.writeGroupCode('77', '0'); // Hatch pattern double flag(pattern fill only): 0 = not double; 1 = double
      file.writeGroupCode('78', Patterns.getPatternLineCount(this.patternName)); // Number of pattern definition lines

      // Pattern data
      const pattern = Patterns.getPattern(this.patternName);
      pattern.forEach((patternLine) => {
        file.writeGroupCode('53', patternLine.angle + this.angle); // Pattern line angle
        file.writeGroupCode('43', patternLine.xOrigin); // Pattern line base X
        file.writeGroupCode('44', patternLine.yOrigin); // Pattern line base y
        const deltaPoint = new Point(patternLine.xDelta * this.scale, patternLine.yDelta * this.scale);
        const rotatedDelta = deltaPoint.rotate(new Point(), Utils.degrees2radians(patternLine.angle + this.angle));
        file.writeGroupCode('45', rotatedDelta.x); // Pattern line offset x
        file.writeGroupCode('46', rotatedDelta.y); // Pattern line offset y
        file.writeGroupCode('79', patternLine.dashes.length); // Number of dash length items
        patternLine.dashes.forEach((dash) => {
          file.writeGroupCode('49', dash * this.scale); // Dash length
        });
      });
    }

    file.writeGroupCode('47', '0.5'); // pixel size
    file.writeGroupCode('98', '1'); // Number of seed points
    // seed points
    file.writeGroupCode('10', '1');
    file.writeGroupCode('20', '1');
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];
    return snaps;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    if (this.isInside(P)) {
      return [P, 0];
    }
    return [P, Infinity];
  }

  /**
   * Determine if point is inside the hatch
   * @param {Point} P
   * @return {boolean} - true if inside
   */
  isInside(P) {
    // P = P.subtract(this.points[0]);
    for (let i = 0; i < this.childEntities.length; i++) {
      const shape = this.childEntities[i];

      if (shape.boundingBox().isInside(P)) {
        const polyline = [...shape.points];

        // check the polyline is closed
        if (!shape.points.at(0).isSame(shape.points.at(-1))) {
          polyline.push(shape.points.at(0));
        }

        // create a line from P, twice the length of the bounding box
        const line = [P, new Point(P.x + shape.boundingBox().xLength, P.y)];

        const intersect = Intersection.intersectPolylinePolyline(polyline, line);
        const intersects = intersect.points.length;
        // P is inside shape if there is a odd number of intersects
        if (Math.abs(intersects % 2) == 1) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
    if (this.childEntities.length === 0) {
      return new BoundingBox();
    }

    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (let i = 0; i < this.childEntities.length; i++) {
      const shape = this.childEntities[i];

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

  /**
   * Determine if the entity is touch the selection window
   * @param {Object} selection - {min: Point, max: Point}
   * @return {boolean} true if touched
   */
  touched(selection) {
    for (let i = 0; i < this.childEntities.length; i++) {
      if (this.childEntities[i].touched(selection)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set a property if it exists
   * @param {string} property
   * @param {any} value
   */
  setProperty(property, value) {
    if (this.hasOwnProperty(property)) {
      if (property === 'points') {
        // Special handling for hatch points to move child entities
        // Consider the changes from the hatch points to be an offset and rotation
        const ang = value[0].angle(value.at(-1));
        const theta = ang - this.points[0].angle(this.points.at(-1));

        if (theta !== 0) {
          // set rotation center
          const center = this.points[0];
          // apply rotation to child entities points
          this.childEntities.forEach((child) => {
            const rotatedPoints = child.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).rotate(center, theta));
            child.setProperty('points', rotatedPoints);
          });

          this.angle+= Utils.radians2degrees(theta);
        }

        const delta = value[0].subtract(this.points[0]);
        if (delta.x !== 0 || delta.y !== 0) {
        // apply translation to child entities points
          this.childEntities.forEach((child) => {
            const offsetPoints = child.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).add(delta));
            child.setProperty('points', offsetPoints);
          });
        }
      }

      // other properties as normal
      this[property] = value;
    }
  }
}
