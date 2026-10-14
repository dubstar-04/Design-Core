import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { DimensionBase } from '../../core/dimensions/dimensionBase.js';

const core = new Core();
const selectionManager = core.scene.selectionManager;

// Add a valid item to scene
core.scene.addEntity('Line', { points: [new Point(10, 10), new Point(100, 10)] });
core.scene.addEntity('Line', { points: [new Point(10, 20), new Point(100, 20)] });
core.scene.addEntity('Circle', { points: [new Point(), new Point(5, 0)] });


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

test('Test SelectionManager.selectAll()', () => {
  // Start with some selections
  selectionManager.reset();
  expect(selectionManager.selectionSet.selectionSet.length).toBe(0);

  // Select all
  selectionManager.selectAll();
  expect(selectionManager.selectionSet.selectionSet.length).toBe(core.scene.entities.count());
  // The indices should match all scene items
  expect(selectionManager.selectionSet.selectionSet).toEqual([0, 1, 2]);
});

// ─── findGripUnderMouse ───────────────────────────────────────────────────────

/**
 * Select a fresh DimensionBase with a Pt11 (text position) grip at the given coordinates.
 * @param {number} x
 * @param {number} y
 * @return {number} index of the entity in core.scene.entities
 */
function selectDimensionWithGrip(x, y) {
  selectionManager.reset();
  const dim = new DimensionBase({});
  dim.points = [
    Object.assign(new Point(0, 0), { sequence: 13 }),
    Object.assign(new Point(x, y), { sequence: 11 }),
  ];
  core.scene.entities.add(dim);
  const entityIndex = core.scene.entities.count() - 1;
  selectionManager.addToSelectionSet(entityIndex);
  return entityIndex;
}

test('findGripUnderMouse returns undefined when no entity is selected', () => {
  selectionManager.reset();
  expect(selectionManager.findGripUnderMouse(new Point(0, 0))).toBeUndefined();
});

test('findGripUnderMouse returns the grip when the point is within tolerance', () => {
  const entityIndex = selectDimensionWithGrip(10, 10);
  const found = selectionManager.findGripUnderMouse(new Point(10, 10));
  expect(found).toBeDefined();
  expect(found.entityIndex).toBe(entityIndex);
  expect(found.grip.point.x).toBe(10);
  expect(found.grip.point.y).toBe(10);
});

test('findGripUnderMouse returns undefined when the point is far from any grip', () => {
  selectDimensionWithGrip(10, 10);
  expect(selectionManager.findGripUnderMouse(new Point(1000, 1000))).toBeUndefined();
});


