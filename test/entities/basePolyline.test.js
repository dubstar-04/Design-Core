import {BasePolyline} from '../../core/entities/basePolyline';
import {Point} from '../../core/entities/point';


test('Test BasePolyline.boundingBox', () => {
  let polyline = new BasePolyline({points: [new Point(101, 102), new Point(201, 202)]});
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(201);
  expect(polyline.boundingBox().yMin).toBeCloseTo(102);
  expect(polyline.boundingBox().yMax).toBeCloseTo(202);

  polyline = new BasePolyline({points: [new Point(101, 102), new Point(-201, 202)]});
  expect(polyline.boundingBox().xMin).toBeCloseTo(-201);
  expect(polyline.boundingBox().xMax).toBeCloseTo(101);
  expect(polyline.boundingBox().yMin).toBeCloseTo(102);
  expect(polyline.boundingBox().yMax).toBeCloseTo(202);


  let points = [new Point(101, 102), new Point(200, 102), new Point(200, 0)];
  // set the bulge
  points[1].bulge = -1;
  polyline = new BasePolyline({points: points});
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(251);
  expect(polyline.boundingBox().yMin).toBeCloseTo(0);
  expect(polyline.boundingBox().yMax).toBeCloseTo(102);

  points = [new Point(101, 102), new Point(200, 102), new Point(200, 0)];
  // set the bulge
  points[1].bulge = -1;
  polyline = new BasePolyline({points: points});
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(251);
  expect(polyline.boundingBox().yMin).toBeCloseTo(0);
  expect(polyline.boundingBox().yMax).toBeCloseTo(102);
});

test('Test BasePolyline.getBulgeFromSegment', () => {
  // start point: 100,0
  // center: 100,50
  // radius: 50
  const points = [new Point(), new Point(100, 0)];
  const polyline = new BasePolyline({points: points});

  // zero delta angle:
  // bulge: 0
  expect(polyline.getBulgeFromSegment(new Point(200, 0))).toBe(0);

  // delta angle: 22.5
  // included angle: 45
  // bulge:
  // end point: 135.3553, 14.6447
  let angle = Math.PI * 0.25;
  let bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, 14.6447))).toBeCloseTo(bulge);

  // delta angle: 22.5
  // included angle: 45
  // bulge:
  // end point: 135.3553, -14.6447
  angle = -Math.PI * 0.25;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, -14.6447))).toBeCloseTo(bulge);

  // delta angle: 45
  // included angle: 90
  // bulge:
  // end point: 150, 50
  angle = Math.PI * 0.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(150, 50))).toBeCloseTo(bulge);

  // delta angle: -45
  // included angle: 90
  // bulge:
  // end point: 150, -50
  angle = -Math.PI * 0.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(150, -50))).toBeCloseTo(bulge);

  // delta angle: 67.5
  // included angle: 135
  // bulge:
  // end point: 135.3553, 85.3553
  angle = Math.PI * 0.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, 85.3553))).toBeCloseTo(bulge);

  // delta angle: -67.5
  // included angle: 135
  // bulge:
  // end point: 135.3553, -85.3553
  angle = -Math.PI * 0.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, -85.3553))).toBeCloseTo(bulge);

  // delta angle: 90
  // included angle: 180
  // bulge: 1
  // end point: 100,100
  angle = Math.PI;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(100, 100))).toBeCloseTo(bulge);

  // delta angle: -90
  // included angle: 180
  // bulge: -1
  // end point: 100, -100
  angle = -Math.PI;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(100, -100))).toBeCloseTo(bulge);

  // delta angle: 112.5
  // included angle: 225
  // bulge: ??
  // end point: 64.6447, 85.3553
  angle = Math.PI * 1.25;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, 85.3553))).toBeCloseTo(bulge);

  // delta angle: -112.5
  // included angle: 225
  // bulge: ??
  // end point: 64.6447, -85.3553
  angle = -Math.PI * 1.25;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, -85.3553))).toBeCloseTo(bulge);

  // delta angle: 135
  // included angle: 270
  // bulge: ??
  // end point: 50, 50
  angle = Math.PI * 1.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(50, 50))).toBeCloseTo(bulge);

  // delta angle: -135
  // included angle: 270
  // bulge: ??
  // end point: 50, -50
  angle = -Math.PI * 1.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(50, -50))).toBeCloseTo(bulge);

  // delta angle: 157.5
  // included angle: 315
  // bulge: ??
  // end point: 64.6447, 14.6447
  angle = Math.PI * 1.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, 14.6447))).toBeCloseTo(bulge);

  // delta angle: -157.5
  // included angle: 315
  // bulge: ??
  // end point: 64.6447, -14.6447
  angle = -Math.PI * 1.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, -14.6447))).toBeCloseTo(bulge);
});
