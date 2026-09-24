import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { WindowPick } from '../../core/tools/windowPick.js';
import { expect, jest } from '@jest/globals';
import { withMockInput } from '../test-helpers/test-helpers.js';

const core = new Core();

// ─── register ────────────────────────────────────────────────────────────────

test('WindowPick.register returns correct command object', () => {
  const reg = WindowPick.register();
  expect(reg.command).toBe('WindowPick');
  expect(reg.shortcut).toBeUndefined();
  expect(reg.type).toBeUndefined();
});

// ─── execute ──────────────────────────────────────────────────────────────────

test('WindowPick.execute collects two points and calls executeCommand', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(0, 0), new Point(10, 10)],
      async () => {
        const tool = new WindowPick();
        await tool.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
});

test('WindowPick.execute returns early when first point is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [],
      async () => {
        const tool = new WindowPick();
        await tool.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('WindowPick.execute returns early when second point is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(0, 0)],
      async () => {
        const tool = new WindowPick();
        await tool.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('WindowPick.execute stores the two collected points', async () => {
  let capturedTool;
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(1, 2), new Point(30, 40)],
      async () => {
        capturedTool = new WindowPick();
        await capturedTool.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(capturedTool.points).toHaveLength(2);
  expect(capturedTool.points[0].x).toBe(1);
  expect(capturedTool.points[0].y).toBe(2);
  expect(capturedTool.points[1].x).toBe(30);
  expect(capturedTool.points[1].y).toBe(40);
});

// ─── preview ──────────────────────────────────────────────────────────────────

test('WindowPick.preview with one point creates a rectangle polyline preview', () => {
  const tool = new WindowPick();
  tool.points.push(new Point(10, 10));

  core.mouse.mouseMoved(50, 50);

  const initialCount = DesignCore.Scene.previewEntities.count();

  tool.preview();

  expect(DesignCore.Scene.previewEntities.count()).toBe(initialCount + 1);

  const tempItem = DesignCore.Scene.previewEntities.get(DesignCore.Scene.previewEntities.count() - 1);
  expect(tempItem.type).toBe('Polyline');
  expect(tempItem.points.length).toBe(4);
});

test('WindowPick.preview with no points does not create a preview', () => {
  const tool = new WindowPick();

  const initialCount = DesignCore.Scene.previewEntities.count();

  tool.preview();

  expect(DesignCore.Scene.previewEntities.count()).toBe(initialCount);
});

test('WindowPick.preview with two points does not create another preview', () => {
  const tool = new WindowPick();
  tool.points.push(new Point(0, 0));
  tool.points.push(new Point(10, 10));

  const initialCount = DesignCore.Scene.previewEntities.count();

  tool.preview();

  expect(DesignCore.Scene.previewEntities.count()).toBe(initialCount);
});

// ─── action ───────────────────────────────────────────────────────────────────

test('WindowPick.action invokes onComplete with the two picked points', () => {
  const tool = new WindowPick();
  const pt1 = new Point(0, 0);
  const pt2 = new Point(20, 20);
  tool.points.push(pt1);
  tool.points.push(pt2);

  const onCompleteSpy = jest.fn();
  tool.onComplete = onCompleteSpy;

  tool.action();

  expect(onCompleteSpy).toHaveBeenCalledWith(pt1, pt2);
});

test('WindowPick.action does not invoke onComplete with fewer than two points', () => {
  const tool = new WindowPick();
  tool.points.push(new Point(0, 0));

  const onCompleteSpy = jest.fn();
  tool.onComplete = onCompleteSpy;

  tool.action();

  expect(onCompleteSpy).not.toHaveBeenCalled();
});

test('WindowPick.action does not throw when onComplete is undefined', () => {
  const tool = new WindowPick();
  tool.points.push(new Point(0, 0));
  tool.points.push(new Point(10, 10));

  expect(() => tool.action()).not.toThrow();
});
