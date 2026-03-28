import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Fillet } from '../../core/tools/fillet.js';
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
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(5, -5), new Point(5, 5)] });

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
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  const entityCountBefore = core.scene.entities.count();

  const fillet = new Fillet();
  fillet.action(); // no firstEntity / secondEntity

  expect(core.scene.entities.count()).toBe(entityCountBefore);
});

test('Fillet.action notifies when entity type is not supported', () => {
  core.scene.clear();
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0); // Circle
  fillet.second.entity = core.scene.entities.get(1); // Line
  fillet.first.clickPoint = new Point(0, 0);
  fillet.second.clickPoint = new Point(5, 0);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOFILLET));
  notifySpy.mockRestore();
});

test('Fillet.action notifies for parallel lines', () => {
  core.scene.clear();
  // Two horizontal parallel lines
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(5, 0);
  fillet.second.clickPoint = new Point(5, 5);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.PARALLELLINES);
  notifySpy.mockRestore();
});

test('Fillet.action radius=0 trimMode=true trims both lines to intersection', () => {
  // Two lines meeting at 90° at (10, 0), but the segments don't overlap.
  // Horizontal: (0,0)→(10,0) and Vertical: (10,0)→(10,10) — already share the corner.
  // Use lines that only touch when extended:
  // Horizontal: (0,0)→(8,0), Vertical: (10,-10)→(10,-2)
  // Their infinite extensions meet at (10, 0).
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(8, 0)] });
  core.scene.addItem('Line', { points: [new Point(10, -10), new Point(10, -2)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(4, 0);
  fillet.second.clickPoint = new Point(10, -6);
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
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(8, 0)] });
  core.scene.addItem('Line', { points: [new Point(10, -10), new Point(10, -2)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(4, 0);
  fillet.second.clickPoint = new Point(10, -6);
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
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(-5, 0); // on the horizontal line, left of intersection
  fillet.second.clickPoint = new Point(0, 5); // on the vertical line, above intersection
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
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(-5, 0);
  fillet.second.clickPoint = new Point(0, 5);
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
  core.scene.addItem('Line', { points: [new Point(-5, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 5)] });

  core.scene.headers.filletRadius = 10;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(-2, 0);
  fillet.second.clickPoint = new Point(0, 2);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.RADIUSTOOLARGE));
  // No arc added
  expect(core.scene.entities.count()).toBe(2);
  notifySpy.mockRestore();
});

test('Fillet.action arc centre is at correct position for 90° corner', () => {
  // 90° corner at origin, radius 3 → arc centre at (-3, 3)
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 3;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(-5, 0);
  fillet.second.clickPoint = new Point(0, 5);
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
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, -10), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(5, 0); // right side of horizontal
  fillet.second.clickPoint = new Point(0, 5); // top of vertical
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
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0); // Line
  fillet.second.entity = core.scene.entities.get(1); // Circle
  fillet.first.clickPoint = new Point(5, 0);
  fillet.second.clickPoint = new Point(0, 0);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOFILLET));
  notifySpy.mockRestore();
});

// ─── action: click at intersection ───────────────────────────────────────────

test('Fillet.action notifies when click coincides with intersection', () => {
  // L-corner at origin. Clicking firstClickPoint exactly at (0,0) makes
  // firstClickDistance = 0, triggering the invalid-selection guard.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(0, 0); // exactly at the intersection
  fillet.second.clickPoint = new Point(0, 5);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.SELECTION);
  expect(core.scene.entities.count()).toBe(2); // no arc added
  notifySpy.mockRestore();
});

test('Fillet.action radius=0 notifies and makes no changes when click coincides with intersection', () => {
  // Click at exactly the intersection point — clickDistance = 0.
  // The guard must fire before applySharpTrim() runs.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const fillet = new Fillet();
  fillet.first.entity = core.scene.entities.get(0);
  fillet.second.entity = core.scene.entities.get(1);
  fillet.first.clickPoint = new Point(0, 0); // exactly at the intersection
  fillet.second.clickPoint = new Point(0, 5);
  fillet.action();

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.SELECTION);
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

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.INVALIDNUMBER);
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
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

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
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

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
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.first.entity = lineEntity;
  fillet.first.segment = lineEntity;
  fillet.first.segmentIndex = null;
  fillet.first.clickPoint = new Point(0, 5);
  fillet.second.entity = polyEntity;
  fillet.second.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.second.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.second.clickPoint = polyClickPoint;
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
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);
  const lineEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.first.entity = polyEntity;
  fillet.first.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.first.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.first.clickPoint = polyClickPoint;
  fillet.second.entity = lineEntity;
  fillet.second.segment = lineEntity;
  fillet.second.segmentIndex = null;
  fillet.second.clickPoint = new Point(0, 5);
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
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(8, 0);

  const fillet = new Fillet();
  fillet.first.entity = lineEntity;
  fillet.first.segment = lineEntity;
  fillet.first.segmentIndex = null;
  fillet.first.clickPoint = new Point(0, 5);
  fillet.second.entity = polyEntity;
  fillet.second.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.second.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.second.clickPoint = polyClickPoint;
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
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 0;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.first.entity = lineEntity;
  fillet.first.segment = lineEntity;
  fillet.first.segmentIndex = null;
  fillet.first.clickPoint = new Point(0, 5);
  fillet.second.entity = polyEntity;
  fillet.second.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.second.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.second.clickPoint = polyClickPoint;
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
  core.scene.addItem('Lwpolyline', { points: [new Point(-10, 0), new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);

  const fillet = new Fillet();
  fillet.first.entity = polyEntity;
  fillet.second.entity = polyEntity;
  fillet.first.segment = polyEntity.getClosestSegment(new Point(-5, 0));
  fillet.first.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(-5, 0));
  fillet.first.clickPoint = new Point(-5, 0);
  fillet.second.segment = polyEntity.getClosestSegment(new Point(0, 5));
  fillet.second.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  fillet.second.clickPoint = new Point(0, 5);
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
  core.scene.addItem('Lwpolyline', { points: [new Point(-5, 0), new Point(0, 0), new Point(1, 0), new Point(1, 5)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);

  const fillet = new Fillet();
  fillet.first.entity = polyEntity;
  fillet.second.entity = polyEntity;
  fillet.first.segment = polyEntity.getClosestSegment(new Point(-3, 0)); // segment 1 (index 1)
  fillet.first.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(-3, 0));
  fillet.first.clickPoint = new Point(-3, 0);
  fillet.second.segment = polyEntity.getClosestSegment(new Point(1, 3)); // segment 3 (last, index 3)
  fillet.second.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(1, 3));
  fillet.second.clickPoint = new Point(1, 3);
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

test('Fillet.action radius>0 trimMode=false Line + Lwpolyline: standalone arc added, entities unchanged', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.filletRadius = 2;
  core.scene.headers.trimMode = false;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const fillet = new Fillet();
  fillet.first.entity = lineEntity;
  fillet.first.segment = lineEntity;
  fillet.first.segmentIndex = null;
  fillet.first.clickPoint = new Point(0, 5);
  fillet.second.entity = polyEntity;
  fillet.second.segment = polyEntity.getClosestSegment(polyClickPoint);
  fillet.second.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  fillet.second.clickPoint = polyClickPoint;
  fillet.action();

  // Arc added as standalone entity; original line and polyline untouched
  expect(core.scene.entities.count()).toBe(3);
  expect(core.scene.entities.get(2).type).toBe('Arc');
  expect(core.scene.entities.get(0).points.length).toBe(2);
  expect(core.scene.entities.get(1).points.length).toBe(4);
});
