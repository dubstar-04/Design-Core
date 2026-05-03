import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Fillet } from '../../core/tools/fillet.js';
import { DesignCore } from '../../core/designCore.js';
import { Strings } from '../../core/lib/strings.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { expect, jest } from '@jest/globals';
import { withMockInput } from '../test-helpers/test-helpers.js';

const core = new Core();

test('Fillet.register returns correct command object', () => {
  const reg = Fillet.register();
  expect(reg.command).toBe('Fillet');
  expect(reg.shortcut).toBe('F');
});

test('Fillet.execute selects two entities and calls executeCommand', async () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(5, -5), new Point(5, 5)] });

  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(2, 0)), new SingleSelection(1, new Point(5, 2))],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
        expect(executeCommandSpy).toHaveBeenCalled();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );
});

test('Fillet.execute returns early when first input is undefined', async () => {
  core.scene.clear();
  const fillet = new Fillet();
  await withMockInput(core.scene, [], async () => {
    await fillet.execute(); // requestInput returns undefined → should not throw
  });
  // no assertion needed — just confirming no error is thrown
});

test('Fillet.action does nothing when entities are not set', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  const entityCountBefore = core.scene.entities.count();

  const fillet = new Fillet();
  fillet.action(); // no firstEntity / secondEntity

  expect(core.scene.entities.count()).toBe(entityCountBefore);
});

test('Fillet.action notifies when entity type is not supported', () => {
  core.scene.clear();
  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(5, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0); // Circle
  fillet.secondPick.entity = core.scene.entities.get(1); // Line
  fillet.firstPick.clickPoint = new Point(0, 0);
  fillet.secondPick.clickPoint = new Point(5, 0);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOFILLET));
  notifySpy.mockRestore();
});

test('Fillet.action notifies for parallel lines', () => {
  core.scene.clear();
  // Two horizontal parallel lines
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 5), new Point(10, 5)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(5, 0);
  fillet.secondPick.clickPoint = new Point(5, 5);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.PARALLELLINES));
  notifySpy.mockRestore();
});

test('Fillet.action radius=0 trimMode=true trims both lines to intersection', () => {
  // Two lines meeting at 90° at (10, 0), but the segments don't overlap.
  // Horizontal: (0,0)→(10,0) and Vertical: (10,0)→(10,10) — already share the corner.
  // Use lines that only touch when extended:
  // Horizontal: (0,0)→(8,0), Vertical: (10,-10)→(10,-2)
  // Their infinite extensions meet at (10, 0).
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(8, 0)] });
  core.scene.addEntity('Line', { points: [new Point(10, -10), new Point(10, -2)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(4, 0);
  fillet.secondPick.clickPoint = new Point(10, -6);
  fillet.action();

  const line1 = core.scene.entities.get(0);
  const line2 = core.scene.entities.get(1);

  // Line 1 should now end at the intersection (10, 0)
  expect(line1.points[0].x).toBeCloseTo(0);
  expect(line1.points[0].y).toBeCloseTo(0);
  expect(line1.points[1].x).toBeCloseTo(10);
  expect(line1.points[1].y).toBeCloseTo(0);

  // Line 2 should now end at the intersection (10, 0)
  expect(line2.points[0].x).toBeCloseTo(10);
  expect(line2.points[0].y).toBeCloseTo(-10);
  expect(line2.points[1].x).toBeCloseTo(10);
  expect(line2.points[1].y).toBeCloseTo(0);
});

test('Fillet.action radius=0 trimMode=false makes no changes', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(8, 0)] });
  core.scene.addEntity('Line', { points: [new Point(10, -10), new Point(10, -2)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(4, 0);
  fillet.secondPick.clickPoint = new Point(10, -6);
  fillet.action();

  // Entities unchanged — no new entities, same points
  expect(core.scene.entities.count()).toBe(2);
  expect(core.scene.entities.get(0).points[1].x).toBeCloseTo(8);
  expect(core.scene.entities.get(1).points[1].y).toBeCloseTo(-2);
});

test('Fillet.action radius>0 trimMode=true adds arc and trims lines', () => {
  // Perpendicular lines forming an L at (0,0):
  // Horizontal: (-10,0)→(0,0)  Vertical: (0,0)→(0,10)
  // With radius 2, tangent points are at (-2,0) and (0,2)
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(-5, 0); // on the horizontal line, left of intersection
  fillet.secondPick.clickPoint = new Point(0, 5); // on the vertical line, above intersection
  fillet.action();

  // An arc should have been added — scene now has 3 entities
  expect(core.scene.entities.count()).toBe(3);

  const line1 = core.scene.entities.get(0);
  const line2 = core.scene.entities.get(1);
  const arc = core.scene.entities.get(2);

  expect(arc.type).toBe('Arc');

  // Line 1 trimmed: kept end (-10,0), trimmed end at tangent (-2, 0)
  expect(line1.points[0].x).toBeCloseTo(-10);
  expect(line1.points[0].y).toBeCloseTo(0);
  expect(line1.points[1].x).toBeCloseTo(-2);
  expect(line1.points[1].y).toBeCloseTo(0);

  // Line 2 trimmed: kept end (0,10), trimmed end at tangent (0, 2)
  expect(line2.points[0].x).toBeCloseTo(0);
  expect(line2.points[0].y).toBeCloseTo(10);
  expect(line2.points[1].x).toBeCloseTo(0);
  expect(line2.points[1].y).toBeCloseTo(2);
});

test('Fillet.action radius>0 trimMode=false adds arc only, lines unchanged', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(-5, 0);
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  // Arc added, but lines not trimmed
  expect(core.scene.entities.count()).toBe(3);
  expect(core.scene.entities.get(2).type).toBe('Arc');

  // Lines still have their original endpoints
  expect(core.scene.entities.get(0).points[1].x).toBeCloseTo(0);
  expect(core.scene.entities.get(0).points[1].y).toBeCloseTo(0);
  expect(core.scene.entities.get(1).points[0].x).toBeCloseTo(0);
  expect(core.scene.entities.get(1).points[0].y).toBeCloseTo(0);
});

test('Fillet.action notifies when radius is too large for the segments', () => {
  // Lines only 5 units long from intersection — radius 10 won't fit
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-5, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 5)] });

  core.scene.headers.filletRadius = 10;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(-2, 0);
  fillet.secondPick.clickPoint = new Point(0, 2);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.RADIUSTOOLARGE));
  // No arc added
  expect(core.scene.entities.count()).toBe(2);
  notifySpy.mockRestore();
});

test('Fillet.action arc centre is at correct position for 90° corner', () => {
  // 90° corner at origin, radius 3 → arc centre at (-3, 3)
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 3;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(-5, 0);
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  const arc = core.scene.entities.get(2);
  expect(arc.type).toBe('Arc');

  // Arc centre point is points[0]
  expect(arc.points[0].x).toBeCloseTo(-3);
  expect(arc.points[0].y).toBeCloseTo(3);

  // Tangent points
  expect(arc.points[1].x).toBeCloseTo(-3);
  expect(arc.points[1].y).toBeCloseTo(0);
  expect(arc.points[2].x).toBeCloseTo(0);
  expect(arc.points[2].y).toBeCloseTo(3);
});

test('Fillet.action selects correct corner when lines form a cross', () => {
  // Full cross: horizontal (-10,0)→(10,0), vertical (0,-10)→(0,10)
  // Click on the top-right quadrant → fillet should be in that quadrant
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(5, 0); // right side of horizontal
  fillet.secondPick.clickPoint = new Point(0, 5); // top of vertical
  fillet.action();

  const arc = core.scene.entities.get(2);
  expect(arc.type).toBe('Arc');

  // Arc centre should be in the top-right quadrant
  expect(arc.points[0].x).toBeGreaterThan(0);
  expect(arc.points[0].y).toBeGreaterThan(0);
});

// ─── action: second entity type guard ────────────────────────────────────────

test('Fillet.action notifies when second entity type is not supported', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0); // Line
  fillet.secondPick.entity = core.scene.entities.get(1); // Circle
  fillet.firstPick.clickPoint = new Point(5, 0);
  fillet.secondPick.clickPoint = new Point(0, 0);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOFILLET));
  notifySpy.mockRestore();
});

// ─── action: click at intersection ───────────────────────────────────────────

test('Fillet.action notifies when click coincides with intersection', () => {
  // L-corner at origin. Clicking firstClickPoint exactly at (0,0) makes
  // firstClickDistance = 0, triggering the invalid-selection guard.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(0, 0); // exactly at the intersection
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.SELECTION));
  expect(core.scene.entities.count()).toBe(2); // no arc added
  notifySpy.mockRestore();
});

test('Fillet.action radius=0 notifies and makes no changes when click coincides with intersection', () => {
  // Click at exactly the intersection point — clickDistance = 0.
  // The guard must fire before applySharpTrim() runs.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(0, 0); // exactly at the intersection
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.SELECTION));
  // lines must be unchanged — applySharpTrim must not have run
  expect(core.scene.entities.get(0).points[1].x).toBeCloseTo(0);
  expect(core.scene.entities.get(0).points[1].y).toBeCloseTo(0);
  notifySpy.mockRestore();
});

// ─── execute: option branches ─────────────────────────────────────────────────

test('Fillet.execute sets filletRadius when Radius option is selected', async () => {
  core.scene.headers.filletRadius = 0;

  await withMockInput(
      core.scene,
      ['Radius', 5, undefined],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
      },
  );

  expect(core.scene.headers.filletRadius).toBe(5);
});

test('Fillet.execute notifies INVALIDNUMBER when negative radius is provided', async () => {
  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      ['Radius', -3, undefined],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
  notifySpy.mockRestore();
});

test('Fillet.execute sets trimMode to false when No trim option is selected', async () => {
  core.scene.headers.trimMode = true;

  await withMockInput(
      core.scene,
      ['Trim', 'No trim', undefined],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
      },
  );

  expect(core.scene.headers.trimMode).toBe(false);
});

test('Fillet.execute re-prompts and notifies when first selected entity is not a Line', async () => {
  core.scene.clear();
  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(0, 0)), undefined],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOFILLET));
  notifySpy.mockRestore();
});

test('Fillet.execute re-prompts and notifies when second selected entity is not a Line', async () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(5, 0)), new SingleSelection(1, new Point(0, 0)), undefined],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOFILLET));
  notifySpy.mockRestore();
});

// ─── action: polyline scenarios ───────────────────────────────────────────────

// Geometry shared across the Line + Lwpolyline tests:
//   Line:       (0,0)→(0,10)  (vertical)
//   Lwpolyline: [(-20,0), (-10,0), (0,0), (10,0)]  (horizontal, 3 segments)
//   Infinite extensions of the y=0 and x=0 lines meet at (0,0).
//   With radius 2 and a 90° corner:
//     arc centre  = (-2, 2)
//     polyTangent = (-2,  0)   (tangent on the polyline segment y=0)
//     lineTangent = ( 0,  2)   (tangent on the external line x=0)

test('Fillet.action radius>0 trimMode=true Line first + Lwpolyline second keepStart: arc embedded as bulge', () => {
  // Click polyline near (-15,0) → segment 1. keepStart keeps the start portion.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addEntity('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.firstPick.entity = lineEntity;
  fillet.firstPick.segment = lineEntity;
  fillet.firstPick.segmentIndex = null;
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.entity = polyEntity;
  fillet.secondPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.secondPick.clickPoint = polyClickPoint;
  fillet.action();

  // Line is consumed into the polyline; no separate Arc entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  // [(-20,0), polyTangent(-2,0)[bulge], lineTangent(0,2), lineKeptEnd(0,10)]
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-20);
  expect(poly.points[0].y).toBeCloseTo(0);
  expect(poly.points[1].x).toBeCloseTo(-2);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[1].bulge).not.toBe(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(2);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

test('Fillet.action radius>0 trimMode=true Lwpolyline first + Line second keepStart: arc direction correct', () => {
  // Same geometry but entity order reversed — tests the polyToLineDir arc direction fix.
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);
  const lineEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.firstPick.clickPoint = polyClickPoint;
  fillet.secondPick.entity = lineEntity;
  fillet.secondPick.segment = lineEntity;
  fillet.secondPick.segmentIndex = null;
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  // Line is consumed; no separate Arc entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-20);
  expect(poly.points[1].x).toBeCloseTo(-2);
  expect(poly.points[1].y).toBeCloseTo(0);
  // CCW arc: bulge should be positive
  expect(poly.points[1].bulge).toBeGreaterThan(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(2);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

test('Fillet.action radius>0 trimMode=true Line + Lwpolyline keepEnd: keeps end portion of polyline', () => {
  // Click polyline near (8,0) → segment 3 (right of intersection). keepEnd.
  // arc centre = (2,2), polyTangent = (2,0), lineTangent = (0,2).
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addEntity('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(8, 0);

  const fillet = new Fillet();
  fillet.firstPick.entity = lineEntity;
  fillet.firstPick.segment = lineEntity;
  fillet.firstPick.segmentIndex = null;
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.entity = polyEntity;
  fillet.secondPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.secondPick.clickPoint = polyClickPoint;
  fillet.action();

  // Line consumed; end portion kept; no separate Arc entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  // [lineKeptEnd(0,10), lineTangent(0,2)[bulge], polyTangent(2,0), (10,0)]
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(10);
  expect(poly.points[1].x).toBeCloseTo(0);
  expect(poly.points[1].y).toBeCloseTo(2);
  expect(poly.points[1].bulge).not.toBe(0);
  expect(poly.points[2].x).toBeCloseTo(2);
  expect(poly.points[2].y).toBeCloseTo(0);
  expect(poly.points[3].x).toBeCloseTo(10);
  expect(poly.points[3].y).toBeCloseTo(0);
});

test('Fillet.action radius=0 trimMode=true Line + Lwpolyline keepStart: line consumed to sharp corner', () => {
  // radius=0 → sharp intersection at (0,0), no arc.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addEntity('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.firstPick.entity = lineEntity;
  fillet.firstPick.segment = lineEntity;
  fillet.firstPick.segmentIndex = null;
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.entity = polyEntity;
  fillet.secondPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.secondPick.clickPoint = polyClickPoint;
  fillet.action();

  // Line removed; polyline updated with sharp corner; no arc entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  // [(-20,0), intersection(0,0), lineKeptEnd(0,10)]
  expect(poly.points.length).toBe(3);
  expect(poly.points[0].x).toBeCloseTo(-20);
  expect(poly.points[0].y).toBeCloseTo(0);
  expect(poly.points[1].x).toBeCloseTo(0);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(10);
});

test('Fillet.action radius>0 trimMode=true same Lwpolyline consecutive segments: arc inserted as bulge', () => {
  // L-shaped polyline; fillet the inner corner. Arc encoded as a bulge — no separate Arc entity.
  // Segment 1: (-10,0)→(0,0), Segment 2: (0,0)→(0,10). Corner at (0,0).
  // radius=2 → arc centre (-2,2), tangents at (-2,0) and (0,2).
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(-10, 0), new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);

  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(-5, 0));
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(-5, 0));
  fillet.firstPick.clickPoint = new Point(-5, 0);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  // Arc is embedded as a bulge — no separate Arc entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  // Corner vertex replaced: [(-10,0), (-2,0)[bulge], (0,2), (0,10)]
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-10);
  expect(poly.points[0].y).toBeCloseTo(0);
  expect(poly.points[1].x).toBeCloseTo(-2);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[1].bulge).not.toBe(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(2);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

test('Fillet.action radius>0 trimMode=true same Lwpolyline open ends: separate Arc entity fills gap', () => {
  // 4-point polyline: [(-5,0),(0,0),(1,0),(1,5)]. Segments 1 and 3 are the open ends.
  // They are non-adjacent (diff=2) so the open-ends path is taken.
  // Infinite lines of seg1 (y=0) and seg3 (x=1) meet at (1,0).
  // radius=2, clicks at (-3,0) and (1,3):
  //   arc centre = (-1,2), firstTangent = (-1,0), secondTangent = (1,2).
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(-5, 0), new Point(0, 0), new Point(1, 0), new Point(1, 5)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);

  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(-3, 0)); // segment 1 (index 1)
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(-3, 0));
  fillet.firstPick.clickPoint = new Point(-3, 0);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(1, 3)); // segment 3 (last, index 3)
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(1, 3));
  fillet.secondPick.clickPoint = new Point(1, 3);
  fillet.action();

  // Separate Arc entity fills the gap between the trimmed open ends
  expect(core.scene.entities.count()).toBe(2);

  const arc = core.scene.entities.get(1);
  expect(arc.type).toBe('Arc');
  // Arc centre at (-1,2)
  expect(arc.points[0].x).toBeCloseTo(-1);
  expect(arc.points[0].y).toBeCloseTo(2);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  // Start of polyline trimmed to tangent on segment 1: (-1,0)
  expect(poly.points[0].x).toBeCloseTo(-1);
  expect(poly.points[0].y).toBeCloseTo(0);
  // End of polyline trimmed to tangent on segment 3: (1,2)
  expect(poly.points[3].x).toBeCloseTo(1);
  expect(poly.points[3].y).toBeCloseTo(2);
});

test('Fillet.action radius>0 trimMode=true closed Lwpolyline seg3+closing-seg: corner-splice at shared vertex', () => {
  // Square: [(0,0),(10,0),(10,10),(0,10)], closed (flag 1).
  // Closing segment (idx=4) goes (0,10)→(0,0); seg 3 goes (10,10)→(0,10).
  // Corner at (0,10) — radius=2 replaces the shared vertex with arc bulge points.
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(5, 10));
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 10));
  fillet.firstPick.clickPoint = new Point(5, 10);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  // Corner-splice: no extra Arc entity, arc embedded as bulge
  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  // Shared vertex (0,10) replaced by two tangent points → total 5 points
  expect(poly.points.length).toBe(5);
  // One of the new points should carry a non-zero bulge
  const hasBulge = poly.points.some((p) => p.bulge !== 0);
  expect(hasBulge).toBe(true);
});

test('Fillet.action radius>0 trimMode=true closed Lwpolyline closing-wrap (seg4+seg1): NOT treated as open-ends', () => {
  // Corner at (0,0) shared by closing seg (idx=4) and seg 1.
  // Bug: without the closed-poly guard, this was treated as open-ends → wrong path.
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(5, 0));
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 0));
  fillet.secondPick.clickPoint = new Point(5, 0);
  fillet.action();

  // Must take corner-splice path: no extra Arc entity
  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  // Shared vertex (0,0) replaced by two tangent points → total 5 points
  expect(poly.points.length).toBe(5);
  // Endpoints must NOT have been moved to the intersection (open-ends symptom)
  const allAtOrigin = poly.points[0].x === 0 && poly.points[0].y === 0 &&
    poly.points[poly.points.length - 1].x === 0 && poly.points[poly.points.length - 1].y === 0;
  expect(allAtOrigin).toBe(false);
});

test('Fillet.action radius>0 trimMode=false closed Lwpolyline closing-wrap: standalone Arc only', () => {
  // trimMode=false: no polyline mutation; only Arc entity added.
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(5, 0));
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 0));
  fillet.secondPick.clickPoint = new Point(5, 0);
  fillet.action();

  // trimMode=false: polyline unchanged, arc added
  expect(core.scene.entities.count()).toBe(2);
  expect(core.scene.entities.get(0).points.length).toBe(4); // polyline unchanged
  expect(core.scene.entities.get(1).type).toBe('Arc');
});

test('Fillet.action radius>0 trimMode=false Line + Lwpolyline: standalone arc added, entities unchanged', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addEntity('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.firstPick.entity = lineEntity;
  fillet.firstPick.segment = lineEntity;
  fillet.firstPick.segmentIndex = null;
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.entity = polyEntity;
  fillet.secondPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.secondPick.clickPoint = polyClickPoint;
  fillet.action();

  // Arc added as standalone entity; original line and polyline untouched
  expect(core.scene.entities.count()).toBe(3);
  expect(core.scene.entities.get(2).type).toBe('Arc');
  expect(core.scene.entities.get(0).points.length).toBe(2);
  expect(core.scene.entities.get(1).points.length).toBe(4);
});

// ─── action: closed polyline closing-wrap arc direction (regression) ──────────
//
// Square: P0=(0,0), P1=(10,0), P2=(10,10), P3=(0,10), closed flag=1.
// Closing segment (idx=4): P3=(0,10)→P0=(0,0) — i.e. the left edge, travelling downward.
// Segment 1: P0=(0,0)→P1=(10,0) — i.e. the bottom edge, travelling rightward.
// The shared corner is P0=(0,0).
//
// With radius 2 the fillet must sit inside the square (bottom-left interior corner).
// The arc centre is at (2,2).
//   – lowerTangent = (0,2)  on the closing segment (left edge, y=2)
//   – upperTangent = (2,0)  on segment 1 (bottom edge, x=2)
//   – bulge on lowerTangent must be POSITIVE (CCW arc from (0,2) to (2,0) through ≈(0.59,0.59))
//     (PolylineBase convention: –ve bulge = CW, +ve bulge = CCW)
//
// Before the fix the lowerTangent/upperTangent assignment was inverted, producing
// an arc that traversed the exterior of the square.

test('Fillet.action closing-wrap: lowerTangent is on closing segment (left edge)', () => {
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  // firstPick = closing segment (idx=4, left edge), secondPick = segment 1 (bottom edge)
  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(5, 0));
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 0));
  fillet.secondPick.clickPoint = new Point(5, 0);
  fillet.action();

  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(5);

  // After the splice at cornerIdx=0:
  //   points[0] = lowerTangent (arcStartPoint), points[1] = upperTangent
  // lowerTangent must be on the closing segment (left edge, x≈0)
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(2);
  // upperTangent must be on segment 1 (bottom edge, y≈0)
  expect(poly.points[1].x).toBeCloseTo(2);
  expect(poly.points[1].y).toBeCloseTo(0);
});

test('Fillet.action closing-wrap: arc bulge sign is positive (CCW, fillet inside square)', () => {
  // Same setup. The CCW arc from (0,2) to (2,0) sweeps through (≈0.59, ≈0.59)
  // staying inside the square — a positive bulge value.
  // Before the fix the lowerTangent/upperTangent were swapped, producing an arc
  // that traversed the exterior of the square.
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.firstPick.clickPoint = new Point(0, 5);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(5, 0));
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 0));
  fillet.secondPick.clickPoint = new Point(5, 0);
  fillet.action();

  const poly = core.scene.entities.get(0);
  // points[0] carries the bulge for the arc from lowerTangent to upperTangent
  expect(poly.points[0].bulge).toBeGreaterThan(0);
});

test('Fillet.action closing-wrap reversed pick order: arc bulge sign and tangent positions are correct', () => {
  // Swap firstPick/secondPick — should produce the same geometry.
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  // firstPick = segment 1 (bottom edge), secondPick = closing segment (left edge, idx=4)
  const fillet = new Fillet();
  fillet.firstPick.entity = polyEntity;
  fillet.secondPick.entity = polyEntity;
  fillet.firstPick.segment = polyEntity.getClosestSegment(new Point(5, 0));
  fillet.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 0));
  fillet.firstPick.clickPoint = new Point(5, 0);
  fillet.secondPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(5);

  // Regardless of pick order: lowerTangent at (0,2), upperTangent at (2,0), bulge > 0 (CCW)
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(2);
  expect(poly.points[1].x).toBeCloseTo(2);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[0].bulge).toBeGreaterThan(0);
});

// ─── action: entity property inheritance ─────────────────────────────────────

test('Fillet.action arc inherits layer, lineWidth, lineType from first entity', () => {
  // Perpendicular L-corner at origin; first entity on a non-default layer.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)], layer: 'walls', lineWidth: 5, lineType: 'DASHED' });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.secondPick.entity = core.scene.entities.get(1);
  fillet.firstPick.clickPoint = new Point(-5, 0);
  fillet.secondPick.clickPoint = new Point(0, 5);
  fillet.action();

  expect(core.scene.entities.count()).toBe(3);
  const arc = core.scene.entities.get(2);
  expect(arc.type).toBe('Arc');
  expect(arc.getProperty('layer')).toBe('walls');
  expect(arc.getProperty('lineWidth')).toBe(5);
  expect(arc.getProperty('lineType')).toBe('DASHED');
});

test('Fillet.preview does not throw', () => {
  const fillet = new Fillet();
  expect(() => fillet.preview()).not.toThrow();
});

test('Fillet.preview returns early when findClosestItem returns undefined', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  DesignCore.Scene.previewEntities.clear();

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.firstPick.clickPoint = new Point(-5, 0);

  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(undefined);
  DesignCore.Mouse.pointOnScene = () => new Point(0, 5);
  fillet.preview();
  findSpy.mockRestore();

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Fillet.preview adds fillet arc to previewEntities in no-trim mode', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  DesignCore.Scene.previewEntities.clear();

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.firstPick.clickPoint = new Point(-5, 0);

  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(0, 5);
  fillet.preview();
  findSpy.mockRestore();

  expect(DesignCore.Scene.previewEntities.count()).toBeGreaterThanOrEqual(1);
});

test('Fillet.preview adds dulled segments and arc to previewEntities in trim mode', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  DesignCore.Scene.previewEntities.clear();

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.firstPick.entity = core.scene.entities.get(0);
  fillet.firstPick.clickPoint = new Point(-5, 0);

  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(0, 5);
  fillet.preview();
  findSpy.mockRestore();

  // dulled firstSeg + dulled secondSeg + firstTrimLine + secondTrimLine + arc = 5
  expect(DesignCore.Scene.previewEntities.count()).toBeGreaterThanOrEqual(5);
});

test('Fillet.execute returns early when second-entity input is undefined (inner loop)', async () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  const executeCommandSpy = jest.fn();
  // Only one input: the first selection. Second requestInput returns undefined → inner loop returns.
  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(-5, 0))],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
        expect(executeCommandSpy).not.toHaveBeenCalled();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );
});

test('Fillet.execute notifies NONCONSECUTIVESEGMENTS for non-adjacent polyline segments', async () => {
  // 5-point polyline → 4 segments. Pick segment 1 (near -15,0) then segment 3 (near 5,0).
  // Neither consecutive nor open-ends → NONCONSECUTIVESEGMENTS, then undefined to exit.
  core.scene.clear();
  core.scene.addEntity('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0), new Point(20, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');
  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(-15, 0)), new SingleSelection(0, new Point(5, 0)), undefined],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
      },
  );
  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NONCONSECUTIVESEGMENTS));
  notifySpy.mockRestore();
});

test('Fillet.execute Trim→Trim keeps trimMode=true', async () => {
  core.scene.headers.trimMode = true;

  await withMockInput(
      core.scene,
      ['Trim', 'Trim', undefined],
      async () => {
        const fillet = new Fillet();
        await fillet.execute();
      },
  );

  expect(core.scene.headers.trimMode).toBe(true);
});

// ─── regression: bulge must not leak onto Line endpoints ─────────────────────

test('Fillet.action two fillets on the same line: trimmed endpoints have bulge = 0', () => {
  // Line A: (-10, 0) → (10, 0)  horizontal
  // Line B: (-10, 2) → (-10, -2) vertical at left end
  // Line C: ( 10, 2) → ( 10, -2) vertical at right end
  // Fillet A–B at the left corner, then A–C at the right corner.
  // arc.toPolylinePoints() sets bulge on the start point;
  // that value must not bleed onto the Line endpoints.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(-10, 2), new Point(-10, -2)] });
  core.scene.addEntity('Line', { points: [new Point(10, 2), new Point(10, -2)] });

  core.scene.headers.filletRadius = 1;
  core.scene.headers.trimMode = true;

  const fillet1 = new Fillet();
  fillet1.firstPick.entity = core.scene.entities.get(0);
  fillet1.secondPick.entity = core.scene.entities.get(1);
  fillet1.firstPick.clickPoint = new Point(-5, 0);
  fillet1.secondPick.clickPoint = new Point(-10, 1);
  fillet1.action();

  const fillet2 = new Fillet();
  fillet2.firstPick.entity = core.scene.entities.get(0);
  fillet2.secondPick.entity = core.scene.entities.get(2);
  fillet2.firstPick.clickPoint = new Point(5, 0);
  fillet2.secondPick.clickPoint = new Point(10, 1);
  fillet2.action();

  const line = core.scene.entities.get(0);
  expect(line.points[0].bulge).toBe(0);
  expect(line.points[1].bulge).toBe(0);
});
