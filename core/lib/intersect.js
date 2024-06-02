import {Point} from '../entities/point.js';

/** Intersection Class */
export class Intersection {
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
    points.forEach((point)=>{
      this.appendPoint(point);
    });
  };

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
    const a = (a2.x - a1.x) * (a2.x - a1.x) +
            (a2.y - a1.y) * (a2.y - a1.y);
    const b = 2 * ((a2.x - a1.x) * (a1.x - c.x) +
            (a2.y - a1.y) * (a1.y - c.y));
    const cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y -
            2 * (c.x * a1.x + c.y * a1.y) - r * r;
    const deter = b * b - 4 * a * cc;

    if (deter < 0) {
      result = new Intersection('Outside');
    } else if (deter == 0) {
      result = new Intersection('Tangent');
      // NOTE: should calculate this point
    } else {
      const e = Math.sqrt(deter);
      const u1 = (-b + e) / (2 * a);
      const u2 = (-b - e) / (2 * a);

      if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
        if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
          result = new Intersection('Outside');
          if (extend) {
            result.appendPoint(a1.lerp(a2, u1));
            result.appendPoint(a1.lerp(a2, u2));
          }
        } else {
          result = new Intersection('Inside');
          if (extend) {
            result.appendPoint(a1.lerp(a2, u1));
            result.appendPoint(a1.lerp(a2, u2));
          }
        }
      } else {
        result = new Intersection('Intersection');

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
   * Find intersections between circle and line
   * @param {Line} line
   * @param {Circle} circle
   * @param {boolean} extend - extend the line as a ray
   * @return {Intersect}
   */
  static intersectLineCircle(line, circle, extend) {
    return this.intersectCircleLine(circle, line, extend);
  }

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

    if (cDist > rMax) {
      result = new Intersection('Outside');
    } else if (cDist < rMin) {
      result = new Intersection('Inside');
    } else {
      result = new Intersection('Intersection');

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
   * Find intersections between arc segment and rectangle
   * @param {Arc} arc
   * @param {Rectangle} rectangle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectArcRectangle(arc, rectangle, extend) {
    const r1 = rectangle.start;
    const r2 = rectangle.end;

    const min = r1.min(r2);
    const max = r1.max(r2);
    const topRight = new Point(max.x, min.y);
    const bottomLeft = new Point(min.x, max.y);


    let rectPoints = {start: min, end: topRight};
    const inter1 = this.intersectArcLine(arc, rectPoints, extend);

    rectPoints = {start: topRight, end: max};
    const inter2 = this.intersectArcLine(arc, rectPoints, extend);

    rectPoints = {start: max, end: bottomLeft};
    const inter3 = this.intersectArcLine(arc, rectPoints, extend);

    rectPoints = {start: bottomLeft, end: min};
    const inter4 = this.intersectArcLine(arc, rectPoints, extend);

    const result = new Intersection('No Intersection');

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if (result.points.length > 0) {
      result.status = 'Intersection';
    } else {
      result.status = inter1.status;
    }

    return result;
  }

  /**
   * Find intersections between arc segment and line
   * @param {Arc} arc
   * @param {Line} line
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectArcLine(arc, line, extend) {
    const inter1 = this.intersectCircleLine(arc, line, extend);
    const result = new Intersection('No Intersection');

    if (!extend) {
      for (let i = 0; i < inter1.points.length; i++) {
        if (inter1.points[i].isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction)) {
          result.appendPoint(inter1.points[i]);
        }
      }

      if (result.points.length > 0) {
        result.status = 'Intersection';
      }
    }

    return result;
  }

  /**
   * Find intersections between line and arc segment
   * @param {Line} line
   * @param {Arc} arc
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectLineArc(line, arc, extend) {
    return this.intersectArcLine(arc, line, extend);
  }

  /**
   * Find intersections between circle and arc segment
   * @param {Circle} circle
   * @param {Arc} arc
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectCircleArc(circle, arc, extend) {
    const inter1 = this.intersectCircleCircle(circle, arc, extend);
    const result = new Intersection('No Intersection');

    if (!extend) {
      for (let i = 0; i < inter1.points.length; i++) {
        if (inter1.points[i].isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction)) {
          result.appendPoint(inter1.points[i]);
        }
      }

      if (result.points.length > 0) {
        result.status = 'Intersection';
      }
    }

    return result;
  }

  /**
   * Find intersections between
   * @param {Arc} arc
   * @param {Circle} circle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectArcCircle(arc, circle, extend) {
    return this.intersectCircleArc(circle, arc, extend);
  }

  /**
   * Find intersections between circle and rectangle
   * @param {Circle} circle
   * @param {Rectangle} rectangle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectCircleRectangle(circle, rectangle, extend) {
    const r1 = rectangle.start;
    const r2 = rectangle.end;
    extend = extend || false;

    const min = r1.min(r2);
    const max = r1.max(r2);
    const topRight = new Point(max.x, min.y);
    const bottomLeft = new Point(min.x, max.y);

    let rectPoints = {start: min, end: topRight};
    const inter1 = this.intersectCircleLine(circle, rectPoints);

    rectPoints = {start: topRight, end: max};
    const inter2 = this.intersectCircleLine(circle, rectPoints);

    rectPoints = {start: max, end: bottomLeft};
    const inter3 = this.intersectCircleLine(circle, rectPoints);

    rectPoints = {start: bottomLeft, end: min};
    const inter4 = this.intersectCircleLine(circle, rectPoints);

    const result = new Intersection('No Intersection');

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if (result.points.length > 0) {
      result.status = 'Intersection';
    } else {
      result.status = inter1.status;
    }

    return result;
  };

  /**
   * Find intersections between two lines
   * @param {Line} line1
   * @param {Line} line2
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectLineLine(line1, line2, extend) {
    const a1 = line1.start;
    const a2 = line1.end;
    const b1 = line2.start;
    const b2 = line2.end;
    extend = extend || false;

    let result;

    const uaT = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    const ubT = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    const uB = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if (uB != 0) {
      const ua = uaT / uB;
      const ub = ubT / uB;

      if ((0 <= ua && ua <= 1) && (0 <= ub && ub <= 1) || (0 <= ua && ua <= 1) && extend) {
        result = new Intersection('Intersection');
        result.appendPoint(new Point(
            a1.x + ua * (a2.x - a1.x),
            a1.y + ua * (a2.y - a1.y),
        ));
      } else {
        result = new Intersection('No Intersection');
      }
    } else {
      if (uaT == 0 || ubT == 0) {
        result = new Intersection('Coincident');
      } else {
        result = new Intersection('Parallel');
      }
    }

    return result;
  };

  /**
   * Find intersections between lwpolyline and line
   * @param {Polyline} polyline
   * @param {Line} line
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectLwpolylineLine(polyline, line, extend) {
    return this.intersectPolylineLine(polyline, line, extend);
  }

  /**
   * Find intersections between polyline and line
   * @param {Polyline} polyline
   * @param {Line} line
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectPolylineLine(polyline, line, extend) {
    const result = new Intersection('No Intersection');
    const length = polyline.points.length;

    for (let i = 0; i < length - 1; i++) {
      const b1 = polyline.points[i];
      const b2 = polyline.points[(i + 1) % length];


      if (b1.bulge === 0) {
        const line2 = {start: b1, end: b2};
        const inter = this.intersectLineLine(line2, line, extend);
        result.appendPoints(inter.points);
      } else {
        const arc = {};
        arc.centre = b1.bulgeCentrePoint(b2);
        arc.startPoint = b1;
        arc.endPoint = b2;
        arc.radius = arc.centre.distance(b1);
        arc.direction = b1.bulge;

        const interArc = this.intersectArcLine(arc, line, extend);
        result.appendPoints(interArc.points);
      }
    }

    if (result.points.length > 0) result.status = 'Intersection';
    return result;
  };

  /**
   * Find intersections between hatch and rectangle
   * @param {Array} polylines
   * @param {Rectangle} rectangle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectHatchRectangle(polylines, rectangle, extend) {
    for (let i = 0; i < polylines.length; i++) {
      const intersect = this.intersectPolylineRectangle(polylines[i], rectangle, extend);

      if (intersect.points.length > 0) {
        return intersect;
      }
    }

    return new Intersection('No Intersection');
  }

  /**
   * Find intersections between lwpolyline and rectangle
   * @param {Polyline} polyline
   * @param {Rectangle} rectangle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectLwpolylineRectangle(polyline, rectangle, extend) {
    return this.intersectPolylineRectangle(polyline, rectangle, extend);
  }

  /**
   * Find intersections between polyline and rectangle
   * @param {Polyline} polyline
   * @param {Rectangle} rectangle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectPolylineRectangle(polyline, rectangle, extend) {
    const r1 = rectangle.start;
    const r2 = rectangle.end;
    extend = extend || false;

    const min = r1.min(r2);
    const max = r1.max(r2);
    const topRight = new Point(max.x, min.y);
    const bottomLeft = new Point(min.x, max.y);

    let rectPoints = {start: min, end: topRight};
    const inter1 = this.intersectPolylineLine(polyline, rectPoints, extend);

    rectPoints = {start: topRight, end: max};
    const inter2 = this.intersectPolylineLine(polyline, rectPoints, extend);

    rectPoints = {start: max, end: bottomLeft};
    const inter3 = this.intersectPolylineLine(polyline, rectPoints, extend);

    rectPoints = {start: bottomLeft, end: min};
    const inter4 = this.intersectPolylineLine(polyline, rectPoints, extend);

    const result = new Intersection('No Intersection');

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if (result.points.length > 0) {
      result.status = 'Intersection';
    }

    return result;
  };


  /**
   * Find intersections between line and rectangle
   * @param {Line} line
   * @param {Rectangle} rectangle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectLineRectangle(line, rectangle, extend) {
    const r1 = rectangle.start;
    const r2 = rectangle.end;
    extend = extend || false;

    const min = r1.min(r2);
    const max = r1.max(r2);
    const topRight = new Point(max.x, min.y);
    const bottomLeft = new Point(min.x, max.y);

    let rectPoints = {start: min, end: topRight};
    const inter1 = this.intersectLineLine(rectPoints, line, extend);

    rectPoints = {start: topRight, end: max};
    const inter2 = this.intersectLineLine(rectPoints, line, extend);

    rectPoints = {start: max, end: bottomLeft};
    const inter3 = this.intersectLineLine(rectPoints, line, extend);

    rectPoints = {start: bottomLeft, end: min};
    const inter4 = this.intersectLineLine(rectPoints, line, extend);

    const result = new Intersection('No Intersection');

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if (result.points.length > 0) {
      result.status = 'Intersection';
    }

    return result;
  };

  /**
   * Find intersections between rectangle and line
   * @param {Rectangle} rectangle
   * @param {Line} line
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectRectangleLine(rectangle, line, extend) {
    return this.intersectLineRectangle(line, rectangle, extend);
  }

  /**
   * Find intersections between text and rectangles
   * Text is represented by its bounding box
   * @param {Text} text
   * @param {Rectangle} rectangle
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectTextRectangle(text, rectangle, extend) {
    return this.intersectRectangleRectangle(text, rectangle, extend);
  }

  /**
   * Find intersections between two rectangles
   * @param {Rectangle} rectangle1
   * @param {Rectangle} rectangle2
   * @param {boolean} extend
   * @return {Intersect}
   */
  static intersectRectangleRectangle(rectangle1, rectangle2, extend) {
    const a1 = rectangle1.start;
    const a2 = rectangle1.end;
    // const b1 = rectangle2.start;
    // const b2 = rectangle2.end;
    extend = extend || false;


    const min = a1.min(a2);
    const max = a1.max(a2);
    const topRight = new Point(max.x, min.y);
    const bottomLeft = new Point(min.x, max.y);

    let rectPoints = {start: min, end: topRight};
    const inter1 = this.intersectLineRectangle(rectPoints, rectangle2);

    rectPoints = {start: topRight, end: max};
    const inter2 = this.intersectLineRectangle(rectPoints, rectangle2);

    rectPoints = {start: max, end: bottomLeft};
    const inter3 = this.intersectLineRectangle(rectPoints, rectangle2);

    rectPoints = {start: bottomLeft, end: min};
    const inter4 = this.intersectLineRectangle(rectPoints, rectangle2);

    const result = new Intersection('No Intersection');

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if (result.points.length > 0) {
      result.status = 'Intersection';
    }

    return result;
  };
}

