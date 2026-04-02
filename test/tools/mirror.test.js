import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Mirror } from '../../core/tools/mirror.js';

const core = new Core();

test('Test Mirror.action - keep source (default)', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  // Add entities
  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.addItem('Circle', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.addItem('Polyline', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.addItem('Arc', { points: [new Point(0, 5), new Point(10, 5), new Point(5, 10)] });
  core.scene.addItem('Rectangle', { points: [new Point(0, 5), new Point(10, 5)] });

  const entityCount = core.scene.entities.count();

  // Select all
  for (let i = 0; i < entityCount; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const mirror = new Mirror();

  // Mirror line along the X axis (y=0)
  mirror.points.push(new Point(0, 0));
  mirror.points.push(new Point(1, 0));
  mirror.eraseSource = false;

  mirror.action();

  // Originals kept + mirrored copies added
  expect(core.scene.entities.count()).toBe(entityCount * 2);

  // Originals unchanged
  for (let i = 0; i < entityCount; i++) {
    expect(core.scene.entities.get(i).points[0].y).toBeCloseTo(5);
  }

  // Mirrored copies have y negated
  for (let i = entityCount; i < core.scene.entities.count(); i++) {
    expect(core.scene.entities.get(i).points[0].y).toBeCloseTo(-5);
  }

  // Mirrored copies have unique handles
  for (let i = 0; i < entityCount; i++) {
    const original = core.scene.entities.get(i);
    const copy = core.scene.entities.get(i + entityCount);
    expect(copy.handle).toBeDefined();
    expect(copy.handle).not.toBe(original.handle);
  }
});

test('Test Mirror.action - erase source', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.addItem('Circle', { points: [new Point(0, 5), new Point(10, 5)] });

  const entityCount = core.scene.entities.count();

  for (let i = 0; i < entityCount; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const mirror = new Mirror();

  // Mirror line along the X axis (y=0)
  mirror.points.push(new Point(0, 0));
  mirror.points.push(new Point(1, 0));
  mirror.eraseSource = true;

  mirror.action();

  // No new entities — originals replaced in place
  expect(core.scene.entities.count()).toBe(entityCount);

  // All entities now have y negated
  for (let i = 0; i < entityCount; i++) {
    expect(core.scene.entities.get(i).points[0].y).toBeCloseTo(-5);
  }
});

test('Test Mirror.action - mirror across Y axis', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(5, 10)] });

  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();

  // Mirror line along the Y axis (x=0)
  mirror.points.push(new Point(0, 0));
  mirror.points.push(new Point(0, 1));
  mirror.eraseSource = false;

  mirror.action();

  const mirrored = core.scene.entities.get(1);
  expect(mirrored.points[0].x).toBeCloseTo(-5);
  expect(mirrored.points[0].y).toBeCloseTo(0);
});

test('Test Mirror.action - arc direction is reversed', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  // CCW arc (direction = 1)
  core.scene.addItem('Arc', { points: [new Point(0, 5), new Point(10, 5), new Point(5, 10)], direction: 1 });

  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();

  // Mirror across X axis
  mirror.points.push(new Point(0, 0));
  mirror.points.push(new Point(1, 0));
  mirror.eraseSource = false;

  mirror.action();

  const original = core.scene.entities.get(0);
  const mirrored = core.scene.entities.get(1);

  expect(original.direction).toBe(1);
  expect(mirrored.direction).toBe(-1);
});

test('Test Mirror.getMirroredPoints', () => {
  const mirror = new Mirror();
  const pt1 = new Point(0, 0);
  const pt2 = new Point(1, 0);

  // Mirror two points across X axis
  const points = [new Point(3, 4), new Point(-2, 7)];
  const result = mirror.getMirroredPoints(points, pt1, pt2);

  expect(result[0].x).toBeCloseTo(3);
  expect(result[0].y).toBeCloseTo(-4);
  expect(result[1].x).toBeCloseTo(-2);
  expect(result[1].y).toBeCloseTo(-7);
});
