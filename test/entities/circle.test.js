import { Circle } from '../../core/entities/circle.js';
import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';

import { File } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

test('Circle.execute creates points from user input', async () => {
  // Mock DesignCore.Scene.inputManager.requestInput to return points
  const origInputManager = DesignCore.Scene.inputManager;
  const pt0 = new Point(0, 0);
  const pt1 = new Point(10, 0);

  let callCount = 0;
  DesignCore.Scene.inputManager = {
    requestInput: async () => {
      callCount++;
      if (callCount === 1) return pt0;
      if (callCount === 2) return pt1;
      return pt2;
    },
    executeCommand: () => {},
  };

  const circle = new Circle({});
  await circle.execute();

  expect(circle.points.length).toBe(2);
  expect(circle.points[0]).toBe(pt0);
  expect(circle.points[1]).toBe(pt1);
  expect(circle.getRadius()).toBe(10);

  // Restore original inputManager
  DesignCore.Scene.inputManager = origInputManager;
});

test('Test Circle.getRadius', () => {
  const circle = new Circle({ points: [new Point(100, 100), new Point(200, 100)] });
  expect(circle.getRadius()).toBe(100);
});

test('Test Circle.setRadius', () => {
  // create a circle with radius 100
  const circle = new Circle({ points: [new Point(100, 100), new Point(200, 100)] });
  // set radius to 200
  circle.setRadius(200);
  expect(circle.getRadius()).toBe(200);
  expect(circle.points[1].x).toBe(300);
});

test('Test Circle.closestPoint', () => {
  // create a circle with radius 100
  const circle = new Circle({ points: [new Point(100, 100), new Point(200, 100)] });
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
  let circle = new Circle({ points: [new Point(100, 100), new Point(200, 100)] });
  expect(circle.boundingBox().xMin).toBeCloseTo(0);
  expect(circle.boundingBox().xMax).toBeCloseTo(200);
  expect(circle.boundingBox().yMin).toBeCloseTo(0);
  expect(circle.boundingBox().yMax).toBeCloseTo(200);

  circle = new Circle({ points: [new Point(0, 0)], radius: 100 });
  expect(circle.boundingBox().xMin).toBeCloseTo(-100);
  expect(circle.boundingBox().xMax).toBeCloseTo(100);
  expect(circle.boundingBox().yMin).toBeCloseTo(-100);
  expect(circle.boundingBox().yMax).toBeCloseTo(100);
});

test('Test Circle.dxf', () => {
  const circle = new Circle({ points: [new Point(100, 100), new Point(200, 100)] });
  let file = new File();
  circle.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
CIRCLE
5
1
100
AcDbEntity
100
AcDbCircle
8
0
6
ByLayer
10
100
20
100
30
0.0
39
2
40
100
`;

  expect(file.contents).toEqual(dxfString);


  // create new entity from entity data to ensure all props are loaded
  const newCircle = new Circle(circle);
  file = new File();
  newCircle.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Test Circle.decompose', () => {
  const circle = new Circle({ points: [new Point(100, 100), new Point(200, 100)] });
  const decomposedCircle = circle.decompose();
  expect(decomposedCircle[0].x).toBe(200);
  expect(decomposedCircle[0].y).toBe(100);
  expect(decomposedCircle[0].bulge).toBeCloseTo(1);

  expect(decomposedCircle[1].x).toBe(0);
  expect(decomposedCircle[1].y).toBe(100);
  expect(decomposedCircle[1].bulge).toBeCloseTo(1);

  expect(decomposedCircle[2].x).toBe(200);
  expect(decomposedCircle[2].y).toBe(100);
  expect(decomposedCircle[2].bulge).toBe(0);
});

test('Test Circle.trim returns empty array when provided with empty intersection list', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(100, 0)] });

  expect(circle.trim([])).toEqual([]);
  expect(circle.trim()).toEqual([]);
});

test('Test Circle.trim does not modify circle', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });

  DesignCore.Mouse.pointOnScene = () => new Point(7.71, 7.71);

  // test a single intersection - not valid
  const intersections = [new Point(10, 0)];
  expect(circle.trim(intersections)).toEqual([]);

  // test two intersections - should return an arc
  intersections.push(new Point(-10, 0));
  let trimWithTwoPoints = circle.trim(intersections);
  let trimResult = trimWithTwoPoints[0].entity;
  expect(trimResult.type).toEqual('Arc');
  expect(trimResult.points[0].x).toEqual(0);
  expect(trimResult.points[0].y).toEqual(0);

  expect(trimResult.points[1].x).toEqual(10);
  expect(trimResult.points[1].y).toEqual(0);

  expect(trimResult.points[2].x).toEqual(-10);
  expect(trimResult.points[2].y).toEqual(0);

  expect(trimWithTwoPoints[1].entity).toEqual(circle);

  // test three intersections - should return an arc from first two points found
  intersections.push(new Point(0, 10));
  trimWithTwoPoints = circle.trim(intersections);
  trimResult = trimWithTwoPoints[0].entity;
  expect(trimResult.type).toEqual('Arc');
  expect(trimResult.points[0].x).toEqual(0);
  expect(trimResult.points[0].y).toEqual(0);

  expect(trimResult.points[1].x).toEqual(10);
  expect(trimResult.points[1].y).toEqual(0);

  expect(trimResult.points[2].x).toEqual(0);
  expect(trimResult.points[2].y).toEqual(10);

  expect(trimWithTwoPoints[1].entity).toEqual(circle);

  // test four intersections - should return an arc from first two points found
  intersections.push(new Point(0, -10));
  trimWithTwoPoints = circle.trim(intersections);
  trimResult = trimWithTwoPoints[0].entity;
  expect(trimResult.type).toEqual('Arc');
  expect(trimResult.points[0].x).toEqual(0);
  expect(trimResult.points[0].y).toEqual(0);

  expect(trimResult.points[1].x).toEqual(10);
  expect(trimResult.points[1].y).toEqual(0);

  expect(trimResult.points[2].x).toEqual(0);
  expect(trimResult.points[2].y).toEqual(10);

  expect(trimWithTwoPoints[1].entity).toEqual(circle);
});
