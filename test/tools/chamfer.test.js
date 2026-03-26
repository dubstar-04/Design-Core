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
  chamfer.firstEntity = core.scene.entities.get(0); // Circle
  chamfer.secondEntity = core.scene.entities.get(1); // Line
  chamfer.firstClickPoint = new Point(0, 0);
  chamfer.secondClickPoint = new Point(5, 0);
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
  chamfer.firstEntity = core.scene.entities.get(0); // Line
  chamfer.secondEntity = core.scene.entities.get(1); // Circle
  chamfer.firstClickPoint = new Point(5, 0);
  chamfer.secondClickPoint = new Point(0, 0);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(5, 0);
  chamfer.secondClickPoint = new Point(5, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.PARALLELLINES);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(4, 0);
  chamfer.secondClickPoint = new Point(10, -6);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(4, 0);
  chamfer.secondClickPoint = new Point(10, -6);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(-5, 0);
  chamfer.secondClickPoint = new Point(0, 5);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(-5, 0);
  chamfer.secondClickPoint = new Point(0, 5);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(-5, 0);
  chamfer.secondClickPoint = new Point(0, 5);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(-2, 0);
  chamfer.secondClickPoint = new Point(0, 2);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.DISTANCETOOLARGE));
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

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferAngle = 45; // degrees
  core.scene.headers.chamferMode = true;
  core.scene.headers.trimMode = true;

  const chamfer = new Chamfer();
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(-5, 0);
  chamfer.secondClickPoint = new Point(0, 5);
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
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(0, 0); // exactly at the intersection
  chamfer.secondClickPoint = new Point(0, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOCHAMFER));
  expect(core.scene.entities.count()).toBe(2);
  notifySpy.mockRestore();
});

// ─── action: angle method edge cases ─────────────────────────────────────────

test('Chamfer.action angle method notifies INVALIDNUMBER when angle is zero', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferAngle = 0; // alpha = 0 * π/180 = 0, fails alpha <= 0 guard
  core.scene.headers.chamferMode = true;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(-5, 0);
  chamfer.secondClickPoint = new Point(0, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.INVALIDNUMBER);
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

  core.scene.headers.chamferDistanceA = 2;
  core.scene.headers.chamferAngle = 90; // degrees
  core.scene.headers.chamferMode = true;
  core.scene.headers.trimMode = true;

  const notifySpy = jest.spyOn(core, 'notify');

  const chamfer = new Chamfer();
  chamfer.firstEntity = core.scene.entities.get(0);
  chamfer.secondEntity = core.scene.entities.get(1);
  chamfer.firstClickPoint = new Point(-5, 0);
  chamfer.secondClickPoint = new Point(0, 5);
  chamfer.action();

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.PARALLELLINES);
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

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.INVALIDNUMBER);
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

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.INVALIDNUMBER);
  notifySpy.mockRestore();
});

test('Chamfer.execute sets chamferDistanceA and chamferAngle via Angle option', async () => {
  core.scene.headers.chamferDistanceA = 0;
  core.scene.headers.chamferAngle = 0;

  await withMockInput(
      core.scene,
      ['Angle', 3, 60, undefined],
      async () => {
        const chamfer = new Chamfer();
        await chamfer.execute();
      },
  );

  expect(core.scene.headers.chamferDistanceA).toBe(3);
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

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.INVALIDNUMBER);
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

  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.INVALIDNUMBER);
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
