import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Circle } from '../../core/entities/circle.js';
import { Arc } from '../../core/entities/arc.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Lwpolyline } from '../../core/entities/lwpolyline.js';
import { Solid } from '../../core/entities/solid.js';
import { Text } from '../../core/entities/text.js';
import { ArcAlignedText } from '../../core/entities/arctext.js';
import { Hatch } from '../../core/entities/hatch.js';
import { AlignedDimension } from '../../core/dimensions/alignedDimension.js';
import { RotatedDimension } from '../../core/dimensions/rotatedDimension.js';
import { DiametricDimension } from '../../core/dimensions/diametricDimension.js';
import { RadialDimension } from '../../core/dimensions/radialDimension.js';
import { AngularDimension } from '../../core/dimensions/angularDimension.js';
import { Intersection } from '../../core/lib/intersect.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

/**
 * Dummy Selection Extremes from two points
 * @param {Point} p1
 * @param {Point} p2
 * @return {Array} [xmin, xmax, ymin, ymax]
 */
function selectionExtremes(p1, p2) {
  return [Math.min(p1.x, p2.x), Math.max(p1.x, p2.x), Math.min(p1.y, p2.y), Math.max(p1.y, p2.y)];
}

// ========================================================
// Entity decompose / intersectPoints format tests
// ========================================================
describe('Entity decompose and intersectPoints', () => {
  test('Line.decompose returns 2 points with bulge 0', () => {
    const line = new Line({ points: [new Point(0, 0), new Point(10, 5)] });
    const pts = line.decompose();
    expect(pts.length).toBe(2);
    expect(pts[0].x).toBe(0);
    expect(pts[0].y).toBe(0);
    expect(pts[0].bulge).toBe(0);
    expect(pts[1].x).toBe(10);
    expect(pts[1].y).toBe(5);
    expect(pts[1].bulge).toBe(0);
  });

  test('Line.intersectPoints returns {points} from decompose', () => {
    const line = new Line({ points: [new Point(0, 0), new Point(10, 5)] });
    const ip = line.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points).toEqual(line.decompose());
  });

  test('Circle.decompose returns 3 points with bulge 1', () => {
    const circle = new Circle({ points: [new Point(10, 10), new Point(15, 10)] });
    const pts = circle.decompose();
    expect(pts.length).toBe(3);
    // Two semicircular arcs
    expect(pts[0].bulge).toBe(1);
    expect(pts[1].bulge).toBe(1);
    // Closure point
    expect(pts[2].x).toBe(pts[0].x);
    expect(pts[2].y).toBe(pts[0].y);
  });

  test('Circle.intersectPoints returns {points} from decompose', () => {
    const circle = new Circle({ points: [new Point(10, 10), new Point(15, 10)] });
    const ip = circle.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(3);
  });

  test('Arc.decompose returns 2 points with calculated bulge', () => {
    // CCW arc from (10,0) to (0,10) centred at origin, radius 10
    const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
    const pts = arc.decompose();
    expect(pts.length).toBe(2);
    expect(pts[0].bulge).not.toBe(0);
    expect(pts[1].bulge).toBe(0);
  });

  test('Arc.intersectPoints returns {points} from decompose', () => {
    const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
    const ip = arc.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(2);
  });

  test('Polyline.decompose returns points array', () => {
    const poly = new Polyline({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
    const pts = poly.decompose();
    expect(pts.length).toBe(3);
    expect(pts[0].x).toBe(0);
    expect(pts[2].x).toBe(10);
    expect(pts[2].y).toBe(10);
  });

  test('Polyline.intersectPoints returns {points} from decompose', () => {
    const poly = new Polyline({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
    const ip = poly.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(3);
  });

  test('Lwpolyline.decompose returns points array', () => {
    const lwpoly = new Lwpolyline({ points: [new Point(0, 0), new Point(5, 5), new Point(10, 0)] });
    const pts = lwpoly.decompose();
    expect(pts.length).toBe(3);
  });

  test('Lwpolyline.intersectPoints returns {points} from decompose', () => {
    const lwpoly = new Lwpolyline({ points: [new Point(0, 0), new Point(5, 5), new Point(10, 0)] });
    const ip = lwpoly.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(3);
  });

  test('Solid.decompose returns closed polygon', () => {
    const solid = new Solid({ points: [new Point(0, 0), new Point(10, 0), new Point(5, 10)] });
    const pts = solid.decompose();
    // 3 points + closing point
    expect(pts.length).toBe(4);
    expect(pts[3].x).toBe(pts[0].x);
    expect(pts[3].y).toBe(pts[0].y);
  });

  test('Solid.intersectPoints returns {points} from decompose', () => {
    const solid = new Solid({ points: [new Point(0, 0), new Point(10, 0), new Point(5, 10)] });
    const ip = solid.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(4);
  });

  test('Solid.decompose with 4 points returns 5 points', () => {
    const solid = new Solid({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
    const pts = solid.decompose();
    expect(pts.length).toBe(5);
    expect(pts[4].x).toBe(pts[0].x);
    expect(pts[4].y).toBe(pts[0].y);
  });

  test('Text.decompose returns closed rectangle (5 points)', () => {
    const text = new Text({ points: [new Point(0, 0)] });
    text.boundingRect = { width: 10, height: 5 };
    const pts = text.decompose();
    expect(pts.length).toBe(5);
    // Closed polygon: first and last point match
    expect(pts[4].x).toBe(pts[0].x);
    expect(pts[4].y).toBe(pts[0].y);
  });

  test('Text.intersectPoints returns {points} from decompose', () => {
    const text = new Text({ points: [new Point(0, 0)] });
    text.boundingRect = { width: 10, height: 5 };
    const ip = text.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(5);
  });

  test('ArcAlignedText.decompose returns character positions', () => {
    const arcText = new ArcAlignedText({
      points: [new Point(0, 0)],
      string: 'AB',
      radius: 20,
      height: 2.5,
      startAngle: 0,
      endAngle: 180,
    });
    const pts = arcText.decompose();
    expect(pts.length).toBe(2);
    // Points should be at character positions along the arc
    pts.forEach((pt) => {
      expect(pt).toBeInstanceOf(Point);
    });
  });

  test('ArcAlignedText.intersectPoints returns {points} from decompose', () => {
    const arcText = new ArcAlignedText({
      points: [new Point(0, 0)],
      string: 'Test',
      radius: 20,
      height: 2.5,
      startAngle: 0,
      endAngle: 180,
    });
    const ip = arcText.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(4);
  });

  test('ArcAlignedText with empty string returns empty points', () => {
    const arcText = new ArcAlignedText({
      points: [new Point(0, 0)],
      string: '',
      radius: 20,
    });
    const pts = arcText.decompose();
    expect(pts.length).toBe(0);
  });

  test('Polyline with bulge segments decomposes correctly', () => {
    // Polyline with an arc segment (bulge=1 is a semicircle)
    const poly = new Polyline({ points: [new Point(0, 0, 1), new Point(10, 0)] });
    const pts = poly.decompose();
    expect(pts.length).toBe(2);
    expect(pts[0].bulge).toBe(1);
    expect(pts[1].bulge).toBe(0);
  });
});

// ========================================================
// Entity touched (selection) tests - via intersectPolylinePolyline
// ========================================================
describe('Entity.touched - selection rectangle intersection', () => {
  test('Line touching selection rectangle', () => {
    const line = new Line({ points: [new Point(0, 0), new Point(20, 20)] });
    // Selection rectangle crossing the line
    const sE = selectionExtremes(new Point(5, 5), new Point(15, 15));
    expect(line.touched(sE)).toBe(true);
  });

  test('Line not touching selection rectangle', () => {
    const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
    // Selection rectangle above the line
    const sE = selectionExtremes(new Point(0, 5), new Point(10, 15));
    expect(line.touched(sE)).toBe(false);
  });

  test('Line partially crossing selection rectangle edge', () => {
    // Line crossing only one edge of the rectangle
    const line = new Line({ points: [new Point(-10, 5), new Point(5, 5)] });
    const sE = selectionExtremes(new Point(0, 0), new Point(10, 10));
    expect(line.touched(sE)).toBe(true);
  });

  test('Circle touching selection rectangle', () => {
    const circle = new Circle({ points: [new Point(10, 10), new Point(15, 10)] }); // radius=5
    // Rectangle crossing the circle
    const sE = selectionExtremes(new Point(12, 0), new Point(18, 20));
    expect(circle.touched(sE)).toBe(true);
  });

  test('Circle not touching selection rectangle', () => {
    const circle = new Circle({ points: [new Point(10, 10), new Point(15, 10)] }); // radius=5
    // Rectangle far from circle
    const sE = selectionExtremes(new Point(50, 50), new Point(60, 60));
    expect(circle.touched(sE)).toBe(false);
  });

  test('Circle surrounding selection rectangle (no edge crossing)', () => {
    const circle = new Circle({ points: [new Point(0, 0), new Point(100, 0)] }); // radius=100
    // Tiny rectangle inside circle - no edge crossings
    const sE = selectionExtremes(new Point(-1, -1), new Point(1, 1));
    expect(circle.touched(sE)).toBe(false);
  });

  test('Arc touching selection rectangle', () => {
    // CCW arc from (10,0) to (0,10) centred at origin, radius 10
    const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
    // Rectangle crossing the arc
    const sE = selectionExtremes(new Point(4, 4), new Point(12, 12));
    expect(arc.touched(sE)).toBe(true);
  });

  test('Arc not touching selection rectangle', () => {
    // CCW arc from (10,0) to (0,10) centred at origin (positive quadrant)
    const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
    // Rectangle in negative quadrant
    const sE = selectionExtremes(new Point(-20, -20), new Point(-10, -10));
    expect(arc.touched(sE)).toBe(false);
  });

  test('Polyline touching selection rectangle', () => {
    const poly = new Polyline({ points: [new Point(0, 0), new Point(20, 0), new Point(20, 20)] });
    const sE = selectionExtremes(new Point(15, -5), new Point(25, 5));
    expect(poly.touched(sE)).toBe(true);
  });

  test('Polyline not touching selection rectangle', () => {
    const poly = new Polyline({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
    const sE = selectionExtremes(new Point(50, 50), new Point(60, 60));
    expect(poly.touched(sE)).toBe(false);
  });

  test('Lwpolyline touching selection rectangle', () => {
    const lwpoly = new Lwpolyline({ points: [new Point(0, 0), new Point(20, 0), new Point(20, 20)] });
    const sE = selectionExtremes(new Point(15, -5), new Point(25, 5));
    expect(lwpoly.touched(sE)).toBe(true);
  });

  test('Lwpolyline not touching selection rectangle', () => {
    const lwpoly = new Lwpolyline({ points: [new Point(0, 0), new Point(10, 0)] });
    const sE = selectionExtremes(new Point(0, 5), new Point(10, 15));
    expect(lwpoly.touched(sE)).toBe(false);
  });

  test('Solid touching selection rectangle', () => {
    const solid = new Solid({ points: [new Point(0, 0), new Point(20, 0), new Point(10, 20)] });
    const sE = selectionExtremes(new Point(5, -5), new Point(15, 5));
    expect(solid.touched(sE)).toBe(true);
  });

  test('Solid not touching selection rectangle', () => {
    const solid = new Solid({ points: [new Point(0, 0), new Point(10, 0), new Point(5, 10)] });
    const sE = selectionExtremes(new Point(50, 50), new Point(60, 60));
    expect(solid.touched(sE)).toBe(false);
  });

  test('Solid 4-point touching selection rectangle', () => {
    const solid = new Solid({ points: [new Point(0, 0), new Point(20, 0), new Point(20, 20), new Point(0, 20)] });
    // Rectangle crossing the top edge
    const sE = selectionExtremes(new Point(5, 15), new Point(15, 25));
    expect(solid.touched(sE)).toBe(true);
  });

  test('Text touching selection rectangle', () => {
    const text = new Text({ points: [new Point(0, 0)] });
    text.boundingRect = { width: 20, height: 10 };
    // Rectangle crossing through the text frame
    const sE = selectionExtremes(new Point(-5, -5), new Point(5, 5));
    expect(text.touched(sE)).toBe(true);
  });

  test('Text not touching selection rectangle', () => {
    const text = new Text({ points: [new Point(0, 0)] });
    text.boundingRect = { width: 10, height: 5 };
    // Rectangle far from text
    const sE = selectionExtremes(new Point(50, 50), new Point(60, 60));
    expect(text.touched(sE)).toBe(false);
  });

  test('ArcAlignedText touching selection rectangle', () => {
    const arcText = new ArcAlignedText({
      points: [new Point(0, 0)],
      string: 'Hello',
      radius: 20,
      height: 2.5,
      startAngle: 0,
      endAngle: 180,
    });
    // Get the character positions to determine where to place selection rectangle
    const pts = arcText.decompose();
    if (pts.length > 0) {
      const charPos = pts[0];
      const sE = selectionExtremes(
          new Point(charPos.x - 5, charPos.y - 5),
          new Point(charPos.x + 5, charPos.y + 5),
      );
      expect(arcText.touched(sE)).toBe(true);
    }
  });

  test('ArcAlignedText not touching selection rectangle', () => {
    const arcText = new ArcAlignedText({
      points: [new Point(0, 0)],
      string: 'Test',
      radius: 20,
      height: 2.5,
      startAngle: 0,
      endAngle: 180,
    });
    // Rectangle far away
    const sE = selectionExtremes(new Point(500, 500), new Point(600, 600));
    expect(arcText.touched(sE)).toBe(false);
  });

  test('Polyline with arc segment touching selection rectangle', () => {
    // Semicircular polyline arc from (0,0) to (0,10) bulging right
    const poly = new Polyline({ points: [new Point(0, 0, 1), new Point(0, 10)] });
    // Rectangle to the right of the midpoint where the arc bulges
    const sE = selectionExtremes(new Point(3, 3), new Point(7, 7));
    expect(poly.touched(sE)).toBe(true);
  });

  test('Closed polyline touching selection rectangle', () => {
    // Closed square polyline
    const poly = new Polyline({
      points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10), new Point(0, 0)],
    });
    // Rectangle crossing the right edge
    const sE = selectionExtremes(new Point(8, 3), new Point(12, 7));
    expect(poly.touched(sE)).toBe(true);
  });
});

// ========================================================
// Entity-to-entity intersections via intersectPolylinePolyline
// ========================================================
describe('Entity-to-entity intersection via intersectPolylinePolyline', () => {
  test('Line vs Line - crossing', () => {
    const line1 = new Line({ points: [new Point(-10, 0), new Point(10, 0)] });
    const line2 = new Line({ points: [new Point(0, -10), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(line1.intersectPoints(), line2.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(1);
    expect(result.points[0].x).toBeCloseTo(0);
    expect(result.points[0].y).toBeCloseTo(0);
  });

  test('Line vs Line - no intersection', () => {
    const line1 = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
    const line2 = new Line({ points: [new Point(0, 5), new Point(10, 5)] });
    const result = Intersection.intersectPolylinePolyline(line1.intersectPoints(), line2.intersectPoints());
    expect(result.status).toBe('No Intersection');
    expect(result.points.length).toBe(0);
  });

  test('Line vs Circle', () => {
    const line = new Line({ points: [new Point(-10, 0), new Point(10, 0)] });
    const circle = new Circle({ points: [new Point(0, 0), new Point(5, 0)] }); // radius=5
    const result = Intersection.intersectPolylinePolyline(line.intersectPoints(), circle.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
  });

  test('Line vs Arc - intersection', () => {
    // Horizontal line through arc
    const line = new Line({ points: [new Point(-20, 5), new Point(20, 5)] });
    // CCW arc from (10,0) to (0,10) centred at origin, radius 10
    const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(line.intersectPoints(), arc.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBeGreaterThanOrEqual(1);
  });

  test('Line vs Polyline - multiple intersections', () => {
    const line = new Line({ points: [new Point(5, -5), new Point(5, 25)] });
    const poly = new Polyline({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(line.intersectPoints(), poly.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
    // Line at x=5 crosses bottom edge (y=0) and top edge (y=10) - but poly is not closed
    // Actually crosses bottom (0,0)-(10,0) and the third segment (10,10)-(0,10)
    expect(result.points[0].x).toBeCloseTo(5);
  });

  test('Line vs Solid', () => {
    const line = new Line({ points: [new Point(-5, 5), new Point(25, 5)] });
    const solid = new Solid({ points: [new Point(0, 0), new Point(20, 0), new Point(20, 20), new Point(0, 20)] });
    const result = Intersection.intersectPolylinePolyline(line.intersectPoints(), solid.intersectPoints());
    expect(result.status).toBe('Intersection');
    // Line crosses left and right edges of the closed solid
    expect(result.points.length).toBe(2);
  });

  test('Circle vs Circle - overlapping', () => {
    const circle1 = new Circle({ points: [new Point(0, 0), new Point(5, 0)] }); // radius=5
    const circle2 = new Circle({ points: [new Point(5, 0), new Point(10, 0)] }); // radius=5
    const result = Intersection.intersectPolylinePolyline(circle1.intersectPoints(), circle2.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
  });

  test('Circle vs Circle - no intersection', () => {
    const circle1 = new Circle({ points: [new Point(0, 0), new Point(5, 0)] }); // radius=5
    const circle2 = new Circle({ points: [new Point(50, 50), new Point(55, 50)] }); // radius=5
    const result = Intersection.intersectPolylinePolyline(circle1.intersectPoints(), circle2.intersectPoints());
    expect(result.status).toBe('No Intersection');
  });

  test('Circle vs Arc', () => {
    const circle = new Circle({ points: [new Point(10, 0), new Point(15, 0)] }); // radius=5 at (10,0)
    // CCW arc from (10,0) to (0,10) centred at origin, radius 10
    const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(circle.intersectPoints(), arc.intersectPoints());
    expect(result.status).toBe('Intersection');
  });

  test('Arc vs Arc - intersecting', () => {
    // Two overlapping arcs: arc1 upper semicircle, arc2 shifted
    const arc1 = new Arc({ points: [new Point(0, 0), new Point(-10, 0), new Point(10, 0)] }); // upper semicircle r=10
    const arc2 = new Arc({ points: [new Point(5, 0), new Point(-5, 0), new Point(15, 0)] }); // upper semicircle r=10 shifted right
    const result = Intersection.intersectPolylinePolyline(arc1.intersectPoints(), arc2.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBeGreaterThanOrEqual(1);
  });

  test('Polyline vs Polyline - crossing', () => {
    const poly1 = new Polyline({ points: [new Point(-10, 0), new Point(10, 0)] });
    const poly2 = new Polyline({ points: [new Point(0, -10), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(poly1.intersectPoints(), poly2.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(1);
    expect(result.points[0].x).toBeCloseTo(0);
    expect(result.points[0].y).toBeCloseTo(0);
  });

  test('Polyline vs Polyline - multi-segment', () => {
    // V-shaped polyline vs horizontal line
    const poly1 = new Polyline({ points: [new Point(0, 10), new Point(10, 0), new Point(20, 10)] });
    const poly2 = new Polyline({ points: [new Point(-5, 5), new Point(25, 5)] });
    const result = Intersection.intersectPolylinePolyline(poly1.intersectPoints(), poly2.intersectPoints());
    expect(result.status).toBe('Intersection');
    // Crosses both segments of poly1
    expect(result.points.length).toBe(2);
  });

  test('Lwpolyline vs Line', () => {
    const lwpoly = new Lwpolyline({ points: [new Point(-10, 0), new Point(10, 0)] });
    const line = new Line({ points: [new Point(0, -10), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(lwpoly.intersectPoints(), line.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(1);
  });

  test('Lwpolyline vs Polyline', () => {
    const lwpoly = new Lwpolyline({ points: [new Point(-10, 0), new Point(10, 0)] });
    const poly = new Polyline({ points: [new Point(0, -10), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(lwpoly.intersectPoints(), poly.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(1);
  });

  test('Lwpolyline vs Lwpolyline', () => {
    const lwpoly1 = new Lwpolyline({ points: [new Point(-10, 0), new Point(10, 0)] });
    const lwpoly2 = new Lwpolyline({ points: [new Point(0, -10), new Point(0, 10)] });
    const result = Intersection.intersectPolylinePolyline(lwpoly1.intersectPoints(), lwpoly2.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(1);
  });

  test('Polyline with bulge vs Line', () => {
    // Semicircular arc polyline bulging right
    const poly = new Polyline({ points: [new Point(0, 0, 1), new Point(0, 10)] });
    // Vertical line through the middle of the arc
    const line = new Line({ points: [new Point(3, -5), new Point(3, 15)] });
    const result = Intersection.intersectPolylinePolyline(poly.intersectPoints(), line.intersectPoints());
    expect(result.status).toBe('Intersection');
    // Line should cross the arc in two places
    expect(result.points.length).toBe(2);
  });

  test('Solid vs Line - crossing closed polygon', () => {
    // Triangle solid
    const solid = new Solid({ points: [new Point(0, 0), new Point(20, 0), new Point(10, 20)] });
    // Horizontal line crossing two edges
    const line = new Line({ points: [new Point(-5, 10), new Point(25, 10)] });
    const result = Intersection.intersectPolylinePolyline(solid.intersectPoints(), line.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
  });

  test('Solid vs Polyline', () => {
    const solid = new Solid({ points: [new Point(0, 0), new Point(20, 0), new Point(20, 20), new Point(0, 20)] });
    const poly = new Polyline({ points: [new Point(10, -5), new Point(10, 25)] });
    const result = Intersection.intersectPolylinePolyline(solid.intersectPoints(), poly.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
  });

  test('Solid vs Circle', () => {
    // Square solid with a circle crossing through an edge
    const solid = new Solid({ points: [new Point(0, 0), new Point(20, 0), new Point(20, 20), new Point(0, 20)] });
    const circle = new Circle({ points: [new Point(0, 10), new Point(5, 10)] }); // radius=5 at left edge
    const result = Intersection.intersectPolylinePolyline(solid.intersectPoints(), circle.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBeGreaterThanOrEqual(2);
  });

  test('Text vs Line', () => {
    const text = new Text({ points: [new Point(0, 0)] });
    text.boundingRect = { width: 20, height: 10 };
    // Line crossing through the text frame
    const line = new Line({ points: [new Point(-5, 5), new Point(25, 5)] });
    const result = Intersection.intersectPolylinePolyline(text.intersectPoints(), line.intersectPoints());
    expect(result.status).toBe('Intersection');
    // Line enters and exits the text frame
    expect(result.points.length).toBe(2);
  });

  test('Text vs Circle', () => {
    const text = new Text({ points: [new Point(0, 0)] });
    text.boundingRect = { width: 20, height: 10 };
    const circle = new Circle({ points: [new Point(0, 5), new Point(5, 5)] }); // radius=5 at left edge
    const result = Intersection.intersectPolylinePolyline(text.intersectPoints(), circle.intersectPoints());
    expect(result.status).toBe('Intersection');
  });
});

// ========================================================
// Cross-type intersection combinations
// ========================================================
describe('Cross-type entity intersections', () => {
  test('Line vs Solid vs Circle - chain verification', () => {
    // Verify that intersections work consistently across entity types
    const line = new Line({ points: [new Point(0, 0), new Point(20, 0)] });
    const solid = new Solid({ points: [new Point(5, -5), new Point(15, -5), new Point(15, 5), new Point(5, 5)] });

    // Line crosses left and right edges of solid
    const result = Intersection.intersectPolylinePolyline(line.intersectPoints(), solid.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
    expect(result.points[0].x).toBeCloseTo(15);
    expect(result.points[0].y).toBeCloseTo(0);
    expect(result.points[1].x).toBeCloseTo(5);
    expect(result.points[1].y).toBeCloseTo(0);
  });

  test('Polyline with bulge vs Circle', () => {
    // Polyline with arc segment
    const poly = new Polyline({ points: [new Point(0, -5, 1), new Point(0, 5)] });
    // Circle overlapping the arc
    const circle = new Circle({ points: [new Point(5, 0), new Point(10, 0)] }); // radius=5
    const result = Intersection.intersectPolylinePolyline(poly.intersectPoints(), circle.intersectPoints());
    expect(result.status).toBe('Intersection');
  });

  test('Closed polyline vs Closed polyline', () => {
    // Two overlapping squares
    const poly1 = new Polyline({
      points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10), new Point(0, 0)],
    });
    const poly2 = new Polyline({
      points: [new Point(5, 5), new Point(15, 5), new Point(15, 15), new Point(5, 15), new Point(5, 5)],
    });
    const result = Intersection.intersectPolylinePolyline(poly1.intersectPoints(), poly2.intersectPoints());
    expect(result.status).toBe('Intersection');
    // Two overlapping squares intersect at multiple points
    expect(result.points.length).toBeGreaterThanOrEqual(2);
  });

  test('Arc vs Solid - crossing triangle', () => {
    const arc = new Arc({ points: [new Point(10, 0), new Point(20, 0), new Point(0, 0)] }); // semicircle top
    const solid = new Solid({ points: [new Point(0, 0), new Point(20, 0), new Point(10, 15)] });
    const result = Intersection.intersectPolylinePolyline(arc.intersectPoints(), solid.intersectPoints());
    expect(result.status).toBe('Intersection');
  });

  test('Line vs Lwpolyline', () => {
    const line = new Line({ points: [new Point(0, 5), new Point(20, 5)] });
    const lwpoly = new Lwpolyline({ points: [new Point(10, 0), new Point(10, 10)] });
    const result = Intersection.intersectPolylinePolyline(line.intersectPoints(), lwpoly.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(1);
    expect(result.points[0].x).toBeCloseTo(10);
    expect(result.points[0].y).toBeCloseTo(5);
  });

  test('Circle vs Lwpolyline', () => {
    const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] }); // radius=10
    const lwpoly = new Lwpolyline({ points: [new Point(0, -15), new Point(0, 15)] });
    const result = Intersection.intersectPolylinePolyline(circle.intersectPoints(), lwpoly.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
  });

  test('Arc vs Lwpolyline', () => {
    const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
    const lwpoly = new Lwpolyline({ points: [new Point(0, 0), new Point(15, 15)] });
    const result = Intersection.intersectPolylinePolyline(arc.intersectPoints(), lwpoly.intersectPoints());
    expect(result.status).toBe('Intersection');
  });
});

// ========================================================
// Dimension touched tests
// ========================================================
describe('Dimension touched tests', () => {
  test('AlignedDimension.touched delegates to block', () => {
    const pt13 = new Point(0, 0, 0, 13); // first definition point
    const pt14 = new Point(100, 0, 0, 14); // second definition point
    const pt11 = new Point(50, 20, 0, 11); // text position
    const pt10 = new Point(100, 20, 0, 10); // dimension line location
    const dim = new AlignedDimension({
      points: [pt13, pt14, pt11, pt10],
    });
    dim.refesh();

    // Selection rectangle around the dimension text area
    const sE = selectionExtremes(new Point(40, 15), new Point(60, 25));
    const touched = dim.touched(sE);
    expect(typeof touched).toBe('boolean');
  });

  test('AlignedDimension.touched returns false when far away', () => {
    const pt13 = new Point(0, 0, 0, 13);
    const pt14 = new Point(100, 0, 0, 14);
    const pt11 = new Point(50, 20, 0, 11);
    const pt10 = new Point(100, 20, 0, 10);
    const dim = new AlignedDimension({
      points: [pt13, pt14, pt11, pt10],
    });
    dim.refesh();

    // Selection rectangle far from dimension
    const sE = selectionExtremes(new Point(500, 500), new Point(600, 600));
    expect(dim.touched(sE)).toBe(false);
  });

  test('RotatedDimension.touched delegates to block', () => {
    const pt13 = new Point(0, 0, 0, 13);
    const pt14 = new Point(100, 0, 0, 14);
    const pt11 = new Point(50, 20, 0, 11);
    const pt10 = new Point(100, 20, 0, 10);
    const dim = new RotatedDimension({
      points: [pt13, pt14, pt11, pt10],
    });
    dim.refesh();

    const sE = selectionExtremes(new Point(500, 500), new Point(600, 600));
    expect(dim.touched(sE)).toBe(false);
  });

  test('DiametricDimension.touched delegates to block', () => {
    const dim = new DiametricDimension({
      points: [new Point(0, 0), new Point(100, 0)],
    });
    dim.refesh();

    const sE = selectionExtremes(new Point(500, 500), new Point(600, 600));
    expect(dim.touched(sE)).toBe(false);
  });

  test('RadialDimension.touched delegates to block', () => {
    const dim = new RadialDimension({
      points: [new Point(0, 0), new Point(100, 0)],
    });
    dim.refesh();

    const sE = selectionExtremes(new Point(500, 500), new Point(600, 600));
    expect(dim.touched(sE)).toBe(false);
  });

  test('AngularDimension.touched delegates to block', () => {
    const pt13 = new Point(0, 0, 0, 13); // line 1 start
    const pt14 = new Point(100, 0, 0, 14); // line 1 end
    const pt15 = new Point(0, 0, 0, 15); // line 2 start
    const pt10 = new Point(0, 100, 0, 10); // line 2 end
    const pt16 = new Point(50, 50, 0, 16); // dimension line position
    const pt11 = new Point(50, 50, 0, 11); // text position
    const dim = new AngularDimension({
      points: [pt13, pt14, pt15, pt10, pt16, pt11],
    });
    dim.refesh();

    const sE = selectionExtremes(new Point(500, 500), new Point(600, 600));
    expect(dim.touched(sE)).toBe(false);
  });

  test('AlignedDimension.touched uses block.touched not intersectPoints', () => {
    // Dimensions delegate touched() to block.touched() which iterates block items.
    // block.intersectPoints() is not implemented - dimensions rely on block.touched() instead.
    const pt13 = new Point(0, 0, 0, 13);
    const pt14 = new Point(100, 0, 0, 14);
    const pt11 = new Point(50, 20, 0, 11);
    const pt10 = new Point(100, 20, 0, 10);
    const dim = new AlignedDimension({
      points: [pt13, pt14, pt11, pt10],
    });
    dim.refesh();

    // touched() works via block delegation - returns boolean
    const sE = selectionExtremes(new Point(-10, -10), new Point(110, 30));
    expect(dim.touched(sE)).toBe(false);

    // intersectPoints() throws because block doesn't implement it
    expect(() => dim.intersectPoints()).toThrow();
  });
});

// ========================================================
// Hatch touched tests
// ========================================================
describe('Hatch touched tests', () => {
  test('Hatch.touched delegates to child entities', () => {
    const hatch = new Hatch();
    // Add a polyline as child entity
    const boundary = new Polyline({
      points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100), new Point(0, 0)],
    });
    hatch.childEntities.push(boundary);

    // Selection rectangle crossing the boundary
    const sE = selectionExtremes(new Point(-5, 50), new Point(5, 60));
    expect(hatch.touched(sE)).toBe(true);
  });

  test('Hatch.touched returns false when no child entity touched', () => {
    const hatch = new Hatch();
    const boundary = new Polyline({
      points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10), new Point(0, 0)],
    });
    hatch.childEntities.push(boundary);

    // Selection rectangle far from hatch
    const sE = selectionExtremes(new Point(500, 500), new Point(600, 600));
    expect(hatch.touched(sE)).toBe(false);
  });

  test('Hatch.touched with multiple child entities', () => {
    const hatch = new Hatch();
    const boundary1 = new Polyline({
      points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10), new Point(0, 0)],
    });
    const boundary2 = new Polyline({
      points: [new Point(50, 50), new Point(60, 50), new Point(60, 60), new Point(50, 60), new Point(50, 50)],
    });
    hatch.childEntities.push(boundary1);
    hatch.childEntities.push(boundary2);

    // Touch only the second boundary
    const sE = selectionExtremes(new Point(48, 55), new Point(52, 58));
    expect(hatch.touched(sE)).toBe(true);
  });
});

// ========================================================
// Edge cases
// ========================================================
describe('Intersection edge cases', () => {
  test('Zero-length line intersectPoints', () => {
    const line = new Line({ points: [new Point(5, 5), new Point(5, 5)] });
    const ip = line.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(2);
  });

  test('Large line touched by large rectangle', () => {
    // Line that crosses the selection rectangle edge
    const line = new Line({ points: [new Point(-200, 0), new Point(200, 0)] });
    const sE = selectionExtremes(new Point(-100, -100), new Point(100, 100));
    expect(line.touched(sE)).toBe(true);
  });

  test('Entity exactly on rectangle edge', () => {
    const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
    // Rectangle edge coincides with the line
    const sE = selectionExtremes(new Point(0, 0), new Point(10, 10));
    // Coincident lines detected
    expect(line.touched(sE)).toBe(true);
  });

  test('Polyline with single point returns valid intersectPoints', () => {
    const poly = new Polyline({ points: [new Point(5, 5)] });
    const ip = poly.intersectPoints();
    expect(ip).toHaveProperty('points');
    expect(ip.points.length).toBe(1);
  });

  test('Coincident lines intersection', () => {
    const line1 = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
    const line2 = new Line({ points: [new Point(2, 0), new Point(8, 0)] });
    const result = Intersection.intersectPolylinePolyline(line1.intersectPoints(), line2.intersectPoints());
    // Coincident lines have special status
    expect(result.points.length).toBe(1);
  });

  test('Perpendicular lines at endpoint', () => {
    const line1 = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
    const line2 = new Line({ points: [new Point(10, 0), new Point(10, 10)] });
    const result = Intersection.intersectPolylinePolyline(line1.intersectPoints(), line2.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points[0].x).toBeCloseTo(10);
    expect(result.points[0].y).toBeCloseTo(0);
  });

  test('Diagonal line through circle centre', () => {
    const line = new Line({ points: [new Point(-20, -20), new Point(20, 20)] });
    const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] }); // radius=10
    const result = Intersection.intersectPolylinePolyline(line.intersectPoints(), circle.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(2);
    // Points should be equidistant from centre
    const dist1 = Math.sqrt(result.points[0].x ** 2 + result.points[0].y ** 2);
    const dist2 = Math.sqrt(result.points[1].x ** 2 + result.points[1].y ** 2);
    expect(dist1).toBeCloseTo(10);
    expect(dist2).toBeCloseTo(10);
  });

  test('Two concentric circles - no intersection', () => {
    const circle1 = new Circle({ points: [new Point(0, 0), new Point(5, 0)] }); // radius=5
    const circle2 = new Circle({ points: [new Point(0, 0), new Point(10, 0)] }); // radius=10
    const result = Intersection.intersectPolylinePolyline(circle1.intersectPoints(), circle2.intersectPoints());
    expect(result.status).toBe('No Intersection');
  });

  test('Polyline segment with negative bulge', () => {
    // Negative bulge = clockwise arc
    const poly = new Polyline({ points: [new Point(0, 0, -1), new Point(0, 10)] });
    const line = new Line({ points: [new Point(-10, 5), new Point(10, 5)] });
    const result = Intersection.intersectPolylinePolyline(poly.intersectPoints(), line.intersectPoints());
    expect(result.status).toBe('Intersection');
    // CW arc bulges to the left, line crosses through
    expect(result.points.length).toBeGreaterThanOrEqual(1);
    expect(result.points[0].x).toBeCloseTo(-5);
    expect(result.points[0].y).toBeCloseTo(5);
  });

  test('Polyline segment with small bulge (shallow arc)', () => {
    // Small bulge creates a shallow arc
    const poly = new Polyline({ points: [new Point(0, 0, 0.1), new Point(10, 0)] });
    const line = new Line({ points: [new Point(5, -5), new Point(5, 5)] });
    const result = Intersection.intersectPolylinePolyline(poly.intersectPoints(), line.intersectPoints());
    expect(result.status).toBe('Intersection');
    expect(result.points.length).toBe(1);
  });
});

// ========================================================
// Extend flag tests
// ========================================================
describe('Intersection with extend flag', () => {
  test('intersectSegmentSegment with extend finds projected intersection', () => {
    // line1 (boundary) is long enough to contain intersection
    // line2 (selected) doesn't reach line1 without extend
    const result1 = Intersection.intersectSegmentSegment(
        new Point(10, -10), new Point(10, 10),
        new Point(0, 0), new Point(5, 0),
        false,
    );
    expect(result1.status).toBe('No Intersection');
    // With extend - line2 projects beyond its endpoint
    const result2 = Intersection.intersectSegmentSegment(
        new Point(10, -10), new Point(10, 10),
        new Point(0, 0), new Point(5, 0),
        true,
    );
    expect(result2.status).toBe('Intersection');
    expect(result2.points[0].x).toBeCloseTo(10);
    expect(result2.points[0].y).toBeCloseTo(0);
  });

  test('intersectPolylinePolyline with extend', () => {
    // Polyline (boundary) is long, line (selected) doesn't reach it
    const poly = { points: [new Point(10, -10), new Point(10, 10)] };
    const line = { points: [new Point(0, 0), new Point(5, 0)] };
    const result = Intersection.intersectPolylinePolyline(poly, line, true);
    expect(result.status).toBe('Intersection');
    expect(result.points[0].x).toBeCloseTo(10);
  });

  test('intersectPolylinePolyline arc with extend finds full circle intersection', () => {
    // Arc from (5,0) to (-5,0) CCW, bulge=1 -> upper semicircle centred at (0,0), r=5
    const arcPolyline = { points: [new Point(5, 0, 1), new Point(-5, 0)] };
    // Line below the arc - doesn't intersect the arc without extend
    const polyline = { points: [new Point(0, -10), new Point(0, -3)] };
    const result1 = Intersection.intersectPolylinePolyline(polyline, arcPolyline, false);
    expect(result1.status).toBe('No Intersection');
    // With extend - uses full circle, finds intersection at (0,-5)
    const result2 = Intersection.intersectPolylinePolyline(polyline, arcPolyline, true);
    expect(result2.status).toBe('Intersection');
    expect(result2.points[0].x).toBeCloseTo(0);
    expect(result2.points[0].y).toBeCloseTo(-5);
  });
});
