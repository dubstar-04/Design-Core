import { Point } from '../entities/point.js';
import { Utils } from './utils.js';

/** Intersection Class */
export class Intersection {
  /**
   * Enumeration of all possible intersection status values.
   * Use these constants instead of magic strings when comparing or setting
   * `Intersection#status`.
   */
  static Status = {
    /** The geometries do not intersect. */
    NONE: 'None',
    /** The geometries intersect at one or more discrete points (arc/circle/polyline aggregate). */
    INTERSECTION: 'Intersection',
    /** Two line segments cross in their interiors (both intersection parameters strictly inside [0,1]). */
    CROSSING: 'Crossing',
    /** Two line segments cross in their interiors at exactly 90°. */
    PERPENDICULAR: 'Perpendicular',
    /** An endpoint of one segment lies in the interior of the other segment (T-intersection). */
    TOUCHING: 'Touching',
    /** The segments share an endpoint exactly. */
    ENDPOINT: 'Endpoint',
    /** The geometries are collinear and their intervals overlap (line-line). */
    OVERLAPPING: 'Overlapping',
    /** The geometries are collinear / coincident (used for concentric equal-radius arcs/circles). */
    COINCIDENT: 'Coincident',
    /** The geometries are parallel but distinct. */
    PARALLEL: 'Parallel',
    /** The geometries are tangent (touch at exactly one point). */
    TANGENT: 'Tangent',
    /** One geometry is fully inside the other with no intersection points. */
    INSIDE: 'Inside',
    /** The geometries are entirely separate with one outside the other. */
    OUTSIDE: 'Outside',
  };

  /**
   * Intersection constructor
   * @param {string} status - defined status of the intersection i.e inside or outside of shape
   */
  constructor(status) {
    this.status = status;
    this.points = [];
  }

  /**
   * Append point to suggested intersecting points
   * @param {Point} point
   */
  appendPoint(point) {
    // check if point already exists in the array
    for (let i = 0; i < this.points.length; i++) {
      if (this.points[i].isSame(point)) {
        // point already exists - return
        return;
      }
    }

    // push point to points if it doesn't exist
    this.points.push(point);
  };

  /**
   * Append points to suggested intersecting points
   * @param {Array} points
   */
  appendPoints(points) {
    // Forward all points through appendPoint
    points.forEach((point) => {
      this.appendPoint(point);
    });
  };

  /**
   * Find intersections between two polylines.
   * Aggregates all segment-level results and collapses the status to a binary
   * outcome: {@link Intersection.Status.NONE} or {@link Intersection.Status.INTERSECTION}.
   * Use this method when you only need to know whether any intersection exists
   * (e.g. selection / touch tests). For granular status detail (CROSSING, TOUCHING,
   * ENDPOINT, OVERLAPPING, etc.) call {@link intersectSegmentSegment} directly.
   * @param {Array} points1 - boundary points array
   * @param {Array} points2 - selected points array
   * @param {boolean} extend - extend the selected entity
   * @return {Intersection}
   */
  static intersectPolylinePolyline(points1, points2, extend) {
    const result = new Intersection(Intersection.Status.NONE);

    for (let i = 0; i < points1.length - 1; i++) {
      for (let j = 0; j < points2.length - 1; j++) {
        const inter = this.intersectSegmentSegment(
            points1[i], points1[i + 1],
            points2[j], points2[j + 1],
            extend,
        );
        result.appendPoints(inter.points);
      }
    }

    if (result.points.length > 0) result.status = Intersection.Status.INTERSECTION;
    return result;
  }

  /**
   * Find intersections between two polyline segments.
   * Returns the full granular status (CROSSING, PERPENDICULAR, TOUCHING, ENDPOINT,
   * OVERLAPPING, TANGENT, etc.) needed by geometric operations such as trim and extend.
   * @param {Point} b1 - boundary segment start point
   * @param {Point} b2 - boundary segment end point
   * @param {Point} b3 - selected segment start point
   * @param {Point} b4 - selected segment end point
   * @param {boolean} extend - extend the selected segment
   * @return {Intersection}
   */
  static intersectSegmentSegment(b1, b2, b3, b4, extend) {
    const seg1IsArc = b1.bulge !== 0 && b1.bulge !== undefined;
    const seg2IsArc = b3.bulge !== 0 && b3.bulge !== undefined;

    // line vs line
    if (!seg1IsArc && !seg2IsArc) {
      return this.#intersectLineLine({ start: b1, end: b2 }, { start: b3, end: b4 }, extend);
    }

    const arc1 = seg1IsArc ? this.#buildArc(b1, b2) : null;
    const arc2 = seg2IsArc ? this.#buildArc(b3, b4) : null;

    let candidatePoints;
    let innerStatus;

    if (seg1IsArc && seg2IsArc) {
      // arc vs arc
      const inter = this.#intersectCircleCircle(arc1, arc2);
      candidatePoints = inter.points;
      innerStatus = inter.status;
    } else if (seg1IsArc) {
      // arc(boundary) vs line(selected)
      const inter = this.#intersectCircleLine(arc1, { start: b3, end: b4 }, extend);
      candidatePoints = inter.points;
      innerStatus = inter.status;
    } else {
      // line(boundary) vs arc(selected)
      const inter = this.#intersectCircleLine(arc2, { start: b1, end: b2 }, false);
      candidatePoints = inter.points;
      innerStatus = inter.status;
    }

    const result = new Intersection(innerStatus || Intersection.Status.NONE);

    for (let i = 0; i < candidatePoints.length; i++) {
      const pt = candidatePoints[i];
      let valid = true;

      // boundary arc filter - always applied
      if (seg1IsArc && !pt.isOnArc(arc1.startPoint, arc1.endPoint, arc1.centre, arc1.direction)) {
        valid = false;
      }

      // selected arc filter - skipped when extending
      if (valid && seg2IsArc && !extend) {
        if (!pt.isOnArc(arc2.startPoint, arc2.endPoint, arc2.centre, arc2.direction)) {
          valid = false;
        }
      }

      if (valid) {
        result.appendPoint(pt);
      }
    }

    if (result.points.length > 0 && result.status !== Intersection.Status.TANGENT) result.status = Intersection.Status.INTERSECTION;
    return result;
  }

  /**
   * Find intersections between circle and line
   * @param {Circle} circle
   * @param {Line} line
   * @param {boolean} extend - extend the line as a ray
   * @return {Intersect}
   */
  static #intersectCircleLine(circle, line, extend) {
    const c = circle.centre;
    const r = circle.radius;
    const a1 = line.start;
    const a2 = line.end;
    extend = extend || false;


    let result;
    const a = (a2.x - a1.x) * (a2.x - a1.x) +
      (a2.y - a1.y) * (a2.y - a1.y);
    const b = 2 * ((a2.x - a1.x) * (a1.x - c.x) +
      (a2.y - a1.y) * (a1.y - c.y));
    const cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y -
      2 * (c.x * a1.x + c.y * a1.y) - r * r;
    const deter = b * b - 4 * a * cc;

    if (deter < 0) {
      result = new Intersection(Intersection.Status.OUTSIDE);
    } else if (deter == 0) {
      result = new Intersection(Intersection.Status.TANGENT);
      const u = -b / (2 * a);
      if (0 <= u && u <= 1 || extend) {
        result.appendPoint(a1.lerp(a2, u));
      }
    } else {
      const e = Math.sqrt(deter);
      const u1 = (-b + e) / (2 * a);
      const u2 = (-b - e) / (2 * a);

      if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
        if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
          result = new Intersection(Intersection.Status.OUTSIDE);
          if (extend) {
            result.appendPoint(a1.lerp(a2, u1));
            result.appendPoint(a1.lerp(a2, u2));
          }
        } else {
          result = new Intersection(Intersection.Status.INSIDE);
          if (extend) {
            result.appendPoint(a1.lerp(a2, u1));
            result.appendPoint(a1.lerp(a2, u2));
          }
        }
      } else {
        result = new Intersection(Intersection.Status.INTERSECTION);

        if (0 <= u1 && u1 <= 1 || extend) {
          result.appendPoint(a1.lerp(a2, u1));
        }

        if (0 <= u2 && u2 <= 1 || extend) {
          result.appendPoint(a1.lerp(a2, u2));
        }
      }
    }

    return result;
  };

  /**
   * Find intersections between two circles
   * @param {Circle} circle1
   * @param {Circle} circle2
   * @param {boolean} extend  - unused
   * @return {Intersect}
   */
  static #intersectCircleCircle(circle1, circle2, extend) {
    const c1 = circle1.centre;
    const r1 = circle1.radius;
    const c2 = circle2.centre;
    const r2 = circle2.radius;
    let result;

    // Determine minimum and maximum radii where circles can intersect
    const rMax = r1 + r2;
    const rMin = Math.abs(r1 - r2);

    // Determine actual distance between circle circles
    const cDist = c1.distance(c2);

    if (cDist === 0) {
      result = new Intersection(r1 === r2 ? Intersection.Status.COINCIDENT : Intersection.Status.INSIDE);
    } else if (cDist > rMax) {
      result = new Intersection(Intersection.Status.OUTSIDE);
    } else if (cDist < rMin) {
      result = new Intersection(Intersection.Status.INSIDE);
    } else {
      result = new Intersection(Intersection.Status.INTERSECTION);

      const a = (r1 * r1 - r2 * r2 + cDist * cDist) / (2 * cDist);
      const h = Math.sqrt(r1 * r1 - a * a);
      const p = c1.lerp(c2, a / cDist);
      const b = h / cDist;

      result.appendPoint(new Point(
          p.x - b * (c2.y - c1.y),
          p.y + b * (c2.x - c1.x),
      ));
      result.appendPoint(new Point(
          p.x + b * (c2.y - c1.y),
          p.y - b * (c2.x - c1.x),
      ));
    }

    return result;
  };

  /**
   * Build arc object from two polyline points
   * @param {Point} b1 - start point with bulge
   * @param {Point} b2 - end point
   * @return {Object} arc with centre, startPoint, endPoint, radius, direction
   */
  static #buildArc(b1, b2) {
    const arc = {};
    arc.centre = b1.bulgeCentrePoint(b2);
    arc.startPoint = b1;
    arc.endPoint = b2;
    arc.radius = arc.centre.distance(b1);
    arc.direction = b1.bulge;
    return arc;
  }

  /**
   * Find intersections between two lines
   * @param {Line} line1
   * @param {Line} line2
   * @param {boolean} extend
   * @return {Intersection}
   */
  static #intersectLineLine(line1, line2, extend) {
    const aStart = line1.start;
    const aEnd = line1.end;
    const bStart = line2.start;
    const bEnd = line2.end;
    extend = extend || false;

    let result;

    // Check if any endpoints are coincident
    if (aStart.isSame(bStart)) {
      result = new Intersection(Intersection.Status.ENDPOINT);
      result.appendPoint(new Point(aStart.x, aStart.y));
      return result;
    }

    if (aStart.isSame(bEnd)) {
      result = new Intersection(Intersection.Status.ENDPOINT);
      result.appendPoint(new Point(aStart.x, aStart.y));
      return result;
    }

    if (aEnd.isSame(bStart)) {
      result = new Intersection(Intersection.Status.ENDPOINT);
      result.appendPoint(new Point(aEnd.x, aEnd.y));
      return result;
    }

    if (aEnd.isSame(bEnd)) {
      result = new Intersection(Intersection.Status.ENDPOINT);
      result.appendPoint(new Point(aEnd.x, aEnd.y));
      return result;
    }

    // Check if any endpoints of one line are on the other line
    if (aStart.isOnLine(bStart, bEnd)) {
      result = new Intersection(Intersection.Status.TOUCHING);
      result.appendPoint(new Point(aStart.x, aStart.y));
      return result;
    }

    if (aEnd.isOnLine(bStart, bEnd)) {
      result = new Intersection(Intersection.Status.TOUCHING);
      result.appendPoint(new Point(aEnd.x, aEnd.y));
      return result;
    }

    if (bStart.isOnLine(aStart, aEnd)) {
      result = new Intersection(Intersection.Status.TOUCHING);
      result.appendPoint(new Point(bStart.x, bStart.y));
      return result;
    }

    if (bEnd.isOnLine(aStart, aEnd)) {
      result = new Intersection(Intersection.Status.TOUCHING);
      result.appendPoint(new Point(bEnd.x, bEnd.y));
      return result;
    }

    // Guard against zero-length (degenerate) segments.
    // Endpoint and touching cases were already handled above; anything remaining
    // means the point simply does not lie on the other segment.
    if (aStart.isSame(aEnd) || bStart.isSame(bEnd)) {
      return new Intersection(Intersection.Status.NONE);
    }

    // Direction vectors and offset between start points
    const line1Dir = aEnd.subtract(aStart);
    const line2Dir = bEnd.subtract(bStart);
    const startDiff = aStart.subtract(bStart);

    // Zero cross product means the lines are parallel
    const directionCross = line1Dir.cross(line2Dir);

    if (directionCross !== 0) {
      // Lines are not parallel
      // lerp parameters: 0 = segment start, 1 = segment end
      const line1Lerp = line2Dir.cross(startDiff) / directionCross;
      const line2Lerp = line1Dir.cross(startDiff) / directionCross;

      // If both lerp values are between 0 and 1, the intersection is within the line segments
      // When extend is true, line1 (boundary) must contain the intersection (line1Lerp in [0,1])
      // but line2 (selected) can extend beyond its endpoints (line2Lerp unconstrained)
      const isWithinSegments = (0 <= line1Lerp && line1Lerp <= 1) && (0 <= line2Lerp && line2Lerp <= 1);
      const isExtended = (0 <= line1Lerp && line1Lerp <= 1) && extend;

      if (isWithinSegments || isExtended) {
        const isPerpendicular = Utils.round(line1Dir.dot(line2Dir)) === 0;
        result = new Intersection(isPerpendicular ? Intersection.Status.PERPENDICULAR : Intersection.Status.CROSSING);
        result.appendPoint(aStart.lerp(aEnd, line1Lerp));
      } else {
        result = new Intersection(Intersection.Status.NONE);
      }
    } else {
      // Lines are parallel or coincident
      if (line2Dir.cross(startDiff) === 0 || line1Dir.cross(startDiff) === 0) {
        // Lines are collinear — check whether the segments actually overlap
        // Project all four endpoints onto the shared direction axis
        const len2 = line1Dir.x * line1Dir.x + line1Dir.y * line1Dir.y;
        const t0 = 0; // aStart projects to 0
        const t1 = 1; // aEnd projects to 1 (parametric)
        const t2 = (bStart.subtract(aStart).x * line1Dir.x + bStart.subtract(aStart).y * line1Dir.y) / len2;
        const t3 = (bEnd.subtract(aStart).x * line1Dir.x + bEnd.subtract(aStart).y * line1Dir.y) / len2;

        const bMin = Math.min(t2, t3);
        const bMax = Math.max(t2, t3);

        if (bMax < t0 || bMin > t1) {
          // Segments are collinear but disjoint
          result = new Intersection(Intersection.Status.NONE);
        } else {
          result = new Intersection(Intersection.Status.OVERLAPPING);
        }
      } else {
        // Lines are parallel but not coincident
        result = new Intersection(Intersection.Status.PARALLEL);
      }
    }

    return result;
  };
}

