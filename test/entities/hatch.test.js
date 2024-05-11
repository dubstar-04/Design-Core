import {Hatch} from '../../core/entities/hatch.js';
import {BoundaryPathPolyline} from '../../core/entities/hatch.js';
import {Point} from '../../core/entities/point.js';

import {File} from '../test-helpers/test-helpers.js';

const boundaryShape = new BoundaryPathPolyline();
const points = [new Point(100, 100, 1), new Point(200, 100, 1)];
boundaryShape.points = points;

const hatch = new Hatch();
hatch.boundaryShapes = [boundaryShape];

test('Test Hatch.closestPoint', () => {
  // inside
  const point1 = new Point(150, 100);
  const closest1 = hatch.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(150);
  expect(closest1[0].y).toBeCloseTo(100);
  expect(closest1[1]).toBe(0);

  // outside
  const point2 = new Point();
  const closest2 = hatch.closestPoint(point2);
  expect(closest2[0].x).toBeCloseTo(0);
  expect(closest2[0].y).toBeCloseTo(0);
  expect(closest2[1]).toBeCloseTo(Infinity);
});

test('Test Hatch.boundingBox', () => {
  expect(hatch.boundingBox().xMin).toBe(100);
  expect(hatch.boundingBox().xMax).toBe(200);
  expect(hatch.boundingBox().yMin).toBe(50);
  expect(hatch.boundingBox().yMax).toBe(150);
});

test('Test Hatch.dxf', () => {
  const file = new File();
  hatch.dxf(file);
  console.log(file.contents);

  const dxfString = `0
HATCH
5
1
100
AcDbEntity
8
0
100
AcDbHatch
10
0
20
0
30
0.0
210
0.0
220
0.0
230
1.0
2
ANSI31
70
0
71
1
91
1
92
7
72
1
73
1
93
2
10
100
20
100
42
1
10
200
20
100
42
1
97
0
75
1
76
1
52
0
41
1.0
77
0
78
1
53
45
43
0
44
0
45
0
46
3.175
79
0
47
0.5
98
1
10
1
20
1
`;

  expect(file.contents).toEqual(dxfString);
});
