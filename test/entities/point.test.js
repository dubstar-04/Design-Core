
import { Point } from '../../core/entities/point.js';


test('Test Point.add', () => {
  const pt1 = new Point(10, 10);

  const pt2 = new Point(20, 20);
  const result1 = pt1.add(pt2);
  expect(result1.x).toBe(30);
  expect(result1.y).toBe(30);

  const pt3 = new Point(-20, -20);
  const result2 = pt1.add(pt3);
  expect(result2.x).toBe(-10);
  expect(result2.y).toBe(-10);
});


test('Test Point.subtract', () => {
  const pt1 = new Point(10, 10);

  const pt2 = new Point(5, 5);
  const result1 = pt1.subtract(pt2);
  expect(result1.x).toBe(5);
  expect(result1.y).toBe(5);


  const pt3 = new Point(-5, -5);
  const result2 = pt1.subtract(pt3);
  expect(result2.x).toBe(15);
  expect(result2.y).toBe(15);
});


test('Test Point.angle', () => {
  const pt1 = new Point();

  /* 0 degrees */
  expect(pt1.angle(new Point(10, 0))).toBe(0);

  /* 22.5 degrees */
  expect(pt1.angle(new Point(13.065629648764, 5.411961001462))).toBeCloseTo(Math.PI / 8);

  /* 45 degrees */
  expect(pt1.angle(new Point(10, 10))).toBe(Math.PI / 4);

  /* 90 degrees */
  expect(pt1.angle(new Point(0, 10))).toBe(Math.PI / 2);

  /* 180 degrees */
  expect(pt1.angle(new Point(-10, 0))).toBe(Math.PI);

  /* 270 degrees */
  expect(pt1.angle(new Point(0, -10))).toBe(Math.PI * 1.5);
});

test('Test Point.clone', () => {
  const pt1 = new Point(10, 10);

  const clone1 = pt1.clone();
  expect(clone1.x).toBe(pt1.x);
  expect(clone1.y).toBe(pt1.y);
});

test('Test Point.distance', () => {
  const pt1 = new Point();

  const pt2 = new Point(10, 0);
  expect(pt1.distance(pt2)).toBe(10);

  const pt3 = new Point(10, 10);
  expect(pt1.distance(pt3)).toBeCloseTo(14.14);

  const pt4 = new Point(-10, -10);
  expect(pt1.distance(pt4)).toBeCloseTo(14.14);
});

test('Test Point.dot', () => {
  const pt1 = new Point(10, 10);

  const pt2 = new Point(10, 10);
  expect(pt1.dot(pt2)).toBe(200);

  const pt3 = new Point(-10, -10);
  expect(pt1.dot(pt3)).toBe(-200);
});

test('Test Point.cross', () => {
  // Perpendicular vectors
  const pt1 = new Point(1, 0);
  const pt2 = new Point(0, 1);
  expect(pt1.cross(pt2)).toBe(1);

  // Reversed order negates the result
  expect(pt2.cross(pt1)).toBe(-1);

  // Parallel vectors
  const pt3 = new Point(2, 0);
  expect(pt1.cross(pt3)).toBe(0);
});

test('Test Point.mirror', () => {
  // Mirror across the X axis (y=0 line: from (0,0) to (1,0))
  const xAxisPt1 = new Point(0, 0);
  const xAxisPt2 = new Point(1, 0);
  const pt1 = new Point(3, 4);
  const r1 = pt1.mirror(xAxisPt1, xAxisPt2);
  expect(r1.x).toBeCloseTo(3);
  expect(r1.y).toBeCloseTo(-4);

  // Mirror across the Y axis (x=0 line: from (0,0) to (0,1))
  const yAxisPt1 = new Point(0, 0);
  const yAxisPt2 = new Point(0, 1);
  const pt2 = new Point(5, 3);
  const r2 = pt2.mirror(yAxisPt1, yAxisPt2);
  expect(r2.x).toBeCloseTo(-5);
  expect(r2.y).toBeCloseTo(3);

  // Mirror across a diagonal line y=x (from (0,0) to (1,1))
  const diagPt1 = new Point(0, 0);
  const diagPt2 = new Point(1, 1);
  const pt3 = new Point(3, 0);
  const r3 = pt3.mirror(diagPt1, diagPt2);
  expect(r3.x).toBeCloseTo(0);
  expect(r3.y).toBeCloseTo(3);

  // A point on the mirror line is unchanged
  const pt4 = new Point(2, 0);
  const r4 = pt4.mirror(xAxisPt1, xAxisPt2);
  expect(r4.x).toBeCloseTo(2);
  expect(r4.y).toBeCloseTo(0);

  // Mirror across an offset vertical line (x=5)
  const vPt1 = new Point(5, 0);
  const vPt2 = new Point(5, 1);
  const pt5 = new Point(3, 2);
  const r5 = pt5.mirror(vPt1, vPt2);
  expect(r5.x).toBeCloseTo(7);
  expect(r5.y).toBeCloseTo(2);

  // Bulge is negated (arc direction reverses)
  const pt6 = new Point(3, 4, 0.5, 10);
  const r6 = pt6.mirror(xAxisPt1, xAxisPt2);
  expect(r6.bulge).toBeCloseTo(-0.5);
  expect(r6.sequence).toBe(10);

  // Degenerate mirror line (pt1 === pt2) returns a clone of the point unchanged
  const ptDegen = new Point(7, 8, 0.25, 3);
  const samePt = new Point(5, 5);
  const rDegen = ptDegen.mirror(samePt, samePt);
  expect(rDegen.x).toBeCloseTo(7);
  expect(rDegen.y).toBeCloseTo(8);
  expect(rDegen.bulge).toBeCloseTo(0.25);
  expect(rDegen.sequence).toBe(3);
});

test('Test Point.rotate', () => {
  const centre = new Point();

  /* 90 degrees */
  const pt1 = new Point(10, 0);
  const result1 = pt1.rotate(centre, Math.PI / 2);
  expect(result1.x).toBeCloseTo(0, 5);
  expect(result1.y).toBeCloseTo(10, 5);

  /* -90 degrees */
  const pt2 = new Point(-10, 0);
  const result2 = pt2.rotate(centre, -Math.PI / 2);
  expect(result2.x).toBeCloseTo(0, 5);
  expect(result2.y).toBeCloseTo(10, 5);


  /* 180 degrees */
  const offsetCentre = new Point(10, 10);
  const pt3 = new Point(-10, -10);
  const result3 = pt3.rotate(offsetCentre, Math.PI);
  expect(result3.x).toBeCloseTo(30, 5);
  expect(result3.y).toBeCloseTo(30, 5);
});

test('Test Point.length', () => {
  expect(new Point(3, 4).length()).toBe(5);
  expect(new Point(5, 0).length()).toBe(5);
  expect(new Point(0, -7).length()).toBe(7);
  expect(new Point(0, 0).length()).toBe(0);
  expect(new Point(1, 1).length()).toBeCloseTo(Math.SQRT2);
});

test('Test Point.normalise', () => {
  // Axis-aligned vector: (5, 0) → (1, 0)
  const pt1 = new Point(5, 0);
  const r1 = pt1.normalise();
  expect(r1.x).toBeCloseTo(1);
  expect(r1.y).toBeCloseTo(0);

  // Axis-aligned vector: (0, -3) → (0, -1)
  const pt2 = new Point(0, -3);
  const r2 = pt2.normalise();
  expect(r2.x).toBeCloseTo(0);
  expect(r2.y).toBeCloseTo(-1);

  // Diagonal vector: (3, 4) has length 5 → (0.6, 0.8)
  const pt3 = new Point(3, 4);
  const r3 = pt3.normalise();
  expect(r3.x).toBeCloseTo(0.6);
  expect(r3.y).toBeCloseTo(0.8);

  // Result is a unit vector: length = 1
  const pt4 = new Point(7, -24);
  const r4 = pt4.normalise();
  expect(Math.sqrt(r4.x ** 2 + r4.y ** 2)).toBeCloseTo(1);

  // Zero vector: returns (0, 0) rather than NaN
  const pt5 = new Point(0, 0);
  const r5 = pt5.normalise();
  expect(r5.x).toBe(0);
  expect(r5.y).toBe(0);
});

test('Test Point.scale', () => {
  // Scale by positive factor
  const pt1 = new Point(3, 4);
  const r1 = pt1.scale(2);
  expect(r1.x).toBeCloseTo(6);
  expect(r1.y).toBeCloseTo(8);

  // Scale by fractional factor
  const pt2 = new Point(10, -5);
  const r2 = pt2.scale(0.5);
  expect(r2.x).toBeCloseTo(5);
  expect(r2.y).toBeCloseTo(-2.5);

  // Scale by zero → origin
  const pt3 = new Point(7, -3);
  const r3 = pt3.scale(0);
  expect(r3.x).toBeCloseTo(0);
  expect(r3.y).toBeCloseTo(0);

  // Scale by negative factor
  const pt4 = new Point(1, 2);
  const r4 = pt4.scale(-3);
  expect(r4.x).toBeCloseTo(-3);
  expect(r4.y).toBeCloseTo(-6);
});

test('Test Point.scaleFrom', () => {
  const base = new Point();

  // Scale by 2 from origin
  const pt1 = new Point(5, 0);
  const r1 = pt1.scaleFrom(base, 2);
  expect(r1.x).toBeCloseTo(10);
  expect(r1.y).toBeCloseTo(0);

  // Scale by 0.5 from origin
  const pt2 = new Point(0, 10);
  const r2 = pt2.scaleFrom(base, 0.5);
  expect(r2.x).toBeCloseTo(0);
  expect(r2.y).toBeCloseTo(5);

  // Scale by 1 leaves point unchanged
  const pt3 = new Point(3, 7);
  const r3 = pt3.scaleFrom(base, 1);
  expect(r3.x).toBeCloseTo(3);
  expect(r3.y).toBeCloseTo(7);

  // Scale from an offset base point
  const offsetBase = new Point(10, 10);
  const pt4 = new Point(20, 10);
  const r4 = pt4.scaleFrom(offsetBase, 2);
  expect(r4.x).toBeCloseTo(30);
  expect(r4.y).toBeCloseTo(10);

  // Scale by 0 collapses point onto base
  const pt5 = new Point(5, 5);
  const r5 = pt5.scaleFrom(offsetBase, 0);
  expect(r5.x).toBeCloseTo(10);
  expect(r5.y).toBeCloseTo(10);

  // Preserves bulge and sequence
  const pt6 = new Point(4, 0, 0.5, 10);
  const r6 = pt6.scaleFrom(base, 2);
  expect(r6.x).toBeCloseTo(8);
  expect(r6.y).toBeCloseTo(0);
  expect(r6.bulge).toBe(0.5);
  expect(r6.sequence).toBe(10);
});

test('Test Point.min', () => {
  const pt1 = new Point(10, 10);

  const pt2 = new Point(20, 20);
  const result1 = pt1.min(pt2);
  expect(result1.x).toBe(10);
  expect(result1.y).toBe(10);

  const pt3 = new Point(-20, -20);
  const result2 = pt1.min(pt3);
  expect(result2.x).toBe(-20);
  expect(result2.y).toBe(-20);

  const pt4 = new Point(-20, 20);
  const result3 = pt1.min(pt4);
  expect(result3.x).toBe(-20);
  expect(result3.y).toBe(10);
});

test('Test Point.max', () => {
  const pt1 = new Point(10, 10);

  const pt2 = new Point(20, 20);
  const result1 = pt1.max(pt2);
  expect(result1.x).toBe(20);
  expect(result1.y).toBe(20);

  const pt3 = new Point(-20, -20);
  const result2 = pt1.max(pt3);
  expect(result2.x).toBe(10);
  expect(result2.y).toBe(10);

  const pt4 = new Point(-20, 20);
  const result3 = pt1.max(pt4);
  expect(result3.x).toBe(10);
  expect(result3.y).toBe(20);
});


test('Test Point.midPoint', () => {
  const pt1 = new Point();

  const pt2 = new Point(10, 10);
  const mid1 = pt1.midPoint(pt2);
  expect(mid1.x).toBe(5);
  expect(mid1.y).toBe(5);

  const pt3 = new Point(-10, -10);
  const mid2 = pt1.midPoint(pt3);
  expect(mid2.x).toBe(-5);
  expect(mid2.y).toBe(-5);

  const mid3 = pt2.midPoint(pt3);
  expect(mid3.x).toBe(0);
  expect(mid3.y).toBe(0);
});


test('Test Point.lerp', () => {
  const pt1 = new Point();

  const pt2 = new Point(10, 10);
  const mid1 = pt1.lerp(pt2, 0.5);
  expect(mid1.x).toBe(5);
  expect(mid1.y).toBe(5);

  const pt3 = new Point(-10, -10);
  const mid2 = pt1.lerp(pt3, 0.5);
  expect(mid2.x).toBe(-5);
  expect(mid2.y).toBe(-5);

  const mid3 = pt2.lerp(pt3, 0.5);
  expect(mid3.x).toBe(0);
  expect(mid3.y).toBe(0);
});

test('Test Point.project', () => {
  const pt1 = new Point();

  /* 0 degrees */
  const project1 = pt1.project(0, 10);
  expect(project1.x).toBe(10);
  expect(project1.y).toBe(0);

  /* 45 degrees */
  const project2 = pt1.project(Math.PI / 4, 10);
  expect(project2.x).toBeCloseTo(7.07);
  expect(project2.y).toBeCloseTo(7.07);

  /* 90 degrees */
  const project3 = pt1.project(Math.PI / 2, 10);
  expect(project3.x).toBeCloseTo(0);
  expect(project3.y).toBeCloseTo(10);

  /* -90 degrees */
  const project4 = pt1.project(-Math.PI / 2, 10);
  expect(project4.x).toBeCloseTo(0);
  expect(project4.y).toBeCloseTo(-10);

  /* 180 degrees */
  const project5 = pt1.project(Math.PI, 10);
  expect(project5.x).toBeCloseTo(-10);
  expect(project5.y).toBeCloseTo(0);

  /* 270 degrees */
  const project6 = pt1.project(Math.PI * 1.5, 10);
  expect(project6.x).toBeCloseTo(0);
  expect(project6.y).toBeCloseTo(-10);

  const pt2 = new Point(100, 100);
  /* Non-zero 45 degrees */
  const project7 = pt2.project(Math.PI / 4, 100);
  expect(project7.x).toBeCloseTo(170.710);
  expect(project7.y).toBeCloseTo(170.710);
});


test('Test Point.perpendicular', () => {
  const lineStart1 = new Point(-10, 0);
  const lineEnd1 = new Point(10, 0);

  const pt1 = new Point();
  const perp1 = pt1.perpendicular(lineStart1, lineEnd1);
  expect(perp1.x).toBe(0);
  expect(perp1.y).toBe(0);

  const pt2 = new Point(5, 5);
  const perp2 = pt2.perpendicular(lineStart1, lineEnd1);
  expect(perp2.x).toBe(5);
  expect(perp2.y).toBe(0);

  const pt3 = new Point(-5, -5);
  const perp3 = pt3.perpendicular(lineStart1, lineEnd1);
  expect(perp3.x).toBe(-5);
  expect(perp3.y).toBe(0);

  const pt4 = new Point(15, 15);
  const perp4 = pt4.perpendicular(lineStart1, lineEnd1);
  expect(perp4.x).toBe(15);
  expect(perp4.y).toBe(0);
});


test('Test Point.isSame', () => {
  const pt1 = new Point();

  const pt2 = new Point();
  expect(pt1.isSame(pt2)).toBe(true);

  const pt3 = new Point(10, 10);
  expect(pt2.isSame(pt3)).toBe(false);
});


test('Test Point.closestPointOnLine', () => {
  const lineStart1 = new Point(-10, 0);
  const lineEnd1 = new Point(10, 0);

  const pt1 = new Point();
  const perp1 = pt1.closestPointOnLine(lineStart1, lineEnd1);
  expect(perp1.x).toBe(0);
  expect(perp1.y).toBe(0);

  const pt2 = new Point(5, 5);
  const perp2 = pt2.closestPointOnLine(lineStart1, lineEnd1);
  expect(perp2.x).toBe(5);
  expect(perp2.y).toBe(0);

  const pt3 = new Point(-5, -5);
  const perp3 = pt3.closestPointOnLine(lineStart1, lineEnd1);
  expect(perp3.x).toBe(-5);
  expect(perp3.y).toBe(0);

  const pt4 = new Point(15, 15);
  const perp4 = pt4.closestPointOnLine(lineStart1, lineEnd1);
  expect(perp4).toBe(lineEnd1);
});

test('Test Point.closestPointOnArc', () => {
  // clockwise 270 degrees 45 - 135
  // direction: ccw > 0, cw <= 0
  let arc = { centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10) };

  let point = new Point(5, 5);
  let closest = point.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(closest.x).toBe(10);
  expect(closest.y).toBe(10);

  point = new Point(0, 5);
  closest = point.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(closest).toBe(null);

  point = new Point(20, 10);
  closest = point.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre, 0);
  expect(closest.x).toBeCloseTo(12.649);
  expect(closest.y).toBeCloseTo(6.3245);

  // test circle i.e. start and end points are the same
  point = new Point(5, 5);
  const onCircle = point.closestPointOnArc(arc.startPoint, arc.startPoint, arc.centre);
  expect(onCircle.x).toBe(10);
  expect(onCircle.y).toBe(10);


  // counter clockwise 90 degrees 45 - 135
  // direction: ccw > 0, cw <= 0
  arc = { centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1 };

  point = new Point(5, 5);
  closest = point.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(closest.x).toBe(10);
  expect(closest.y).toBe(10);

  point = new Point(0, 10);
  closest = point.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(closest.x).toBeCloseTo(0);
  expect(closest.y).toBeCloseTo(14.14);
});


test('Test Point.isOnArc', () => {
  // clockwise arc 270: 45 - 135
  // direction: ccw > 0, cw <= 0
  let arc = { centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10) };

  let point = new Point(5, 5);
  let onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(onArc).toBe(true);

  point = new Point(0, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(onArc).toBe(false);

  point = new Point(20, 10);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(onArc).toBe(true);

  point = new Point(0, 14.14);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(onArc).toBe(false);


  // clockwise arc 90 degrees: 45 - 135
  // direction: ccw > 0, cw <= 0
  arc = { centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10), direction: 1 };

  point = new Point(5, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(0, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(20, 10);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(false);

  point = new Point(0, 14.14);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  // counter clockwise arc 270 degrees: 135 - 45
  // direction: ccw > 0, cw <= 0
  arc = { centre: new Point(), radius: 14.14, startPoint: new Point(-10, 10), endPoint: new Point(10, 10), direction: 1 };

  point = new Point(5, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(0, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(false);

  point = new Point(20, 10);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(0, 14.14);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(false);


  // clockwise arc 180 degrees: 180 - 0
  // direction: ccw > 0, cw <= 0
  arc = { centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(10, 0), direction: 0 };


  point = new Point(5, 0);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(-5, 0);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(5, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(0, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(-5, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(5, -5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(false);

  // Counter clockwise arc 180 degrees: 180 - 0
  // direction: ccw > 0, cw <= 0
  arc = { centre: new Point(), radius: 14.14, startPoint: new Point(-10, 0), endPoint: new Point(10, 0), direction: 1 };

  point = new Point(5, 0);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(-5, 0);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  point = new Point(5, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(false);

  point = new Point(0, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(false);

  point = new Point(-5, 5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(false);

  point = new Point(5, -5);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);

  // clockwise arc 180 degrees: 180 - 0
  // direction: ccw > 0, cw <= 0
  arc = { centre: new Point(0, 5), radius: 5, startPoint: new Point(-5, 5), endPoint: new Point(5, 5), direction: -1 };
  point = new Point(5, 7);
  onArc = point.isOnArc(arc.startPoint, arc.endPoint, arc.centre, arc.direction);
  expect(onArc).toBe(true);
});

test('Test Point.isOnLine', () => {
  const lineStart1 = new Point(-10, 0);
  const lineEnd1 = new Point(10, 0);

  const pt1 = new Point();
  const isOnLine1 = pt1.isOnLine(lineStart1, lineEnd1);
  expect(isOnLine1).toBe(true);

  const pt3 = new Point(5, 0);
  const isOnLine2 = pt3.isOnLine(lineStart1, lineEnd1);
  expect(isOnLine2).toBe(true);

  const pt4 = new Point(-5, 0);
  const isOnLine3 = pt4.isOnLine(lineStart1, lineEnd1);
  expect(isOnLine3).toBe(true);

  const pt5 = new Point(20, 10);
  const isOnLine4 = pt5.isOnLine(lineStart1, lineEnd1);
  expect(isOnLine4).toBe(false);
});


test('Test Point.isInRectangle', () => {
  let pt = new Point(5, 5);
  const bl = new Point(0, 0);
  const br = new Point(10, 0);
  const tr = new Point(10, 10);
  const tl = new Point(0, 10);

  const isInRect = pt.isInRectangle(bl, br, tr, tl);
  expect(isInRect).toBe(true);

  // not in rectangle
  pt = new Point(-5, 5);
  const notInRect = pt.isInRectangle(bl, br, tr, tl);
  expect(notInRect).toBe(false);

  // on edge of rectangle
  pt = new Point(0, 0);
  const onEdgeRect = pt.isInRectangle(bl, br, tr, tl);
  expect(onEdgeRect).toBe(true);

  // rotated rectangle
  pt = new Point(0, 5);
  const bl2 = new Point(0, 0);
  const br2 = new Point(7, 7);
  const tr2 = new Point(0, 10);
  const tl2 = new Point(-7, 7);
  const isInRotatedRect = pt.isInRectangle(bl2, br2, tr2, tl2);
  expect(isInRotatedRect).toBe(true);
});


test('Test Point.bulgeAngle', () => {
  const angle = Math.PI;
  const bulge = Math.tan(angle / 4);

  const point = new Point();
  point.bulge = bulge;


  expect(point.bulgeAngle()).toBe(angle);
});

test('Test Point.bulgeRadius', () => {
  // start point: 100,0
  // centre: 100,50
  // radius: 50
  const point = new Point(100, 0);

  // bulge: 0
  expect(point.bulgeRadius(new Point(200, 0))).toBe(0);

  // included angle: 45
  // end point: 135.3553, 14.6447
  let angle = Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(135.3553, 14.6447))).toBeCloseTo(50);

  // included angle: 45
  // end point: 135.3553, -14.6447
  angle = -Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(135.3553, -14.6447))).toBeCloseTo(50);

  // included angle: 90
  // end point: 150, 50
  angle = Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(150, 50))).toBeCloseTo(50);

  // included angle: 90
  // end point: 150, -50
  angle = -Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(150, -50))).toBeCloseTo(50);

  // included angle: 135
  // end point: 135.3553, 85.3553
  angle = Math.PI * 0.75;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(135.3553, 85.3553))).toBeCloseTo(50);

  // included angle: 135
  // end point: 135.3553, -85.3553
  angle = -Math.PI * 0.75;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(135.3553, -85.3553))).toBeCloseTo(50);

  // included angle: 180
  // end point: 100,100
  angle = Math.PI;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(100, 100))).toBeCloseTo(50);

  // included angle: 180
  // end point: 100,-100
  angle = -Math.PI;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(100, -100))).toBeCloseTo(50);

  // included angle: 270
  // end point: 50, 50
  angle = Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(50, 50))).toBeCloseTo(50);

  // included angle: 270
  // end point: 50, 50
  angle = -Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.bulgeRadius(new Point(50, -50))).toBeCloseTo(50);
});

test('Test Point.apothem', () => {
  // start point: 100,0
  // centre: 100,50
  // radius: 50
  const point = new Point(100, 0);

  // bulge: 0
  expect(point.apothem(new Point(200, 0))).toBe(0);

  // included angle: 45
  // end point: 135.3553, 14.6447
  let angle = Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(135.3553, 14.6447))).toBeCloseTo(46.19395);

  // included angle: 45
  // end point: 135.3553, -14.6447
  angle = -Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(135.3553, -14.6447))).toBeCloseTo(46.19395);

  // included angle: 90
  // end point: 150, 50
  angle = Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(150, 50))).toBeCloseTo(35.35534);

  // included angle: 90
  // end point: 150, -50
  angle = -Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(150, -50))).toBeCloseTo(35.35534);

  // included angle: 180
  // end point: 100,100
  angle = Math.PI;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(100, 100))).toBeCloseTo(0);

  // included angle: 180
  // end point: 100,-100
  angle = -Math.PI;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(100, -100))).toBeCloseTo(0);

  // included angle: 270
  // end point: 50, 50
  angle = Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(50, 50))).toBeCloseTo(35.35534);

  // included angle: 270
  // end point: 50, 50
  angle = -Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  expect(point.apothem(new Point(50, -50))).toBeCloseTo(35.35534);
});

test('Test Point.bulgeCentrePoint', () => {
  // start point: 100,0
  // centre: 100,50
  // radius: 50
  const point = new Point(100, 0);

  // zero delta angle:
  // bulge: 0
  const bulge0CenterPt = point.bulgeCentrePoint(new Point(200, 0));
  expect(bulge0CenterPt.x).toBe(150);
  expect(bulge0CenterPt.y).toBe(0);

  // included angle: 45
  // end point: 135.3553, 14.6447
  let angle = Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  const bulge45CenterPt = point.bulgeCentrePoint(new Point(135.3553, 14.6447));
  expect(bulge45CenterPt.x).toBeCloseTo(100);
  expect(bulge45CenterPt.y).toBeCloseTo(50);

  // included angle: 45
  // end point: 135.3553, -14.6447
  angle = -Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg45CenterPt = point.bulgeCentrePoint(new Point(135.3553, -14.6447));
  expect(bulgeNeg45CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg45CenterPt.y).toBeCloseTo(-50);

  // included angle: 90
  // end point: 150, 50
  angle = Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  const bulge90CenterPt = point.bulgeCentrePoint(new Point(150, 50));
  expect(bulge90CenterPt.x).toBeCloseTo(100);
  expect(bulge90CenterPt.y).toBeCloseTo(50);

  // included angle: 90
  // end point: 150, -50
  angle = -Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg90CenterPt = point.bulgeCentrePoint(new Point(150, -50));
  expect(bulgeNeg90CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg90CenterPt.y).toBeCloseTo(-50);

  // included angle: 135
  // end point: 135.3553, 85.3553
  angle = Math.PI * 0.75;
  point.bulge = Math.tan(angle / 4);
  const bulge135CenterPt = point.bulgeCentrePoint(new Point(135.3553, 85.3553));
  expect(bulge135CenterPt.x).toBeCloseTo(100);
  expect(bulge135CenterPt.y).toBeCloseTo(50);

  // included angle: 135
  // end point: 135.3553, -85.3553
  angle = -Math.PI * 0.75;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg135CenterPt = point.bulgeCentrePoint(new Point(135.3553, -85.3553));
  expect(bulgeNeg135CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg135CenterPt.y).toBeCloseTo(-50);

  // included angle: 180
  // end point: 100,100
  angle = Math.PI;
  point.bulge = Math.tan(angle / 4);
  const bulge180CenterPt = point.bulgeCentrePoint(new Point(100, 100));
  expect(bulge180CenterPt.x).toBeCloseTo(100);
  expect(bulge180CenterPt.y).toBeCloseTo(50);

  // included angle: 180
  // end point: 100,-100
  angle = -Math.PI;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg180CenterPt = point.bulgeCentrePoint(new Point(100, -100));
  expect(bulgeNeg180CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg180CenterPt.y).toBeCloseTo(-50);

  // included angle: 225
  // end point: 64.6447, 85.3553
  angle = Math.PI * 1.25;
  point.bulge = Math.tan(angle / 4);
  const bulge225CenterPt = point.bulgeCentrePoint(new Point(64.6447, 85.3553));
  expect(bulge225CenterPt.x).toBeCloseTo(100);
  expect(bulge225CenterPt.y).toBeCloseTo(50);

  // included angle: 225
  // end point: 64.6447, -85.3553
  angle = -Math.PI * 1.25;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg225CenterPt = point.bulgeCentrePoint(new Point(64.6447, -85.3553));
  expect(bulgeNeg225CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg225CenterPt.y).toBeCloseTo(-50);

  // included angle: 270
  // end point: 50, 50
  angle = Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  const bulge270CenterPt = point.bulgeCentrePoint(new Point(50, 50));
  expect(bulge270CenterPt.x).toBeCloseTo(100);
  expect(bulge270CenterPt.y).toBeCloseTo(50);

  // included angle: 270
  // end point: 50, -50
  angle = -Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg270CenterPt = point.bulgeCentrePoint(new Point(50, -50));
  expect(bulgeNeg270CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg270CenterPt.y).toBeCloseTo(-50);

  // included angle: 315
  // end point: 64.6447, 14.6447
  angle = Math.PI * 1.75;
  point.bulge = Math.tan(angle / 4);
  const bulge315CenterPt = point.bulgeCentrePoint(new Point(64.6447, 14.6447));
  expect(bulge315CenterPt.x).toBeCloseTo(100);
  expect(bulge315CenterPt.y).toBeCloseTo(50);

  // included angle: 315
  // end point: 64.6447, 14.6447
  angle = -Math.PI * 1.75;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg315CenterPt = point.bulgeCentrePoint(new Point(64.6447, -14.6447));
  expect(bulgeNeg315CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg315CenterPt.y).toBeCloseTo(-50);
});


