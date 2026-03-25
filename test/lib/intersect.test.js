import { Point } from '../../core/entities/point.js';
import { Intersection } from '../../core/lib/intersect';

test('Test Intersection.intersectCircleEllipse()', () => {
  expect(true).toBeTruthy();
  // TODO: intersectCircleEllipse
});

test('Test intersectSegmentSegment - circle line', () => {
  // CCW semicircular arc from (10,0) to (-10,0) with bulge=1
  // centre (0,0), radius 10, passes through (0,10)
  // Vertical line from (0,-15) to (0,15) crosses the arc at (0,10)
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(0, -15), new Point(0, 15),
      false,
  );
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(10);
});

test('Test intersectSegmentSegment - tangent arc line', () => {
  // CCW semicircular arc from (10,0) to (-10,0), centre (0,0), radius 10
  // Horizontal line y=10 is tangent to the top of the arc at (0,10)
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(-15, 10), new Point(15, 10),
      false,
  );
  expect(result.status).toBe('Tangent');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(10);
});

test('Test intersectSegmentSegment - concentric arcs same radius', () => {
  // Two semicircular arcs with the same centre and radius
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(0, 10, 1), new Point(0, -10),
      false,
  );
  expect(result.status).toBe('Coincident');
  expect(result.points.length).toBe(0);
});

test('Test intersectSegmentSegment - concentric arcs different radius', () => {
  // Two semicircular arcs with the same centre but different radii
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(5, 0, 1), new Point(-5, 0),
      false,
  );
  expect(result.status).toBe('Inside');
  expect(result.points.length).toBe(0);
});

test('Test intersectSegmentSegment - line line', () => {
  // Intersection
  const result = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(-5, 5), new Point(5, 5),
      false,
  );
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Intersection - Extend
  const result1 = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(1, 5), new Point(5, 5),
      true,
  );
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);
  expect(result1.points[0].x).toBeCloseTo(0);
  expect(result1.points[0].y).toBeCloseTo(5);

  // No Intersection - Parallel
  const result2 = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(1, 0), new Point(1, 10),
      false,
  );
  expect(result2.status).toBe('Parallel');
  expect(result2.points.length).toBe(0);

  // No Intersection - Coincident
  const result3 = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(0, 1), new Point(0, 8),
      false,
  );
  expect(result3.status).toBe('Coincident');
  expect(result3.points.length).toBe(1);
});

test('Test intersectPolylinePolyline - polyline line', () => {
  // Intersection
  let points = [new Point(), new Point(0, 10)];
  let polyline = points;
  let line = [new Point(-10, 5), new Point(10, 5)];

  // Test polyline with single segment
  let result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(2, 10), new Point(2, 0));
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[1].x).toBeCloseTo(2);
  expect(result.points[1].y).toBeCloseTo(5);

  // No Intersection
  const line2 = [new Point(5, 0), new Point(5, 10)];
  result = Intersection.intersectPolylinePolyline(polyline, line2, false);
  expect(result.status).toBe('No Intersection');
  expect(result.points.length).toBe(0);

  // Test polyline with 180 degree arc segment - 270 - 90 - negative bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(0, 0, -1), new Point(0, 10)];
  polyline = points;
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(-5);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment - 270 - 90 - positive bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(0, 0, 1), new Point(0, 10)];
  polyline = points;
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - negative bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, -1), new Point(5, 5)];
  polyline = points;
  line = [new Point(-10, 5), new Point(10, 5)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);
  expect(result.points[1].x).toBeCloseTo(-5);
  expect(result.points[1].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - positive bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, 1), new Point(5, 5)];
  polyline = points;
  line = [new Point(-10, 5), new Point(10, 5)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);
  expect(result.points[1].x).toBeCloseTo(-5);
  expect(result.points[1].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - negative bulge - offset line
  // counter clockwise bulge = +ve, clockwise bulge = -ve
  // direction: - ccw > 0, cw <= 0
  points = [new Point(-5, 5, -1), new Point(5, 5)];
  polyline = points;
  line = [new Point(0, 7), new Point(10, 7)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(4.5826);
  expect(result.points[0].y).toBeCloseTo(7);

  // Test polyline with 180 degree arc segment 180 - 0 - positive bulge - offset line
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, 1), new Point(5, 5)];
  polyline = points;
  line = [new Point(0, 7), new Point(10, 7)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('No Intersection');
  expect(result.points.length).toBe(0);
});

test('Test intersectPolylinePolyline with rectangle polyline', () => {
  const points = [new Point(-5, 5), new Point(5, 5)];
  const polyline = points;
  const rectangle = [new Point(), new Point(25, 0), new Point(25, 25), new Point(0, 25), new Point()];

  // Test polyline with single segment
  const result = Intersection.intersectPolylinePolyline(polyline, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(5, 20), new Point(30, 20));
  const result2 = Intersection.intersectPolylinePolyline(polyline, rectangle, false);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBe(2);
  expect(result2.points[0].x).toBeCloseTo(0);
  expect(result2.points[0].y).toBeCloseTo(5);
  expect(result2.points[1].x).toBeCloseTo(25);
  expect(result2.points[1].y).toBeCloseTo(20);

  // Overlapping collinear segments
  const points2 = [new Point(5, 5), new Point(20, 20)];
  const polyline2 = points2;
  const result3 = Intersection.intersectPolylinePolyline(polyline2, [new Point(), new Point(25, 25)], false);
  expect(result3.status).toBe('Intersection');
  expect(result3.points.length).toBe(1);
});

test('Test intersectPolylinePolyline - polyline arc', () => {
  // Intersection - polyline(boundary) vs arc segment(selected)
  const polyline = [new Point(), new Point(0, 25)];
  // Arc segment from (10,10) to (-10,10) with bulge=1
  // This creates a CCW semicircular arc with centre (0,10), radius 10
  const arcPolyline = [new Point(10, 10, 1), new Point(-10, 10)];
  const result = Intersection.intersectPolylinePolyline(polyline, arcPolyline, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(20);
});

test('Test Intersection.intersectPolylinePolyline()', () => {
  // Two crossing polylines with line segments
  const polyline1 = [new Point(-10, 0), new Point(10, 0)];
  const polyline2 = [new Point(0, -10), new Point(0, 10)];

  const result = Intersection.intersectPolylinePolyline(polyline1, polyline2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(0);

  // No intersection
  const polyline3 = [new Point(20, 0), new Point(30, 0)];
  const result2 = Intersection.intersectPolylinePolyline(polyline1, polyline3, false);
  expect(result2.status).toBe('No Intersection');
  expect(result2.points.length).toBe(0);

  // Polyline with arc segment intersecting a line-segment polyline
  // CCW arc from (-5,0) to (5,0) with bulge=1 goes through (0,-5)
  const polyline4 = [new Point(-5, 0, 1), new Point(5, 0)];
  const polyline5 = [new Point(0, -10), new Point(0, -3)];

  const result3 = Intersection.intersectPolylinePolyline(polyline4, polyline5, false);
  expect(result3.status).toBe('Intersection');
  expect(result3.points.length).toBe(1);
  expect(result3.points[0].x).toBeCloseTo(0);
  expect(result3.points[0].y).toBeCloseTo(-5);
});

test('Test intersectPolylinePolyline - polyline arc with extend', () => {
  // Arc: quarter circle from (10,0) to (0,10) centred at origin, radius 10, CCW
  // Represent as polyline with arc segment
  const arcPolyline = [new Point(10, 0, 1), new Point(0, 10)];

  // Polyline crossing the arc
  const polyline = [new Point(0, 0), new Point(15, 15)];

  // Without extend - intersection should be on the arc
  const result1 = Intersection.intersectPolylinePolyline(polyline, arcPolyline, false);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);

  // With extend - all circle intersections returned (not filtered by arc bounds)
  const result2 = Intersection.intersectPolylinePolyline(polyline, arcPolyline, true);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBeGreaterThanOrEqual(1);
});
