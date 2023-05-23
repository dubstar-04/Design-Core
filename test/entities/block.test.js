import {Block} from '../../core/entities/block.js';
import {Line} from '../../core/entities/line.js';
import {Point} from '../../core/entities/point.js';

test('Test Block.boundingBox', () => {
  const block = new Block();
  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  block.addItem(line);

  expect(block.boundingBox().xMin).toBeCloseTo(101);
  expect(block.boundingBox().xMax).toBeCloseTo(201);
  expect(block.boundingBox().yMin).toBeCloseTo(102);
  expect(block.boundingBox().yMax).toBeCloseTo(202);

  const line2 = new Line({points: [new Point(1001, 1002), new Point(2001, 2002)]});
  block.addItem(line2);

  expect(block.boundingBox().xMin).toBeCloseTo(101);
  expect(block.boundingBox().xMax).toBeCloseTo(2001);
  expect(block.boundingBox().yMin).toBeCloseTo(102);
  expect(block.boundingBox().yMax).toBeCloseTo(2002);
});
