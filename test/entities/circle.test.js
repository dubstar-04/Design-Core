import { jest } from '@jest/globals';
import { Circle } from '../../core/entities/circle.js';
import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { Strings } from '../../core/lib/strings.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

test('Circle.execute creates points from user input', async () => {
  const pt0 = new Point(0, 0);
  const pt1 = new Point(10, 0);

  await withMockInput(DesignCore.Scene, [pt0, pt1], async () => {
    const circle = new Circle({});
    await circle.execute();

    expect(circle.points.length).toBe(2);
    expect(circle.points[0]).toBe(pt0);
    expect(circle.points[1]).toBe(pt1);
    expect(circle.getRadius()).toBe(10);
  });
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
  const circle = new Circle({ handle: '1', points: [new Point(100, 100), new Point(200, 100)] });
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
1
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

test('Test Circle.toPolylinePoints', () => {
  const circle = new Circle({ points: [new Point(100, 100), new Point(200, 100)] });
  const circlePoints = circle.toPolylinePoints();
  expect(circlePoints[0].x).toBe(200);
  expect(circlePoints[0].y).toBe(100);
  expect(circlePoints[0].bulge).toBeCloseTo(1);

  expect(circlePoints[1].x).toBe(0);
  expect(circlePoints[1].y).toBe(100);
  expect(circlePoints[1].bulge).toBeCloseTo(1);

  expect(circlePoints[2].x).toBe(200);
  expect(circlePoints[2].y).toBe(100);
  expect(circlePoints[2].bulge).toBe(0);
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
  // Verify trimmed arc has a unique handle (not the circle's)
  expect(trimResult.handle).toBeUndefined();
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

test('Circle.execute creates circle from diameter input', async () => {
  const center = new Point(0, 0);

  await withMockInput(DesignCore.Scene, [center, 'Diameter', 20], async () => {
    const circle = new Circle({});
    await circle.execute();

    expect(circle.points[0]).toBe(center);
    expect(circle.getRadius()).toBeCloseTo(10);
  });
});

test('Circle.execute re-prompts on zero or negative radius', async () => {
  const center = new Point(0, 0);

  // 0 and -5 are rejected; 10 is accepted
  await withMockInput(DesignCore.Scene, [center, 0, -5, 10], async () => {
    const circle = new Circle({});
    await circle.execute();

    expect(circle.getRadius()).toBeCloseTo(10);
  });
});

test('Circle.execute re-prompts on zero or negative diameter', async () => {
  const center = new Point(0, 0);

  // 'Diameter', then 0 and -20 rejected, then 20 accepted (radius = 10)
  await withMockInput(DesignCore.Scene, [center, 'Diameter', 0, -20, 20], async () => {
    const circle = new Circle({});
    await circle.execute();

    expect(circle.getRadius()).toBeCloseTo(10);
  });
});

test('Circle.register returns command object', () => {
  expect(Circle.register()).toEqual({ command: 'Circle', shortcut: 'C', type: 'Entity' });
});

test('Circle constructor loads radius from DXF group code 40', () => {
  const circle = new Circle({ points: [new Point(0, 0)], 40: 50 });
  expect(circle.getRadius()).toBeCloseTo(50);
  expect(circle.points[1].x).toBeCloseTo(50);
  expect(circle.points[1].y).toBeCloseTo(0);
});

test('Circle.execute creates circle from numeric radius input', async () => {
  const center = new Point(0, 0);
  await withMockInput(DesignCore.Scene, [center, 25], async () => {
    const circle = new Circle({});
    await circle.execute();
    expect(circle.getRadius()).toBeCloseTo(25);
  });
});

test('Circle.execute re-prompts on zero-distance point input', async () => {
  const notifySpy = jest.spyOn(DesignCore.Core, 'notify').mockImplementation(() => {});
  const center = new Point(0, 0);
  await withMockInput(DesignCore.Scene, [center, new Point(0, 0), new Point(10, 0)], async () => {
    const circle = new Circle({});
    await circle.execute();
    expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.NONZERO));
    expect(circle.getRadius()).toBeCloseTo(10);
  });
  notifySpy.mockRestore();
});

test('Circle.preview does not throw with 0 or 1 points', () => {
  const origCreate = DesignCore.Scene.previewEntities.create;
  const origMouse = DesignCore.Mouse.pointOnScene;
  const calls = [];
  DesignCore.Scene.previewEntities.create = (type, obj) => calls.push([type, obj]);
  DesignCore.Mouse.pointOnScene = () => new Point(5, 5);

  const circle0 = new Circle({});
  expect(() => circle0.preview()).not.toThrow();
  expect(calls.length).toBe(0);

  const circle1 = new Circle({});
  circle1.points = [new Point(0, 0)];
  expect(() => circle1.preview()).not.toThrow();
  expect(calls.some(([type]) => type === 'Circle')).toBe(true);

  DesignCore.Scene.previewEntities.create = origCreate;
  DesignCore.Mouse.pointOnScene = origMouse;
});

test('Circle.draw calls renderer.drawShape with toPolylinePoints', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  let capturedEntity;
  let capturedPoints;
  const mockRenderer = {
    drawShape(entity, points) {
      capturedEntity = entity;
      capturedPoints = points;
    },
  };
  circle.draw(mockRenderer);
  expect(capturedEntity).toBe(circle);
  expect(capturedPoints).toEqual(circle.toPolylinePoints());
});

test('Circle.snaps returns centre snap', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const snaps = circle.snaps(new Point(5, 0), 100);
  const centreSnaps = snaps.filter((s) => s.type === 'centre');
  expect(centreSnaps).toHaveLength(1);
  expect(centreSnaps[0].snapPoint.x).toBe(0);
  expect(centreSnaps[0].snapPoint.y).toBe(0);
});

test('Circle.snaps returns four quadrant snaps', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const snaps = circle.snaps(new Point(5, 0), 100);
  const quadrantSnaps = snaps.filter((s) => s.type === 'quadrant');
  expect(quadrantSnaps).toHaveLength(4);
  expect(quadrantSnaps.some((p) => p.snapPoint.x === 10 && p.snapPoint.y === 0)).toBe(true);// 0°
  expect(quadrantSnaps.some((p) => p.snapPoint.x === 0 && p.snapPoint.y === 10)).toBe(true);// 90°
  expect(quadrantSnaps.some((p) => p.snapPoint.x === -10 && p.snapPoint.y === 0)).toBe(true);// 180°
  expect(quadrantSnaps.some((p) => p.snapPoint.x === 0 && p.snapPoint.y === -10)).toBe(true);// 270°
});

test('Circle.snaps nearest snap fires when close enough', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  // Mouse on the circle surface with large delta
  const snaps = circle.snaps(new Point(10, 0), 1000);
  expect(snaps.filter((s) => s.type === 'nearest').length).toBeGreaterThanOrEqual(1);
});

test('Circle.snaps nearest snap does not fire when too far', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const snaps = circle.snaps(new Point(100, 100), 1);
  expect(snaps.filter((s) => s.type === 'nearest').length).toBe(0);
});

test('Circle.fromPolylinePoints round-trip preserves centre and radius', () => {
  const circle = new Circle({ points: [new Point(5, 10), new Point(5, 10).project(0, 8)] });
  const polyPts = circle.toPolylinePoints();
  const rebuilt = new Circle({});
  rebuilt.fromPolylinePoints(polyPts);
  expect(rebuilt.points[0].x).toBeCloseTo(5, 10);
  expect(rebuilt.points[0].y).toBeCloseTo(10, 10);
  expect(rebuilt.radius).toBeCloseTo(8, 10);
});

test('Circle.fromPolylinePoints precision drift is negligible', () => {
  const circle = new Circle({ points: [new Point(123.456, -789.012), new Point(123.456, -789.012).project(1.234, 56.789)] });
  const polyPts = circle.toPolylinePoints();
  const rebuilt = new Circle({});
  rebuilt.fromPolylinePoints(polyPts);
  const drift = Math.hypot(rebuilt.points[0].x - circle.points[0].x, rebuilt.points[0].y - circle.points[0].y);
  expect(drift).toBeLessThan(1e-10);
  expect(Math.abs(rebuilt.radius - circle.radius)).toBeLessThan(1e-10);
});

test('Circle.snaps returns two tangent snaps from outside', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const savedInputPoint = DesignCore.Scene.inputManager.inputPoint;
  // fromPoint=(20,0): distanceToCenter=20 > radius=10
  // tangentHalfAngle = acos(10/20) = π/3; both tangent points at (5, ±8.66) are on the full circle
  DesignCore.Scene.inputManager.inputPoint = new Point(20, 0);
  const snaps = circle.snaps(new Point(5, 0), 100);
  const tangentSnaps = snaps.filter((s) => s.type === 'tangent');
  expect(tangentSnaps.length).toBe(2);
  expect(tangentSnaps.some((s) => s.snapPoint.x > 4.9 && s.snapPoint.y > 8.5)).toBe(true);
  expect(tangentSnaps.some((s) => s.snapPoint.x > 4.9 && s.snapPoint.y < -8.5)).toBe(true);
  DesignCore.Scene.inputManager.inputPoint = savedInputPoint;
});

test('Circle.snaps returns no tangent when fromPoint is inside the circle', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const savedInputPoint = DesignCore.Scene.inputManager.inputPoint;
  DesignCore.Scene.inputManager.inputPoint = new Point(1, 1); // distanceToCenter ≈ 1.41 < radius 10
  const snaps = circle.snaps(new Point(5, 0), 100);
  expect(snaps.filter((s) => s.type === 'tangent').length).toBe(0);
  DesignCore.Scene.inputManager.inputPoint = savedInputPoint;
});

test('Circle.snaps returns perpendicular snap from outside', () => {
  const circle = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const savedInputPoint = DesignCore.Scene.inputManager.inputPoint;
  // fromPoint=(20,0): angleFromCentreToInput=0; perpendicularPoint=(10,0)
  DesignCore.Scene.inputManager.inputPoint = new Point(20, 0);
  const snaps = circle.snaps(new Point(5, 0), 100);
  const perpSnaps = snaps.filter((s) => s.type === 'perpendicular');
  expect(perpSnaps.length).toBe(1);
  expect(perpSnaps[0].snapPoint.x).toBeCloseTo(10);
  expect(perpSnaps[0].snapPoint.y).toBeCloseTo(0);
  DesignCore.Scene.inputManager.inputPoint = savedInputPoint;
});
