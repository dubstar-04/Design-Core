import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Utils } from '../lib/utils.js';
import { DXFFile } from '../lib/dxf/dxfFile.js';
import { BoundingBox } from '../lib/boundingBox.js';
import { Point } from './point.js';
import { Line } from './line.js';
import { Arc } from './arc.js';
import { Flags } from '../properties/flags.js';
import { Property } from '../properties/property.js';
import { AddState, RemoveState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Base Polyline Entity Class
 * @extends Entity
 */
export class BasePolyline extends Entity {
  /**
   * Create a Base Polyline
   * @param {Array} data
   */
  constructor(data) {
    super(data);

    const modes = {
      LINE: 'Line',
      ARC: 'Arc',
    };

    Object.defineProperty(this, 'modes', {
      value: modes,
      writable: true,
    });

    Object.defineProperty(this, 'inputMode', {
      value: this.modes.LINE,
      writable: true,
    });

    Object.defineProperty(this, 'flags', {
      value: new Flags(),
      writable: true,
    });

    if (data) {
      if (data.hasOwnProperty('40')) {
        // DXF Groupcode 40 - Start Width
      }

      if (data.hasOwnProperty('41')) {
        // DXF Groupcode 41 - End Width
      }

      if (data.hasOwnProperty('43')) {
        // DXF Groupcode 43 - Constant Width
      }
    }

    // DXF Groupcode 70 - Polyline flag (bit-coded; default = 0):
    // 1 = This is a closed polyline (or a polygon mesh closed in the M direction)
    // 2 = Curve-fit vertices have been added
    // 4 = Spline-fit vertices have been added
    // 8 = This is a 3D polyline
    // 16 = This is a 3D polygon mesh
    // 32 = The polygon mesh is closed in the N direction
    // 64 = The polyline is a polyface mesh
    // 128 = The linetype pattern is generated continuously around the vertices of this polyline

    this.flags.setFlagValue(Property.loadValue([data?.flags, data?.[70]], 0));
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      let index;
      while (true) {
        let options;
        if (this.points.length >= 2) {
          options = this.inputMode === this.modes.LINE ? [this.modes.ARC] : [this.modes.LINE];
        }

        const op2 = new PromptOptions(Strings.Input.NEXTPOINT, [Input.Type.POINT, Input.Type.DYNAMIC], options);
        const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
        if (pt2 === undefined) break;

        if (Input.getType(pt2) === Input.Type.POINT) {
          if (this.inputMode === this.modes.ARC) {
            this.points.at(-1).bulge = this.getBulgeFromSegment(pt2);
          }

          this.points.push(pt2);
          // first creation will get a new index, subsequent will use the index to update the original polyline
          index = DesignCore.Scene.inputManager.actionCommand(this, index);
        } else if (Input.getType(pt2) === Input.Type.STRING) {
          // options are converted to input in the prompt options class
          if (pt2 === this.modes.ARC) {
            this.inputMode = this.modes.ARC;
          }
          if (pt2 === this.modes.LINE) {
            this.inputMode = this.modes.LINE;
          }
        }
      }
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    const mousePoint = DesignCore.Mouse.pointOnScene();

    if (this.points.length >= 1) {
      const points = [...this.points, mousePoint];
      DesignCore.Scene.tempEntities.create(this.type, { points: points });
    }

    if (this.inputMode === this.modes.ARC) {
      const arcpoints = Utils.cloneObject(this.points);
      arcpoints.at(-1).bulge = this.getBulgeFromSegment(mousePoint);
      const points = [...arcpoints, mousePoint];
      DesignCore.Scene.tempEntities.create(this.type, { points: points });
    }
  }

  /**
   * Draw the polyline
   * @param {Object} ctx
   * @param {number} scale
   * @param {boolean} stroke - don't stroke hatch boundary shapes
   */
  draw(ctx, scale, stroke = true) {
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

    // handle a closed shape
    if (this.flags.hasFlag(1)) {
      ctx.lineTo(this.points[0].x, this.points[0].y);
    }

    if (stroke) {
      ctx.stroke();
    }
  }

  /**
   * Write the entity to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    file.writeGroupCode('0', 'LWPOLYLINE');
    file.writeGroupCode('5', this.handle, DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbEntity', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbPolyline', DXFFile.Version.R2000);
    file.writeGroupCode('8', this.layer); // LAYERNAME
    file.writeGroupCode('6', this.lineType);
    file.writeGroupCode('39', this.lineWidth);
    file.writeGroupCode('90', this.points.length);
    file.writeGroupCode('70', this.flags.getFlagValue());
    for (let i = 0; i < this.points.length; i++) {
      file.writeGroupCode('10', this.points[i].x);
      file.writeGroupCode('20', this.points[i].y);
      file.writeGroupCode('42', this.points[i].bulge);
    }
  }

  /**
   * Return a list of points representing a polyline version of this entity
   * @return {Array}
   */
  decompose() {
    return this.points;
  }

  /**
   * Intersect points
   * @return {Object} - object defining data required by intersect methods
   */
  intersectPoints() {
    return {
      points: this.points,
    };
  }

  /**
   * Get snap points
   * @param {Point} mousePoint
   * @param {number} delta
   * @return {Array} - array of snap points
   */
  snaps(mousePoint, delta) {
    const snaps = [];

    if (DesignCore.Settings.endsnap) {
      // End points for each segment
      for (let i = 0; i < this.points.length; i++) {
        snaps.push(this.points[i]);
      }
    }

    if (DesignCore.Settings.midsnap) {
      for (let i = 1; i < this.points.length; i++) {
        if (this.points[i - 1].bulge === 0) {
          snaps.push(this.points[i - 1].midPoint(this.points[i]));
        }
      }
    }

    if (DesignCore.Settings.centresnap) {
      for (let i = 1; i < this.points.length; i++) {
        if (this.points[i - 1].bulge !== 0) {
          snaps.push(this.points[i - 1].bulgeCentrePoint(this.points[i]));
        }
      }
    }

    if (DesignCore.Settings.nearestsnap) {
      const closest = this.closestPoint(mousePoint);

      // Crude way to snap to the closest point or a node
      if (closest[1] < delta / 10) {
        snaps.push(closest[0]);
      }
    }

    return snaps;
  }

  /**
   * Get the segment closest to point P
   * @param {Point} P
   * @return {Line|Arc|null} - closest segment
   */
  getClosestSegment(P) {
    let closestSegment = null;
    let minDistance = Infinity;

    for (let i = 1; i < this.points.length; i++) {
      const A = this.points[i - 1];
      const B = this.points[i];

      let candidateSegment;
      let closestPoint;
      if (A.bulge !== 0) {
        const center = A.bulgeCentrePoint(B);
        const direction = A.bulge > 0 ? 1 : -1;
        closestPoint = P.closestPointOnArc(A, B, center, direction);
        candidateSegment = new Arc({ points: [center, A, B], direction });
      } else {
        closestPoint = P.closestPointOnLine(A, B);
        candidateSegment = new Line({ points: [A, B] });
      }

      if (closestPoint) {
        const dist = P.distance(closestPoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestSegment = candidateSegment;
        }
      }
    }

    return closestSegment;
  }

  /**
   * Get closest point on entity
   * @param {Point} P
   * @return {Array} - [Point, distance]
   */
  closestPoint(P) {
    let distance = Infinity;
    let minPnt = P;

    for (let i = 1; i < this.points.length; i++) {
      const A = this.points[i - 1];
      const B = this.points[i];

      let pnt;
      if (A.bulge !== 0) {
        const C = A.bulgeCentrePoint(B);
        // -ve bulge is clockwise
        // +ve bulge is counter clockwise
        // -ve arc is clockwise
        // +ve arc is counter clockwise
        const direction = A.bulge > 0 ? 1 : -1;
        pnt = P.closestPointOnArc(A, B, C, direction);
      } else {
        pnt = P.closestPointOnLine(A, B);
      }

      if (pnt !== null) {
        const pntDist = P.distance(pnt);

        if (pntDist < distance) {
          distance = pntDist;
          minPnt = pnt;
        }
      }
    }

    return [minPnt, distance];
  }

  /**
   * Check if a point falls on a specific segment of the polyline
   * @param {Point} point - the point to test
   * @param {Point} A - segment start point
   * @param {Point} B - segment end point
   * @return {boolean}
   */
  isPointOnSegment(point, A, B) {
    if (A.bulge !== 0) {
      const center = A.bulgeCentrePoint(B);
      const direction = A.bulge > 0 ? 1 : -1;
      return point.isOnArc(A, B, center, direction);
    }
    return point.isOnLine(A, B);
  }

  /**
   * Trim the entity
   * @param {Array} intersections - array of intersection points
   * @return {Array} - array of state changes
   */
  trim(intersections) {
    const stateChanges = [];

    if (!intersections?.length) {
      return stateChanges;
    }

    const mousePosition = DesignCore.Mouse.pointOnScene();

    // Find the segment index closest to the mouse
    let mouseSegmentIndex = 0;
    let minDistance = Infinity;

    for (let i = 1; i < this.points.length; i++) {
      const A = this.points[i - 1];
      const B = this.points[i];

      let closestPoint;
      if (A.bulge !== 0) {
        const center = A.bulgeCentrePoint(B);
        const direction = A.bulge > 0 ? 1 : -1;
        closestPoint = mousePosition.closestPointOnArc(A, B, center, direction);
      } else {
        closestPoint = mousePosition.closestPointOnLine(A, B);
      }

      if (closestPoint) {
        const dist = mousePosition.distance(closestPoint);
        if (dist < minDistance) {
          minDistance = dist;
          mouseSegmentIndex = i;
        }
      }
    }

    // For each intersection, determine which segment it falls on
    // Store as {segmentIndex, point, distanceAlongSegment}
    const locatedIntersections = [];

    for (const point of intersections) {
      for (let i = 1; i < this.points.length; i++) {
        const A = this.points[i - 1];
        const B = this.points[i];

        if (this.isPointOnSegment(point, A, B)) {
          locatedIntersections.push({
            segmentIndex: i,
            point: point,
            distanceFromStart: A.distance(point),
          });
          break;
        }
      }
    }

    if (!locatedIntersections.length) {
      return stateChanges;
    }

    // Sort by segment index, then by distance from start of segment
    locatedIntersections.sort((a, b) => {
      if (a.segmentIndex !== b.segmentIndex) return a.segmentIndex - b.segmentIndex;
      return a.distanceFromStart - b.distanceFromStart;
    });

    // Find the nearest intersection(s) that bracket the mouse segment
    // - trimBefore: the last intersection at or before the mouse segment
    // - trimAfter: the first intersection at or after the mouse segment
    let trimBefore = null;
    let trimAfter = null;

    for (const loc of locatedIntersections) {
      if (loc.segmentIndex < mouseSegmentIndex) {
        trimBefore = loc;
      } else if (loc.segmentIndex === mouseSegmentIndex) {
        const A = this.points[mouseSegmentIndex - 1];
        const mouseDistFromA = A.distance(mousePosition.closestPointOnLine(A, this.points[mouseSegmentIndex]));

        if (A.bulge !== 0) {
          // For arc segments, compare angular position
          const B = this.points[mouseSegmentIndex];
          const center = A.bulgeCentrePoint(B);
          const direction = A.bulge > 0 ? 1 : -1;
          const mouseClosest = mousePosition.closestPointOnArc(A, B, center, direction);
          if (mouseClosest) {
            const mouseAngle = center.angle(mouseClosest);
            const intAngle = center.angle(loc.point);
            const startAngle = center.angle(A);

            // Normalise angles relative to start
            const normMouse = ((mouseAngle - startAngle) * direction + 4 * Math.PI) % (2 * Math.PI);
            const normInt = ((intAngle - startAngle) * direction + 4 * Math.PI) % (2 * Math.PI);

            if (normInt <= normMouse) {
              trimBefore = loc;
            } else if (!trimAfter) {
              trimAfter = loc;
            }
          }
        } else {
          if (loc.distanceFromStart <= mouseDistFromA) {
            trimBefore = loc;
          } else if (!trimAfter) {
            trimAfter = loc;
          }
        }
      } else {
        if (!trimAfter) {
          trimAfter = loc;
        }
      }
    }

    // Build new polyline(s) from the remaining portions
    // Portion 1: start of polyline to trimBefore point
    if (trimBefore) {
      const points = [];

      // Add all points before the trim segment start
      for (let i = 0; i < trimBefore.segmentIndex - 1; i++) {
        points.push(this.points[i].clone());
      }

      // Add the segment start point (with adjusted bulge for arcs)
      const segStart = this.points[trimBefore.segmentIndex - 1];
      const segStartClone = segStart.clone();
      if (segStart.bulge !== 0) {
        segStartClone.bulge = this.getPartialBulge(segStart, this.points[trimBefore.segmentIndex], trimBefore.point);
      }
      points.push(segStartClone);

      // Add the trim point
      const trimPoint = trimBefore.point.clone();
      points.push(trimPoint);

      if (points.length >= 2) {
        const polyline = Utils.cloneObject(this);
        polyline.points = points;
        polyline.flags.setFlagValue(0); // open
        stateChanges.push(new AddState(polyline));
      }
    }

    // Portion 2: trimAfter point to end of polyline
    if (trimAfter) {
      const points = [];

      // Add the intersection point
      const trimPoint = trimAfter.point.clone();
      points.push(trimPoint);

      // If the segment is an arc, add remaining arc portion
      const segStart = this.points[trimAfter.segmentIndex - 1];
      if (segStart.bulge !== 0) {
        trimPoint.bulge = this.getPartialBulge(segStart, this.points[trimAfter.segmentIndex], trimPoint, true);
      }

      // Add remaining points
      for (let i = trimAfter.segmentIndex; i < this.points.length; i++) {
        points.push(this.points[i].clone());
      }

      if (points.length >= 2) {
        const polyline = Utils.cloneObject(this);
        polyline.points = points;
        polyline.flags.setFlagValue(0); // open
        stateChanges.push(new AddState(polyline));
      }
    }

    // Only trim if at least one intersection was found to bracket the mouse
    if (trimBefore || trimAfter) {
      stateChanges.push(new RemoveState(this));
    }

    return stateChanges;
  }

  /**
   * Calculate the bulge for a partial arc segment
   * @param {Point} segStart - original segment start point (has bulge)
   * @param {Point} segEnd - original segment end point
   * @param {Point} splitPoint - point where the arc is split
   * @param {boolean} afterSplit - if true, return bulge for the portion after the split point
   * @return {number} - the partial bulge value
   */
  getPartialBulge(segStart, segEnd, splitPoint, afterSplit = false) {
    const center = segStart.bulgeCentrePoint(segEnd);
    const direction = segStart.bulge > 0 ? 1 : -1;

    const startAngle = center.angle(segStart);
    const endAngle = center.angle(segEnd);
    const splitAngle = center.angle(splitPoint);

    let includedAngle;
    if (afterSplit) {
      // Angle from split point to end
      includedAngle = (endAngle - splitAngle) * direction;
    } else {
      // Angle from start to split point
      includedAngle = (splitAngle - startAngle) * direction;
    }

    // Normalise to 0..2PI
    includedAngle = ((includedAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return Math.tan(includedAngle / 4) * direction;
  }

  /**
   * Return boundingbox for entity
   * @return {BoundingBox}
   */
  boundingBox() {
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

  /**
   * Get the bulge value from the previous segment and the selected point
   * @param {Point} point
   * @return {number} polyline bulge value
   */
  getBulgeFromSegment(point) {
    const lastSegBulge = this.points.at(-2).bulge;
    const lastSegIsArc = lastSegBulge !== 0;

    // get the angle at the end of the previous segment
    let lastSegAngle;
    if (lastSegIsArc) {
      const centerPoint = this.points.at(-2).bulgeCentrePoint(this.points.at(-1));
      // angle is perpendicular to the center-to-end point ray, in the direction of the bulge
      lastSegAngle = centerPoint.angle(this.points.at(-1)) + (Math.PI / 2) * Math.sign(lastSegBulge);
    } else {
      // line segment angle is the angle from point 0 to to point 1
      lastSegAngle = this.points.at(-2).angle(this.points.at(-1));
    }

    const mouseAngle = this.points.at(-1).angle(point) % (2 * Math.PI);
    // get the angle delta between point and the previous segment
    // ensure that the angle is always less than 2 * Math.PI
    const angleDelta = ((mouseAngle - lastSegAngle) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    // angleDelta is 1/2 the included angle
    // bulge is tan of (included angle * 0.25)
    const bulge = Math.tan((angleDelta * 2) / 4);
    return bulge;
  }
}
