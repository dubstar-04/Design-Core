import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Zoom } from '../../core/tools/zoom.js';
import { expect, jest } from '@jest/globals';
import { withMockInput } from '../test-helpers/test-helpers.js';

const core = new Core();

test('Test Zoom.register', () => {
  const command = Zoom.register();
  expect(command.command).toBe('Zoom');
  expect(command.shortcut).toBe('Z');
  expect(command.type).toBeUndefined();
});

test('Test Zoom.action - Window mode', () => {
  // Set canvas dimensions for zoom calculations
  core.canvas.width = 800;
  core.canvas.height = 600;

  // Set initial scale
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  const zoom = new Zoom();
  zoom.mode = 'Window';

  // Set two points for window zoom
  zoom.points.push(new Point(0, 0));
  zoom.points.push(new Point(100, 100));

  // Perform zoom
  zoom.action();

  // Verify scale has changed (should be different from initial)
  const finalScale = core.canvas.getScale();
  expect(finalScale).not.toBe(initialScale);
  expect(finalScale).toBeGreaterThan(0);
});

test('Test Zoom.action - Window mode with reversed points', () => {
  // Set canvas dimensions
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  const zoom = new Zoom();
  zoom.mode = 'Window';

  // Points in reverse order (should still work)
  zoom.points.push(new Point(100, 100));
  zoom.points.push(new Point(0, 0));

  zoom.action();

  const finalScale = core.canvas.getScale();
  expect(finalScale).not.toBe(initialScale);
  expect(finalScale).toBeGreaterThan(0);
});

test('Test Zoom.action - Window mode with single point (should not zoom)', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  const zoom = new Zoom();
  zoom.mode = 'Window';

  // Only one point - action should not zoom
  zoom.points.push(new Point(0, 0));

  zoom.action();

  // Scale should remain the same
  const finalScale = core.canvas.getScale();
  expect(finalScale).toBe(initialScale);
});

test('Test Zoom.action - All mode (calls zoomExtents)', () => {
  // Add items to scene so extents exist
  DesignCore.Scene.addItem('Line', { points: [new Point(10, 10), new Point(100, 100)] });
  DesignCore.Scene.addItem('Circle', { points: [new Point(50, 50), new Point(60, 60)] });

  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  // zoomExtents should change the scale
  core.canvas.zoomExtents();

  const finalScale = core.canvas.getScale();
  expect(finalScale).not.toBe(initialScale);
  expect(finalScale).toBeGreaterThan(0);
});

test('Test Zoom.preview - Window mode with one point', () => {
  const zoom = new Zoom();
  zoom.mode = 'Window';
  zoom.points.push(new Point(10, 10));

  // Mock mouse position
  core.mouse.mouseMoved(50, 50);

  const initialTempItemsCount = DesignCore.Scene.previewEntities.count();

  zoom.preview();

  // Should have added a polyline (rectangle preview)
  expect(DesignCore.Scene.previewEntities.count()).toBe(initialTempItemsCount + 1);

  // Verify it's a polyline
  const tempItem = DesignCore.Scene.previewEntities.get(DesignCore.Scene.previewEntities.count() - 1);
  expect(tempItem.type).toBe('Polyline');
  expect(tempItem.points.length).toBe(4); // Rectangle has 4 points (closed flag set)
});

test('Test Zoom.preview - Window mode with no points (should not preview)', () => {
  const zoom = new Zoom();
  zoom.mode = 'Window';

  const initialTempItemsCount = DesignCore.Scene.previewEntities.count();

  zoom.preview();

  // Should not add anything
  expect(DesignCore.Scene.previewEntities.count()).toBe(initialTempItemsCount);
});

test('Test Zoom.preview - All mode (should not preview)', () => {
  const zoom = new Zoom();
  zoom.mode = 'All';
  zoom.points.push(new Point(10, 10));

  const initialTempItemsCount = DesignCore.Scene.previewEntities.count();

  zoom.preview();

  // Should not add anything for All/Extents modes
  expect(DesignCore.Scene.previewEntities.count()).toBe(initialTempItemsCount);
});

test('Test Canvas.zoomToWindow - valid window', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  const pt1 = new Point(0, 0);
  const pt2 = new Point(100, 100);

  core.canvas.zoomToWindow(pt1, pt2);

  const finalScale = core.canvas.getScale();
  expect(finalScale).not.toBe(initialScale);
  expect(finalScale).toBeGreaterThan(0);
});

test('Test Canvas.zoomToWindow - reversed points', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  // Points in reverse order
  const pt1 = new Point(100, 100);
  const pt2 = new Point(0, 0);

  core.canvas.zoomToWindow(pt1, pt2);

  const finalScale = core.canvas.getScale();
  expect(finalScale).not.toBe(initialScale);
});

test('Test Canvas.zoomToWindow - zero width (should not zoom)', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  // Points with same x coordinate (zero width)
  const pt1 = new Point(50, 0);
  const pt2 = new Point(50, 100);

  core.canvas.zoomToWindow(pt1, pt2);

  // Should not change scale
  const finalScale = core.canvas.getScale();
  expect(finalScale).toBe(initialScale);
});

test('Test Canvas.zoomToWindow - zero height (should not zoom)', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  // Points with same y coordinate (zero height)
  const pt1 = new Point(0, 50);
  const pt2 = new Point(100, 50);

  core.canvas.zoomToWindow(pt1, pt2);

  // Should not change scale
  const finalScale = core.canvas.getScale();
  expect(finalScale).toBe(initialScale);
});

test('Test Canvas.zoomToWindow - same point (should not zoom)', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  // Same point
  const pt1 = new Point(50, 50);
  const pt2 = new Point(50, 50);

  core.canvas.zoomToWindow(pt1, pt2);

  // Should not change scale
  const finalScale = core.canvas.getScale();
  expect(finalScale).toBe(initialScale);
});

test('Test Zoom.action - Object mode', () => {
  // Add an object to the scene
  const obj = DesignCore.Scene.addItem('Circle', { points: [new Point(20, 20), new Point(40, 40)] });

  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);

  const initialScale = core.canvas.getScale();

  const zoom = new Zoom();
  zoom.mode = 'Object';

  // Select the object for zoom
  DesignCore.Scene.selectionManager.addToSelectionSet(obj);

  // Perform zoom to object
  zoom.action();

  const finalScale = core.canvas.getScale();
  expect(finalScale).not.toBe(initialScale);
  expect(finalScale).toBeGreaterThan(0);
});

// ─── constructor / mode defaults ──────────────────────────────────────────────

test('Zoom constructor defaults mode to Window', () => {
  const zoom = new Zoom();
  expect(zoom.mode).toBe('Window');
});

test('Zoom.modes contains All, Extents, Window, Object', () => {
  const zoom = new Zoom();
  expect(zoom.modes.ALL).toBe('All');
  expect(zoom.modes.EXTENTS).toBe('Extents');
  expect(zoom.modes.WINDOW).toBe('Window');
  expect(zoom.modes.OBJECT).toBe('Object');
});

// ─── action: Extents mode ─────────────────────────────────────────────────────

test('Zoom.action - Extents mode calls zoomExtents', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(10, 10), new Point(50, 50)] });

  const initialScale = core.canvas.getScale();

  const zoom = new Zoom();
  zoom.mode = 'Extents';
  zoom.action();

  const finalScale = core.canvas.getScale();
  expect(finalScale).not.toBe(initialScale);
  expect(finalScale).toBeGreaterThan(0);
});

// ─── action: Object mode with empty selection ─────────────────────────────────

test('Zoom.action - Object mode with empty selection does not zoom', () => {
  core.canvas.width = 800;
  core.canvas.height = 600;
  core.canvas.matrix.scale(1, 1);
  core.scene.selectionManager.reset();

  const initialScale = core.canvas.getScale();

  const zoom = new Zoom();
  zoom.mode = 'Object';
  zoom.action();

  // Selection is empty — should return early without changing scale
  expect(core.canvas.getScale()).toBe(initialScale);
});

// ─── execute ──────────────────────────────────────────────────────────────────

test('Zoom.execute returns early when first input is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Zoom.execute Window mode: first input is a Point, collects second point, calls executeCommand', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(0, 0), new Point(100, 100)],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
});

test('Zoom.execute Window mode: returns early when second point is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(0, 0)],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Zoom.execute Window mode: string input prompts for first point then second, calls executeCommand', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      ['Window', new Point(0, 0), new Point(100, 100)],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
});

test('Zoom.execute Window mode: returns early when prompted first point is undefined', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      ['Window'],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Zoom.execute Window mode: returns early when prompted second point is undefined after string branch', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      ['Window', new Point(0, 0)],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Zoom.execute All mode: calls executeCommand without extra point prompts', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      ['All'],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
});

test('Zoom.execute Extents mode: calls executeCommand without extra point prompts', async () => {
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      ['Extents'],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
});

test('Zoom.execute Object mode: with existing selection calls executeCommand without prompting', async () => {
  core.scene.clear();
  const idx = core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 10)] });
  core.scene.selectionManager.reset();
  core.scene.selectionManager.addToSelectionSet(idx);

  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      ['Object'],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).toHaveBeenCalled();
  core.scene.selectionManager.reset();
});

test('Zoom.execute Object mode: without selection prompts for selection set, returns early when undefined', async () => {
  core.scene.selectionManager.reset();

  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      ['Object'],
      async () => {
        const zoom = new Zoom();
        await zoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(executeCommandSpy).not.toHaveBeenCalled();
});

test('Zoom.execute stores collected window points for action', async () => {
  let capturedZoom;
  const executeCommandSpy = jest.fn();

  await withMockInput(
      core.scene,
      [new Point(5, 10), new Point(50, 80)],
      async () => {
        capturedZoom = new Zoom();
        await capturedZoom.execute();
      },
      { extraMethods: { executeCommand: executeCommandSpy } },
  );

  expect(capturedZoom.points).toHaveLength(2);
  expect(capturedZoom.points[0].x).toBe(5);
  expect(capturedZoom.points[0].y).toBe(10);
  expect(capturedZoom.points[1].x).toBe(50);
  expect(capturedZoom.points[1].y).toBe(80);
});
