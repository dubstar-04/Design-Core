import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Offset } from '../../core/tools/offset.js';
import { Line } from '../../core/entities/line.js';
import { Arc } from '../../core/entities/arc.js';
import { Circle } from '../../core/entities/circle.js';
import { DesignCore } from '../../core/designCore.js';
import { expect, jest } from '@jest/globals';

const core = new Core();

const inputScenarios = [
  {
    desc: 'offset line to the left by distance 5',
    entityType: 'Line',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [5, { selectedEntityIndex: 0 }, new Point(5, 5)],
    checkIndex: 1,
    expectedPoints: [new Point(0, 5), new Point(10, 5)],
  },
  {
    desc: 'offset line to the right by distance 5',
    entityType: 'Line',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [5, { selectedEntityIndex: 0 }, new Point(5, -5)],
    checkIndex: 1,
    expectedPoints: [new Point(0, -5), new Point(10, -5)],
  },
  {
    desc: 'offset circle outward by distance 5',
    entityType: 'Circle',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [5, { selectedEntityIndex: 0 }, new Point(20, 0)],
    checkIndex: 1,
    checkRadius: 15,
  },
  {
    desc: 'offset circle inward by distance 3',
    entityType: 'Circle',
    entityData: { points: [new Point(0, 0), new Point(10, 0)] },
    inputs: [3, { selectedEntityIndex: 0 }, new Point(5, 0)],
    checkIndex: 1,
    checkRadius: 7,
  },
  {
    desc: 'offset arc outward by distance 5',
    entityType: 'Arc',
    entityData: { points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] },
    inputs: [5, { selectedEntityIndex: 0 }, new Point(20, 0)],
    checkIndex: 1,
    checkRadius: 15,
  },
];

test.each(inputScenarios)('Offset.execute handles $desc', async (scenario) => {
  const { entityType, entityData, inputs, checkIndex, expectedPoints, checkRadius } = scenario;

  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addEntity(entityType, entityData);

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

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

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

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

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

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [5, { selectedEntityIndex: 0 }]; // distance + selection, then undefined
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
  // selectedEntity must be cleared so a stale action() call cannot create an unintended entity
  expect(offset.selectedEntity).toBeNull();

  core.scene.inputManager = origInputManager;
});

test('Offset.execute - entity count increases by one per offset', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const entityCount = core.scene.entities.count();

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  const inputs = [5, { selectedEntityIndex: 0 }, new Point(5, 5)];
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

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
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

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
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

  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 5;
  offset.points = [new Point(20, 0)]; // outside the circle

  offset.action();

  expect(core.scene.entities.count()).toBe(2);

  const newCircle = core.scene.entities.get(1);
  // Centre should remain the same
  expect(newCircle.points[0].x).toBeCloseTo(0);
  expect(newCircle.points[0].y).toBeCloseTo(0);
  // New radius should be 15
  expect(newCircle.getProperty('radius')).toBeCloseTo(15);
});

test('Test Offset.action - offset circle inward', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 3;
  offset.points = [new Point(5, 0)]; // inside the circle

  offset.action();

  const newCircle = core.scene.entities.get(1);
  expect(newCircle.points[0].x).toBeCloseTo(0);
  expect(newCircle.points[0].y).toBeCloseTo(0);
  expect(newCircle.getProperty('radius')).toBeCloseTo(7);
});

test('Test Offset.action - offset circle inward returns null when radius would be zero', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 15; // larger than radius
  offset.points = [new Point(5, 0)]; // inside

  offset.action();

  // No new entity should be created
  expect(core.scene.entities.count()).toBe(1);
});

test('Test Offset.action - offset arc outward preserves angles', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  const centre = new Point(0, 0);
  const start = centre.project(0, 10); // radius 10
  const end = centre.project(Math.PI / 2, 10);

  core.scene.addEntity('Arc', { points: [centre, start, end] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 5;
  offset.points = [new Point(20, 0)]; // outside

  offset.action();

  const newArc = core.scene.entities.get(1);
  // New radius should be 15
  const newRadius = newArc.points[0].distance(newArc.points[1]);
  expect(newRadius).toBeCloseTo(15);

  // Start and end angles should be preserved
  const originalStartAngle = centre.angle(start);
  const originalEndAngle = centre.angle(end);
  const newStartAngle = newArc.points[0].angle(newArc.points[1]);
  const newEndAngle = newArc.points[0].angle(newArc.points[2]);
  expect(newStartAngle).toBeCloseTo(originalStartAngle);
  expect(newEndAngle).toBeCloseTo(originalEndAngle);
});

test('Test Offset.action - unsupported entity type does not create new entity', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  core.scene.addEntity('Rectangle', { points: [new Point(0, 0), new Point(10, 10)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 5;
  offset.points = [new Point(20, 20)];

  offset.action();

  // No new entity should be created for unsupported types
  expect(core.scene.entities.count()).toBe(1);
});

test('Test Offset.getOffsetPoints - diagonal line via polyline path', () => {
  const offset = new Offset();

  const entity = new Line({ points: [new Point(0, 0), new Point(10, 10)] });
  const sidePoint = new Point(0, 10); // above-left
  const result = offset.getOffsetPoints(entity, sidePoint, 5);

  expect(result).not.toBeNull();
  // Reconstruct and check the offset line
  const rebuilt = new Line({});
  rebuilt.fromPolylinePoints(result);

  // For a 45° line, the normal offset of 5 should shift by ~3.535 in each axis
  const expected = 5 / Math.sqrt(2);
  expect(rebuilt.points[0].x).toBeCloseTo(-expected);
  expect(rebuilt.points[0].y).toBeCloseTo(expected);
  expect(rebuilt.points[1].x).toBeCloseTo(10 - expected);
  expect(rebuilt.points[1].y).toBeCloseTo(10 + expected);
});

test('Test Offset.getThroughDistance - line', () => {
  const offset = new Offset();
  const entity = new Line({ points: [new Point(0, 0), new Point(10, 0)] });

  const throughPoint = new Point(5, 7);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(7);
});

test('Test Offset.getThroughDistance - circle', () => {
  const offset = new Offset();
  const entity = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });

  const throughPoint = new Point(15, 0);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(5);
});

// ─── getThroughDistance ───────────────────────────────────────────────────────

test('Test Offset.getThroughDistance - arc uses same radial distance as circle', () => {
  const offset = new Offset();
  // Arc: centre (0,0), radius 10
  const entity = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });

  // Point inside the arc radius
  const throughPoint = new Point(4, 0);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(6); // |4 - 10|
});

test('Test Offset.getThroughDistance - polyline uses closestPoint distance', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Polyline', { points: [new Point(0, 0), new Point(10, 0)] });
  const entity = core.scene.entities.get(0);

  const offset = new Offset();
  const throughPoint = new Point(5, 3);
  const result = offset.getThroughDistance(entity, throughPoint);
  expect(result).toBeCloseTo(3);
});

test('Test Offset.getThroughDistance - unsupported entity returns 0', () => {
  const offset = new Offset();
  const entity = { points: [] };
  expect(offset.getThroughDistance(entity, new Point(5, 5))).toBe(0);
});

// ─── action edge cases ────────────────────────────────────────────────────────

test('Test Offset.action - returns early when selectedEntity is null', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedEntity = null;
  core.scene.headers.offsetDistance = 5;
  offset.action();

  expect(core.scene.entities.count()).toBe(1);
});

test('Test Offset.action - returns early when offsetDistance is 0', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 0;
  offset.points = [new Point(5, 5)];
  offset.action();

  expect(core.scene.entities.count()).toBe(1);
});

// ─── getOffsetPoints - arc ────────────────────────────────────────────────────

test('Test Offset.getOffsetPoints - arc inward offset shrinks radius', () => {
  const offset = new Offset();
  const entity = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });

  // sidePoint inside the arc (between centre and circumference)
  const result = offset.getOffsetPoints(entity, new Point(5, 0), 3);

  expect(result).not.toBeNull();
  const rebuilt = new Arc({});
  rebuilt.fromPolylinePoints(result);
  expect(rebuilt.getProperty('radius')).toBeCloseTo(7);
});

test('Test Offset.getOffsetPoints - arc returns null when inward offset collapses radius', () => {
  const offset = new Offset();
  const entity = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });

  // distance (15) > radius (10) when going inward
  const result = offset.getOffsetPoints(entity, new Point(5, 0), 15);

  expect(result).toBeNull();
});

// ─── getOffsetPolylinePoints ──────────────────────────────────────────────────

test('Test Offset.getOffsetPolylinePoints - returns null for fewer than 2 points', () => {
  const offset = new Offset();
  expect(offset.getOffsetPolylinePoints([new Point(0, 0)], false, new Point(0, 5), 1)).toBeNull();
});

test('Test Offset.getOffsetPolylinePoints - open L-shape offset produces 3 points', () => {
  const offset = new Offset();
  // L-shape: (0,0) → (10,0) → (10,10)
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10)];

  // sidePoint above the bottom segment → offset upward/left
  const result = offset.getOffsetPolylinePoints(points, false, new Point(5, 2), 1);

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
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10)];

  // sidePoint below the bottom segment → offset downward/right
  const result = offset.getOffsetPolylinePoints(points, false, new Point(5, -2), 1);

  expect(result).not.toBeNull();
  expect(result.length).toBe(3);
  expect(result[0].y).toBeCloseTo(-1);
  expect(result[2].x).toBeCloseTo(11);
});

test('Test Offset.getOffsetPolylinePoints - closed rectangle offset outward', () => {
  const offset = new Offset();
  // Closed rectangle: (0,0) → (10,0) → (10,10) → (0,10), closed
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)];

  // sidePoint outside the left edge
  const result = offset.getOffsetPolylinePoints(points, true, new Point(-5, 5), 1);

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
  // centre=(5,0), radius=5
  const start = new Point(0, 0, -1); // bulge=-1 → CW, arc goes upward
  const end = new Point(10, 0);
  const points = [start, end];

  // sidePoint above the arc (outside), offset outward by 1 → new radius = 6
  const result = offset.getOffsetPolylinePoints(points, false, new Point(5, 10), 1);

  expect(result).not.toBeNull();
  expect(result.length).toBe(2);
  const arcCenter = new Point(5, 0);
  const newRadius = arcCenter.distance(result[0]);
  expect(newRadius).toBeCloseTo(6);
});

// ─── findJunction ─────────────────────────────────────────────────────────────

test('Offset.findJunction - line/line returns intersection point', () => {
  const offset = new Offset();
  // Two offset line segments that would meet at (5, 2)
  const seg = { A: new Point(0, 2), B: new Point(10, 2), bulge: 0 };
  const nextSeg = { A: new Point(5, 0), B: new Point(5, 10), bulge: 0 };
  const result = offset.findJunction(seg, nextSeg);
  expect(result.x).toBeCloseTo(5);
  expect(result.y).toBeCloseTo(2);
});

test('Offset.findJunction - parallel line/line falls back to midpoint', () => {
  const offset = new Offset();
  // Parallel lines — no intersection, midpoint between seg.B and nextSeg.A
  const seg = { A: new Point(0, 1), B: new Point(4, 1), bulge: 0 };
  const nextSeg = { A: new Point(6, 1), B: new Point(10, 1), bulge: 0 };
  const result = offset.findJunction(seg, nextSeg);
  expect(result.x).toBeCloseTo(5);
  expect(result.y).toBeCloseTo(1);
});

test('Offset.findJunction - arc/line returns circle-line intersection', () => {
  const offset = new Offset();
  // Arc: A=(-5,0) B=(5,0) bulge=1 → centre (0,0), radius 5 via bulgeCentrePoint
  // Line: vertical at x=3 → circle intersects at (3,4) and (3,-4)
  const seg = { A: new Point(-5, 0), B: new Point(5, 0), bulge: 1 };
  const nextSeg = { A: new Point(3, 5), B: new Point(3, 10), bulge: 0 };
  const result = offset.findJunction(seg, nextSeg);
  // midpoint of seg.B(5,0) and nextSeg.A(3,5) = (4,2.5) → closest intersection is (3,4)
  expect(result.x).toBeCloseTo(3);
  expect(result.y).toBeCloseTo(4);
});

test('Offset.findJunction - line/arc returns line-circle intersection', () => {
  const offset = new Offset();
  // Line: y=0. Arc: A=(10,3) B=(0,3) bulge=1 → center (5,3), radius 5 via bulgeCentrePoint
  // Circle intersects y=0 at x=1 and x=9
  const seg = { A: new Point(0, 0), B: new Point(6, 0), bulge: 0 };
  const nextSeg = { A: new Point(10, 3), B: new Point(0, 3), bulge: 1 };
  const result = offset.findJunction(seg, nextSeg);
  // midpoint of seg.B(6,0) and nextSeg.A(10,3) = (8,1.5) → closest intersection is (9,0)
  expect(result.x).toBeCloseTo(9);
  expect(result.y).toBeCloseTo(0);
});

test('Offset.findJunction - arc/arc returns circle-circle intersection', () => {
  const offset = new Offset();
  // Circle 1: A=(-4,0) B=(4,0) bulge=1 → centre (0,0), radius 4 via bulgeCentrePoint
  // Circle 2: A=(0,4) B=(6,4) bulge=1 → center (3,4), radius 3 via bulgeCentrePoint
  // Intersections: (0,4) and (96/25, 28/25)
  const seg = { A: new Point(-4, 0), B: new Point(4, 0), bulge: 1 };
  const nextSeg = { A: new Point(0, 4), B: new Point(6, 4), bulge: 1 };
  const result = offset.findJunction(seg, nextSeg);
  // midpoint of seg.B(4,0) and nextSeg.A(0,4) = (2,2) → closest is (96/25, 28/25) ≈ (3.84, 1.12)
  expect(result.x).toBeCloseTo(3.84);
  expect(result.y).toBeCloseTo(1.12);
});

test('Offset.findJunction - non-intersecting arc/arc falls back to midpoint', () => {
  const offset = new Offset();
  // Two circles too far apart to intersect
  // A=(0,2) B=(4,2) bulge=1 → center (2,2), radius 2 via bulgeCentrePoint
  // A=(16,4) B=(20,4) bulge=1 → center (18,4), radius 2 via bulgeCentrePoint
  const seg = { A: new Point(0, 2), B: new Point(4, 2), bulge: 1 };
  const nextSeg = { A: new Point(16, 4), B: new Point(20, 4), bulge: 1 };
  const result = offset.findJunction(seg, nextSeg);
  expect(result.x).toBeCloseTo(10);
  expect(result.y).toBeCloseTo(3);
});

// ─── preselection ───────────────────────────────────────────────────────────

test('Offset.execute - single preselection skips entity selection prompt', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  // Preselect the entity
  core.scene.selectionManager.addToSelectionSet(0);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  // Only distance and side-point inputs — no selection prompt should be requested
  const inputs = [5, new Point(5, 5)];
  const offset = new Offset();
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) return inputs[callCount++];
    },
    actionCommand: () => {
      offset.action();
    },
    executeCommand: () => {},
    reset: () => {},
  };

  await offset.execute();

  expect(core.scene.entities.count()).toBe(2);
  core.scene.inputManager = origInputManager;
});

test('Offset.execute - multi-preselection clears selection and prompts', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 5), new Point(10, 5)] });
  // Preselect two entities
  core.scene.selectionManager.addToSelectionSet(0);
  core.scene.selectionManager.addToSelectionSet(1);

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  // After clearing, distance + selection + side-point
  const inputs = [5, { selectedEntityIndex: 0 }, new Point(5, 5)];
  const offset = new Offset();
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) return inputs[callCount++];
    },
    actionCommand: () => {
      offset.action();
    },
    executeCommand: () => {},
    reset: () => {},
  };

  await offset.execute();

  expect(core.scene.entities.count()).toBe(3);
  core.scene.inputManager = origInputManager;
});

// ─── execute edge cases ───────────────────────────────────────────────────────

test('Offset.execute - distance <= 0 notifies and does not offset', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

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
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  // 'Through' → select entity at index 0 → through point at (5, 7) → undefined exits loop
  const inputs = ['Through', { selectedEntityIndex: 0 }, new Point(5, 7)];

  const offset = new Offset();
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) return inputs[callCount++];
    },
    actionCommand: () => {
      offset.action();
    },
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

// ─── register ─────────────────────────────────────────────────────────────────

test('Offset.register returns correct metadata', () => {
  const reg = Offset.register();
  expect(reg.command).toBe('Offset');
  expect(reg.shortcut).toBe('O');
});

// ─── preview ──────────────────────────────────────────────────────────────────

test('Offset.preview does not add preview entity when selectedEntity is null', () => {
  core.scene.clear();
  DesignCore.Scene.previewEntities.clear();
  core.scene.headers.offsetDistance = 5;

  const offset = new Offset();
  offset.selectedEntity = null;
  expect(() => offset.preview()).not.toThrow();
  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Offset.preview does not add preview entity when offsetDistance is 0', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  DesignCore.Scene.previewEntities.clear();
  core.scene.headers.offsetDistance = 0;

  const savedPointOnScene = DesignCore.Mouse.pointOnScene;
  DesignCore.Mouse.pointOnScene = () => new Point(5, 5);

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  offset.preview();

  DesignCore.Mouse.pointOnScene = savedPointOnScene;
  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Offset.preview adds entity to previewEntities for a valid line', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  DesignCore.Scene.previewEntities.clear();
  core.scene.headers.offsetDistance = 5;

  const savedPointOnScene = DesignCore.Mouse.pointOnScene;
  DesignCore.Mouse.pointOnScene = () => new Point(5, 5);

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  offset.preview();

  DesignCore.Mouse.pointOnScene = savedPointOnScene;
  expect(DesignCore.Scene.previewEntities.count()).toBe(1);
  expect(DesignCore.Scene.previewEntities.get(0).points[0].y).toBeCloseTo(5);
});

// ─── Lwpolyline action ─────────────────────────────────────────────────────────

test('Test Offset.action - offset open Lwpolyline', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  // L-shape: (0,0) → (10,0) → (10,10)
  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });

  const offset = new Offset();
  offset.selectedEntity = core.scene.entities.get(0);
  core.scene.headers.offsetDistance = 1;
  offset.points = [new Point(5, 2)]; // above the bottom segment → offset upward/left

  offset.action();

  expect(core.scene.entities.count()).toBe(2);
  const newPoly = core.scene.entities.get(1);
  expect(newPoly.points[0].x).toBeCloseTo(0);
  expect(newPoly.points[0].y).toBeCloseTo(1);
  expect(newPoly.points[2].x).toBeCloseTo(9);
  expect(newPoly.points[2].y).toBeCloseTo(10);
});

test('Test Offset.action - offset closed Lwpolyline outward', () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  // Closed square: 5 points where first === last → constructor sets flag=1
  core.scene.addEntity('Lwpolyline', {
    points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10), new Point(0, 0)],
  });

  const polyline = core.scene.entities.get(0);
  expect(polyline.flags.hasFlag(1)).toBe(true); // confirm closed

  const offset = new Offset();
  offset.selectedEntity = polyline;
  core.scene.headers.offsetDistance = 1;
  offset.points = [new Point(-5, 5)]; // outside the left edge

  offset.action();

  expect(core.scene.entities.count()).toBe(2);
  const newPoly = core.scene.entities.get(1);
  expect(newPoly.flags.hasFlag(1)).toBe(true); // closed flag preserved
  const xs = newPoly.points.map((p) => p.x);
  const ys = newPoly.points.map((p) => p.y);
  expect(Math.min(...xs)).toBeCloseTo(-1);
  expect(Math.max(...xs)).toBeCloseTo(11);
  expect(Math.min(...ys)).toBeCloseTo(-1);
  expect(Math.max(...ys)).toBeCloseTo(11);
});

// ─── closed inward offset ──────────────────────────────────────────────────────

test('Test Offset.getOffsetPolylinePoints - closed rectangle offset inward', () => {
  const offset = new Offset();
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)];

  // sidePoint inside the rectangle
  const result = offset.getOffsetPolylinePoints(points, true, new Point(5, 5), 1);

  expect(result).not.toBeNull();
  expect(result.length).toBe(4);
  const xs = result.map((p) => p.x);
  const ys = result.map((p) => p.y);
  expect(Math.min(...xs)).toBeCloseTo(1);
  expect(Math.max(...xs)).toBeCloseTo(9);
  expect(Math.min(...ys)).toBeCloseTo(1);
  expect(Math.max(...ys)).toBeCloseTo(9);
});

// ─── Through mode with circle ──────────────────────────────────────────────────

test('Offset.execute - Through mode offsets circle to the through point', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();

  // Circle: centre (0,0), radius 10
  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(10, 0)] });

  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  // Through → select circle → through point at (15,0) → undefined exits loop
  const inputs = ['Through', { selectedEntityIndex: 0 }, new Point(15, 0)];

  const offset = new Offset();
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) return inputs[callCount++];
    },
    actionCommand: () => {
      offset.action();
    },
    executeCommand: () => {},
    reset: () => {},
  };

  await offset.execute();

  // getThroughDistance(circle at radius 10, throughPoint at r=15) = |15 - 10| = 5
  expect(core.scene.headers.offsetDistance).toBeCloseTo(5);
  expect(core.scene.entities.count()).toBe(2);
  const newCircle = core.scene.entities.get(1);
  expect(newCircle.getProperty('radius')).toBeCloseTo(15); // original 10 + outward 5

  core.scene.inputManager = origInputManager;
});
