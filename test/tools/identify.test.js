import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Identify } from '../../core/tools/identify.js';
import { expect, jest } from '@jest/globals';
import { withMockInput } from '../test-helpers/test-helpers.js';

const core = new Core();

// ─── register ────────────────────────────────────────────────────────────────

test('Identify.register returns correct command object', () => {
  const reg = Identify.register();
  expect(reg.command).toBe('Identify');
  expect(reg.shortcut).toBe('ID');
});

// ─── action ───────────────────────────────────────────────────────────────────

test('Identify.action notifies formatted X and Y coordinates', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const identify = new Identify();
  identify.points.push(new Point(0, 10));
  identify.action();

  expect(notifySpy).toHaveBeenCalledWith('X:0.0 Y:10.0');
  notifySpy.mockRestore();
});

test('Identify.action at origin formats both coordinates as zero', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const identify = new Identify();
  identify.points.push(new Point(0, 0));
  identify.action();

  expect(notifySpy).toHaveBeenCalledWith('X:0.0 Y:0.0');
  notifySpy.mockRestore();
});

test('Identify.action with negative coordinates', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const identify = new Identify();
  identify.points.push(new Point(-5, -3));
  identify.action();

  expect(notifySpy).toHaveBeenCalledWith('X:-5.0 Y:-3.0');
  notifySpy.mockRestore();
});

test('Identify.action with fractional coordinates rounded to 1 decimal place', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const identify = new Identify();
  identify.points.push(new Point(1.5, 2.5));
  identify.action();

  expect(notifySpy).toHaveBeenCalledWith('X:1.5 Y:2.5');
  notifySpy.mockRestore();
});

test('Identify.action uses the last point when multiple points are present', () => {
  const notifySpy = jest.spyOn(core, 'notify');

  const identify = new Identify();
  identify.points.push(new Point(1, 2));
  identify.points.push(new Point(7, 8));
  identify.action();

  expect(notifySpy).toHaveBeenCalledWith('X:7.0 Y:8.0');
  notifySpy.mockRestore();
});

// ─── execute ──────────────────────────────────────────────────────────────────

test('Identify.execute collects one point and calls executeCommand', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(3, 4)],
      async () => {
        const identify = new Identify();
        await identify.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
});

test('Identify.execute returns early when input is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [],
      async () => {
        const identify = new Identify();
        await identify.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Identify.execute stores the collected point for action', async () => {
  let capturedIdentify;
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(9, 11)],
      async () => {
        capturedIdentify = new Identify();
        await capturedIdentify.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(capturedIdentify.points).toHaveLength(1);
  expect(capturedIdentify.points[0].x).toBe(9);
  expect(capturedIdentify.points[0].y).toBe(11);
});
