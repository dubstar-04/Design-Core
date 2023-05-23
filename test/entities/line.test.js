import {Line} from '../../core/entities/line.js';
import {Point} from '../../core/entities/point.js';


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
