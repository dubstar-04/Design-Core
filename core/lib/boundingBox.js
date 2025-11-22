import { Point } from '../entities/point.js';

/** BoundingBox Class */
export class BoundingBox {
  /**
   * Create BoundingBox
   * @param {Point} firstCorner
   * @param {Point} secondCorner
   */
  constructor(firstCorner = new Point(), secondCorner = new Point()) {
    this.pt1 = firstCorner;
    this.pt2 = secondCorner;
  }

  /**
   * return left boundary
   */
  get xMin() {
    return Math.min(this.pt1.x, this.pt2.x);
  }

  /**
   * return right boundary
   */
  get xMax() {
    return Math.max(this.pt1.x, this.pt2.x);
  }

  /**
   * return bottom boundary
   */
  get yMin() {
    return Math.min(this.pt1.y, this.pt2.y);
  }

  /**
   * return top boundary
   */
  get yMax() {
    return Math.max(this.pt1.y, this.pt2.y);
  }

  /**
   * return bounding box width
   */
  get xLength() {
    return this.xMax - this.xMin;
  }

  /**
   * return bounding box height
   */
  get yLength() {
    return this.yMax - this.yMin;
  }

  /**
   * return bounding box center point
   */
  get centerPoint() {
    return new Point(this.xMin + this.xLength / 2, this.yMin + this.yLength / 2);
  }

  /**
   * Determine if point is inside bounding box
   * @param {Object} point
   * @return {boolean} true if point is inside false if not
   */
  isInside(point) {
    if (point.x > this.xMin && point.x < this.xMax) {
      if (point.y > this.yMin && point.y < this.yMax) {
        return true;
      }
    }

    return false;
  }

  /**
   * Return the bounding box for points
   * @param {Array} points
   * @return {BoundingBox}
   */
  static fromPoints(points) {
    if (!points.length) {
      throw Error('BoundingBox from points - point array empty');
    }
    const xMin = points.reduce((min, p) => p.x < min ? p.x : min, points[0].x);
    const xMax = points.reduce((max, p) => p.x > max ? p.x : max, points[0].x);
    const yMin = points.reduce((min, p) => p.y < min ? p.y : min, points[0].y);
    const yMax = points.reduce((max, p) => p.y > max ? p.y : max, points[0].y);

    return new BoundingBox(new Point(xMin, yMin), new Point(xMax, yMax));
  }

  /**
   * Genetate bounding box from entities
   * @param {Array} entities
   * @return {BoundingBox}
   */
  static fromEntities(entities) {
    if (!entities.length) {
      return;
    }

    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (const ent of entities) {
      const bbox = ent.boundingBox();

      if (!bbox) {
        continue;
      }

      xmin = Math.min(xmin, bbox.xMin);
      xmax = Math.max(xmax, bbox.xMax);
      ymin = Math.min(ymin, bbox.yMin);
      ymax = Math.max(ymax, bbox.yMax);
    }

    return new BoundingBox(new Point(xmin, ymin), new Point(xmax, ymax));
  }

  /**
   * Calculate the boundingbox for a line
   * @param {Point} startPoint
   * @param {Point} endPoint
   * @return {BoundingBox}
   */
  static lineBoundingBox(startPoint, endPoint) {
    return new BoundingBox(startPoint, endPoint);
  }

  /**
   * Calculate the boundingbox for an arc
   * @param {Point} centerPoint
   * @param {Point} startPoint
   * @param {Point} endPoint
   * @param {number} direction - ccw > 0, cw < 0
   * @return {BoundingBox}
   */
  static arcBoundingBox(centerPoint, startPoint, endPoint, direction = 1) {
    const startAngle = centerPoint.angle(startPoint);
    const endAngle = centerPoint.angle(endPoint);
    const radius = centerPoint.distance(startPoint);

    const cross0 = this.crossesAxis(startAngle, endAngle, 0, direction);
    const cross90 = this.crossesAxis(startAngle, endAngle, Math.PI * 0.5, direction);
    const cross180 = this.crossesAxis(startAngle, endAngle, Math.PI, direction);
    const cross270 = this.crossesAxis(startAngle, endAngle, Math.PI * 1.5, direction);

    // if the arc crosses the axis the min or max is where the arc intersects the axis
    // otherwise max/min is the arc endpoint
    const xmin = cross180 ? centerPoint.x - radius : Math.min(startPoint.x, endPoint.x);
    const xmax = cross0 ? centerPoint.x + radius : Math.max(startPoint.x, endPoint.x);
    const ymin = cross270 ? centerPoint.y - radius : Math.min(startPoint.y, endPoint.y);
    const ymax = cross90 ? centerPoint.y + radius : Math.max(startPoint.y, endPoint.y);

    const topLeft = new Point(xmin, ymax);
    const bottomRight = new Point(xmax, ymin);

    return new BoundingBox(topLeft, bottomRight);
  }

  /**
   * Determine if arc crosses through axis defined by axisAngle
   * How it works:
   * Subtract the axisAngle from the start and end angles, effectively referencing against zero.
   * The modulo then returns the new angle.
   * Example:
   * Clockwise arc
   * startAngle = 45 degrees
   * endAngle = 95 degrees
   * The arc therefore crosses the y axis @ 90 degrees, making the largest Y value the point where the arc crosses the axis
   * start: 45 - 90 + 360 % 360 = 315
   * end: 95 -90 + 360 = 5
   * if start > end; arc crosses axis
   * @param {number} startAngle - angle in radians
   * @param {number} endAngle - angle in radians
   * @param {number} axisAngle - angle in radians. i.e 90 deg = Math.PI / 2.
   * @param {number} direction - ccw > 0, cw < 0
   * @return {boolean}
   */
  static crossesAxis(startAngle, endAngle, axisAngle, direction = 1) {
    const circle = Math.PI * 2;
    const referenceStartAngle = (startAngle - axisAngle + circle) % circle;
    const referenceEndAngle = (endAngle - axisAngle + circle) % circle;

    // if refStartAngle > refEndAngle then the arc crosses the axis
    let crosses = referenceStartAngle >= referenceEndAngle;

    if (direction < 0) {
      // if refStartAngle < refEndAngle then the arc crosses the axis
      crosses = referenceStartAngle <= referenceEndAngle;
    }
    return crosses;
  }
}
