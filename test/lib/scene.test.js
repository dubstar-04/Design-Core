import { Core } from '../../core/core/core.js';
import { Line } from '../../core/entities/line';
import { Point } from '../../core/entities/point';


const core = new Core();
const scene = core.scene;

test('Test Scene.boundingBox', () => {
  // empty scene
  expect(scene.boundingBox()).toBeUndefined();

  const line1 = new Line({ points: [new Point(-102, -102), new Point(201, 202)] });
  // add to scene (bypass scene.addItem())
  scene.addItem('Line', line1);
  expect(scene.boundingBox().xMin).toBeCloseTo(-102);
  expect(scene.boundingBox().xMax).toBeCloseTo(201);
  expect(scene.boundingBox().yMin).toBeCloseTo(-102);
  expect(scene.boundingBox().yMax).toBeCloseTo(202);

  const line2 = new Line({ points: [new Point(1001, -2002), new Point(-2001, 2002)] });
  // add to scene (bypass scene.addItem())
  scene.addItem('Line', line2);
  expect(scene.boundingBox().xMin).toBeCloseTo(-2001);
  expect(scene.boundingBox().xMax).toBeCloseTo(1001);
  expect(scene.boundingBox().yMin).toBeCloseTo(-2002);
  expect(scene.boundingBox().yMax).toBeCloseTo(2002);
});


test('Test Scene.addItem', () => {
  // Throw error on missing data
  expect(() => {
    scene.addItem('Line');
  }).toThrow();

  // Add a invalid item type
  const itemCnt = scene.entities.count();
  const returnIndex = scene.addItem('FakeItem', {});
  expect(scene.entities.count()).toBe(itemCnt);
  expect(returnIndex).toBeUndefined();

  // Add a valid item with data
  const itemCount = scene.entities.count();
  const index = scene.addItem('Line', { points: [new Point(), new Point(10, 10)] });
  expect(scene.entities.count()).toBe(itemCount + 1);
  expect(index).toBe(itemCount);

  // Add a valid item with data at index - item count should not increase
  scene.addItem('Line', { points: [new Point(123, 123), new Point(321, 321)] }, index);
  expect(scene.entities.count()).toBe(itemCount + 1);
  // check the items points to make sure index was replaced
  expect(scene.entities.get(index).points[0].x).toBe(123);
  expect(scene.entities.get(index).points[1].x).toBe(321);
});
