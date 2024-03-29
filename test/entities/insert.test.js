import {Insert} from '../../core/entities/insert.js';
import {Point} from '../../core/entities/point.js';
import {Line} from '../../core/entities/line.js';

// mock file for dxf test
class File {
  constructor() {
    this.contents = '';
  }

  writeGroupCode(groupCode, groupValue) {
    this.contents = this.contents.concat(`${groupCode}\n${groupValue}\n`);
  }
}

const insert = new Insert({points: [new Point()]});
const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
insert.block.addItem(line);

test('Test Insert.closestPoint', () => {
  const point = new Point(100, 100);
  const closest = insert.closestPoint(point);

  console.log('closest', closest);

  expect(closest[0].x).toBeCloseTo(101);
  expect(closest[0].y).toBeCloseTo(102);
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
  const file = new File();
  insert.dxf(file);
  // console.log(file.contents);


  const dxfString = `0
INSERT
8
0
2

10
0
20
0
30
0.0
`;

  expect(file.contents).toEqual(dxfString);
});
