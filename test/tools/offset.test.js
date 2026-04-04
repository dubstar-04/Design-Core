import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Offset } from '../../core/tools/offset.js';

const core = new Core();

const inputScenarios = [
  {
    desc: 'offset line to the left by distance 5',
    entityType: 'Line',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [5, { selectedItemIndex: 0 }, new Point(5, 5)],
    checkIndex: 1,
    expectedPoints: [new Point(0, 5), new Point(10, 5)],
  },
  {
    desc: 'offset line to the right by distance 5',
    entityType: 'Line',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [5, { selectedItemIndex: 0 }, new Point(5, -5)],
    checkIndex: 1,
    expectedPoints: [new Point(0, -5), new Point(10, -5)],
  },
  {
    desc: 'offset circle outward by distance 5',
    entityType: 'Circle',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [5, { selectedItemIndex: 0 }, new Point(20, 0)],
    checkIndex: 1,
    checkRadius: 15,
  },
  {
    desc: 'offset circle inward by distance 3',
    entityType: 'Circle',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [3, { selectedItemIndex: 0 }, new Point(5, 0)],
    checkIndex: 1,
    checkRadius: 7,
  },
  {
    desc: 'offset arc outward by distance 5',
    entityType: 'Arc',
    entityData: { points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] },
    inputs: [5, { selectedItemIndex: 0 }, new Point(20, 0)],
    checkIndex: 1,
    checkRadius: 15,
  },
];

test.each(inputScenarios)('Offset.execute handles $desc', async (scenario) => {
  const { entityType, entityData, inputs, checkIndex, expectedPoints, checkRadius } = scenario;

  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem(entityType, entityData);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    actionCommand: () => {
      offset.action();
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const offset = new Offset();
  await offset.execute();

  const entity = core.scene.entities.get(checkIndex);
  expect(entity).toBeDefined();

  if (expectedPoints) {
    expect(entity.points[0].x).toBeCloseTo(expectedPoints[0].x);
    expect(entity.points[0].y).toBeCloseTo(expectedPoints[0].y);
    expect(entity.points[1].x).toBeCloseTo(expectedPoints[1].x);
    expect(entity.points[1].y).toBeCloseTo(expectedPoints[1].y);
  }

  if (checkRadius !== undefined) {
    const radius = entity.points[0].distance(entity.points[1]);
    expect(radius).toBeCloseTo(checkRadius);
  }

  core.scene.inputManager = origInputManager;
});

test('Offset.execute - cancel at distance prompt does not offset', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const origInputManager = core.scene.inputManager;
  core.scene.inputManager = {
    requestInput: async () => undefined,
    executeCommand: () => {},
    reset: () => {},
  };

  const offset = new Offset();
  await offset.execute();

  expect(core.scene.entities.count()).toBe(1);

  core.scene.inputManager = origInputManager;
});

test('Offset.execute - cancel at entity selection does not offset', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [5]; // provides distance, then undefined on selection
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const offset = new Offset();
  await offset.execute();

  expect(core.scene.entities.count()).toBe(1);

  core.scene.inputManager = origInputManager;
});

test('Offset.execute - cancel at side point does not offset', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [5, { selectedItemIndex: 0 }]; // distance + selection, then undefined
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const offset = new Offset();
  await offset.execute();

  expect(core.scene.entities.count()).toBe(1);

  core.scene.inputManager = origInputManager;
});

test('Offset.execute - entity count increases by one per offset', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const entityCount = core.scene.entities.count();

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [5, { selectedItemIndex: 0 }, new Point(5, 5)];
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    actionCommand: () => {
      offset.action();
    },
    executeCommand: () => {},
    reset: () => {},
  };

  const offset = new Offset();
  await offset.execute();

  expect(core.scene.entities.count()).toBe(entityCount + 1);

  core.scene.inputManager = origInputManager;
});

test('Test Offset.action - offset line perpendicular', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 5;
  offset.points = [new Point(5, 5)]; // side point above line

  offset.action();

  expect(core.scene.entities.count()).toBe(2);

  const newLine = core.scene.entities.get(1);
  expect(newLine.points[0].x).toBeCloseTo(0);
  expect(newLine.points[0].y).toBeCloseTo(5);
  expect(newLine.points[1].x).toBeCloseTo(10);
  expect(newLine.points[1].y).toBeCloseTo(5);
});

test('Test Offset.action - offset vertical line', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 3;
  offset.points = [new Point(5, 5)]; // side point to the right

  offset.action();

  const newLine = core.scene.entities.get(1);
  expect(newLine.points[0].x).toBeCloseTo(3);
  expect(newLine.points[0].y).toBeCloseTo(0);
  expect(newLine.points[1].x).toBeCloseTo(3);
  expect(newLine.points[1].y).toBeCloseTo(10);
});

test('Test Offset.action - offset circle outward', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 5;
  offset.points = [new Point(20, 0)]; // outside the circle

  offset.action();

  expect(core.scene.entities.count()).toBe(2);

  const newCircle = core.scene.entities.get(1);
  // Centre should remain the same
  expect(newCircle.points[0].x).toBeCloseTo(0);
  expect(newCircle.points[0].y).toBeCloseTo(0);
  // New radius should be 15
  expect(newCircle.radius).toBeCloseTo(15);
});

test('Test Offset.action - offset circle inward', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 3;
  offset.points = [new Point(5, 0)]; // inside the circle

  offset.action();

  const newCircle = core.scene.entities.get(1);
  expect(newCircle.points[0].x).toBeCloseTo(0);
  expect(newCircle.points[0].y).toBeCloseTo(0);
  expect(newCircle.radius).toBeCloseTo(7);
});

test('Test Offset.action - offset circle inward returns null when radius would be zero', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 15; // larger than radius
  offset.points = [new Point(5, 0)]; // inside

  offset.action();

  // No new entity should be created
  expect(core.scene.entities.count()).toBe(1);
});

test('Test Offset.action - offset arc outward preserves angles', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  const center = new Point(0, 0);
  const start = center.project(0, 10); // radius 10
  const end = center.project(Math.PI / 2, 10);

  core.scene.addItem('Arc', { points: [center, start, end] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 5;
  offset.points = [new Point(20, 0)]; // outside

  offset.action();

  const newArc = core.scene.entities.get(1);
  // New radius should be 15
  const newRadius = newArc.points[0].distance(newArc.points[1]);
  expect(newRadius).toBeCloseTo(15);

  // Start and end angles should be preserved
  const originalStartAngle = center.angle(start);
  const originalEndAngle = center.angle(end);
  const newStartAngle = newArc.points[0].angle(newArc.points[1]);
  const newEndAngle = newArc.points[0].angle(newArc.points[2]);
  expect(newStartAngle).toBeCloseTo(originalStartAngle);
  expect(newEndAngle).toBeCloseTo(originalEndAngle);
});

test('Test Offset.action - unsupported entity type does not create new entity', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addItem('Rectangle', { points: [new Point(0, 0), new Point(10, 10)] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 5;
  offset.points = [new Point(20, 20)];

  offset.action();

  // No new entity should be created for unsupported types
  expect(core.scene.entities.count()).toBe(1);
});

test('Test Offset.getOffsetLinePoints - diagonal line', () => {
  const offset = new Offset();

  const entity = { type: 'Line', points: [new Point(0, 0), new Point(10, 10)] };
  const sidePoint = new Point(0, 10); // above-left
  const result = offset.getOffsetLinePoints(entity, sidePoint, 5);

  // For a 45° line, the normal offset of 5 should shift by ~3.535 in each axis
  const expected = 5 / Math.sqrt(2);
  expect(result[0].x).toBeCloseTo(-expected);
  expect(result[0].y).toBeCloseTo(expected);
  expect(result[1].x).toBeCloseTo(10 - expected);
  expect(result[1].y).toBeCloseTo(10 + expected);
});

test('Test Offset.getThroughDistance - line', () => {
  const offset = new Offset();
  const entity = { type: 'Line', points: [new Point(0, 0), new Point(10, 0)] };

  const throughPoint = new Point(5, 7);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(7);
});

test('Test Offset.getThroughDistance - circle', () => {
  const offset = new Offset();
  const entity = { type: 'Circle', points: [new Point(0, 0), new Point(10, 0)] };

  const throughPoint = new Point(15, 0);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(5);
});
