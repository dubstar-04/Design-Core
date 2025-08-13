import { Core } from '../../core/core/core.js';
import { Snapping } from '../../core/lib/snapping.js';
import { Point } from '../../core/entities/point.js';

const core = new Core();
const snapping = new Snapping();

// Add a valid item to scene
core.scene.addItem('Line', { points: [new Point(10, 10), new Point(100, 10)] });


test('Test Snapping.getSnapPoint', () => {
  // set the mouse position
  core.mouse.mouseMoved(8, 8);
  // Get the snap point
  const snapPoint1 = snapping.getSnapPoint();
  expect(snapPoint1.x).toBe(10);
  expect(snapPoint1.y).toBe(10);


  // set the mouse position
  core.mouse.mouseMoved(101, 11);
  // Get the snap point
  const snapPoint2 = snapping.getSnapPoint();
  expect(snapPoint2.x).toBe(100);
  expect(snapPoint2.y).toBe(10);

  // set the mouse position
  core.mouse.mouseMoved(100, 100);
  // Get the snap point
  expect(snapping.getSnapPoint()).toBeUndefined();
});

test('Test Snapping.polarSnap', () => {
  // set the mouse position
  // note mouseMoved flips the y axis
  core.mouse.mouseMoved(100, -100);
  const button = 0;
  core.mouse.mouseDown(button);
  snapping.active = true;

  // Get the snap point
  // previousPoint = 90, 95
  // mousePoint = 100, 100
  expect(snapping.polarSnap(new Point(90, 95))).toBeUndefined();

  // Get the snap point
  // previousPoint = 80, 99
  // mousePoint = 100, 100
  // const polarSnapOne = snapping.polarSnap(new Point(80, 99));
  // expect(polarSnapOne.x).toBeCloseTo(100.02498);
  // expect(polarSnapOne.y).toBeCloseTo(100);
});

test('Test Snapping.orthoSnap', () => {

});
