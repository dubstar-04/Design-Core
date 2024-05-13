import {Point} from '../../core/entities/point.js';
import {Intersection} from '../../core/lib/intersect';

test('Test Intersection.intersectCircleEllipse()', () => {
  expect(true).toBeTruthy();
  // TODO: intersectCircleEllipse
});

test('Test Intersection.intersectCircleLine()', () => {
  // Intersection
  const circle = {centre: new Point(10, 10), radius: 5};
  const line = {start: new Point(), end: new Point(10, 10)};
  const result = Intersection.intersectCircleLine(circle, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(6.46);
  expect(result.points[0].y).toBeCloseTo(6.46);

  // No Intersection - Outside
  const circle1 = {centre: new Point(10, 10), radius: 2};
  const line1 = {start: new Point(), end: new Point(0, 10)};
  const result1 = Intersection.intersectCircleLine(circle1, line1, false);
  expect(result1.status).toBe('Outside');
  expect(result1.points.length).toBe(0);

  // No Intersection - Inside
  const circle2 = {centre: new Point(), radius: 20};
  const line2 = {start: new Point(), end: new Point(0, 10)};
  const result2 = Intersection.intersectCircleLine(circle2, line2, false);
  expect(result2.status).toBe('Inside');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectLineCircle()', () => {
  // Intersection
  const circle = {centre: new Point(10, 10), radius: 5};
  const line = {start: new Point(), end: new Point(10, 10)};
  const result = Intersection.intersectLineCircle(line, circle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(6.46);
  expect(result.points[0].y).toBeCloseTo(6.46);

  // No Intersection - Outside
  const circle1 = {centre: new Point(10, 10), radius: 2};
  const line1 = {start: new Point(), end: new Point(0, 10)};
  const result1 = Intersection.intersectLineCircle(line1, circle1, false);
  expect(result1.status).toBe('Outside');
  expect(result1.points.length).toBe(0);

  // No Intersection - Inside
  const circle2 = {centre: new Point(), radius: 20};
  const line2 = {start: new Point(), end: new Point(0, 10)};
  const result2 = Intersection.intersectLineCircle(line2, circle2, false);
  expect(result2.status).toBe('Inside');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectCircleCircle()', () => {
  // Intersection
  const circle1 = {centre: new Point(10, 10), radius: 5};
  const circle2 = {centre: new Point(15, 10), radius: 5};
  const result = Intersection.intersectCircleCircle(circle1, circle2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(12.5);
  expect(result.points[0].y).toBeCloseTo(14.33);

  // No Intersection - Inside
  const circle3 = {centre: new Point(10, 10), radius: 5};
  const circle4 = {centre: new Point(10, 10), radius: 2};
  const result1 = Intersection.intersectCircleCircle(circle3, circle4, false);
  expect(result1.status).toBe('Inside');
  expect(result1.points.length).toBe(0);

  // No Intersection - Outside
  const circle5 = {centre: new Point(10, 10), radius: 5};
  const circle6 = {centre: new Point(-10, 10), radius: 2};
  const result2 = Intersection.intersectCircleCircle(circle5, circle6, false);
  expect(result2.status).toBe('Outside');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectCirclePolygon()', () => {
  // Intersection.intersectCirclePolygon(c,r,points);
  expect(true).toBeTruthy();
  // TODO: intersectCirclePolygon
});

test('Test Intersection.intersectArcRectangle()', () => {
  // Intersection
  const arc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1};
  const rectangle = {start: new Point(), end: new Point(25, 25)};
  const result = Intersection.intersectArcRectangle(arc, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);

  // No Intersection
  const arc1 = {centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1};
  const rectangle1 = {start: new Point(), end: new Point(25, 25)};
  const result1 = Intersection.intersectArcRectangle(arc1, rectangle1, false);
  expect(result1.status).toBe('No Intersection');
  expect(result1.points.length).toBe(0);
});

test('Test Intersection.intersectArcLine()', () => {
  // Counter Clockwise Intersection
  const arc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1};
  const line = {start: new Point(), end: new Point(0, 25)};
  const result = Intersection.intersectArcLine(arc, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);

  // Intersection - Arc straddles 0 with startAngle > endAngle
  const arc1 = {centre: new Point(), radius: 14.14, startPoint: new Point(10, -10), endPoint: new Point(-10, 10), direction: 1};
  const line1 = {start: new Point(), end: new Point(0, 25)};
  const result1 = Intersection.intersectArcLine(arc1, line1, false);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);
  expect(result1.points[0].x).toBeCloseTo(0);
  expect(result1.points[0].y).toBeCloseTo(14.14);

  // No Intersection
  const arc2 = {centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1};
  const line2 = {start: new Point(), end: new Point(0, 25)};
  const result2 = Intersection.intersectArcLine(arc2, line2, false);
  expect(result2.status).toBe('No Intersection');
  expect(result2.points.length).toBe(0);
});

test('Test Intersection.intersectLineArc()', () => {
  // Intersection
  const arc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1};
  const line = {start: new Point(), end: new Point(0, 25)};
  const result = Intersection.intersectLineArc(line, arc, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(14.14);

  // No Intersection
  const arc1 = {centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1};
  const line1 = {start: new Point(), end: new Point(0, 25)};
  const result1 = Intersection.intersectLineArc(line1, arc1, false);
  expect(result1.status).toBe('No Intersection');
  expect(result1.points.length).toBe(0);
});

test('Test Intersection.intersectCircleArc()', () => {
  // Intersection
  console.log('this one');
  const arc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1};
  const circle = {centre: new Point(10, 10), radius: 5};
  const result = Intersection.intersectCircleArc(circle, arc, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(5.894);
  expect(result.points[0].y).toBeCloseTo(12.853);

  // No Intersection
  const arc1 = {centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1};
  const circle1 = {centre: new Point(10, 10), radius: 5};
  const result1 = Intersection.intersectCircleArc(circle1, arc1, false);
  expect(result1.status).toBe('No Intersection');
  expect(result1.points.length).toBe(0);
});

test('Test Intersection.intersectArcCircle()', () => {
  // Intersection
  const arc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10)};
  const circle = {centre: new Point(10, 10), radius: 5};
  const result = Intersection.intersectArcCircle(arc, circle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(12.853);
  expect(result.points[0].y).toBeCloseTo(5.894);


  // Clockwise Arc Intersection
  const cwArc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: -1};
  const cwResult = Intersection.intersectArcCircle(cwArc, circle, false);
  expect(cwResult.status).toBe('Intersection');
  expect(cwResult.points.length).toBe(1);
  expect(cwResult.points[0].x).toBeCloseTo(12.853);
  expect(cwResult.points[0].y).toBeCloseTo(5.894);

  // Counter Clockwise Arc No Intersection
  const arc1 = {centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(0, -10), direction: 1};
  const circle1 = {centre: new Point(10, 10), radius: 5};
  const result1 = Intersection.intersectArcCircle(arc1, circle1, false);
  expect(result1.status).toBe('No Intersection');
  expect(result1.points.length).toBe(0);
});

test('Test Intersection.intersectCircleRectangle()', () => {
  // Intersection
  const circle = {centre: new Point(), radius: 14.14};
  const rectangle = {start: new Point(), end: new Point(25, 25)};
  const result = Intersection.intersectCircleRectangle(circle, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(14.14);
  expect(result.points[0].y).toBeCloseTo(0);

  // No Intersection - Outside
  const circle1 = {centre: new Point(12.5, 12.5), radius: 10};
  const rectangle1 = {start: new Point(), end: new Point(25, 25)};
  const result1 = Intersection.intersectCircleRectangle(circle1, rectangle1, false);
  expect(result1.status).toBe('Outside');
  expect(result1.points.length).toBe(0);

  // No Intersection - Inside
  const circle2 = {centre: new Point(12.5, 12.5), radius: 100};
  const rectangle2 = {start: new Point(), end: new Point(25, 25)};
  const result2 = Intersection.intersectCircleRectangle(circle2, rectangle2, false);
  expect(result2.status).toBe('Inside');
  expect(result2.points.length).toBe(0);
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
  const line1 = {start: new Point(), end: new Point(0, 10)};
  const line2 = {start: new Point(-5, 5), end: new Point(5, 5)};
  const result = Intersection.intersectLineLine(line1, line2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Intersection - Extend
  const line3 = {start: new Point(1, 5), end: new Point(5, 5)};
  const result1 = Intersection.intersectLineLine(line1, line3, true);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);
  expect(result1.points[0].x).toBeCloseTo(0);
  expect(result1.points[0].y).toBeCloseTo(5);

  // No Intersection - Parallel
  const line4 = {start: new Point(1, 0), end: new Point(1, 10)};
  const result2 = Intersection.intersectLineLine(line1, line4, false);
  expect(result2.status).toBe('Parallel');
  expect(result2.points.length).toBe(0);

  // No Intersection - Coincident
  const line5 = {start: new Point(0, 1), end: new Point(0, 8)};
  const result3 = Intersection.intersectLineLine(line1, line5, false);
  expect(result3.status).toBe('Coincident');
  expect(result3.points.length).toBe(0);
});

test('Test Intersection.intersectPolylineLine()', () => {
  // Intersection
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

  // No Intersection
  const line2 = {start: new Point(5, 0), end: new Point(5, 10)};
  const result3 = Intersection.intersectPolylineLine(polyline, line2, false);
  expect(result3.status).toBe('No Intersection');
  expect(result3.points.length).toBe(0);
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

  // No Intersection
  const points2 = [new Point(5, 5), new Point(20, 20)];
  const polyline2 = {points: points2};
  const result3 = Intersection.intersectPolylineLine(polyline2, rectangle, false);
  expect(result3.status).toBe('No Intersection');
  expect(result3.points.length).toBe(0);
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

  // No Intersection
  const line3 = {start: new Point(5, 5), end: new Point(20, 20)};
  const result3 = Intersection.intersectLineRectangle(line3, rectangle, false);
  expect(result3.status).toBe('No Intersection');
  expect(result3.points.length).toBe(0);
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

  // No Intersection
  const line3 = {start: new Point(5, 5), end: new Point(20, 20)};
  const result3 = Intersection.intersectRectangleLine(rectangle, line3, false);
  expect(result3.status).toBe('No Intersection');
  expect(result3.points.length).toBe(0);
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

  // No Intersection
  const rectangle3 = {start: new Point(10, 10), end: new Point(20, 20)};
  const result2 = Intersection.intersectRectangleRectangle(rectangle1, rectangle3, false);
  expect(result2.status).toBe('No Intersection');
  expect(result2.points.length).toBe(0);
});
