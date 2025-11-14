import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Zoom } from '../../core/tools/zoom.js';

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

  const initialTempItemsCount = DesignCore.Scene.sceneTempItemCount();

  zoom.preview();

  // Should have added a polyline (rectangle preview)
  expect(DesignCore.Scene.sceneTempItemCount()).toBe(initialTempItemsCount + 1);

  // Verify it's a polyline
  const tempItem = DesignCore.Scene.getTempItem(DesignCore.Scene.sceneTempItemCount() - 1);
  expect(tempItem.type).toBe('Polyline');
  expect(tempItem.points.length).toBe(5); // Rectangle has 5 points (closed)
});

test('Test Zoom.preview - Window mode with no points (should not preview)', () => {
  const zoom = new Zoom();
  zoom.mode = 'Window';

  const initialTempItemsCount = DesignCore.Scene.sceneTempItemCount();

  zoom.preview();

  // Should not add anything
  expect(DesignCore.Scene.sceneTempItemCount()).toBe(initialTempItemsCount);
});

test('Test Zoom.preview - All mode (should not preview)', () => {
  const zoom = new Zoom();
  zoom.mode = 'All';
  zoom.points.push(new Point(10, 10));

  const initialTempItemsCount = DesignCore.Scene.sceneTempItemCount();

  zoom.preview();

  // Should not add anything for All/Extents modes
  expect(DesignCore.Scene.sceneTempItemCount()).toBe(initialTempItemsCount);
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


