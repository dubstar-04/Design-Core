import {Core} from '../../core/core/core.js';
import {Insert} from '../../core/entities/insert.js';
import {Point} from '../../core/entities/point.js';
import {Line} from '../../core/entities/line.js';

import {File} from '../test-helpers/test-helpers.js';

// initialise core
new Core();


const insert = new Insert({points: [new Point()]});
const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
insert.block.addItem(line);

const rotatedInsert = new Insert({points: [new Point()], rotation: 45});
rotatedInsert.block.addItem(line);

test('Test Insert.snaps', () => {
  const point = new Point(100, 100);
  const snaps = insert.snaps(point, 1);
  expect(snaps[0].x).toBeCloseTo(101);
  expect(snaps[0].y).toBeCloseTo(102);

  // Test snaps for a rotated block
  const rotatedSnaps= rotatedInsert.snaps(point);
  expect(rotatedSnaps[0].x).toBeCloseTo(-0.7071);
  expect(rotatedSnaps[0].y).toBeCloseTo(143.5426);
});

test('Test Insert.closestPoint', () => {
  const point = new Point(100, 100);
  const closest = insert.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(101);
  expect(closest[0].y).toBeCloseTo(102);

  // Test closest for a rotated block
  const rotatedClosest = rotatedInsert.closestPoint(point);
  expect(rotatedClosest[0].x).toBeCloseTo(101);
  expect(rotatedClosest[0].y).toBeCloseTo(102);
});

test('Test Insert.boundingBox', () => {
  expect(insert.boundingBox().xMin).toBeCloseTo(101);
  expect(insert.boundingBox().xMax).toBeCloseTo(201);
  expect(insert.boundingBox().yMin).toBeCloseTo(102);
  expect(insert.boundingBox().yMax).toBeCloseTo(202);

  const line2 = new Line({points: [new Point(1001, 1002), new Point(2001, 2002)]});
  insert.block.addItem(line2);

  expect(insert.boundingBox().xMin).toBeCloseTo(101);
  expect(insert.boundingBox().xMax).toBeCloseTo(2001);
  expect(insert.boundingBox().yMin).toBeCloseTo(102);
  expect(insert.boundingBox().yMax).toBeCloseTo(2002);
});

test('Test Insert.dxf', () => {
  let file = new File();
  insert.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
INSERT
5
1
100
AcDbEntity
8
0
100
AcDbBlockReference
2

10
0
20
0
30
0.0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newInsert = new Insert(insert);
  file = new File();
  newInsert.dxf(file);
  expect(file.contents).toEqual(dxfString);
});
