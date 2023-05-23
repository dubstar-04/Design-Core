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

test('Test Circle.closestPoint', () => {
  // create a circle with radius 100
  const circle = new Circle({points: [new Point(100, 100), new Point(200, 100)]});
  // inside
  const point1 = new Point(150, 100);
  const closest1 = circle.closestPoint(point1);
  expect(closest1[0].x).toBe(200);
  expect(closest1[0].y).toBe(100);
  expect(closest1[1]).toBe(50);

  // outside
  const point2 = new Point(250, 100);
  const closest2 = circle.closestPoint(point2);
  expect(closest2[0].x).toBe(200);
  expect(closest2[0].y).toBe(100);
  expect(closest2[1]).toBe(50);
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
