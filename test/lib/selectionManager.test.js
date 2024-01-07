import {Core} from '../../core/core/core.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();
const selectionManager = core.scene.selectionManager;

// Add a valid item to scene
core.scene.addItem('Line', {points: [new Point(10, 10), new Point(100, 10)]});
core.scene.addItem('Line', {points: [new Point(10, 20), new Point(100, 20)]});
core.scene.addItem('Circle', {points: [new Point(), new Point(5, 0)]});


test('Test SelectionManager.findClosestItem', () => {
  // point at 0,0 too far from line to be selected
  expect(selectionManager.findClosestItem(new Point())).toBeUndefined();

  // select bottom line
  expect(selectionManager.findClosestItem(new Point(10, 9.5))).toBe(0);
  expect(selectionManager.findClosestItem(new Point(50, 9.5))).toBe(0);
  expect(selectionManager.findClosestItem(new Point(50, 10.5))).toBe(0);
  expect(selectionManager.findClosestItem(new Point(100, 9.5))).toBe(0);

  // select top line
  expect(selectionManager.findClosestItem(new Point(10, 19.5))).toBe(1);
  expect(selectionManager.findClosestItem(new Point(50, 19.5))).toBe(1);
  expect(selectionManager.findClosestItem(new Point(50, 20.5))).toBe(1);
  expect(selectionManager.findClosestItem(new Point(100, 19.5))).toBe(1);

  // select circle
  expect(selectionManager.findClosestItem(new Point(4.5, 0))).toBe(2);
  expect(selectionManager.findClosestItem(new Point(4.5, 4.5))).toBe(2);
  expect(selectionManager.findClosestItem(new Point(0, 5.5))).toBe(2);
});


test('Test SelectionManager.addToSelectionSet', () => {
  // add item to the selection set
  selectionManager.addToSelectionSet(1);
  expect(selectionManager.selectionSet.selectionSet.length).toBe(1);
  // try and add the same item again - should only be added once
  selectionManager.addToSelectionSet(1);
  expect(selectionManager.selectionSet.selectionSet.length).toBe(1);

  // add second item to the selection set
  selectionManager.addToSelectionSet(2);
  expect(selectionManager.selectionSet.selectionSet.length).toBe(2);
});

test('Test SelectionManager.removeFromSelectionSet', () => {
  // remove item to the selection set
  selectionManager.removeFromSelectionSet(2);
  expect(selectionManager.selectionSet.selectionSet.length).toBe(1);
});


test('Test SelectionManager.reset()', () => {
  // remove item to the selection set
  selectionManager.reset();
  expect(selectionManager.selectionSet.selectionSet.length).toBe(0);
});

