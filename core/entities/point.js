import { Utils } from '../lib/utils.js';

/** Point Entity Class */
export class Point {
  /**
   * Create a Point
   * @param  {number} x
   * @param  {number} y
   * @param  {number} bulge
   * @param  {number} sequence - dxf group code sequence reference
   */
  constructor(x, y, bulge = 0, sequence) {
    this.type = this.constructor.name;
    this.x = 0;
    this.y = 0;
    // sequence holds a reference to the dxf group code sequence the point represents
    // 10, 20, 30;
    // 11, 21, 31;
    this.sequence = sequence;

    // bulge value used for defining arcs in polylines
    // arc is ccw if positive
    this.bulge = bulge;

    if (x !== undefined) {
      this.x = x;
      this.y = y;
    }
  }

  /**
   * Add this to that
   * @param  {Point} that
   * @return {Point}
   */
  add(that) {
    return new Point(this.x + that.x, this.y + that.y, this.bulge, this.sequence);
  }

  /**
   * subtract that from this
   * @param  {Point} that
   * @return {Point}
   */
  subtract(that) {
    return new Point(this.x - that.x, this.y - that.y, this.bulge, this.sequence);
  };

  /**
   * Angle between this and that in radians
   * @param  {Point} that
   * @return {number}
   */
  angle(that) {
    const angle = Math.atan2((this.y - that.y), (this.x - that.x)) + Math.PI;
    return angle % (Math.PI * 2);
  }


  /**
   * Returns a deep clone of a point
   * @return {Point}
   */
  clone() {
    return new Point(this.x, this.y, this.bulge, this.sequence);
  };

  /**
   * Returns distance between this and that
   * @param  {Point} that
   * @return {number}
   */
  distance(that) {
    return Math.sqrt((this.x - that.x) * (this.x - that.x) + (this.y - that.y) * (this.y - that.y));
  }


  /**
   * Return dot product of this and that
   * @param  {Point} that
   * @return {number}
   */
  dot(that) {
    return this.x * that.x + this.y * that.y;
  };

  /**
   * Return new point rotated about centre by angle in radians
   * @param  {Point} centre
   * @param  {number} angle - in radians
   * @return {Point}
   */
  rotate(centre, angle) {
    const x = centre.x + (this.x - centre.x) * Math.cos(angle) - (this.y - centre.y) * Math.sin(angle);
    const y = centre.y + (this.x - centre.x) * Math.sin(angle) + (this.y - centre.y) * Math.cos(angle);
    return new Point(x, y, this.bulge, this.sequence);
  }

  /**
   * Return new point with minimum values for x and y from this and that
   * @param  {Point} that
   * @return {Point}
   */
  min(that) {
    return new Point(
        Math.min(this.x, that.x),
        Math.min(this.y, that.y),
    );
  };

  /**
   * Return new point with maximum values for x and y from this and that
   * @param  {Point} that
   * @return {Point}
   */
  max(that) {
    return new Point(
        Math.max(this.x, that.x),
        Math.max(this.y, that.y),
    );
  };

  /**
   * Return midpoint between this and that
   * @param  {Point} that
   * @return {Point}
   */
  midPoint(that) {
    // return point midway between this and that
    const midX = (this.x + that.x) / 2;
    const midY = (this.y + that.y) / 2;

    const midPoint = new Point(midX, midY);

    return midPoint;
  }

  /**
   * Returns linear interpolation between this and that
   * e.g. t = 0.5 will return midpoint between this and that
   * @param  {Point} that
   * @param  {number} t - ratio between 0 and 1
   * @return {Point}
   */
  lerp(that, t) {
    return new Point(
        this.x + (that.x - this.x) * t,
        this.y + (that.y - this.y) * t,
    );
  };

  /**
   * Return new point projected from this along angle by distance
   * @param  {number} angle - in radians
   * @param  {number} distance
   * @return {Point}
   */
  project(angle, distance) {
    if (angle === 0) {
      const p = new Point(this.x, this.y).add(new Point(distance, 0));
      return p;
    }

    const x = this.x + Math.cos(angle) * distance;
    const y = this.y + Math.sin(angle) * distance;
    const p = new Point(x, y);
    return p;
  };

  /**
   * Find the closest point to this on the ray formed by Pt1 and Pt2
   * @param  {Point} Pt1
   * @param  {Point} Pt2
   * @return {Point} the closest point on the ray
   */
  perpendicular(Pt1, Pt2) {
    const APx = this.x - Pt1.x;
    const APy = this.y - Pt1.y;
    const ABx = Pt2.x - Pt1.x;
    const ABy = Pt2.y - Pt1.y;

    const magAB2 = ABx * ABx + ABy * ABy;
    const ABdotAP = ABx * APx + ABy * APy;
    const t = ABdotAP / magAB2;

    const x = Pt1.x + ABx * t;
    const y = Pt1.y + ABy * t;
    return new Point(x, y);
  }

  /**
   * Check if this is the same as that
   * @param  {Point} that
   * @return {boolean}
   */
  isSame(that) {
    if (Utils.round(this.x) == Utils.round(that.x) && Utils.round(this.y) == Utils.round(that.y)) return true;
    return false;
  }

  /**
   * Find the closest point on a line between start and end points
   * @param {Point} startPoint
   * @param {Point} endPoint
   * @return {Point} the closest point on the line
   */
  closestPointOnLine(startPoint, endPoint) {
    const pnt = this.perpendicular(startPoint, endPoint);
    if (pnt.isOnLine(startPoint, endPoint)) {
      return pnt;
    }

    // point is not perpendicular to the line
    // closest point must be at the start or end
    if (this.distance(startPoint) < this.distance(endPoint)) {
      return startPoint;
    } else {
      return endPoint;
    }
  }

  /**
   * Find the closest point on a arc between start and end points
   * @param {Point} startPoint
   * @param {Point} endPoint
   * @param {Point} centerPoint
   * @param {number} direction - CCW if > 0
   * @return {Point} the closest point on the arc or null
   */
  closestPointOnArc(startPoint, endPoint, centerPoint, direction = 0) {
    const length = this.distance(centerPoint);
    const radius = centerPoint.distance(startPoint);

    const Cx = centerPoint.x + radius * (this.x - centerPoint.x) / length;
    const Cy = centerPoint.y + radius * (this.y - centerPoint.y) / length;
    const closest = new Point(Cx, Cy);

    // circle
    if (startPoint.isSame(endPoint)) {
      return closest;
    }

    if (closest.isOnArc(startPoint, endPoint, centerPoint, direction)) {
      return closest;
    }

    // Point not on arc
    return null;
  }

  /**
   * Determine if point is on arc segment
   * @param {Point} startPoint
   * @param {Point} endPoint
   * @param {Point} centerPoint
   * @param {number} direction - CCW if > 0
   * @return {Point} true or false
   */
  isOnArc(startPoint, endPoint, centerPoint, direction = 0) {
    // direction: ccw arc > 0, clockwise arc <= 0
    const snapAngle = centerPoint.angle(this);
    const startAngle = centerPoint.angle(startPoint);
    const endAngle = centerPoint.angle(endPoint);

    if (direction > 0) {
      // Counter Clockwise Arc
      if (startAngle < endAngle) {
        if (snapAngle >= startAngle && snapAngle <= endAngle) {
          return true;
        }
      }

      if (startAngle > endAngle) {
        if (snapAngle >= startAngle || snapAngle <= endAngle) {
          return true;
        }
      }
    } else if (direction <= 0) {
      // Clockwise Arc
      if (startAngle < endAngle) {
        if (snapAngle <= startAngle || snapAngle >= endAngle) {
          return true;
        }
      }

      if (startAngle > endAngle) {
        if (snapAngle <= startAngle && snapAngle >= endAngle) {
          return true;
        }
      }
    }

    return false;
  }


  /**
   * Determine if point is on line segment
   * @param {Point} startPoint
   * @param {Point} endPoint
   * @return {Point} true or false
   */
  isOnLine(startPoint, endPoint) {
    // check start -> point + point -> end equals start -> end
    if (Utils.round(startPoint.distance(this) + this.distance(endPoint)) === Utils.round(startPoint.distance(endPoint))) {
      return true;
    }
    return false;
  }

  /**
   * Get the arc angle in radians from the bulge value
   * @return {Point} arc angle in radians
   */
  bulgeAngle() {
    return Math.atan(this.bulge) * 4;
  }

  /**
   * Return the radius of the arc from the next point in the polyline
   * @param {Point} nextPoint
   * @return {number}
   */
  bulgeRadius(nextPoint) {
    if (this.bulge == 0) {
      return 0;
    }

    const rad = this.distance(nextPoint) * (1 + Math.pow(this.bulge, 2)) / (4 * Math.abs(this.bulge));
    return rad;
  }

  /**
   * Returns apothem; the distance from arc center to cord midpoint
   * @param {Point} nextPoint
   * @return {number} apothem
   */
  apothem(nextPoint) {
    if (this.bulge == 0) {
      return 0;
    }

    const apothem = Math.sqrt(Math.pow(this.bulgeRadius(nextPoint), 2) - Math.pow(this.distance(nextPoint) / 2, 2));
    return apothem;
  }

  /**
   * Return the centre point of the arc
   * @param {Point} nextPoint
   * @return {Point} Point
   */
  bulgeCentrePoint(nextPoint) {
    const midp = this.midPoint(nextPoint);

    if (this.bulge == 0) {
      return midp;
    }

    let a = this.apothem(nextPoint);

    // check if the center point is inverted. i.e. at 180 it goes inside the arc
    if (Math.abs(this.bulgeAngle()) > Math.PI) {
      a = -a;
    }

    // get the direction from the midpoint to the center point
    const direction = this.angle(nextPoint) + (Math.PI / 2) * Math.sign(this.bulge);
    // centre point is the apothem distance from the mid point in the given direction
    const centre = midp.project(direction, a);

    return centre;
  }
}
