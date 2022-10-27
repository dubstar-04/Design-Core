export class Point {
  constructor(x, y) {
    this.type = 'Point';
    this.x = 0;
    this.y = 0;
    if (x !== undefined) {
      this.x = x;
      this.y = y;
    }
  }

  add(that) {
    return new Point(this.x + that.x, this.y + that.y);
  }

  subtract(that) {
    return new Point(this.x - that.x, this.y - that.y);
  };

  angle(that) {
    // Angle between points in radians
    return Math.atan2((this.y - that.y), (this.x - that.x)) + Math.PI;
  }

  clone() {
    return new Point(this.x, this.y);
  };

  distance(that) {
    return Math.sqrt((this.x - that.x) * (this.x - that.x) + (this.y - that.y) * (this.y - that.y));
  }

  dot(that) {
    return this.x * that.x + this.y * that.y;
  };

  rotate(centre, angle) {
    const x = centre.x + (this.x - centre.x) * Math.cos(angle) - (this.y - centre.y) * Math.sin(angle);
    const y = centre.y + (this.x - centre.x) * Math.sin(angle) + (this.y - centre.y) * Math.cos(angle);
    return new Point(x, y);
  }

  min(that) {
    return new Point(
        Math.min(this.x, that.x),
        Math.min(this.y, that.y),
    );
  };

  max(that) {
    return new Point(
        Math.max(this.x, that.x),
        Math.max(this.y, that.y),
    );
  };

  midPoint(that) {
    // return point midway between this and that
    const midX = (this.x + that.x) / 2;
    const midY = (this.y + that.y) / 2;

    const midPoint = new Point(midX, midY);

    return midPoint;
  }

  lerp(that, t) {
    return new Point(
        this.x + (that.x - this.x) * t,
        this.y + (that.y - this.y) * t,
    );
  };

  fromPoints(p1, p2) {
    return new Point(
        p2.x - p1.x,
        p2.y - p1.y,
    );
  };

  project(angle, distance) {
    // project point from this along angle(radians) by distance
    x = this.x + Math.cos(angle) * distance;
    y = this.y + Math.sin(angle) * distance;
    p = new Point(x, y);
    return p;
  };

  perpendicular(Pt1, Pt2) {
    // find the closest point on the straight line between Pt1 and Pt2

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

  isSame(that) {
    // Check if this is the same as that
    if (this.x == that.x && this.y == that.y) return true;

    return false;
  }
}
