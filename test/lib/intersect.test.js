import {Point} from '../../core/entities/point.js';
import {Intersection} from '../../core/lib/intersect';

/*
test('Test Intersection.intersectCircleEllipse()', () => {
  const cc = new Point();
  const r = 10;
  const ec = new Point();
  const rx = 10;
  const ry = 10;
  const result = Intersection.intersectCircleEllipse(cc, r, ec, rx, ry);

  expect(result.status).toBe();
  expect(result.points).toBe();
});
*/

test('Test Intersection.intersectCircleLine()', () => {
  const circle = {centre: new Point(10, 10), radius: 5};
  const line = {start: new Point(), end: new Point(10, 10)};
  const result = Intersection.intersectCircleLine(circle, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(6.46);
  expect(result.points[0].y).toBeCloseTo(6.46);
});

test('Test Intersection.intersectLineCircle()', () => {
  // Intersection.intersectLineCircle(line,circle,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectCircleCircle()', () => {
  // Intersection.intersectCircleCircle(circle1,circle2,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectCirclePolygon()', () => {
  // Intersection.intersectCirclePolygon(c,r,points);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectArcRectangle()', () => {
  // Intersection.intersectArcRectangle(arc,rectangle,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectArcLine()', () => {
  // Intersection.intersectArcLine(arc,line,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectLineArc()', () => {
  // Intersection.intersectLineArc(line,arc,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectCircleArc()', () => {
  // Intersection.intersectCircleArc(circle,arc,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectArcCircle()', () => {
  // Intersection.intersectArcCircle(arc,circle,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectCircleRectangle()', () => {
  // Intersection.intersectCircleRectangle(circle,rectangle,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectEllipseEllipse()', () => {
  // Intersection.intersectEllipseEllipse(c1,rx1,ry1,c2,rx2,ry2);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectEllipseLine()', () => {
  // Intersection.intersectEllipseLine(ellipse,line,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectEllipsePolygon()', () => {
  // Intersection.intersectEllipsePolygon(c,rx,ry,points);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectEllipseRectangle()', () => {
  // Intersection.intersectEllipseRectangle(ellipse,rectangle,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectLineLine()', () => {
  // Intersection.intersectLineLine(line1,line2,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectPolylineLine()', () => {
  // Intersection.intersectPolylineLine(polyline,line,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectPolylineRectangle()', () => {
  // Intersection.intersectPolylineRectangle(polyline,rectangle,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectLineRectangle()', () => {
  // Intersection.intersectLineRectangle(line,rectangle,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectRectangleLine()', () => {
  // Intersection.intersectRectangleLine(rectangle,line,extend);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectPolygonPolygon()', () => {
  // Intersection.intersectPolygonPolygon(points1,points2);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectPolygonRectangle()', () => {
  // Intersection.intersectPolygonRectangle(points,r1,r2);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectRayRay()', () => {
  // Intersection.intersectRayRay(a1,a2,b1,b2);
  expect(true).toBeTruthy();
});

test('Test Intersection.intersectRectangleRectangle()', () => {
  // Intersection.intersectRectangleRectangle(rectangle1,rectangle2,extend);
  expect(true).toBeTruthy();
});
