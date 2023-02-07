import {Point} from '../entities/point.js';

/** ***
*   Based on work js Kevin Lindsey
*   additions by Daniel Wood 2016, 2017, 2018
*****/

// TODO: Remove unused functions, rays, polygons

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
   * @param {point} point
   */
  appendPoint(point) {
    this.points.push(point);
  };

  /**
   * Append points to suggested intersecting points
   * @param {array} points
   */
  appendPoints(points) {
    this.points = this.points.concat(points);
  };

  /**
   * Find intersections between circle and ellipse
   * @param {point} cc - centre of the circle
   * @param {float} r - radius of the circle
   * @param {point} ec - centre of the ellipse
   * @param {float} rx - radius of ellipse in x direction
   * @param {float} ry- radius of ellipse in x direction
   * @returns
   */
  static intersectCircleEllipse(cc, r, ec, rx, ry) {
    return this.intersectEllipseEllipse(cc, r, r, ec, rx, ry);
  };

  /**
   * Find intersections between circle and line
   * @param {circle} circle
   * @param {line} line
   * @param {boolean} extend - extend the line as a ray
   * @returns
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
            result.points.push(a1.lerp(a2, u1));
            result.points.push(a1.lerp(a2, u2));
          }
        } else {
          result = new Intersection('Inside');
          if (extend) {
            result.points.push(a1.lerp(a2, u1));
            result.points.push(a1.lerp(a2, u2));
          }
        }
      } else {
        result = new Intersection('Intersection');

        if (0 <= u1 && u1 <= 1 || extend) {
          result.points.push(a1.lerp(a2, u1));
        }

        if (0 <= u2 && u2 <= 1 || extend) {
          result.points.push(a1.lerp(a2, u2));
        }
      }
    }

    return result;
  };

  /**
   * Find intersections between circle and line
   * @param {line} line
   * @param {circle} circle
   * @param {boolean} extend - extend the line as a ray
   * @returns
   */
  static intersectLineCircle(line, circle, extend) {
    return this.intersectCircleLine(circle, line, extend);
  }

  /**
   * Find intersections between two circles
   * @param {circle} circle1
   * @param {circle} circle2
   * @param {boolean} extend  - unused
   * @returns
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

      result.points.push(
          new Point(
              p.x - b * (c2.y - c1.y),
              p.y + b * (c2.x - c1.x),
          ),
      );
      result.points.push(
          new Point(
              p.x + b * (c2.y - c1.y),
              p.y - b * (c2.x - c1.x),
          ),
      );
    }

    return result;
  };


  /**
   * Find intersections between circle and polygon
   * @param {point} c  - centre point
   * @param {float} r  - radius
   * @param {array} points
   * @returns
   */
  static intersectCirclePolygon(c, r, points) {
    const result = new Intersection('No Intersection');
    const length = points.length;
    let inter;

    for (let i = 0; i < length; i++) {
      const a1 = points[i];
      const a2 = points[(i + 1) % length];

      inter = this.intersectCircleLine(c, r, a1, a2);
      result.appendPoints(inter.points);
    }

    if (result.points.length > 0) {
      result.status = 'Intersection';
    } else {
      result.status = inter.status;
    }

    return result;
  };

  /**
   * Find intersections between arc segment and rectangle
   * @param {arc} arc
   * @param {rectangle} rectangle
   * @param {boolean} extend
   * @returns
   */
  static intersectArcRectangle(arc, rectangle, extend) {
    // TODO: Remove unused variables
    // const c = arc.centre;
    // const r = arc.radius;
    // const sa = arc.e;
    // const ea = arc.endAngle;

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
   * @param {arc} arc
   * @param {line} line
   * @param {boolean} extend
   * @returns
   */
  static intersectArcLine(arc, line, extend) {
    const c = arc.centre;
    const sa = arc.startAngle;
    const ea = arc.endAngle;

    const inter1 = this.intersectCircleLine(arc, line, extend);
    const result = new Intersection('No Intersection');

    if (!extend) {
      for (let i = 0; i < inter1.points.length; i++) {
        if (sa < ea) {
          // Arc scenario 1 - start angle < end angle
          // if the intersection angle is > start angle AND < end angle the point in on the arc
          if (c.angle(inter1.points[i]) > sa && c.angle(inter1.points[i]) < ea) {
            result.appendPoints(inter1.points[i]);
          }
        } else if (sa > ea) {
          // Arc scenario 2 - start angle > end angle
          // if the intersection angle is > start angle AND < 0 radians OR
          // the intersection angle is < end angle AND > 0 radians the point in on the arc
          if (c.angle(inter1.points[i]) >= sa && c.angle(inter1.points[i]) <= (Math.PI * 2) ||
              c.angle(inter1.points[i]) <= ea && c.angle(inter1.points[i]) >= 0) {
            result.appendPoints(inter1.points[i]);
          }
        }
      }

      if (result.points.length > 0) {
        // console.log('Actual points: ' + result.length);
        result.status = 'Intersection';
      }
    }

    return result;
  }

  /**
   * Find intersections between line and arc segment
   * @param {line} line
   * @param {arc} arc
   * @param {boolean} extend
   * @returns
   */
  static intersectLineArc(line, arc, extend) {
    return this.intersectArcLine(arc, line, extend);
  }

  /**
   * Find intersections between circle and arc segment
   * @param {circle} circle
   * @param {arc} arc
   * @param {boolean} extend
   * @returns
   */
  static intersectCircleArc(circle, arc, extend) {
    const c = arc.centre;
    // const r = arc.radius;
    const sa = arc.startAngle;
    const ea = arc.endAngle;

    const inter1 = this.intersectCircleCircle(circle, arc, extend);
    const result = new Intersection('No Intersection');

    if (!extend) {
      for (let i = 0; i < inter1.points.length; i++) {
        if (c.angle(inter1.points[i]) > sa && c.angle(inter1.points[i]) < ea) {
          // console.log('Angles: ' + c.angle(inter1.points[i]) + ' Start: ' + sa + ' End: ' + ea);

          // result.points.splice(i, 1);
          result.points.push(inter1.points[i]);
        }
      }

      if (result.points.length > 0) {
        // console.log('Actual points: ' + result.points.length);
        result.status = 'Intersection';
      }
    }

    return result;
  }

  /**
   * Find intersections between
   * @param {arc} arc
   * @param {circle} circle
   * @param {boolean} extend
   * @returns
   */
  static intersectArcCircle(arc, circle, extend) {
    return this.intersectCircleArc(circle, arc, extend);
  }

  /**
   * Find intersections between circle and rectangle
   * @param {circle} circle
   * @param {rectangle} rectangle
   * @param {boolean} extend
   * @returns
   */
  static intersectCircleRectangle(circle, rectangle, extend) {
    // var c = circle.centre
    // var r = circle.radius
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
  * Find intersections between two ellipse
  *
  * This code is based on MgcIntr2DElpElp.cpp written by David Eberly.  His
  * code along with many other excellent examples are available at his site:
  * http://www.magic-software.com
  *
  * @param {point} c1 - centre point
  * @param {float} rx1 - radius in x direction
  * @param {float} ry1 - radius in y direction
  * @param {point} c2 - centre point
  * @param {float} rx2 - radius in x direction
  * @param {float} ry2 - radius in y direction
  * @returns
  */
  static intersectEllipseEllipse(c1, rx1, ry1, c2, rx2, ry2) {
    // TODO: Rotation will need to be added to this function
    const a = [
      ry1 * ry1, 0, rx1 * rx1, -2 * ry1 * ry1 * c1.x, -2 * rx1 * rx1 * c1.y,
      ry1 * ry1 * c1.x * c1.x + rx1 * rx1 * c1.y * c1.y - rx1 * rx1 * ry1 * ry1,
    ];
    const b = [
      ry2 * ry2, 0, rx2 * rx2, -2 * ry2 * ry2 * c2.x, -2 * rx2 * rx2 * c2.y,
      ry2 * ry2 * c2.x * c2.x + rx2 * rx2 * c2.y * c2.y - rx2 * rx2 * ry2 * ry2,
    ];

    const yPoly = bezout(a, b);
    const yRoots = yPoly.getRoots();
    const epsilon = 1e-3;
    const norm0 = (a[0] * a[0] + 2 * a[1] * a[1] + a[2] * a[2]) * epsilon;
    const norm1 = (b[0] * b[0] + 2 * b[1] * b[1] + b[2] * b[2]) * epsilon;
    const result = new Intersection('No Intersection');

    for (let y = 0; y < yRoots.length; y++) {
      const xPoly = new Polynomial(
          a[0],
          a[3] + yRoots[y] * a[1],
          a[5] + yRoots[y] * (a[4] + yRoots[y] * a[2]),
      );
      const xRoots = xPoly.getRoots();

      for (let x = 0; x < xRoots.length; x++) {
        let test =
                    (a[0] * xRoots[x] + a[1] * yRoots[y] + a[3]) * xRoots[x] +
                    (a[2] * yRoots[y] + a[4]) * yRoots[y] + a[5];
        if (Math.abs(test) < norm0) {
          test =
                        (b[0] * xRoots[x] + b[1] * yRoots[y] + b[3]) * xRoots[x] +
                        (b[2] * yRoots[y] + b[4]) * yRoots[y] + b[5];
          if (Math.abs(test) < norm1) {
            result.appendPoint(new Point(xRoots[x], yRoots[y]));
          }
        }
      }
    }

    if (result.points.length > 0) result.status = 'Intersection';

    return result;
  };


  /**
   * Find intersections between ellipse and line
   * @param {ellipse} ellipse
   * @param {line} line
   * @param {boolean} extend
   * @returns
   */
  static intersectEllipseLine(ellipse, line, extend) {
    const cen = ellipse.centre;
    const rx = ellipse.radiusX;
    const ry = ellipse.radiusY;
    let a1 = line.start;
    let a2 = line.end;
    const theta = ellipse.theta;

    if (theta) {
      // If theta > 0 then the ellipse is rotated.
      // Its too complicated to do a quadratic equation with a rotated ellipse so we will rotate the lines too and pretend nothing is rotated :)
      a1 = a1.rotate(cen, theta);
      a2 = a2.rotate(cen, theta);
    }

    let result;
    const origin = new Point(a1.x, a1.y);
    const dir = a2.subtract(a1);
    const centre = new Point(cen.x, cen.y);
    const diff = origin.subtract(centre);
    const mDir = new Point(dir.x / (rx * rx), dir.y / (ry * ry));
    const mDiff = new Point(diff.x / (rx * rx), diff.y / (ry * ry));

    // Calculate the quadratic parameters
    const a = dir.dot(mDir);
    const b = dir.dot(mDiff);
    const c = diff.dot(mDiff) - 1.0;
    // Calculate the discriminant
    const d = b * b - a * c;

    if (d < 0) {
      result = new Intersection('Outside');
    } else if (d > 0) {
      const root = Math.sqrt(d);
      const tA = (-b - root) / a;
      const tB = (-b + root) / a;

      if ((tA < 0 || 1 < tA) && (tB < 0 || 1 < tB)) {
        if ((tA < 0 && tB < 0) || (tA > 1 && tB > 1)) {
          result = new Intersection('Outside');
          if (extend) {
            result.appendPoint(a1.lerp(a2, tA));
            result.appendPoint(a1.lerp(a2, tB));
          }
        } else {
          result = new Intersection('Inside');
          if (extend) {
            result.appendPoint(a1.lerp(a2, tA));
            result.appendPoint(a1.lerp(a2, tB));
          }
        }
      } else {
        result = new Intersection('Intersection');
        if (0 <= tA && tA <= 1) {
          result.appendPoint(a1.lerp(a2, tA));
        }
        if (0 <= tB && tB <= 1) {
          result.appendPoint(a1.lerp(a2, tB));
        }
      }
    } else {
      const t = -b / a;
      if (0 <= t && t <= 1) {
        result = new Intersection('Intersection');
        result.appendPoint(a1.lerp(a2, t));
      } else {
        result = new Intersection('Outside');
      }
    }

    if (theta && result.points.length) {
      // If theta > 0 then rotate all the points back to their proper place
      for (let i = 0; i < result.points.length; i++) {
        result.points[i] = result.points[i].rotate(ellipse.centre, -theta);
      }
    }

    return result;
  };

  /**
   * Find intersections between ellipse and polygon
   * @param {point} c - centre point
   * @param {float} rx - radius in x direction
   * @param {float} ry - radius in y direction
   * @param {array} points
   * @returns
   */
  static intersectEllipsePolygon(c, rx, ry, points) {
    const result = new Intersection('No Intersection');
    const length = points.length;

    for (let i = 0; i < length; i++) {
      const b1 = points[i];
      const b2 = points[(i + 1) % length];
      const inter = this.intersectEllipseLine(c, rx, ry, b1, b2);

      result.appendPoints(inter.points);
    }

    if (result.points.length > 0) {
      result.status = 'Intersection';
    }

    return result;
  };


  /**
   * Find intersections between ellipse and rectangle
   * @param {ellipse} ellipse
   * @param {rectangle} rectangle
   * @param {boolean} extend
   * @returns
   */
  static intersectEllipseRectangle(ellipse, rectangle, extend) {
    const r1 = rectangle.start;
    const r2 = rectangle.end;
    extend = extend || false;

    const min = r1.min(r2);
    const max = r1.max(r2);
    const topRight = new Point(max.x, min.y);
    const bottomLeft = new Point(min.x, max.y);

    let rectPoints = {start: min, end: topRight};
    const inter1 = this.intersectEllipseLine(ellipse, rectPoints);

    rectPoints = {start: topRight, end: max};
    const inter2 = this.intersectEllipseLine(ellipse, rectPoints);

    rectPoints = {start: max, end: bottomLeft};
    const inter3 = this.intersectEllipseLine(ellipse, rectPoints);

    rectPoints = {start: bottomLeft, end: min};
    const inter4 = this.intersectEllipseLine(ellipse, rectPoints);

    // var inter1 = this.intersectEllipseLine(c, rx, ry, min, topLeft,theta, Scene);  //<-- Whats the Scene for? can it be removed?
    // var inter2 = this.intersectEllipseLine(c, rx, ry, topLeft, max, theta, Scene);
    // var inter3 = this.intersectEllipseLine(c, rx, ry, max, bottomRight, theta, Scene);
    // var inter4 = this.intersectEllipseLine(c, rx, ry, bottomRight, min, theta, Scene);

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
   * Find intersections between two lines
   * @param {line} line1
   * @param {line} line2
   * @param {boolean} extend
   * @returns
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
        result.points.push(
            new Point(
                a1.x + ua * (a2.x - a1.x),
                a1.y + ua * (a2.y - a1.y),
            ),
        );
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
   * Find intersections between polyline and line
   * @param {polyline} polyline
   * @param {line} line
   * @param {boolean} extend
   * @returns
   */
  static intersectPolylineLine(polyline, line, extend) {
    const result = new Intersection('No Intersection');
    const length = polyline.points.length;

    for (let i = 0; i < length - 1; i++) {
      const b1 = polyline.points[i];
      const b2 = polyline.points[(i + 1) % length];

      const line2 = {start: b1, end: b2};
      const inter = this.intersectLineLine(line2, line, extend);

      result.appendPoints(inter.points);
    }

    if (result.points.length > 0) result.status = 'Intersection';
    return result;
  };


  /**
   * Find intersections between polyline and rectangle
   * @param {polyline} polyline
   * @param {rectangle} rectangle
   * @param {boolean} extend
   * @returns
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
   * @param {line} line
   * @param {rectangle} rectangle
   * @param {boolean} extend
   * @returns
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
   * @param {rectangle} rectangle
   * @param {line} line
   * @param {boolean} extend
   * @returns
   */
  static intersectRectangleLine(rectangle, line, extend) {
    return this.intersectLineRectangle(line, rectangle, extend);
  }

  /**
   * Find intersections between two polygons
   * @param {array} points1
   * @param {array} points2
   * @returns
   */
  static intersectPolygonPolygon(points1, points2) {
    const result = new Intersection('No Intersection');
    const length = points1.length;

    for (let i = 0; i < length; i++) {
      const a1 = points1[i];
      const a2 = points1[(i + 1) % length];
      const inter = this.intersectLinePolygon(a1, a2, points2);

      result.appendPoints(inter.points);
    }

    if (result.points.length > 0) {
      result.status = 'Intersection';
    }

    return result;
  };


  /**
   * Find intersections between polygon and rectangle
   * @param {array} points
   * @param {float} r1
   * @param {float} r2
   * @returns
   */
  static intersectPolygonRectangle(points, r1, r2) {
    const min = r1.min(r2);
    const max = r1.max(r2);
    const topRight = new Point(max.x, min.y);
    const bottomLeft = new Point(min.x, max.y);

    const inter1 = this.intersectLinePolygon(min, topRight, points);
    const inter2 = this.intersectLinePolygon(topRight, max, points);
    const inter3 = this.intersectLinePolygon(max, bottomLeft, points);
    const inter4 = this.intersectLinePolygon(bottomLeft, min, points);

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
   * Find intersections between two rectangles
   * @param {rectangle} rectangle1
   * @param {rectangle} rectangle2
   * @param {boolean} extend
   * @returns
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

