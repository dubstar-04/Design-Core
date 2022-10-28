export class Point {
  /**
   * @param  {Number} x
   * @param  {number} y
   */
  constructor(x, y) {
    this.type = 'Point';
    this.x = 0;
    this.y = 0;
    if (x !== undefined) {
      this.x = x;
      this.y = y;
    }
  }

  /**
   * Add this to that
   * @param  {Point} that
   */
  add(that) {
    return new Point(this.x + that.x, this.y + that.y);
  }

  /**
   * subtract that from this
   * @param  {Point} that
   */
  subtract(that) {
    return new Point(this.x - that.x, this.y - that.y);
  };

  /**
   * Angle between this and that in radians
   * @param  {Point} that
   */
  angle(that) {
    return Math.atan2((this.y - that.y), (this.x - that.x)) + Math.PI;
  }


  /**
   * Returns a deep clone of a point
   */
  clone() {
    return new Point(this.x, this.y);
  };

  /**
   * Returns distance between this and that
   * @param  {Point} that
   */
  distance(that) {
    return Math.sqrt((this.x - that.x) * (this.x - that.x) + (this.y - that.y) * (this.y - that.y));
  }


  /**
   * Return dot product of this and that
   * @param  {Point} that
   */
  dot(that) {
    return this.x * that.x + this.y * that.y;
  };

  /**
   * Return new point rotated about centre by angle in radians
   * @param  {Point} centre
   * @param  {Number} angle - in radians
   */
  rotate(centre, angle) {
    const x = centre.x + (this.x - centre.x) * Math.cos(angle) - (this.y - centre.y) * Math.sin(angle);
    const y = centre.y + (this.x - centre.x) * Math.sin(angle) + (this.y - centre.y) * Math.cos(angle);
    return new Point(x, y);
  }

  /**
   * Return new point with minimum values for x and y from this and that
   * @param  {Point} that
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
   * @param  {Number} t - ratio between 0 and 1
   */
  lerp(that, t) {
    return new Point(
        this.x + (that.x - this.x) * t,
        this.y + (that.y - this.y) * t,
    );
  };

  /**
   * Return new point projected from this along angle by distance
   * @param  {Number} angle - in radians
   * @param  {Number} distance
   */
  project(angle, distance) {
    const x = this.x + Math.cos(angle) * distance;
    const y = this.y + Math.sin(angle) * distance;
    const p = new Point(x, y);
    return p;
  };

  /**
   * Find the closest point to this on the straight line between Pt1 and Pt2
   * @param  {Point} Pt1
   * @param  {Point} Pt2
   */
  perpendicular(Pt1, Pt2) {
    const APx = this.x - Pt1.x;
    const APy = this.y - Pt1.y;
    const ABx = Pt2.x - Pt1.x;
    const ABy = Pt2.y - Pt1.y;

    const magAB2 = ABx * ABx + ABy * ABy;
    const ABdotAP = ABx * APx + ABy * APy;
    const t = ABdotAP / magAB2;

    // check if the point is < start or > end
    if (t > 0 && t < 1) {
      const x = Pt1.x + ABx * t;
      const y = Pt1.y + ABy * t;
      return new Point(x, y);
    }

    // no perpendicular point found. return null
    return null;
  }

  /**
   * Check if this is the same as that
   * @param  {Point} that
   */
  isSame(that) {
    if (this.x == that.x && this.y == that.y) return true;
    return false;
  }
}
