import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Offset } from '../../core/tools/offset.js';
import { expect, jest } from '@jest/globals';

const core = new Core();

// Helper to build a lightweight polyline entity without going through core scene
const makePolyline = (points, closed = false) => ({
  type: 'Polyline',
  points,
  flags: { hasFlag: (n) => n === 1 ? closed : false },
});

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

// ─── getThroughDistance ───────────────────────────────────────────────────────

test('Test Offset.getThroughDistance - arc uses same radial distance as circle', () => {
  const offset = new Offset();
  // Arc: center (0,0), radius 10
  const entity = { type: 'Arc', points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] };

  // Point inside the arc radius
  const throughPoint = new Point(4, 0);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(6); // |4 - 10|
});

test('Test Offset.getThroughDistance - polyline uses closestPoint distance', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Polyline', { points: [new Point(0, 0), new Point(10, 0)] });
  const entity = core.scene.entities.get(0);

  const offset = new Offset();
  const throughPoint = new Point(5, 3);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(3);
});

test('Test Offset.getThroughDistance - unknown type returns 0', () => {
  const offset = new Offset();
  const entity = { type: 'Unknown', points: [] };
  expect(offset.getThroughDistance(entity, new Point(5, 5))).toBe(0);
});

// ─── action edge cases ────────────────────────────────────────────────────────

test('Test Offset.action - returns early when selectedItem is null', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedItem = null;
  core.scene.headers.offsetDistance = 5;
  offset.action();

  expect(core.scene.entities.count()).toBe(1);
});

test('Test Offset.action - returns early when offsetDistance is 0', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedItem = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 0;
  offset.points = [new Point(5, 5)];
  offset.action();

  expect(core.scene.entities.count()).toBe(1);
});

// ─── getOffsetArcPoints ───────────────────────────────────────────────────────

test('Test Offset.getOffsetArcPoints - inward offset shrinks radius', () => {
  const offset = new Offset();
  const entity = { type: 'Arc', points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] };

  // sidePoint inside the arc (between center and circumference)
  const result = offset.getOffsetArcPoints(entity, new Point(5, 0), 3);

  expect(result).not.toBeNull();
  const newRadius = result[0].distance(result[1]);
  expect(newRadius).toBeCloseTo(7);
});

test('Test Offset.getOffsetArcPoints - returns null when inward offset collapses radius', () => {
  const offset = new Offset();
  const entity = { type: 'Arc', points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] };

  // distance (15) > radius (10) when going inward
  const result = offset.getOffsetArcPoints(entity, new Point(5, 0), 15);

  expect(result).toBeNull();
});

// ─── getOffsetPolylinePoints ──────────────────────────────────────────────────

test('Test Offset.getOffsetPolylinePoints - returns null for fewer than 2 points', () => {
  const offset = new Offset();
  const entity = makePolyline([new Point(0, 0)]);
  expect(offset.getOffsetPolylinePoints(entity, new Point(0, 5), 1)).toBeNull();
});

test('Test Offset.getOffsetPolylinePoints - open L-shape offset produces 3 points', () => {
  const offset = new Offset();
  // L-shape: (0,0) → (10,0) → (10,10)
  const entity = makePolyline([new Point(0, 0), new Point(10, 0), new Point(10, 10)]);

  // sidePoint above the bottom segment → offset upward/left
  const result = offset.getOffsetPolylinePoints(entity, new Point(5, 2), 1);

  expect(result).not.toBeNull();
  expect(result.length).toBe(3);
  // First point: start of bottom segment offset upward
  expect(result[0].x).toBeCloseTo(0);
  expect(result[0].y).toBeCloseTo(1);
  // Last point: end of right segment offset left
  expect(result[2].x).toBeCloseTo(9);
  expect(result[2].y).toBeCloseTo(10);
});

test('Test Offset.getOffsetPolylinePoints - open polyline offset to other side', () => {
  const offset = new Offset();
  const entity = makePolyline([new Point(0, 0), new Point(10, 0), new Point(10, 10)]);

  // sidePoint below the bottom segment → offset downward/right
  const result = offset.getOffsetPolylinePoints(entity, new Point(5, -2), 1);

  expect(result).not.toBeNull();
  expect(result.length).toBe(3);
  expect(result[0].y).toBeCloseTo(-1);
  expect(result[2].x).toBeCloseTo(11);
});

test('Test Offset.getOffsetPolylinePoints - closed rectangle offset outward', () => {
  const offset = new Offset();
  // Closed rectangle: (0,0) → (10,0) → (10,10) → (0,10), closed
  const entity = makePolyline(
    [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)],
    true,
  );

  // sidePoint outside the left edge
  const result = offset.getOffsetPolylinePoints(entity, new Point(-5, 5), 1);

  expect(result).not.toBeNull();
  expect(result.length).toBe(4); // closed: junction per segment, same count as point count
  // All result corners should be further from the origin than the originals
  const xs = result.map((p) => p.x);
  const ys = result.map((p) => p.y);
  expect(Math.min(...xs)).toBeCloseTo(-1);
  expect(Math.max(...xs)).toBeCloseTo(11);
  expect(Math.min(...ys)).toBeCloseTo(-1);
  expect(Math.max(...ys)).toBeCloseTo(11);
});

test('Test Offset.getOffsetPolylinePoints - arc segment (bulge) offset outward grows radius', () => {
  const offset = new Offset();
  // CW semicircle (bulge=-1) from (0,0) to (10,0): traces the TOP half through (5,5)
  // center=(5,0), radius=5
  const start = new Point(0, 0, -1); // bulge=-1 → CW, arc goes upward
  const end = new Point(10, 0);
  const entity = makePolyline([start, end]);

  // sidePoint above the arc (outside), offset outward by 1 → new radius = 6
  const result = offset.getOffsetPolylinePoints(entity, new Point(5, 10), 1);

  expect(result).not.toBeNull();
  expect(result.length).toBe(2);
  const arcCenter = new Point(5, 0);
  const newRadius = arcCenter.distance(result[0]);
  expect(newRadius).toBeCloseTo(6);
});

// ─── execute edge cases ───────────────────────────────────────────────────────

test('Offset.execute - distance <= 0 notifies and does not offset', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const notifySpy = jest.spyOn(core, 'notify').mockImplementation(() => {});

  const origInputManager = core.scene.inputManager;
  core.scene.inputManager = {
    requestInput: async () => -5,
    executeCommand: () => {},
    reset: () => {},
  };

  const offset = new Offset();
  await offset.execute();

  expect(notifySpy).toHaveBeenCalled();
  expect(core.scene.entities.count()).toBe(1);

  notifySpy.mockRestore();
  core.scene.inputManager = origInputManager;
});

test('Offset.execute - Through mode offsets entity to the through point distance', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  // 'Through' → select entity at index 0 → through point at (5, 7) → undefined exits loop
  const inputs = ['Through', { selectedItemIndex: 0 }, new Point(5, 7)];

  const offset = new Offset();
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) return inputs[callCount++];
    },
    actionCommand: () => { offset.action(); },
    executeCommand: () => {},
    reset: () => {},
  };

  await offset.execute();

  // getThroughDistance(line, (5,7)) = perpendicular distance = 7
  expect(core.scene.headers.offsetDistance).toBeCloseTo(7);
  // Offset entity should have been created
  expect(core.scene.entities.count()).toBe(2);
  // The new line should be at y ≈ 7
  const newLine = core.scene.entities.get(1);
  expect(newLine.points[0].y).toBeCloseTo(7);
  expect(newLine.points[1].y).toBeCloseTo(7);

  core.scene.inputManager = origInputManager;
});
