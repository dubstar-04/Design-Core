import { Point } from '../entities/point.js';
import { Constants } from './constants.js';
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
            false, extend,
        );
        result.appendPoints(inter.points);
        // COINCIDENT (identical concentric circles) produces no discrete points,
        // so it must be promoted to INTERSECTION explicitly.
        if (inter.status === Intersection.Status.COINCIDENT) {
          result.status = Intersection.Status.INTERSECTION;
        }
      }
    }

    if (result.points.length > 0) result.status = Intersection.Status.INTERSECTION;
    return result;
  }

  /**
   * Find intersections between two polyline segments.
   * Returns the full granular status (CROSSING, PERPENDICULAR, TOUCHING, ENDPOINT,
   * OVERLAPPING, TANGENT, etc.) needed by geometric operations such as trim and extend.
   * @param {Point} b1 - segment one start point
   * @param {Point} b2 - segment one end point
   * @param {Point} b3 - segment two start point
   * @param {Point} b4 - segment two end point
   * @param {boolean} extendSegOne - extend segment one to infinite form
   * @param {boolean} extendSegTwo - extend segment two to infinite form
   * @return {Intersection}
   */
  static intersectSegmentSegment(b1, b2, b3, b4, extendSegOne, extendSegTwo) {
    const seg1IsArc = b1.bulge !== 0 && b1.bulge !== undefined;
    const seg2IsArc = b3.bulge !== 0 && b3.bulge !== undefined;

    // line vs line
    if (!seg1IsArc && !seg2IsArc) {
      return this.#intersectLineLine({ start: b1, end: b2 }, { start: b3, end: b4 }, extendSegOne, extendSegTwo);
    }

    const arc1 = seg1IsArc ? this.#buildArc(b1, b2) : null;
    const arc2 = seg2IsArc ? this.#buildArc(b3, b4) : null;

    let candidatePoints;
    let innerStatus;

    if (seg1IsArc && seg2IsArc) {
      // arc vs arc
      const inter = this.intersectCircleCircle(arc1, arc2);
      candidatePoints = inter.points;
      innerStatus = inter.status;
    } else if (seg1IsArc) {
      // arc(seg1) vs line(seg2)
      const inter = this.intersectCircleLine(arc1, { start: b3, end: b4 }, extendSegTwo);
      candidatePoints = inter.points;
      innerStatus = inter.status;
    } else {
      // line(seg1) vs arc(seg2)
      const inter = this.intersectCircleLine(arc2, { start: b1, end: b2 }, extendSegOne);
      candidatePoints = inter.points;
      innerStatus = inter.status;
    }

    const result = new Intersection(innerStatus || Intersection.Status.NONE);

    for (let i = 0; i < candidatePoints.length; i++) {
      const pt = candidatePoints[i];
      let valid = true;

      // seg1 arc filter - skipped when extending seg1
      if (seg1IsArc && !extendSegOne && !pt.isOnArc(arc1.startPoint, arc1.endPoint, arc1.centre, arc1.direction)) {
        valid = false;
      }

      // seg2 arc filter - skipped when extending seg2
      if (valid && seg2IsArc && !extendSegTwo) {
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
  static intersectCircleLine(circle, line, extend) {
    const c = circle.centre;
    const r = circle.radius;
    const a1 = line.start;
    const a2 = line.end;
    extend = extend || false;


    let result;
    const lineDir = a2.subtract(a1); // direction vector of the line segment
    const centreToStart = a1.subtract(c); // vector from circle centre to line start
    const quadA = lineDir.dot(lineDir); // squared length of the line segment
    const quadB = 2 * lineDir.dot(centreToStart); // linear coefficient (projection term)
    const quadC = centreToStart.dot(centreToStart) - r * r; // constant coefficient (signed distance²)
    const discriminant = quadB * quadB - 4 * quadA * quadC;

    if (discriminant < 0) {
      result = new Intersection(Intersection.Status.OUTSIDE);
    } else if (discriminant === 0) {
      result = new Intersection(Intersection.Status.TANGENT);
      const u = -quadB / (2 * quadA);
      if (0 <= u && u <= 1 || extend) {
        result.appendPoint(a1.lerp(a2, u));
      }
    } else {
      const sqrtDiscriminant = Math.sqrt(discriminant); // square root of discriminant — half-spread between the two roots
      const lineParam1 = (-quadB + sqrtDiscriminant) / (2 * quadA); // parametric t for first intersection (0 = line start, 1 = line end)
      const lineParam2 = (-quadB - sqrtDiscriminant) / (2 * quadA); // parametric t for second intersection (0 = line start, 1 = line end)

      if ((lineParam1 < 0 || lineParam1 > 1) && (lineParam2 < 0 || lineParam2 > 1)) {
        if ((lineParam1 < 0 && lineParam2 < 0) || (lineParam1 > 1 && lineParam2 > 1)) {
          result = new Intersection(Intersection.Status.OUTSIDE);
          if (extend) {
            result.appendPoint(a1.lerp(a2, lineParam1));
            result.appendPoint(a1.lerp(a2, lineParam2));
          }
        } else {
          result = new Intersection(Intersection.Status.INSIDE);
          if (extend) {
            result.appendPoint(a1.lerp(a2, lineParam1));
            result.appendPoint(a1.lerp(a2, lineParam2));
          }
        }
      } else {
        result = new Intersection(Intersection.Status.INTERSECTION);

        if (0 <= lineParam1 && lineParam1 <= 1 || extend) {
          result.appendPoint(a1.lerp(a2, lineParam1));
        }

        if (0 <= lineParam2 && lineParam2 <= 1 || extend) {
          result.appendPoint(a1.lerp(a2, lineParam2));
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
  static intersectCircleCircle(circle1, circle2, extend) {
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

      // Distance from c1 to the radical axis along the line of centres
      const axialDist = (r1 * r1 - r2 * r2 + cDist * cDist) / (2 * cDist);
      // Half the length of the chord connecting the two intersection points
      const halfChordLength = Math.sqrt(r1 * r1 - axialDist * axialDist);
      // Point on the line of centres where the perpendicular bisector of the chord passes through
      const chordMidpoint = c1.lerp(c2, axialDist / cDist);
      // Normalised scale factor for the perpendicular offset
      const perpScale = halfChordLength / cDist;
      // Perpendicular offset vector from chordMidpoint to each intersection point
      const perpOffset = new Point(-(c2.y - c1.y), c2.x - c1.x).scale(perpScale);

      result.appendPoint(chordMidpoint.add(perpOffset));
      result.appendPoint(chordMidpoint.subtract(perpOffset));
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
   * @param {boolean} extendSegOne
   * @param {boolean} extendSegTwo
   * @return {Intersection}
   */
  static #intersectLineLine(line1, line2, extendSegOne, extendSegTwo) {
    const aStart = line1.start;
    const aEnd = line1.end;
    const bStart = line2.start;
    const bEnd = line2.end;
    extendSegOne = extendSegOne || false;
    extendSegTwo = extendSegTwo || false;

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

    // Normalise the cross product to |sin(angle)| so the tolerance is scale-independent
    const directionCross = line1Dir.cross(line2Dir);
    const line1Len = line1Dir.length();
    const line2Len = line2Dir.length();
    const isParallel = Math.abs(directionCross) / (line1Len * line2Len) < Constants.Tolerance.EPSILON;

    if (!isParallel) {
      // Lines are not parallel
      // lerp parameters: 0 = segment start, 1 = segment end
      const line1Lerp = line2Dir.cross(startDiff) / directionCross;
      const line2Lerp = line1Dir.cross(startDiff) / directionCross;

      // If both lerp values are between 0 and 1, the intersection is within the line segments
      const line1InRange = 0 <= line1Lerp && line1Lerp <= 1;
      const line2InRange = 0 <= line2Lerp && line2Lerp <= 1;
      const isWithinSegments = line1InRange && line2InRange;
      const isExtended = (line1InRange || extendSegOne) && (line2InRange || extendSegTwo);

      if (isWithinSegments || isExtended) {
        const isPerpendicular = Utils.round(line1Dir.dot(line2Dir)) === 0;
        result = new Intersection(isPerpendicular ? Intersection.Status.PERPENDICULAR : Intersection.Status.CROSSING);
        result.appendPoint(aStart.lerp(aEnd, line1Lerp));
      } else {
        result = new Intersection(Intersection.Status.NONE);
      }
    } else {
      // Lines are parallel or coincident
      const startDiffLen = startDiff.length();
      const isCollinear = startDiffLen < Constants.Tolerance.EPSILON ||
          Math.abs(line2Dir.cross(startDiff)) / (line2Len * startDiffLen) < Constants.Tolerance.EPSILON;
      if (isCollinear) {
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
          // Segments overlap — return the two endpoints of the shared interval
          result = new Intersection(Intersection.Status.OVERLAPPING);
          result.appendPoint(aStart.lerp(aEnd, Math.max(t0, bMin)));
          result.appendPoint(aStart.lerp(aEnd, Math.min(t1, bMax)));
        }
      } else {
        // Lines are parallel but not coincident
        result = new Intersection(Intersection.Status.PARALLEL);
      }
    }

    return result;
  };

  /**
   * Even-odd point-in-boundary test using a horizontal ray to the right.
   * A tiny y-offset (rayEps) prevents the ray from passing exactly through the
   * top or bottom of a curved boundary (e.g. a circle), which would produce a
   * wrong crossing count.
   * @param {number} px - x coordinate of the test point
   * @param {number} py - y coordinate of the test point
   * @param {Array} boundaries - array of closed point arrays (each a polyline loop)
   * @param {number} testRayEndX - x coordinate of the ray endpoint, must be rightward of all geometry
   * @return {boolean} true if the point is inside the boundaries under the even-odd rule
   */
  static isInsidePolyline(px, py, boundaries, testRayEndX) {
    // TODO: consider extending Boundbox.fromPoints to calculate bounds for an entire polyline
    // Calculate a test ray endpoint that is guaranteed to be outside the geometry bounds
    // and remove testRayEndX parameter
    const rayEps = 1e-9 * testRayEndX; // negligibly small relative to the geometry
    const testLine = [new Point(px, py + rayEps), new Point(testRayEndX, py + rayEps)];
    let count = 0;
    for (const b of boundaries) {
      count += Intersection.intersectPolylinePolyline(b, testLine).points.length;
    }
    return (count % 2) === 1;
  }
}

