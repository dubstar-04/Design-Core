import {Core} from '../../core/core/core.js';
import {Line} from '../../core/entities/line';
import {Point} from '../../core/entities/point';


const core = new Core();
const scene = core.scene;


test('Test Scene.boundingBox', () => {
  // empty scene
  expect(scene.boundingBox()).toBeUndefined();

  const line1 = new Line({points: [new Point(-102, -102), new Point(201, 202)]});
  // add to scene (bypass scene.addItem())
  scene.items.push(line1);
  expect(scene.boundingBox().xMin).toBeCloseTo(-102);
  expect(scene.boundingBox().xMax).toBeCloseTo(201);
  expect(scene.boundingBox().yMin).toBeCloseTo(-102);
  expect(scene.boundingBox().yMax).toBeCloseTo(202);

  const line2 = new Line({points: [new Point(1001, -2002), new Point(-2001, 2002)]});
  // add to scene (bypass scene.addItem())
  scene.items.push(line2);
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
  const itemCnt = scene.items.length;
  const returnIndex = scene.addItem('FakeItem', {});
  expect(scene.items.length).toBe(itemCnt);
  expect(returnIndex).toBeUndefined();

  // Add a valid item with data
  const itemCount = scene.items.length;
  const index = scene.addItem('Line', {points: [new Point(), new Point(10, 10)]});
  expect(scene.items.length).toBe(itemCount + 1);
  expect(index).toBe(itemCount);

  // Add a valid item with data at index - item count should not increase
  scene.addItem('Line', {points: [new Point(123, 123), new Point(321, 321)]}, index);
  expect(scene.items.length).toBe(itemCount + 1);
  // check the items points to make sure index was replaced
  expect(scene.items[index].points[0].x).toBe(123);
  expect(scene.items[index].points[1].x).toBe(321);
});

test('Test Scene.findItem', () => {
  // Add a circle with a known radius
  const index = scene.addItem('Circle', {points: [new Point(543, 543)], radius: 123});
  // find the item
  const foundItems = scene.findItem('Circle', 'radius', 123);
  expect(foundItems[0]).toBe(index);
  expect(scene.items[index].points[0].x).toBe(543);
  expect(scene.items[index].radius).toBe(123);
});

test('Test Scene.getItem', () => {
  // Add a valid item with data at index - item count should not increase
  const index = 0;
  scene.addItem('Line', {points: [new Point(1234, 1234), new Point(4321, 4321)]}, index);
  // check the items points to make sure index was replaced
  expect(scene.getItem(index).points[0].x).toBe(1234);
  expect(scene.getItem(index).points[1].x).toBe(4321);
});


test('Test Scene.removeItem', () => {
  // Remove an existing index
  const itemCount = scene.items.length;
  const index = 0;
  const removed = scene.removeItem(index);
  expect(removed).toBe(true);
  expect(scene.items.length).toBe(itemCount - 1);

  // Remove a non-existing index
  const itemCount2 = scene.items.length;
  const notRemoved = scene.removeItem(100);
  expect(notRemoved).toBe(false);
  expect(scene.items.length).toBe(itemCount2);
});
