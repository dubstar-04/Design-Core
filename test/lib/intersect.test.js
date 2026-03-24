import { Point } from '../../core/entities/point.js';
import { Intersection } from '../../core/lib/intersect';

test('Test Intersection.intersectCircleEllipse()', () => {
  expect(true).toBeTruthy();
  // TODO: intersectCircleEllipse
});

test('Test Intersection.intersectCircleLine()', () => {
  // Intersection
  const circle = { centre: new Point(10, 10), radius: 5 };
  const line = { start: new Point(), end: new Point(10, 10) };
  const result = Intersection.intersectCircleLine(circle, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(6.46);
  expect(result.points[0].y).toBeCloseTo(6.46);

  // No Intersection - Outside
  const circle1 = { centre: new Point(10, 10), radius: 2 };
  const line1 = { start: new Point(), end: new Point(0, 10) };
  const result1 = Intersection.intersectCircleLine(circle1, line1, false);
  expect(result1.status).toBe('Outside');
  expect(result1.points.length).toBe(0);

  // No Intersection - Inside
  const circle2 = { centre: new Point(), radius: 20 };
  const line2 = { start: new Point(), end: new Point(0, 10) };
  const result2 = Intersection.intersectCircleLine(circle2, line2, false);
  expect(result2.status).toBe('Inside');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectCircleCircle()', () => {
  // Intersection
  const circle1 = { centre: new Point(10, 10), radius: 5 };
  const circle2 = { centre: new Point(15, 10), radius: 5 };
  const result = Intersection.intersectCircleCircle(circle1, circle2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(12.5);
  expect(result.points[0].y).toBeCloseTo(14.33);

  // No Intersection - Inside
  const circle3 = { centre: new Point(10, 10), radius: 5 };
  const circle4 = { centre: new Point(10, 10), radius: 2 };
  const result1 = Intersection.intersectCircleCircle(circle3, circle4, false);
  expect(result1.status).toBe('Inside');
  expect(result1.points.length).toBe(0);

  // No Intersection - Outside
  const circle5 = { centre: new Point(10, 10), radius: 5 };
  const circle6 = { centre: new Point(-10, 10), radius: 2 };
  const result2 = Intersection.intersectCircleCircle(circle5, circle6, false);
  expect(result2.status).toBe('Outside');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectCirclePolygon()', () => {
  // Intersection.intersectCirclePolygon(c,r,points);
  expect(true).toBeTruthy();
  // TODO: intersectCirclePolygon
});

test('Test Intersection.intersectArcLine()', () => {
  // Counter Clockwise Intersection
  const arc = { centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1 };
  const line = { start: new Point(), end: new Point(0, 25) };
  const result = Intersection.intersectArcLine(arc, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);

  // Intersection - Arc straddles 0 with startAngle > endAngle
  const arc1 = { centre: new Point(), radius: 14.14, startPoint: new Point(10, -10), endPoint: new Point(-10, 10), direction: 1 };
  const line1 = { start: new Point(), end: new Point(0, 25) };
  const result1 = Intersection.intersectArcLine(arc1, line1, false);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);
  expect(result1.points[0].x).toBeCloseTo(0);
  expect(result1.points[0].y).toBeCloseTo(14.14);

  // No Intersection
  const arc2 = { centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1 };
  const line2 = { start: new Point(), end: new Point(0, 25) };
  const result2 = Intersection.intersectArcLine(arc2, line2, false);
  expect(result2.status).toBe('No Intersection');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectCircleArc()', () => {
  // Intersection
  const arc = { centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1 };
  const circle = { centre: new Point(10, 10), radius: 5 };
  const result = Intersection.intersectCircleArc(circle, arc, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(5.894);
  expect(result.points[0].y).toBeCloseTo(12.853);

  // No Intersection
  const arc1 = { centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1 };
  const circle1 = { centre: new Point(10, 10), radius: 5 };
  const result1 = Intersection.intersectCircleArc(circle1, arc1, false);
  expect(result1.status).toBe('No Intersection');
  expect(result1.points.length).toBe(0);
});

test('Test Intersection.intersectEllipseEllipse()', () => {
  // Intersection.intersectEllipseEllipse(c1,rx1,ry1,c2,rx2,ry2);
  expect(true).toBeTruthy();
  // TODO: intersectEllipseEllipse
});

test('Test Intersection.intersectEllipseLine()', () => {
  // Intersection.intersectEllipseLine(ellipse,line,extend);
  expect(true).toBeTruthy();
  // TODO: intersectEllipseLine
});

test('Test Intersection.intersectEllipsePolygon()', () => {
  // Intersection.intersectEllipsePolygon(c,rx,ry,points);
  expect(true).toBeTruthy();
  // TODO: intersectEllipsePolygon
});

test('Test Intersection.intersectEllipseRectangle()', () => {
  // Intersection.intersectEllipseRectangle(ellipse,rectangle,extend);
  expect(true).toBeTruthy();
  // TODO: intersectEllipseRectangle
});

test('Test Intersection.intersectLineLine()', () => {
  // Intersection
  const line1 = { start: new Point(), end: new Point(0, 10) };
  const line2 = { start: new Point(-5, 5), end: new Point(5, 5) };
  const result = Intersection.intersectLineLine(line1, line2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Intersection - Extend
  const line3 = { start: new Point(1, 5), end: new Point(5, 5) };
  const result1 = Intersection.intersectLineLine(line1, line3, true);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);
  expect(result1.points[0].x).toBeCloseTo(0);
  expect(result1.points[0].y).toBeCloseTo(5);

  // No Intersection - Parallel
  const line4 = { start: new Point(1, 0), end: new Point(1, 10) };
  const result2 = Intersection.intersectLineLine(line1, line4, false);
  expect(result2.status).toBe('Parallel');
  expect(result2.points.length).toBe(0);

  // No Intersection - Coincident
  const line5 = { start: new Point(0, 1), end: new Point(0, 8) };
  const result3 = Intersection.intersectLineLine(line1, line5, false);
  expect(result3.status).toBe('Coincident');
  expect(result3.points.length).toBe(1);
});

test('Test Intersection.intersectPolylineLine()', () => {
  // Intersection
  let points = [new Point(), new Point(0, 10)];
  let polyline = { points: points };
  let line = { start: new Point(-10, 5), end: new Point(10, 5) };

  // Test polyline with single segment
  let result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(2, 10), new Point(2, 0));
  result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[1].x).toBeCloseTo(2);
  expect(result.points[1].y).toBeCloseTo(5);

  // No Intersection
  const line2 = { start: new Point(5, 0), end: new Point(5, 10) };
  result = Intersection.intersectPolylineLine(polyline, line2, false);
  expect(result.status).toBe('No Intersection');
  expect(result.points.length).toBe(0);

  // Test polyline with 180 degree arc segment - 270 - 90 - negative bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(0, 0, -1), new Point(0, 10)];
  polyline = { points: points };
  result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(-5);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment - 270 - 90 - positive bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(0, 0, 1), new Point(0, 10)];
  polyline = { points: points };
  result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - negative bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, -1), new Point(5, 5)];
  polyline = { points: points };
  line = { start: new Point(-10, 5), end: new Point(10, 5) };
  result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);
  expect(result.points[1].x).toBeCloseTo(-5);
  expect(result.points[1].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - positive bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, 1), new Point(5, 5)];
  polyline = { points: points };
  line = { start: new Point(-10, 5), end: new Point(10, 5) };
  result = Intersection.intersectPolylineLine(polyline, line, false);
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
  polyline = { points: points };
  line = { start: new Point(0, 7), end: new Point(10, 7) };
  result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(4.5826);
  expect(result.points[0].y).toBeCloseTo(7);

  // Test polyline with 180 degree arc segment 180 - 0 - positive bulge - offset line
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, 1), new Point(5, 5)];
  polyline = { points: points };
  line = { start: new Point(0, 7), end: new Point(10, 7) };
  result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('No Intersection');
  expect(result.points.length).toBe(0);
});

test('Test intersectEntities with rectangle polyline', () => {
  const points = [new Point(-5, 5), new Point(5, 5)];
  const polyline = { points: points };
  const rectangle = { points: [new Point(), new Point(25, 0), new Point(25, 25), new Point(0, 25), new Point()] };

  // Test polyline with single segment
  const result = Intersection.intersectEntities(polyline, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(5, 20), new Point(30, 20));
  const result2 = Intersection.intersectEntities(polyline, rectangle, false);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBe(2);
  expect(result2.points[0].x).toBeCloseTo(25);
  expect(result2.points[0].y).toBeCloseTo(20);

  // No Intersection
  const points2 = [new Point(5, 5), new Point(20, 20)];
  const polyline2 = { points: points2 };
  const result3 = Intersection.intersectPolylineLine(polyline2, { start: new Point(), end: new Point(25, 25) }, false);
  expect(result3.status).toBe('Intersection');
  expect(result3.points.length).toBe(1);
});

test('Test Intersection.intersectArcArc()', () => {
  // Counter Clockwise Intersection
  const arc1 = { centre: new Point(5, 0), radius: 10, startPoint: new Point(-5, -10), endPoint: new Point(-5, 10), direction: 1 };
  const arc2 = { centre: new Point(-5, 0), radius: 10, startPoint: new Point(5, 10), endPoint: new Point(5, -10), direction: 1 };
  const result = Intersection.intersectArcArc(arc1, arc2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(-8.66025);
  expect(result.points[1].x).toBeCloseTo(0);
  expect(result.points[1].y).toBeCloseTo(8.66025);

  // No Intersection
  const arc3 = { centre: new Point(5, 0), radius: 10, startPoint: new Point(15, 10), endPoint: new Point(15, -10), direction: 1 };
  const result2 = Intersection.intersectArcArc(arc1, arc3, false);
  expect(result2.status).toBe('No Intersection');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectPolylineArc()', () => {
  // Intersection
  const arc = { centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1 };
  const polyline = { points: [new Point(), new Point(0, 25)] };
  const result = Intersection.intersectPolylineArc(polyline, arc, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);

  // No Intersection
  const arc1 = { centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1 };
  const result1 = Intersection.intersectPolylineArc(polyline, arc1, false);
  expect(result1.status).toBe('No Intersection');
  expect(result1.points.length).toBe(0);
});

test('Test Intersection.intersectPolylineCircle()', () => {
  // Intersection
  const circle = { centre: new Point(0, 0), radius: 5 };
  const polyline = { points: [new Point(), new Point(0, 25)] };
  const result = Intersection.intersectPolylineCircle(polyline, circle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Double Intersection
  const polyline1 = { points: [new Point(0, -25), new Point(0, 25)] };
  const result1 = Intersection.intersectPolylineCircle(polyline1, circle, false);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(2);
  expect(result1.points[0].x).toBeCloseTo(0);
  expect(result1.points[0].y).toBeCloseTo(5);

  expect(result1.points[1].x).toBeCloseTo(0);
  expect(result1.points[1].y).toBeCloseTo(-5);

  // No Intersection
  const circle1 = { centre: new Point(10, 10), radius: 5 };
  const result2 = Intersection.intersectPolylineCircle(polyline, circle1, false);
  expect(result2.status).toBe('No Intersection');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectPolylinePolyline()', () => {
  // Two crossing polylines with line segments
  const polyline1 = { points: [new Point(-10, 0), new Point(10, 0)] };
  const polyline2 = { points: [new Point(0, -10), new Point(0, 10)] };

  const result = Intersection.intersectEntities(polyline1, polyline2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(0);

  // No intersection
  const polyline3 = { points: [new Point(20, 0), new Point(30, 0)] };
  const result2 = Intersection.intersectEntities(polyline1, polyline3, false);
  expect(result2.status).toBe('No Intersection');
  expect(result2.points.length).toBe(0);

  // Polyline with arc segment intersecting a line-segment polyline
  // CCW arc from (-5,0) to (5,0) with bulge=1 goes through (0,-5)
  const polyline4 = { points: [new Point(-5, 0, 1), new Point(5, 0)] };
  const polyline5 = { points: [new Point(0, -10), new Point(0, -3)] };

  const result3 = Intersection.intersectEntities(polyline4, polyline5, false);
  expect(result3.status).toBe('Intersection');
  expect(result3.points.length).toBe(1);
  expect(result3.points[0].x).toBeCloseTo(0);
  expect(result3.points[0].y).toBeCloseTo(-5);
});

test('Test Intersection.intersectPolylineArc() with extend', () => {
  // Arc: quarter circle from (10,0) to (0,10) centred at origin, radius 10, CCW
  const arc = {
    centre: new Point(0, 0),
    startPoint: new Point(10, 0),
    endPoint: new Point(0, 10),
    radius: 10,
    direction: 1,
  };

  // Polyline crossing the arc
  const polyline = { points: [new Point(0, 0), new Point(15, 15)] };

  // Without extend - intersection should be on the arc
  const result1 = Intersection.intersectPolylineArc(polyline, arc, false);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);

  // With extend - all circle intersections returned (not filtered by arc bounds)
  const result2 = Intersection.intersectPolylineArc(polyline, arc, true);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBeGreaterThanOrEqual(1);
});
