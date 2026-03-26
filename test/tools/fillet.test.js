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
  fillet.firstEntity = core.scene.entities.get(0); // Circle
  fillet.secondEntity = core.scene.entities.get(1); // Line
  fillet.firstClickPoint = new Point(0, 0);
  fillet.secondClickPoint = new Point(5, 0);
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(5, 0);
  fillet.secondClickPoint = new Point(5, 5);
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(4, 0);
  fillet.secondClickPoint = new Point(10, -6);
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(4, 0);
  fillet.secondClickPoint = new Point(10, -6);
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(-5, 0); // on the horizontal line, left of intersection
  fillet.secondClickPoint = new Point(0, 5); // on the vertical line, above intersection
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(-5, 0);
  fillet.secondClickPoint = new Point(0, 5);
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(-2, 0);
  fillet.secondClickPoint = new Point(0, 2);
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(-5, 0);
  fillet.secondClickPoint = new Point(0, 5);
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
  fillet.firstEntity = core.scene.entities.get(0);
  fillet.secondEntity = core.scene.entities.get(1);
  fillet.firstClickPoint = new Point(5, 0); // right side of horizontal
  fillet.secondClickPoint = new Point(0, 5); // top of vertical
  fillet.action();

  const arc = core.scene.entities.get(2);
  expect(arc.type).toBe('Arc');

  // Arc centre should be in the top-right quadrant
  expect(arc.points[0].x).toBeGreaterThan(0);
  expect(arc.points[0].y).toBeGreaterThan(0);
});
