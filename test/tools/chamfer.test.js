import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Chamfer } from '../../core/tools/chamfer.js';
import { Strings } from '../../core/lib/strings.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { expect, jest } from '@jest/globals';
import { withMockInput } from '../test-helpers/test-helpers.js';

const core = new Core();

// ─── register ────────────────────────────────────────────────────────────────

test('Chamfer.register returns correct command object', () => {
  const reg = Chamfer.register();
  expect(reg.command).toBe('Chamfer');
  expect(reg.shortcut).toBe('CHA');
});

// ─── action: guard conditions ─────────────────────────────────────────────────

test('Chamfer.action does nothing when entities are not set', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  const countBefore = core.scene.entities.count();

  const chamfer = new Chamfer();
  chamfer.action();

  expect(core.scene.entities.count()).toBe(countBefore);
});

test('Chamfer.action notifies when first entity type is not supported', () => {
  core.scene.clear();
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0); // Circle
  chamfer.secondPick.entity = core.scene.entities.get(1); // Line
  chamfer.firstPick.clickPoint = new Point(0, 0);
  chamfer.secondPick.clickPoint = new Point(5, 0);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOCHAMFER));
  notifySpy.mockRestore();
});

test('Chamfer.action notifies when second entity type is not supported', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0); // Line
  chamfer.secondPick.entity = core.scene.entities.get(1); // Circle
  chamfer.firstPick.clickPoint = new Point(5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 0);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOCHAMFER));
  notifySpy.mockRestore();
});

test('Chamfer.action notifies for parallel lines', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 5), new Point(10, 5)] });

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(5, 0);
  chamfer.secondPick.clickPoint = new Point(5, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.PARALLELLINES));
  notifySpy.mockRestore();
});

// ─── action: distance method ──────────────────────────────────────────────────

test('Chamfer.action dist=0 trimMode=true trims both lines to intersection', () => {
  // Lines only touching when extended: horizontal (0,0)→(8,0), vertical (10,-10)→(10,-2)
  // Infinite extensions meet at (10, 0).
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(8, 0)] });
  core.scene.addItem('Line', { points: [new Point(10, -10), new Point(10, -2)] });

  core.scene.headers.chamferDistanceA = 0;
  core.scene.headers.chamferDistanceB = 0;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(4, 0);
  chamfer.secondPick.clickPoint = new Point(10, -6);
  chamfer.action();

  // No chamfer line added
  expect(core.scene.entities.count()).toBe(2);

  const line1 = core.scene.entities.get(0);
  const line2 = core.scene.entities.get(1);

  // Line 1 extended to intersection (10, 0)
  expect(line1.points[1].x).toBeCloseTo(10);
  expect(line1.points[1].y).toBeCloseTo(0);

  // Line 2 extended to intersection (10, 0)
  expect(line2.points[1].x).toBeCloseTo(10);
  expect(line2.points[1].y).toBeCloseTo(0);
});

test('Chamfer.action dist=0 trimMode=false makes no changes', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(8, 0)] });
  core.scene.addItem('Line', { points: [new Point(10, -10), new Point(10, -2)] });

  core.scene.headers.chamferDistanceA = 0;
  core.scene.headers.chamferDistanceB = 0;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = false;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(4, 0);
  chamfer.secondPick.clickPoint = new Point(10, -6);
  chamfer.action();

  expect(core.scene.entities.count()).toBe(2);
  expect(core.scene.entities.get(0).points[1].x).toBeCloseTo(8);
  expect(core.scene.entities.get(1).points[1].y).toBeCloseTo(-2);
});

test('Chamfer.action distance method trimMode=true adds chamfer line and trims', () => {
  // Perpendicular L-corner at origin: horizontal (-10,0)→(0,0), vertical (0,0)→(0,10)
  // Equal distances of 2 → chamfer endpoints at (-2,0) and (0,2)
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  expect(core.scene.entities.count()).toBe(3);

  const line1 = core.scene.entities.get(0);
  const line2 = core.scene.entities.get(1);
  const chamferLine = core.scene.entities.get(2);

  expect(chamferLine.type).toBe('Line');

  // Chamfer line connects (-2,0) and (0,2)
  expect(chamferLine.points[0].x).toBeCloseTo(-2);
  expect(chamferLine.points[0].y).toBeCloseTo(0);
  expect(chamferLine.points[1].x).toBeCloseTo(0);
  expect(chamferLine.points[1].y).toBeCloseTo(2);

  // Line 1 trimmed: kept end (-10,0), trimmed to (-2,0)
  expect(line1.points[0].x).toBeCloseTo(-10);
  expect(line1.points[0].y).toBeCloseTo(0);
  expect(line1.points[1].x).toBeCloseTo(-2);
  expect(line1.points[1].y).toBeCloseTo(0);

  // Line 2 trimmed: kept end (0,10), trimmed to (0,2)
  expect(line2.points[0].x).toBeCloseTo(0);
  expect(line2.points[0].y).toBeCloseTo(10);
  expect(line2.points[1].x).toBeCloseTo(0);
  expect(line2.points[1].y).toBeCloseTo(2);
});

test('Chamfer.action distance method asymmetric distances', () => {
  // L-corner at origin, distA=3 along horizontal, distB=1 along vertical
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 3;
  core.scene.headers.chamferDistanceB = 1;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  const chamferLine = core.scene.entities.get(2);
  expect(chamferLine.type).toBe('Line');
  expect(chamferLine.points[0].x).toBeCloseTo(-3);
  expect(chamferLine.points[0].y).toBeCloseTo(0);
  expect(chamferLine.points[1].x).toBeCloseTo(0);
  expect(chamferLine.points[1].y).toBeCloseTo(1);
});

test('Chamfer.action distance method trimMode=false adds chamfer line only', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = false;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  // Chamfer line added, original lines unchanged
  expect(core.scene.entities.count()).toBe(3);
  expect(core.scene.entities.get(2).type).toBe('Line');

  // Original lines still have their original endpoints
  expect(core.scene.entities.get(0).points[1].x).toBeCloseTo(0);
  expect(core.scene.entities.get(0).points[1].y).toBeCloseTo(0);
  expect(core.scene.entities.get(1).points[0].x).toBeCloseTo(0);
  expect(core.scene.entities.get(1).points[0].y).toBeCloseTo(0);
});

test('Chamfer.action notifies when distance is too large for the segments', () => {
  // Lines only 5 units long from intersection — distance 10 won't fit
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-5, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 5)] });

  core.scene.headers.chamferDistanceA = 10;
  core.scene.headers.chamferDistanceB = 10;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-2, 0);
  chamfer.secondPick.clickPoint = new Point(0, 2);
  chamfer.action();
  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.MAXVALUE));
  expect(core.scene.entities.count()).toBe(2);
  notifySpy.mockRestore();
});

// ─── action: angle method ─────────────────────────────────────────────────────

test('Chamfer.action angle method 45° on perpendicular lines matches distance method', () => {
  // L-corner at origin, distA=2, angle=45° on perpendicular lines.
  // With perpendicular lines and 45°, the chamfer endpoint on line2 should also be 2 units
  // from the intersection — matching a symmetric distance chamfer.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferLength = 2;
  core.scene.headers.chamferAngle = 45; // degrees
  core.scene.headers.chamferMode = true;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  expect(core.scene.entities.count()).toBe(3);
  const chamferLine = core.scene.entities.get(2);
  expect(chamferLine.type).toBe('Line');

  // First chamfer point: 2 units along line1 from intersection → (-2, 0)
  expect(chamferLine.points[0].x).toBeCloseTo(-2);
  expect(chamferLine.points[0].y).toBeCloseTo(0);

  // Second chamfer point: where chamfer ray meets line2 → (0, 2) for 45° on perpendicular lines
  expect(chamferLine.points[1].x).toBeCloseTo(0);
  expect(chamferLine.points[1].y).toBeCloseTo(2);
});

// ─── action: click at intersection ───────────────────────────────────────────

test('Chamfer.action notifies when click coincides with intersection', () => {
  // L-corner at origin. Clicking firstClickPoint exactly at (0,0) makes
  // firstClickDistance = 0, triggering the "Selected corner cannot be chamfered" guard.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(0, 0); // exactly at the intersection
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.SELECTION));
  expect(core.scene.entities.count()).toBe(2);
  notifySpy.mockRestore();
});

// ─── action: angle method edge cases ─────────────────────────────────────────

test('Chamfer.action angle method notifies INVALIDNUMBER when angle is zero', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferLength = 2;
  core.scene.headers.chamferAngle = 0; // alpha = 0 * π/180 = 0, fails alpha <= 0 guard
  core.scene.headers.chamferMode = true;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
  expect(core.scene.entities.count()).toBe(2);
  notifySpy.mockRestore();
});

test('Chamfer.action angle method notifies PARALLELLINES when chamfer direction is parallel to line2', () => {
  // L-corner at origin, angle = 90°.
  // firstClickUnit along line1 clicked from left: (-1, 0).
  // rotAngle = π - π/2 = π/2.
  // candidate1 = rotate(-1,0) by +π/2 = (0,-1); dot with secondClickUnit (0,1) = -1 < 0.
  // candidate2 = rotate(-1,0) by -π/2 = (0, 1) → parallel to secondLineDirection (0,1) → cross = 0.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferLength = 2;
  core.scene.headers.chamferAngle = 90; // degrees
  core.scene.headers.chamferMode = true;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.PARALLELLINES));
  expect(core.scene.entities.count()).toBe(2);
  notifySpy.mockRestore();
});

// ─── execute ──────────────────────────────────────────────────────────────────

test('Chamfer.execute returns early when first input is undefined', async () => {
  core.scene.clear();
  const chamfer = new Chamfer();
  await withMockInput(core.scene, [], async () => {
    await chamfer.execute();
  });
  // no error thrown — confirms early-return path
});

test('Chamfer.execute selects two lines and calls executeCommand', async () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(-5, 0)), new SingleSelection(1, new Point(0, 5))],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
        expect(executeCommandSpy).toHaveBeenCalled();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );
});

test('Chamfer.execute sets chamferDistanceA and chamferDistanceB via Distance option', async () => {
  core.scene.headers.chamferDistanceA = 0;
  core.scene.headers.chamferDistanceB = 0;

  await withMockInput(
      core.scene,
      ['Distance', 4, 6, undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(core.scene.headers.chamferDistanceA).toBe(4);
  expect(core.scene.headers.chamferDistanceB).toBe(6);
});

test('Chamfer.execute notifies INVALIDNUMBER for negative first distance', async () => {
  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      ['Distance', -2, undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
  notifySpy.mockRestore();
});

test('Chamfer.execute notifies INVALIDNUMBER for negative second distance', async () => {
  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      ['Distance', 3, -1, undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
  notifySpy.mockRestore();
});

test('Chamfer.execute sets chamferLength and chamferAngle via Angle option', async () => {
  core.scene.headers.chamferLength = 0;
  core.scene.headers.chamferAngle = 0;

  await withMockInput(
      core.scene,
      ['Angle', 3, 60, undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(core.scene.headers.chamferLength).toBe(3);
  expect(core.scene.headers.chamferAngle).toBe(60);
});

test('Chamfer.execute notifies INVALIDNUMBER for negative length in Angle option', async () => {
  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      ['Angle', -1, undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
  notifySpy.mockRestore();
});

test('Chamfer.execute notifies INVALIDNUMBER for out-of-range angle in Angle option', async () => {
  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      ['Angle', 3, 200, undefined], // 200° is >= 180, invalid
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
  notifySpy.mockRestore();
});

test('Chamfer.execute sets trimMode to false via Trim option', async () => {
  core.scene.headers.trimMode = true;

  await withMockInput(
      core.scene,
      ['Trim', 'No trim', undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(core.scene.headers.trimMode).toBe(false);
});

test('Chamfer.execute sets chamferMode to true via Method=Angle option', async () => {
  core.scene.headers.chamferMode = false;

  await withMockInput(
      core.scene,
      ['Method', 'Angle', undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(core.scene.headers.chamferMode).toBe(true);
});

test('Chamfer.execute re-prompts and notifies when first selected entity is not a Line', async () => {
  core.scene.clear();
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(0, 0)), undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOCHAMFER));
  notifySpy.mockRestore();
});

test('Chamfer.execute re-prompts and notifies when second selected entity is not a Line', async () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');

  await withMockInput(
      core.scene,
      [new SingleSelection(0, new Point(5, 0)), new SingleSelection(1, new Point(0, 0)), undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOCHAMFER));
  notifySpy.mockRestore();
});

// ─── action: polyline scenarios ───────────────────────────────────────────────

// Geometry shared across the Line + Lwpolyline tests:
//   Line:       (0,0)→(0,10)  (vertical)
//   Lwpolyline: [(-20,0), (-10,0), (0,0), (10,0)]  (horizontal, 3 segments)
//   Infinite extensions of the y=0 and x=0 lines meet at (0,0).
//   With distance 2:
//     polyChamfer  = (-2, 0)   (on the polyline segment y=0)
//     lineChamfer  = ( 0, 2)   (on the external line x=0)

test('Chamfer.action dist>0 trimMode=true Line first + Lwpolyline second keepStart: chamfer embedded in polyline', () => {
  // Click polyline near (-15,0) → segment 1. keepStart keeps the start portion.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = lineEntity;
  chamfer.firstPick.segment = lineEntity;
  chamfer.firstPick.segmentIndex = null;
  chamfer.firstPick.clickPoint = new Point(0, 5);
  chamfer.secondPick.entity = polyEntity;
  chamfer.secondPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  chamfer.secondPick.clickPoint = polyClickPoint;
  chamfer.action();

  // Line is consumed into the polyline; no separate chamfer Line entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  // [(-20,0), polyChamfer(-2,0), lineChamfer(0,2), lineKeptEnd(0,10)]
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-20);
  expect(poly.points[0].y).toBeCloseTo(0);
  expect(poly.points[1].x).toBeCloseTo(-2);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(2);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

test('Chamfer.action dist>0 trimMode=true Lwpolyline first + Line second keepStart: same result with entities reversed', () => {
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);
  const lineEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.firstPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  chamfer.firstPick.clickPoint = polyClickPoint;
  chamfer.secondPick.entity = lineEntity;
  chamfer.secondPick.segment = lineEntity;
  chamfer.secondPick.segmentIndex = null;
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  // Line is consumed; no separate chamfer Line entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-20);
  expect(poly.points[1].x).toBeCloseTo(-2);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(2);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

test('Chamfer.action dist>0 trimMode=true Line + Lwpolyline keepEnd: keeps end portion of polyline', () => {
  // Click polyline near (8,0) → segment 3 (right of intersection). keepEnd.
  // polyChamfer = (2,0), lineChamfer = (0,2).
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(8, 0);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = lineEntity;
  chamfer.firstPick.segment = lineEntity;
  chamfer.firstPick.segmentIndex = null;
  chamfer.firstPick.clickPoint = new Point(0, 5);
  chamfer.secondPick.entity = polyEntity;
  chamfer.secondPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  chamfer.secondPick.clickPoint = polyClickPoint;
  chamfer.action();

  // Line consumed; end portion of polyline kept; no separate chamfer Line entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  // [lineKeptEnd(0,10), lineChamfer(0,2), polyChamfer(2,0), (10,0)]
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(10);
  expect(poly.points[1].x).toBeCloseTo(0);
  expect(poly.points[1].y).toBeCloseTo(2);
  expect(poly.points[2].x).toBeCloseTo(2);
  expect(poly.points[2].y).toBeCloseTo(0);
  expect(poly.points[3].x).toBeCloseTo(10);
  expect(poly.points[3].y).toBeCloseTo(0);
});

test('Chamfer.action dist>0 trimMode=true same Lwpolyline consecutive segments: chamfer points inserted', () => {
  // L-shaped polyline; chamfer the inner corner. No separate chamfer Line entity.
  // Segment 1: (-10,0)→(0,0), Segment 2: (0,0)→(0,10). Corner at (0,0).
  // dist=2 → chamfer at (-2,0) and (0,2).
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-10, 0), new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segment = polyEntity.getClosestSegment(new Point(-5, 0));
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(-5, 0));
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  // Chamfer segment is a straight polyline segment — no separate Line entity
  expect(core.scene.entities.count()).toBe(1);

  const poly = core.scene.entities.get(0);
  // Corner vertex replaced: [(-10,0), (-2,0), (0,2), (0,10)]
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-10);
  expect(poly.points[0].y).toBeCloseTo(0);
  expect(poly.points[1].x).toBeCloseTo(-2);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(2);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

test('Chamfer.action dist>0 trimMode=true same Lwpolyline open ends: separate chamfer Line fills gap', () => {
  // 4-point polyline: [(-5,0),(0,0),(1,0),(1,5)]. Segments 1 and 3 are the open ends.
  // They are non-adjacent (diff=2) so the open-ends path is taken.
  // Infinite lines of seg1 (y=0) and seg3 (x=1) meet at (1,0).
  // dist=2, clicks at (-3,0) and (1,3):
  //   firstChamfer = (-1,0), secondChamfer = (1,2).
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-5, 0), new Point(0, 0), new Point(1, 0), new Point(1, 5)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const polyEntity = core.scene.entities.get(0);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segment = polyEntity.getClosestSegment(new Point(-3, 0)); // segment 1 (index 1)
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(-3, 0));
  chamfer.firstPick.clickPoint = new Point(-3, 0);
  chamfer.secondPick.segment = polyEntity.getClosestSegment(new Point(1, 3)); // segment 3 (last, index 3)
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(1, 3));
  chamfer.secondPick.clickPoint = new Point(1, 3);
  chamfer.action();

  // Separate chamfer Line entity fills the gap between the trimmed open ends
  expect(core.scene.entities.count()).toBe(2);

  const chamferLine = core.scene.entities.get(1);
  expect(chamferLine.type).toBe('Line');
  // Chamfer line from firstChamfer(-1,0) to secondChamfer(1,2)
  expect(chamferLine.points[0].x).toBeCloseTo(-1);
  expect(chamferLine.points[0].y).toBeCloseTo(0);
  expect(chamferLine.points[1].x).toBeCloseTo(1);
  expect(chamferLine.points[1].y).toBeCloseTo(2);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  // Start of polyline trimmed to first chamfer point: (-1,0)
  expect(poly.points[0].x).toBeCloseTo(-1);
  expect(poly.points[0].y).toBeCloseTo(0);
  // End of polyline trimmed to second chamfer point: (1,2)
  expect(poly.points[3].x).toBeCloseTo(1);
  expect(poly.points[3].y).toBeCloseTo(2);
});

test('Chamfer.action dist>0 trimMode=true closed Lwpolyline seg3+closing-seg: corner-splice at shared vertex', () => {
  // Square: [(0,0),(10,0),(10,10),(0,10)], closed (flag 1).
  // Closing segment (idx=4) goes (0,10)→(0,0); seg 3 goes (10,10)→(0,10).
  // Corner at (0,10) — chamfer dist=2 trims to (2,10) on seg3 and (0,8) on closing seg.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  // Click on segment 3 near (5,10) and on closing segment near (0,5)
  chamfer.firstPick.segment = polyEntity.getClosestSegment(new Point(5, 10));
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 10));
  chamfer.firstPick.clickPoint = new Point(5, 10);
  chamfer.secondPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  // Corner-splice: no extra entity, just the modified polyline
  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  // Shared vertex (0,10) at index 3 replaced by two chamfer points → total 5 points
  expect(poly.points.length).toBe(5);
  // Other vertices unchanged
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(0);
  expect(poly.points[1].x).toBeCloseTo(10);
  expect(poly.points[1].y).toBeCloseTo(0);
});

test('Chamfer.action dist>0 trimMode=true closed Lwpolyline closing-wrap (seg4+seg1): NOT treated as open-ends', () => {
  // Same square, closed. Corner at (0,0) shared by closing seg (idx=4) and seg 1.
  // Bug: old code had no closed-poly guard, so closing-wrap was treated as open-ends.
  // Fix: closed poly must NOT enter the open-ends path → corner-splice at index 0.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  // closing segment near (0,5), seg 1 near (5,0)
  chamfer.firstPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  chamfer.firstPick.clickPoint = new Point(0, 5);
  chamfer.secondPick.segment = polyEntity.getClosestSegment(new Point(5, 0));
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 0));
  chamfer.secondPick.clickPoint = new Point(5, 0);
  chamfer.action();

  // Must take corner-splice path (not open-ends): no extra chamfer Line entity
  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  // Shared vertex (0,0) at index 0 replaced by two chamfer points → total 5 points
  expect(poly.points.length).toBe(5);
  // Endpoints must NOT have been moved to the intersection (open-ends symptom)
  // The first two new points should be the chamfer points, not (0,0)/(0,0)
  const allAtOrigin = poly.points[0].x === 0 && poly.points[0].y === 0 &&
    poly.points[1].x === 0 && poly.points[1].y === 0;
  expect(allAtOrigin).toBe(false);
});

test('Chamfer.action dist>0 trimMode=false closed Lwpolyline closing-wrap: standalone chamfer Line only', () => {
  // Same square, closed, trimMode=false. No polyline mutation; only chamfer Line added.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = false;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segment = polyEntity.getClosestSegment(new Point(0, 5));
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(0, 5));
  chamfer.firstPick.clickPoint = new Point(0, 5);
  chamfer.secondPick.segment = polyEntity.getClosestSegment(new Point(5, 0));
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(5, 0));
  chamfer.secondPick.clickPoint = new Point(5, 0);
  chamfer.action();

  // trimMode=false: polyline unchanged, chamfer Line added
  expect(core.scene.entities.count()).toBe(2);
  expect(core.scene.entities.get(0).points.length).toBe(4); // polyline unchanged
  expect(core.scene.entities.get(1).type).toBe('Line');
});

test('Chamfer.action dist>0 trimMode=true open Lwpolyline seg1+lastIdx still takes open-ends path', () => {
  // Open 4-point polyline (no flags). Seg 1 and seg 3 (lastIdx=3) → open-ends path still fires.
  // Regression guard: the closed-poly fix must not break the open-poly open-ends case.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-5, 0), new Point(0, 0), new Point(1, 0), new Point(1, 5)] });
  const polyEntity = core.scene.entities.get(0);
  // No flags set — open polyline

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segment = polyEntity.getClosestSegment(new Point(-3, 0));
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(-3, 0));
  chamfer.firstPick.clickPoint = new Point(-3, 0);
  chamfer.secondPick.segment = polyEntity.getClosestSegment(new Point(1, 3));
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(new Point(1, 3));
  chamfer.secondPick.clickPoint = new Point(1, 3);
  chamfer.action();

  // Open-ends path: separate chamfer Line entity added
  expect(core.scene.entities.count()).toBe(2);
  expect(core.scene.entities.get(1).type).toBe('Line');
});

test('Chamfer.action dist>0 trimMode=false Line + Lwpolyline: standalone chamfer Line added, entities unchanged', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = false;

  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-15, 0);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = lineEntity;
  chamfer.firstPick.segment = lineEntity;
  chamfer.firstPick.segmentIndex = null;
  chamfer.firstPick.clickPoint = new Point(0, 5);
  chamfer.secondPick.entity = polyEntity;
  chamfer.secondPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  chamfer.secondPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  chamfer.secondPick.clickPoint = polyClickPoint;
  chamfer.action();

  // Chamfer Line added as standalone entity; original line and polyline untouched
  expect(core.scene.entities.count()).toBe(3);
  expect(core.scene.entities.get(2).type).toBe('Line');
  expect(core.scene.entities.get(0).points.length).toBe(2);
  expect(core.scene.entities.get(1).points.length).toBe(4);
});

// ─── action: entity property inheritance ─────────────────────────────────────

test('Chamfer.action chamfer line inherits layer, lineWidth, lineType from first entity', () => {
  // Perpendicular L-corner at origin; first entity on a non-default layer.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)], layer: 'walls', lineWidth: 5, lineType: 'DASHED' });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferDistanceB = 2;
  core.scene.headers.chamferMode = false;
  core.scene.headers.trimMode = false;

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);
  chamfer.action();

  expect(core.scene.entities.count()).toBe(3);
  const chamferLine = core.scene.entities.get(2);
  expect(chamferLine.type).toBe('Line');
  expect(chamferLine.layer).toBe('walls');
  expect(chamferLine.lineWidth).toBe(5);
  expect(chamferLine.lineType).toBe('DASHED');
});
