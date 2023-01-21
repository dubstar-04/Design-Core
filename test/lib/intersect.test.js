import {Point} from '../../core/entities/point.js';
import {Intersection} from '../../core/lib/intersect';

test('Test Intersection.intersectCircleEllipse()', () => {
  expect(true).toBeTruthy();
  // TODO: intersectCircleEllipse
});

test('Test Intersection.intersectCircleLine()', () => {
  const circle = {centre: new Point(10, 10), radius: 5};
  const line = {start: new Point(), end: new Point(10, 10)};
  const result = Intersection.intersectCircleLine(circle, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(6.46);
  expect(result.points[0].y).toBeCloseTo(6.46);
  // TODO: No Intersection
});

test('Test Intersection.intersectLineCircle()', () => {
  const circle = {centre: new Point(10, 10), radius: 5};
  const line = {start: new Point(), end: new Point(10, 10)};
  const result = Intersection.intersectLineCircle(line, circle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(6.46);
  expect(result.points[0].y).toBeCloseTo(6.46);
  // TODO: No Intersection
});

test('Test Intersection.intersectCircleCircle()', () => {
  const circle1 = {centre: new Point(10, 10), radius: 5};
  const circle2 = {centre: new Point(15, 10), radius: 5};
  const result = Intersection.intersectCircleCircle(circle1, circle2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(12.5);
  expect(result.points[0].y).toBeCloseTo(14.33);
  // TODO: No Intersection
});

test('Test Intersection.intersectCirclePolygon()', () => {
  // Intersection.intersectCirclePolygon(c,r,points);
  expect(true).toBeTruthy();
  // TODO: intersectCirclePolygon
});

test('Test Intersection.intersectArcRectangle()', () => {
  const arc = {centre: new Point(), radius: 14.14, startAngle: 0.785398, endAngle: 2.35619};
  const rectangle = {start: new Point(), end: new Point(25, 25)};
  const result = Intersection.intersectArcRectangle(arc, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);
  // TODO: No Intersection
});

test('Test Intersection.intersectArcLine()', () => {
  const arc = {centre: new Point(), radius: 14.14, startAngle: 0.785398, endAngle: 2.35619};
  const line = {start: new Point(), end: new Point(0, 25)};
  const result = Intersection.intersectArcLine(arc, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);
  // TODO: No Intersection
});

test('Test Intersection.intersectLineArc()', () => {
  const arc = {centre: new Point(), radius: 14.14, startAngle: 0.785398, endAngle: 2.35619};
  const line = {start: new Point(), end: new Point(0, 25)};
  const result = Intersection.intersectLineArc(line, arc, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);
  // TODO: No Intersection
});

test('Test Intersection.intersectCircleArc()', () => {
  const arc = {centre: new Point(), radius: 14.14, startAngle: 0.785398, endAngle: 2.35619};
  const circle = {centre: new Point(10, 10), radius: 5};
  const result = Intersection.intersectCircleArc(circle, arc, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(5.894);
  expect(result.points[0].y).toBeCloseTo(12.853);
  // TODO: No Intersection
});

test('Test Intersection.intersectArcCircle()', () => {
  const arc = {centre: new Point(), radius: 14.14, startAngle: 0.785398, endAngle: 2.35619};
  const circle = {centre: new Point(10, 10), radius: 5};
  const result = Intersection.intersectArcCircle(arc, circle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(5.894);
  expect(result.points[0].y).toBeCloseTo(12.853);
  // TODO: No Intersection
});

test('Test Intersection.intersectCircleRectangle()', () => {
  const arc = {centre: new Point(), radius: 14.14, startAngle: 0.785398, endAngle: 2.35619};
  const rectangle = {start: new Point(), end: new Point(25, 25)};
  const result = Intersection.intersectCircleRectangle(arc, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(14.14);
  expect(result.points[0].y).toBeCloseTo(0);
  // TODO: No Intersection
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
  const line1 = {start: new Point(), end: new Point(0, 10)};
  const line2 = {start: new Point(-5, 5), end: new Point(5, 5)};
  const result = Intersection.intersectLineLine(line1, line2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);
  // TODO: No Intersection
});

test('Test Intersection.intersectPolylineLine()', () => {
  const points = [new Point(), new Point(0, 10)];
  const polyline = {points: points};
  const line = {start: new Point(-5, 5), end: new Point(5, 5)};

  // Test polyline with single segment
  const result = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(2, 10), new Point(2, 0));
  const result2 = Intersection.intersectPolylineLine(polyline, line, false);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBe(2);
  expect(result2.points[1].x).toBeCloseTo(2);
  expect(result2.points[1].y).toBeCloseTo(5);
  // TODO: No Intersection
});

test('Test Intersection.intersectPolylineRectangle()', () => {
  const points = [new Point(-5, 5), new Point(5, 5)];
  const polyline = {points: points};
  const rectangle = {start: new Point(), end: new Point(25, 25)};

  // Test polyline with single segment
  const result = Intersection.intersectPolylineRectangle(polyline, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(5, 20), new Point(30, 20));
  const result2 = Intersection.intersectPolylineRectangle(polyline, rectangle, false);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBe(2);
  expect(result2.points[0].x).toBeCloseTo(25);
  expect(result2.points[0].y).toBeCloseTo(20);
  // TODO: No Intersection
});

test('Test Intersection.intersectLineRectangle()', () => {
  const line1 = {start: new Point(-5, 5), end: new Point(5, 5)};
  const rectangle = {start: new Point(), end: new Point(25, 25)};

  // Test rectangle with single intersection
  const result = Intersection.intersectLineRectangle(line1, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test rectangle with multiple intersections
  const line2 = {start: new Point(-5, 5), end: new Point(30, 20)};
  const result2 = Intersection.intersectLineRectangle(line2, rectangle, false);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBe(2);
  expect(result2.points[0].x).toBeCloseTo(25);
  expect(result2.points[0].y).toBeCloseTo(17.857);
  expect(result2.points[1].x).toBeCloseTo(0);
  expect(result2.points[1].y).toBeCloseTo(7.14);
  // TODO: No Intersection
});

test('Test Intersection.intersectRectangleLine()', () => {
  const line1 = {start: new Point(-5, 5), end: new Point(5, 5)};
  const rectangle = {start: new Point(), end: new Point(25, 25)};

  // Test rectangle with single intersection
  const result = Intersection.intersectRectangleLine(rectangle, line1, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test rectangle with multiple intersections
  const line2 = {start: new Point(-5, 5), end: new Point(30, 20)};
  const result2 = Intersection.intersectRectangleLine(rectangle, line2, false);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBe(2);
  expect(result2.points[0].x).toBeCloseTo(25);
  expect(result2.points[0].y).toBeCloseTo(17.857);
  expect(result2.points[1].x).toBeCloseTo(0);
  expect(result2.points[1].y).toBeCloseTo(7.14);
  // TODO: No Intersection
});

test('Test Intersection.intersectPolygonPolygon()', () => {
  // Intersection.intersectPolygonPolygon(points1,points2);
  expect(true).toBeTruthy();
  // TODO: intersectPolygonPolygon
});

test('Test Intersection.intersectPolygonRectangle()', () => {
  // Intersection.intersectPolygonRectangle(points,r1,r2);
  expect(true).toBeTruthy();
  // TODO: intersectPolygonRectangle
});

test('Test Intersection.intersectRectangleRectangle()', () => {
  const rectangle1 = {start: new Point(), end: new Point(25, 25)};
  const rectangle2 = {start: new Point(10, 10), end: new Point(35, 35)};

  const result = Intersection.intersectRectangleRectangle(rectangle1, rectangle2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(25);
  expect(result.points[0].y).toBeCloseTo(10);
  expect(result.points[1].x).toBeCloseTo(10);
  expect(result.points[1].y).toBeCloseTo(25);
  // TODO: No Intersection
});
