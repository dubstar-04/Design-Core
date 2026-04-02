import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Scale } from '../../core/tools/scale.js';

const core = new Core();

test('Test Scale.action - scale by factor 2 from origin', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Polyline', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Arc', { points: [new Point(5, 0), new Point(10, 0), new Point(5, 5)] });
  core.scene.addItem('Rectangle', { points: [new Point(5, 0), new Point(10, 0)] });

  for (let i = 0; i < core.scene.entities.count(); i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const scale = new Scale();
  scale.points.push(new Point(0, 0)); // base point at origin
  scale.scaleFactor = 2;

  scale.action();

  for (let i = 0; i < core.scene.entities.count(); i++) {
    expect(core.scene.entities.get(i).points[0].x).toBeCloseTo(10);
    expect(core.scene.entities.get(i).points[0].y).toBeCloseTo(0);
    expect(core.scene.entities.get(i).points[1].x).toBeCloseTo(20);
    expect(core.scene.entities.get(i).points[1].y).toBeCloseTo(0);
  }
});

test('Test Scale.action - scale by factor 0.5 from origin', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });

  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.scaleFactor = 0.5;

  scale.action();

  const line = core.scene.entities.get(0);
  expect(line.points[0].x).toBeCloseTo(5);
  expect(line.points[0].y).toBeCloseTo(0);
  expect(line.points[1].x).toBeCloseTo(10);
  expect(line.points[1].y).toBeCloseTo(0);
});

test('Test Scale.action - scale from offset base point', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(10, 10), new Point(20, 10)] });

  core.scene.selectionManager.addToSelectionSet(0);

  const scale = new Scale();
  scale.points.push(new Point(10, 10)); // base at first point
  scale.scaleFactor = 2;

  scale.action();

  const line = core.scene.entities.get(0);
  // base point stays fixed, second point doubles away from it
  expect(line.points[0].x).toBeCloseTo(10);
  expect(line.points[0].y).toBeCloseTo(10);
  expect(line.points[1].x).toBeCloseTo(30);
  expect(line.points[1].y).toBeCloseTo(10);
});

test('Test Scale.action - entity count unchanged (in-place update)', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(5, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(5, 0), new Point(10, 0)] });

  const entityCount = core.scene.entities.count();

  for (let i = 0; i < entityCount; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const scale = new Scale();
  scale.points.push(new Point(0, 0));
  scale.scaleFactor = 3;

  scale.action();

  // Scale is in-place — no new entities added
  expect(core.scene.entities.count()).toBe(entityCount);
});

test('Test Scale.getScaledPoints', () => {
  const scale = new Scale();
  const base = new Point(0, 0);

  const points = [new Point(5, 0), new Point(0, 5)];
  const result = scale.getScaledPoints(points, base, 2);

  expect(result[0].x).toBeCloseTo(10);
  expect(result[0].y).toBeCloseTo(0);
  expect(result[1].x).toBeCloseTo(0);
  expect(result[1].y).toBeCloseTo(10);
});
