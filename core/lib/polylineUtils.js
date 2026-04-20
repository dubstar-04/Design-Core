import { Utils } from './utils.js';

/**
 * Shared polyline-segment geometry helpers used by the Trim and Extend tools.
 * All methods accept an explicit `points` array rather than operating on
 * `this.points`, so they are entity-independent and can be reused by any
 * tool that works in polyline-point space.
 */
export class PolylineUtils {
  /**
   * Test whether a point lies on the segment from A to B (line or arc).
   * @param {Point} point
   * @param {Point} A - segment start; carries bulge for arc segments
   * @param {Point} B - segment end
   * @return {boolean}
   */
  static isPointOnSegment(point, A, B) {
    if (A.bulge !== 0 && A.bulge !== undefined) {
      const center = A.bulgeCentrePoint(B);
      const radius = center.distance(A);
      // Point must lie on the circle before checking the angular range.
      if (Utils.round(center.distance(point)) !== Utils.round(radius)) return false;
      const direction = A.bulge > 0 ? 1 : -1;
      return point.isOnArc(A, B, center, direction);
    }
    return point.isOnLine(A, B);
  }

  /**
   * Get the closest point on a segment to a reference point.
   * @param {Array}  points       - polyline points array
   * @param {Point}  point        - reference point
   * @param {number} segmentIndex - 1-based segment index
   * @return {Point|null}
   */
  static closestPointOnSegment(points, point, segmentIndex) {
    const A = points[segmentIndex - 1];
    const B = points[segmentIndex % points.length];

    if (A.bulge !== 0 && A.bulge !== undefined) {
      const center = A.bulgeCentrePoint(B);
      const direction = A.bulge > 0 ? 1 : -1;
      const closest = point.closestPointOnArc(A, B, center, direction);
      if (closest) return closest;
      // Point not on arc — return the nearer endpoint
      return point.distance(A) < point.distance(B) ? A : B;
    }

    return point.closestPointOnLine(A, B);
  }

  /**
   * Get the normalised position of a point along a segment (used for ordering).
   * For line segments returns chord distance from A; for arc segments returns
   * the angular sweep from A, normalised to [0, 2π).
   * @param {Array}  points       - polyline points array
   * @param {Point}  point        - a point known to lie on the segment
   * @param {number} segmentIndex - 1-based segment index
   * @return {number}
   */
  static positionOnSegment(points, point, segmentIndex) {
    const A = points[segmentIndex - 1];
    const B = points[segmentIndex % points.length];

    if (A.bulge !== 0 && A.bulge !== undefined) {
      const center = A.bulgeCentrePoint(B);
      const direction = A.bulge > 0 ? 1 : -1;
      const startAngle = center.angle(A);
      const pointAngle = center.angle(point);
      return ((pointAngle - startAngle) * direction + 4 * Math.PI) % (2 * Math.PI);
    }

    return A.distance(point);
  }
}
