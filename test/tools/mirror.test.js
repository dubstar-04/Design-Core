import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Mirror } from '../../core/tools/mirror.js';

const core = new Core();

const inputScenarios = [
  {
    desc: 'mirror across X axis keeping source',
    points: [new Point(0, 5), new Point(10, 5)],
    inputs: [new Point(0, 0), new Point(1, 0), 'No'],
    expectedCount: 2,
    checkIndex: 1,
    expectedX: 0,
    expectedY: -5,
  },
  {
    desc: 'mirror across X axis erasing source',
    points: [new Point(0, 5), new Point(10, 5)],
    inputs: [new Point(0, 0), new Point(1, 0), 'Yes'],
    expectedCount: 1,
    checkIndex: 0,
    expectedX: 0,
    expectedY: -5,
  },
  {
    desc: 'mirror across Y axis keeping source',
    points: [new Point(5, 0), new Point(5, 10)],
    inputs: [new Point(0, 0), new Point(0, 1), 'No'],
    expectedCount: 2,
    checkIndex: 1,
    expectedX: -5,
    expectedY: 0,
  },
];

test.each(inputScenarios)('Mirror.execute handles $desc', async (scenario) => {
  const { points, inputs, expectedCount, checkIndex, expectedX, expectedY } = scenario;

  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const mirror = new Mirror();
  await mirror.execute();
  mirror.action();

  expect(core.scene.entities.count()).toBe(expectedCount);

  const entity = core.scene.entities.get(checkIndex);
  expect(entity.points[0].x).toBeCloseTo(expectedX);
  expect(entity.points[0].y).toBeCloseTo(expectedY);

  core.scene.inputManager = origInputManager;
});

test('Mirror.execute - cancel at first point does not mirror', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  core.scene.inputManager = {
    requestInput: async () => undefined,
    executeCommand: () => {},
    reset: () => {},
  };

  const mirror = new Mirror();
  await mirror.execute();

  expect(core.scene.entities.count()).toBe(1);
  expect(core.scene.entities.get(0).points[0].y).toBeCloseTo(5);

  core.scene.inputManager = origInputManager;
});

test('Mirror.execute - cancel at second point does not mirror', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [new Point(0, 0)]; // provides pt1, then undefined on pt2
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const mirror = new Mirror();
  await mirror.execute();

  expect(core.scene.entities.count()).toBe(1);
  expect(core.scene.entities.get(0).points[0].y).toBeCloseTo(5);

  core.scene.inputManager = origInputManager;
});

test('Mirror.execute - cancel at erase prompt does not mirror', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [new Point(0, 0), new Point(1, 0)]; // pt1 + pt2, then undefined on erase
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const mirror = new Mirror();
  await mirror.execute();

  expect(core.scene.entities.count()).toBe(1);
  expect(core.scene.entities.get(0).points[0].y).toBeCloseTo(5);

  core.scene.inputManager = origInputManager;
});

test('Mirror.execute - entity count unchanged when keeping source', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.addItem('Circle', { points: [new Point(0, 5), new Point(10, 5)] });

  const entityCount = core.scene.entities.count();

  for (let i = 0; i < entityCount; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [new Point(0, 0), new Point(1, 0), 'No'];
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const mirror = new Mirror();
  await mirror.execute();
  mirror.action();

  expect(core.scene.entities.count()).toBe(entityCount * 2);

  core.scene.inputManager = origInputManager;
});

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

test('Mirror.action - zero-length mirror line does not modify entities', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();
  mirror.points.push(new Point(3, 3)); // pt1 === pt2 — degenerate mirror line
  mirror.points.push(new Point(3, 3));
  mirror.eraseSource = false;

  mirror.action();

  // No new entity should have been added
  expect(core.scene.entities.count()).toBe(1);
  // Original entity is unchanged
  expect(core.scene.entities.get(0).points[0].y).toBeCloseTo(5);
});

test('Mirror.execute - requests selection set when none pre-selected', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  // Intentionally do NOT add to selection set — triggers the SELECTIONSET prompt

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  core.scene.inputManager = {
    requestInput: async () => {
      callCount++;
      if (callCount === 1) {
        // SELECTIONSET prompt: populate the selection manually and return
        core.scene.selectionManager.addToSelectionSet(0);
        return;
      }
      if (callCount === 2) return new Point(0, 0); // pt1
      if (callCount === 3) return new Point(1, 0); // pt2
      if (callCount === 4) return 'No'; // keep source
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const mirror = new Mirror();
  await mirror.execute();
  mirror.action();

  expect(core.scene.entities.count()).toBe(2);
  expect(core.scene.entities.get(1).points[0].y).toBeCloseTo(-5);

  core.scene.inputManager = origInputManager;
});

test('Mirror.preview - no points set, adds no temp entities', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();
  // No points pushed — guard condition should prevent any work
  mirror.preview();

  expect(core.scene.tempEntities.count()).toBe(0);
});

test('Mirror.preview - one point set, draws temp mirror line using mouse position', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();
  mirror.points.push(new Point(3, 3)); // pt1 distinct from default mouse (0,0) scene position
  mirror.preview();

  // Temp mirror line should have been created
  expect(core.scene.tempEntities.count()).toBeGreaterThanOrEqual(1);
});

test('Mirror.preview - two distinct points, draws mirror line and mirrors selected items', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();
  mirror.points.push(new Point(0, 0)); // pt1
  mirror.points.push(new Point(1, 0)); // pt2 — mirror across X axis
  mirror.preview();

  // Temp mirror line should exist
  expect(core.scene.tempEntities.count()).toBeGreaterThanOrEqual(1);

  // The selectedItems copy should have its points mirrored (y negated)
  const previewItem = core.scene.selectionManager.selectedItems[0];
  expect(previewItem.points[0].y).toBeCloseTo(-5);
});

test('Mirror.preview - identical points, draws line but skips mirroring selected items', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();
  mirror.points.push(new Point(5, 5)); // pt1
  mirror.points.push(new Point(5, 5)); // pt2 — same as pt1, zero-length mirror line
  mirror.preview();

  // Temp line is still drawn
  expect(core.scene.tempEntities.count()).toBeGreaterThanOrEqual(1);

  // Selected item points should be unchanged (mirroring skipped)
  const previewItem = core.scene.selectionManager.selectedItems[0];
  expect(previewItem.points[0].y).toBeCloseTo(5);
});

test('Mirror.preview - reverses direction for entities with a direction property', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  // Arc with CCW direction
  core.scene.addItem('Arc', { points: [new Point(0, 5), new Point(10, 5), new Point(5, 10)], direction: 1 });
  core.scene.selectionManager.addToSelectionSet(0);

  const mirror = new Mirror();
  mirror.points.push(new Point(0, 0)); // pt1
  mirror.points.push(new Point(1, 0)); // pt2 — mirror across X axis
  mirror.preview();

  // Original entity direction is unchanged
  expect(core.scene.entities.get(0).direction).toBe(1);

  // Preview copy has direction reversed
  const previewItem = core.scene.selectionManager.selectedItems[0];
  expect(previewItem.direction).toBe(-1);
});
