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
  static type = 'Hatch';

  /**
   * Create a Hatch Entity
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    // cache for pre-computed world-space pattern line segments
    Object.defineProperty(this, 'cachedPattern', {
      value: null,
      writable: true,
      enumerable: false,
    });

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
    const upper = name.toUpperCase();
    if (this.pattern === upper) return;
    this.pattern = upper;
    this.solid = this.pattern === 'SOLID';
    this.cachedPattern = null;
  }

  /**
   * Build and cache world-space line segments for the current pattern.
   * For pattern hatches, segments are pre-clipped against the boundary using
   * geometric intersection so draw() requires no ctx.save/clip/restore overhead.
   */
  buildPatternCache() {
    if (!this.childEntities.length) {
      this.cachedPattern = [];
      return;
    }

    if (this.solid || !Patterns.patternExists(this.patternName)) {
      this.cachedPattern = [];
      return;
    }

    // Build closed boundary arrays for intersection-based pre-clipping
    const bb = this.boundingBox();
    const boundaryExtentX = bb.xMax + bb.xLength + 1;
    const boundaries = [];
    // Collect all interior boundary vertices (the junction points between segments).
    // An intersection point that lands exactly on a junction vertex will be reported
    // by both adjacent segments, doubling the crossing count unless we deduplicate.
    const boundaryVertices = [];
    for (let i = 0; i < this.childEntities.length; i++) {
      const shape = this.childEntities[i];
      if (!shape.points.length) continue;
      const pts = [...shape.points];
      if (!pts[0].isSame(pts.at(-1))) pts.push(pts[0]);
      boundaries.push(pts);
      // All unique vertices (skip only the closure duplicate at pts[length-1]).
      // pts[0] is also a junction — shared by the last and first segments.
      for (let j = 0; j < pts.length - 1; j++) {
        boundaryVertices.push(pts[j]);
      }
    }

    const centerPoint = bb.centerPoint;
    const bbXLength = bb.xLength;
    const bbYLength = bb.yLength;
    const s = this.scale;
    const lines = [];

    const pattern = Patterns.getPattern(this.patternName);
    pattern.forEach((patternLine) => {
      let dashLength = bbXLength / 2;
      if (patternLine.dashes.length) {
        dashLength = patternLine.getDashLength();
      }

      let dashes = [...patternLine.dashes];
      let dashOffset = 0;

      if (dashes.length && dashes[0] < 0) {
        const firstIndex = dashes.shift();
        dashOffset = Math.abs(firstIndex);
        dashes.push(firstIndex);
      }

      dashes = dashes.map((x) => (Math.abs(x) + 0.00001) * s);

      // Combined rotation: pattern line angle plus the hatch entity angle
      const rotation = Utils.degrees2radians(patternLine.angle + this.angle);

      // Precomputed rotation components used to transform between pattern-local
      // (line-aligned) space and world space throughout this family's loop.
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      // World-space anchor for this family: bounding-box centre shifted by the
      // pattern line's origin offset (scaled to match the hatch scale).
      const cx = centerPoint.x + patternLine.xOrigin * s;
      const cy = centerPoint.y + patternLine.yOrigin * s;

      // Bounding-box half-extents in pattern-local (unscaled) space.
      const halfW = bbXLength / (2 * s);
      const halfH = bbYLength / (2 * s);

      // Absolute trig values for projecting axis-aligned extents onto rotated axes.
      const sinA = Math.abs(sinR);
      const cosA = Math.abs(cosR);

      // Half-extents of the bounding box projected onto the pattern line's
      // parallel (halfX) and perpendicular (halfY) axes.  halfX bounds how far
      // each raw segment must reach; halfY bounds how many parallel lines are needed.
      const halfX = halfW * cosA + halfH * sinA;
      const halfY = halfW * sinA + halfH * cosA;

      // Perpendicular projection of the family's origin offset from the bounding-box
      // centre onto the direction perpendicular to the pattern lines.  A non-zero
      // origin shifts the whole family, so the loop range must be widened on the far
      // side and the tangent guard must use the shifted position.
      const originPerpOffset = patternLine.yOrigin * cosR - patternLine.xOrigin * sinR;

      const maxSegmentsPerFamily = 1000;
      const yIncrement = Math.min(
          Math.ceil((halfY + Math.abs(originPerpOffset)) / Math.abs(patternLine.yDelta)),
          maxSegmentsPerFamily,
      );

      const segments = [];
      for (let i = -yIncrement; i < yIncrement; i++) {
        const yOffset = patternLine.yDelta * i;
        // A line whose shifted perpendicular position equals or exceeds halfY is
        // tangent to or outside the bounding box — it cannot produce any valid
        // inside sub-segment.  Skip it to avoid phantom slivers caused by
        // near-tangent numerical artefacts in the arc-intersection code.
        if (Math.abs(yOffset + originPerpOffset) >= halfY) continue;
        // Each family member i is phase-shifted along the line direction by i × xDelta.
        const xPhaseShift = patternLine.xDelta * i;
        // Extend the raw segment far enough in both directions to cover the bounding
        // box regardless of how large the phase shift grows for large i.
        const xHalfSpan = dashLength * Math.ceil((halfX + Math.abs(xPhaseShift)) / dashLength);
        const lx1 = xPhaseShift - xHalfSpan + dashOffset;
        const lx2 = xPhaseShift + xHalfSpan;
        const ly = yOffset;
        const rx1 = (lx1 * cosR - ly * sinR) * s + cx;
        const ry1 = (lx1 * sinR + ly * cosR) * s + cy;
        const rx2 = (lx2 * cosR - ly * sinR) * s + cx;
        const ry2 = (lx2 * sinR + ly * cosR) * s + cy;

        // Find all intersection t-values where this segment crosses a boundary edge.
        // A point that falls on a boundary vertex is shared by two adjacent segments
        // and would be reported twice, doubling the crossing count. Track which vertex
        // t-values have already been added and skip duplicates.
        const segStartPt = new Point(rx1, ry1);
        const segEndPt = new Point(rx2, ry2);
        const dir = segEndPt.subtract(segStartPt);
        const lenSq = dir.dot(dir);
        if (lenSq === 0) continue;
        const sqrtLenSq = Math.sqrt(lenSq);
        const ts = [0, 1];
        const vertexTsAdded = new Set();
        for (const b of boundaries) {
          const result = Intersection.intersectPolylinePolyline(b, [segStartPt, segEndPt]);
          for (const pt of result.points) {
            const t = pt.subtract(segStartPt).dot(dir) / lenSq;
            if (t > 0.0001 && t < 0.9999) {
              // Check if this point coincides with a boundary vertex
              let isVertex = false;
              for (const v of boundaryVertices) {
                const vdx = pt.x - v.x;
                const vdy = pt.y - v.y;
                if (vdx * vdx + vdy * vdy < 1e-10) {
                  isVertex = true;
                  break;
                }
              }
              if (isVertex) {
                // Round t to 6 decimal places to get a stable key
                const tKey = Math.round(t * 1e6);
                if (!vertexTsAdded.has(tKey)) {
                  vertexTsAdded.add(tKey);
                  ts.push(t);
                }
              } else {
                ts.push(t);
              }
            }
          }
        }

        ts.sort((a, b) => a - b);

        // Deduplicate very close t-values (e.g. a corner vertex found by two edges)
        const uniqueTs = [ts[0]];
        for (let k = 1; k < ts.length; k++) {
          if (ts[k] - uniqueTs.at(-1) > 0.0001) uniqueTs.push(ts[k]);
        }

        // Test each interval's midpoint; keep sub-segments that are inside the boundary
        for (let k = 0; k < uniqueTs.length - 1; k++) {
          const tMid = (uniqueTs[k] + uniqueTs[k + 1]) / 2;
          if (Intersection.isInsidePolyline(segStartPt.x + tMid * dir.x, segStartPt.y + tMid * dir.y, boundaries, boundaryExtentX)) {
            const p1 = segStartPt.lerp(segEndPt, uniqueTs[k]);
            const p2 = segStartPt.lerp(segEndPt, uniqueTs[k + 1]);
            // Store the segment along with its initial dash phase, which is used by draw()
            segments.push({
              x1: p1.x,
              y1: p1.y,
              x2: p2.x,
              y2: p2.y,
              dashPhase: uniqueTs[k] * sqrtLenSq,
            });
          }
        }
      }

      lines.push({ dashes, segments });
    });

    this.cachedPattern = lines;
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

                // On the last vertex, apply the closed flag (73) to the shape.
                // For polyline boundaries 73 = is-closed and appears once, before
                // the vertices, so it has already been parsed into data[73]. We
                // must not consume it inside the arc-edge branch (that branch uses
                // 73 as the per-edge "is counter-clockwise" flag), so we read it
                // here only when we are in the polyline branch and on the final vertex.
                if (edgeNum === edgeCount - 1 && this.getDataValue(data, 73)) {
                  shape.flags.addValue(1);
                }
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
      DesignCore.Scene.previewEntities.create(this.type, { points: this.points, childEntities: shapes });
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
            // Mark as closed (flag bit 1)
            shape.flags.addValue(1);
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
   * @param {Object} renderer
   * @param {number} scale
   */
  draw(renderer) {
    // ensure the scale is valid
    if (this.scale < 0.01) {
      this.scale = 1;
      this.cachedPattern = null;
    }

    if (!this.childEntities.length) return;

    // Build cache if stale (cachedPattern === null means never built or invalidated)
    if (this.cachedPattern === null) this.buildPatternCache();

    if (this.solid) {
      // Design renders solid hatches with a direct fill() call rather than the
      // dense cross-hatch line pattern used by commercial CAD applications
      // (Commercial CAD's SOLID pattern uses two line families at 0.0001-unit spacing).
      // fill() is resolution-independent, handles curved boundaries exactly,
      // and avoids the cost of generating and clipping thousands of segments.
      renderer.beginPath();
      for (const shape of this.childEntities) {
        if (!shape.points.length) continue;
        renderer.tracePath(shape.toPolylinePoints());
        renderer.closePath();
      }
      renderer.applyPath({ fill: true, stroke: false, fillRule: 'evenodd' });
    } else {
      // Pattern hatch: draw pre-clipped segments directly.
      for (const family of this.cachedPattern) {
        renderer.setDash([], 0);
        renderer.drawSegments(family.segments, family.dashes);
      }
    }

    // Draw the boundary outline when hovered or selected.
    const isSelected = DesignCore.Scene.selectionManager.selectedItems.includes(this);
    const isHovered = DesignCore.Scene.hoverEntities.indexOf(this) !== -1;
    if (isSelected || isHovered) {
      renderer.setDash([], 0);
      for (const shape of this.childEntities) {
        if (!shape.points.length) continue;
        renderer.drawShape(shape.toPolylinePoints(), { closed: true });
      }
    }
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

      // invalidate the pattern cache for any property change — the cache encodes
      // geometry, scale, angle, and boundary shape, so any update may affect it
      this.cachedPattern = null;

      // other properties as normal
      this[property] = value;
    }
  }
}
