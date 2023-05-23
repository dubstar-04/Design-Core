import {Circle} from '../../core/entities/circle.js';
import {Point} from '../../core/entities/point.js';


test('Test Circle.getRadius', () => {
  const circle = new Circle({points: [new Point(100, 100), new Point(200, 100)]});
  expect(circle.getRadius()).toBe(100);
});

test('Test Circle.setRadius', () => {
  // create a circle with radius 100
  const circle = new Circle({points: [new Point(100, 100), new Point(200, 100)]});
  // set radius to 200
  circle.setRadius(200);
  expect(circle.getRadius()).toBe(200);
  expect(circle.points[1].x).toBe(300);
});
test('Test Circle.boundingBox', () => {
  let circle = new Circle({points: [new Point(100, 100), new Point(200, 100)]});
  expect(circle.boundingBox().xMin).toBeCloseTo(0);
  expect(circle.boundingBox().xMax).toBeCloseTo(200);
  expect(circle.boundingBox().yMin).toBeCloseTo(0);
  expect(circle.boundingBox().yMax).toBeCloseTo(200);

  circle = new Circle({points: [new Point(0, 0)], radius: 100});
  expect(circle.boundingBox().xMin).toBeCloseTo(-100);
  expect(circle.boundingBox().xMax).toBeCloseTo(100);
  expect(circle.boundingBox().yMin).toBeCloseTo(-100);
  expect(circle.boundingBox().yMax).toBeCloseTo(100);
});
