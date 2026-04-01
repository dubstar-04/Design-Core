import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Distance } from '../../core/tools/distance.js';
import { Strings } from '../../core/lib/strings.js';
import { expect, jest } from '@jest/globals';
import { withMockInput } from '../test-helpers/test-helpers.js';

const core = new Core();

// ─── register ────────────────────────────────────────────────────────────────

test('Distance.register returns correct command object', () => {
  const reg = Distance.register();
  expect(reg.command).toBe('Distance');
  expect(reg.shortcut).toBe('DI');
});

// ─── action ───────────────────────────────────────────────────────────────────

test('Distance.action vertical line: correct length, angle, and deltas', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const distance = new Distance();
  distance.points.push(new Point(0, 0));
  distance.points.push(new Point(0, 10));
  distance.action();

  expect(notifySpy).toHaveBeenCalledWith(
      `${Strings.Strings.LENGTH}: 10.0 Angle: 90.0${Strings.Symbol.DEGREE} ${Strings.Symbol.DELTA}X: 0.0 ${Strings.Symbol.DELTA}Y: 10.0`,
  );
  notifySpy.mockRestore();
});

test('Distance.action horizontal line: correct length, angle, and deltas', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const distance = new Distance();
  distance.points.push(new Point(0, 0));
  distance.points.push(new Point(10, 0));
  distance.action();

  expect(notifySpy).toHaveBeenCalledWith(
      `${Strings.Strings.LENGTH}: 10.0 Angle: 0.0${Strings.Symbol.DEGREE} ${Strings.Symbol.DELTA}X: 10.0 ${Strings.Symbol.DELTA}Y: 0.0`,
  );
  notifySpy.mockRestore();
});

test('Distance.action diagonal 3-4-5 triangle: correct length and angle', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const distance = new Distance();
  distance.points.push(new Point(0, 0));
  distance.points.push(new Point(3, 4));
  distance.action();

  // length = 5, angle = atan2(4,3) ≈ 53.1°
  expect(notifySpy).toHaveBeenCalledWith(
      `${Strings.Strings.LENGTH}: 5.0 Angle: 53.1${Strings.Symbol.DEGREE} ${Strings.Symbol.DELTA}X: 3.0 ${Strings.Symbol.DELTA}Y: 4.0`,
  );
  notifySpy.mockRestore();
});

test('Distance.action reversed horizontal line: negative delta and 180° angle', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const distance = new Distance();
  distance.points.push(new Point(10, 0));
  distance.points.push(new Point(0, 0));
  distance.action();

  // angle = atan2(0, -10) = 180°
  expect(notifySpy).toHaveBeenCalledWith(
      `${Strings.Strings.LENGTH}: 10.0 Angle: 180.0${Strings.Symbol.DEGREE} ${Strings.Symbol.DELTA}X: -10.0 ${Strings.Symbol.DELTA}Y: 0.0`,
  );
  notifySpy.mockRestore();
});

test('Distance.action non-origin start point: deltas computed from actual coordinates', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const distance = new Distance();
  distance.points.push(new Point(5, 5));
  distance.points.push(new Point(5, 10));
  distance.action();

  // dx=0, dy=5, length=5, angle=90°
  expect(notifySpy).toHaveBeenCalledWith(
      `${Strings.Strings.LENGTH}: 5.0 Angle: 90.0${Strings.Symbol.DEGREE} ${Strings.Symbol.DELTA}X: 0.0 ${Strings.Symbol.DELTA}Y: 5.0`,
  );
  notifySpy.mockRestore();
});

// ─── execute ──────────────────────────────────────────────────────────────────

test('Distance.execute collects two points and calls executeCommand', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(0, 0), new Point(10, 0)],
      async () => {
        const distance = new Distance();
        await distance.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
});

test('Distance.execute returns early when first point is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [],
      async () => {
        const distance = new Distance();
        await distance.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Distance.execute returns early when second point is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(0, 0)],
      async () => {
        const distance = new Distance();
        await distance.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Distance.execute stores collected points for action', async () => {
  let capturedDistance;
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(0, 0), new Point(0, 5)],
      async () => {
        capturedDistance = new Distance();
        await capturedDistance.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(capturedDistance.points).toHaveLength(2);
  expect(capturedDistance.points[0].x).toBe(0);
  expect(capturedDistance.points[0].y).toBe(0);
  expect(capturedDistance.points[1].x).toBe(0);
  expect(capturedDistance.points[1].y).toBe(5);
});
