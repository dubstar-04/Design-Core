import { BasePolyline } from '../../core/entities/basePolyline';
import { Point } from '../../core/entities/point';
import { Polyline } from '../../core/entities/polyline.js';

import { File } from '../test-helpers/test-helpers.js';

test('Test BasePolyline.closestPoint', () => {
  const points = [new Point(100, 100), new Point(200, 100, -1), new Point(200, 50)];
  const polyline = new BasePolyline({ points: points });
  // line segment
  const point1 = new Point(150, 85);
  const closest1 = polyline.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(150);
  expect(closest1[0].y).toBeCloseTo(100);
  expect(closest1[1]).toBeCloseTo(15);

  // arc segment
  const point2 = new Point(210, 65);
  const closest2 = polyline.closestPoint(point2);
  expect(closest2[0].x).toBeCloseTo(217.6777);
  expect(closest2[0].y).toBeCloseTo(57.3223);
  expect(closest2[1]).toBeCloseTo(10.857);
});

test('Test BasePolyline.boundingBox', () => {
  let polyline = new BasePolyline({ points: [new Point(101, 102), new Point(201, 202)] });
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(201);
  expect(polyline.boundingBox().yMin).toBeCloseTo(102);
  expect(polyline.boundingBox().yMax).toBeCloseTo(202);

  polyline = new BasePolyline({ points: [new Point(101, 102), new Point(-201, 202)] });
  expect(polyline.boundingBox().xMin).toBeCloseTo(-201);
  expect(polyline.boundingBox().xMax).toBeCloseTo(101);
  expect(polyline.boundingBox().yMin).toBeCloseTo(102);
  expect(polyline.boundingBox().yMax).toBeCloseTo(202);


  let points = [new Point(101, 102), new Point(200, 102), new Point(200, 0)];
  // set the bulge
  points[1].bulge = -1;
  polyline = new BasePolyline({ points: points });
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(251);
  expect(polyline.boundingBox().yMin).toBeCloseTo(0);
  expect(polyline.boundingBox().yMax).toBeCloseTo(102);

  points = [new Point(101, 102), new Point(200, 102), new Point(200, 0)];
  // set the bulge
  points[1].bulge = -1;
  polyline = new BasePolyline({ points: points });
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
  const polyline = new BasePolyline({ points: points });

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

test('Test BasePolyline.dxf', () => {
  const points = [new Point(100, 100), new Point(200, 100), new Point(200, 50)];
  points[1].bulge = -1;
  const polyline = new BasePolyline({ points: points });
  let file = new File();
  polyline.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
POLYLINE
5
1
100
AcDbEntity
100
AcDb2dPolyline
8
0
10
0
20
0
30
0
39
2
70
0
66
1
0
VERTEX
5
1
100
AcDbEntity
100
AcDbVertex
100
AcDb2dVertex
8
0
10
100
20
100
30
0.0
42
0
0
VERTEX
5
1
100
AcDbEntity
100
AcDbVertex
100
AcDb2dVertex
8
0
10
200
20
100
30
0.0
42
-1
0
VERTEX
5
1
100
AcDbEntity
100
AcDbVertex
100
AcDb2dVertex
8
0
10
200
20
50
30
0.0
42
0
0
SEQEND
5
1
100
AcDbEntity
8
0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newPolyline = new Polyline(polyline);
  file = new File();
  newPolyline.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Test BasePolyline.decompose', () => {
  const points = [new Point(100, 100), new Point(200, 100), new Point(200, 50)];
  points[1].bulge = -1;
  const polyline = new BasePolyline({ points: points });

  const decomposedPolyline = polyline.decompose();
  expect(decomposedPolyline[0].x).toBe(100);
  expect(decomposedPolyline[0].y).toBe(100);
  expect(decomposedPolyline[0].bulge).toBe(0);

  expect(decomposedPolyline[1].x).toBe(200);
  expect(decomposedPolyline[1].y).toBe(100);
  expect(decomposedPolyline[1].bulge).toBe(-1);

  expect(decomposedPolyline[2].x).toBe(200);
  expect(decomposedPolyline[2].y).toBe(50);
  expect(decomposedPolyline[2].bulge).toBe(0);
});
