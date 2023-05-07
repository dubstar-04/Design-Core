
import {Point} from '../../core/entities/point.js';


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
  expect(pt1.angle(new Point(13.065629648764, 5.411961001462))).toBeCloseTo(Math.PI/8);

  /* 45 degrees */
  expect(pt1.angle(new Point(10, 10))).toBe(Math.PI/4);

  /* 90 degrees */
  expect(pt1.angle(new Point(0, 10))).toBe(Math.PI/2);

  /* 180 degrees */
  expect(pt1.angle(new Point(-10, 0))).toBe(Math.PI);

  /* 270 degrees */
  expect(pt1.angle(new Point(0, -10))).toBe(Math.PI*1.5);
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

test('Test Point.rotate', () => {
  const centre = new Point();

  /* 90 degrees */
  const pt1 = new Point(10, 0);
  const result1 = pt1.rotate(centre, Math.PI/2);
  expect(result1.x).toBeCloseTo(0, 5);
  expect(result1.y).toBeCloseTo(10, 5);

  /* -90 degrees */
  const pt2 = new Point(-10, 0);
  const result2 = pt2.rotate(centre, -Math.PI/2);
  expect(result2.x).toBeCloseTo(0, 5);
  expect(result2.y).toBeCloseTo(10, 5);


  /* 180 degrees */
  const offsetCentre = new Point(10, 10);
  const pt3 = new Point(-10, -10);
  const result3 = pt3.rotate(offsetCentre, Math.PI);
  expect(result3.x).toBeCloseTo(30, 5);
  expect(result3.y).toBeCloseTo(30, 5);
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
  const project2 = pt1.project(Math.PI/4, 10);
  expect(project2.x).toBeCloseTo(7.07);
  expect(project2.y).toBeCloseTo(7.07);

  /* 90 degrees */
  const project3 = pt1.project(Math.PI/2, 10);
  expect(project3.x).toBeCloseTo(0);
  expect(project3.y).toBeCloseTo(10);

  /* -90 degrees */
  const project4 = pt1.project(-Math.PI/2, 10);
  expect(project4.x).toBeCloseTo(0);
  expect(project4.y).toBeCloseTo(-10);

  /* 180 degrees */
  const project5 = pt1.project(Math.PI, 10);
  expect(project5.x).toBeCloseTo(-10);
  expect(project5.y).toBeCloseTo(0);

  /* 270 degrees */
  const project6 = pt1.project(Math.PI*1.5, 10);
  expect(project6.x).toBeCloseTo(0);
  expect(project6.y).toBeCloseTo(-10);

  const pt2 = new Point(100, 100);
  /* Non-zero 45 degrees */
  const project7 = pt2.project(Math.PI/4, 100);
  console.log(project7);
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
  expect(perp4).toBe(null);
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
  expect(perp4).toBe(null);
});

test('Test Point.closestPointOnArc', () => {
  const arc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10)};

  const pt3 = new Point(5, 5);
  const closest1 = pt3.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(closest1.x).toBe(10);
  expect(closest1.y).toBe(10);

  const pt4 = new Point(0, 5);
  const closest2 = pt4.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(closest2.x).toBe(0);
  expect(closest2.y).toBeCloseTo(14.14);

  const pt5 = new Point(20, 10);
  const closest3 = pt5.closestPointOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(closest3).toBe(null);
});


test('Test Point.isOnArc', () => {
  const arc = {centre: new Point(), radius: 14.14, startPoint: new Point(10, 10), endPoint: new Point(-10, 10)};

  const pt3 = new Point(5, 5);
  const onArc1 = pt3.isOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(onArc1).toBe(true);

  const pt4 = new Point(0, 5);
  const onArc2 = pt4.isOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(onArc2).toBe(true);

  const pt5 = new Point(20, 10);
  const onArc3 = pt5.isOnArc(arc.startPoint, arc.endPoint, arc.centre);
  expect(onArc3).toBe(false);
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

test('Test Point.angleFromBulge', () => {
  const angle = Math.PI;
  const bulge = Math.tan(angle / 4);

  const point = new Point();
  point.bulge = bulge;


  expect(point.angleFromBulge()).toBe(angle);
});

test('Test Point.getCentrePoint', () => {
  // start point: 100,0
  // center: 100,50
  // radius: 50
  const point = new Point(100, 0);

  // zero delta angle:
  // bulge: 0
  const bulge0CenterPt = point.getCentrePoint(new Point(200, 0));
  expect(bulge0CenterPt.x).toBe(150);
  expect(bulge0CenterPt.y).toBe(0);

  // included angle: 45
  // end point: 135.3553, 14.6447
  let angle = Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  const bulge45CenterPt = point.getCentrePoint(new Point(135.3553, 14.6447));
  expect(bulge45CenterPt.x).toBeCloseTo(100);
  expect(bulge45CenterPt.y).toBeCloseTo(50);

  // included angle: 45
  // end point: 135.3553, -14.6447
  angle = -Math.PI * 0.25;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg45CenterPt = point.getCentrePoint(new Point(135.3553, -14.6447));
  expect(bulgeNeg45CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg45CenterPt.y).toBeCloseTo(-50);

  // included angle: 90
  // end point: 150, 50
  angle = Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  const bulge90CenterPt = point.getCentrePoint(new Point(150, 50));
  expect(bulge90CenterPt.x).toBeCloseTo(100);
  expect(bulge90CenterPt.y).toBeCloseTo(50);

  // included angle: 90
  // end point: 150, -50
  angle = -Math.PI * 0.5;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg90CenterPt = point.getCentrePoint(new Point(150, -50));
  expect(bulgeNeg90CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg90CenterPt.y).toBeCloseTo(-50);

  // included angle: 135
  // end point: 135.3553, 85.3553
  angle = Math.PI * 0.75;
  point.bulge = Math.tan(angle / 4);
  const bulge135CenterPt = point.getCentrePoint(new Point(135.3553, 85.3553));
  expect(bulge135CenterPt.x).toBeCloseTo(100);
  expect(bulge135CenterPt.y).toBeCloseTo(50);

  // included angle: 135
  // end point: 135.3553, -85.3553
  angle = -Math.PI * 0.75;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg135CenterPt = point.getCentrePoint(new Point(135.3553, -85.3553));
  expect(bulgeNeg135CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg135CenterPt.y).toBeCloseTo(-50);

  // included angle: 180
  // end point: 100,100
  angle = Math.PI;
  point.bulge = Math.tan(angle / 4);
  const bulge180CenterPt = point.getCentrePoint(new Point(100, 100));
  expect(bulge180CenterPt.x).toBeCloseTo(100);
  expect(bulge180CenterPt.y).toBeCloseTo(50);

  // included angle: 180
  // end point: 100,-100
  angle = -Math.PI;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg180CenterPt = point.getCentrePoint(new Point(100, -100));
  expect(bulgeNeg180CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg180CenterPt.y).toBeCloseTo(-50);

  // included angle: 225
  // end point: 64.6447, 85.3553
  angle = Math.PI * 1.25;
  point.bulge = Math.tan(angle / 4);
  const bulge225CenterPt = point.getCentrePoint(new Point(64.6447, 85.3553));
  expect(bulge225CenterPt.x).toBeCloseTo(100);
  expect(bulge225CenterPt.y).toBeCloseTo(50);

  // included angle: 225
  // end point: 64.6447, -85.3553
  angle = -Math.PI * 1.25;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg225CenterPt = point.getCentrePoint(new Point(64.6447, -85.3553));
  expect(bulgeNeg225CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg225CenterPt.y).toBeCloseTo(-50);

  // included angle: 270
  // end point: 50, 50
  angle = Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  const bulge270CenterPt = point.getCentrePoint(new Point(50, 50));
  expect(bulge270CenterPt.x).toBeCloseTo(100);
  expect(bulge270CenterPt.y).toBeCloseTo(50);

  // included angle: 270
  // end point: 50, -50
  angle = -Math.PI * 1.5;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg270CenterPt = point.getCentrePoint(new Point(50, -50));
  expect(bulgeNeg270CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg270CenterPt.y).toBeCloseTo(-50);

  // included angle: 315
  // end point: 64.6447, 14.6447
  angle = Math.PI * 1.75;
  point.bulge = Math.tan(angle / 4);
  const bulge315CenterPt = point.getCentrePoint(new Point(64.6447, 14.6447));
  expect(bulge315CenterPt.x).toBeCloseTo(100);
  expect(bulge315CenterPt.y).toBeCloseTo(50);

  // included angle: 315
  // end point: 64.6447, 14.6447
  angle = -Math.PI * 1.75;
  point.bulge = Math.tan(angle / 4);
  const bulgeNeg315CenterPt = point.getCentrePoint(new Point(64.6447, -14.6447));
  expect(bulgeNeg315CenterPt.x).toBeCloseTo(100);
  expect(bulgeNeg315CenterPt.y).toBeCloseTo(-50);
});


