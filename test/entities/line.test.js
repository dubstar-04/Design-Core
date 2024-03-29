import {Line} from '../../core/entities/line.js';
import {Point} from '../../core/entities/point.js';

test('Test BasePolyline.closestPoint', () => {
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
