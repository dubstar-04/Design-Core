import {Line} from '../../core/entities/line.js';
import {Point} from '../../core/entities/point.js';

import {File} from '../test-helpers/test-helpers.js';

test('Test Line.closestPoint', () => {
  const points = [new Point(100, 100), new Point(200, 100)];
  const line = new Line({points: points});
  // line segment
  const point1 = new Point(150, 85);
  const closest1 = line.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(150);
  expect(closest1[0].y).toBeCloseTo(100);
  expect(closest1[1]).toBeCloseTo(15);
});

test('Test Line.boundingBox', () => {
  let line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  expect(line.boundingBox().xMin).toBeCloseTo(101);
  expect(line.boundingBox().xMax).toBeCloseTo(201);
  expect(line.boundingBox().yMin).toBeCloseTo(102);
  expect(line.boundingBox().yMax).toBeCloseTo(202);

  line = new Line({points: [new Point(101, 102), new Point(-201, 202)]});
  expect(line.boundingBox().xMin).toBeCloseTo(-201);
  expect(line.boundingBox().xMax).toBeCloseTo(101);
  expect(line.boundingBox().yMin).toBeCloseTo(102);
  expect(line.boundingBox().yMax).toBeCloseTo(202);
});

test('Test Line.dxf', () => {
  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  const file = new File();
  line.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
LINE
5
1
100
AcDbEntity
100
AcDbLine
8
0
10
101
20
102
30
0.0
11
201
21
202
31
0.0
`;

  expect(file.contents).toEqual(dxfString);
});
