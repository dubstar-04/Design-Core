import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Matrix } from '../../core/lib/matrix.js';
import { expect, jest } from '@jest/globals';

const core = new Core();
const mouse = core.mouse;

test('Test Mouse constructor defaults', () => {
  expect(mouse.x).toBe(0);
  expect(mouse.y).toBe(0);
  expect(mouse.buttonOneDown).toBe(false);
  expect(mouse.buttonTwoDown).toBe(false);
  expect(mouse.buttonThreeDown).toBe(false);
  expect(mouse.mouseDownCanvasPoint).toBeDefined();
  expect(mouse.lastClick).toBe(0);
  expect(mouse.lastButton).toBe(0);
});

test('Test Mouse.pointOnCanvas', () => {
  mouse.x = 150;
  mouse.y = 200;
  const pt = mouse.pointOnCanvas();
  expect(pt).toBeInstanceOf(Point);
  expect(pt.x).toBe(150);
  expect(pt.y).toBe(200);
});

test('Test Mouse.pointOnScene returns Point', () => {
  mouse.x = 100;
  mouse.y = 50;
  const pt = mouse.pointOnScene();
  expect(pt).toBeInstanceOf(Point);
  expect(typeof pt.x).toBe('number');
  expect(typeof pt.y).toBe('number');
});

test('Test Mouse.transformToScene and transformToCanvas are inverse', () => {
  core.canvas.matrix = new Matrix();
  core.canvas.height = 600;

  const scenePoint = new Point(250, 300);
  const canvasPoint = mouse.transformToCanvas(scenePoint);
  const roundTrip = mouse.transformToScene(canvasPoint);

  expect(roundTrip.x).toBeCloseTo(scenePoint.x, 5);
  expect(roundTrip.y).toBeCloseTo(scenePoint.y, 5);
});

test('Test Mouse.positionString format', () => {
  mouse.x = 0;
  mouse.y = 0;
  const str = mouse.positionString();
  expect(typeof str).toBe('string');
  expect(str).toMatch(/X: .+ Y: .+/);
});

test('Test Mouse.positionString returns empty string when buttonOneDown', () => {
  mouse.lastClick = 0;
  mouse.mouseDown(0);
  expect(mouse.positionString()).toBe('');
  mouse.mouseUp(0);
});

test('Test Mouse.positionString returns empty string when buttonTwoDown', () => {
  mouse.lastClick = 0;
  mouse.mouseDown(1);
  expect(mouse.positionString()).toBe('');
  mouse.mouseUp(1);
});

test('Test Mouse.positionString returns empty string when buttonThreeDown', () => {
  mouse.lastClick = 0;
  mouse.mouseDown(2);
  expect(mouse.positionString()).toBe('');
  mouse.mouseUp(2);
});

test('Test Mouse.positionString returns coordinate string when no buttons down', () => {
  mouse.buttonOneDown = false;
  mouse.buttonTwoDown = false;
  mouse.buttonThreeDown = false;
  expect(mouse.positionString()).toMatch(/X: .+ Y: .+/);
});

test('Test Mouse.mouseDown sets button states', () => {
  mouse.lastClick = 0;

  mouse.mouseDown(0);
  expect(mouse.buttonOneDown).toBe(true);
  mouse.mouseUp(0);

  mouse.mouseDown(1);
  expect(mouse.buttonTwoDown).toBe(true);
  mouse.mouseUp(1);

  mouse.mouseDown(2);
  expect(mouse.buttonThreeDown).toBe(true);
  mouse.mouseUp(2);
});

test('Test Mouse.mouseUp clears button states', () => {
  mouse.lastClick = 0;

  mouse.mouseDown(0);
  mouse.mouseUp(0);
  expect(mouse.buttonOneDown).toBe(false);

  mouse.mouseDown(1);
  mouse.mouseUp(1);
  expect(mouse.buttonTwoDown).toBe(false);

  mouse.mouseDown(2);
  mouse.mouseUp(2);
  expect(mouse.buttonThreeDown).toBe(false);
});

test('Test Mouse.mouseDown sets mouseDownCanvasPoint', () => {
  mouse.x = 42;
  mouse.y = 84;
  mouse.lastClick = 0;
  mouse.mouseDown(0);
  expect(mouse.mouseDownCanvasPoint.x).toBe(42);
  expect(mouse.mouseDownCanvasPoint.y).toBe(84);
  mouse.mouseUp(0);
});

test('Test Mouse.mouseMoved updates position', () => {
  core.canvas.height = 600;
  mouse.mouseMoved(300, 400);
  expect(mouse.x).toBe(300);
  // y is inverted: -y + canvas.height = -400 + 600 = 200
  expect(mouse.y).toBe(200);
});

test('Test Mouse.mouseMoved updates position when button is held down', () => {
  core.canvas.height = 600;
  mouse.lastClick = 0;
  mouse.mouseDown(1); // buttonTwoDown (pan)
  mouse.mouseMoved(100, 200);
  expect(mouse.x).toBe(100);
  expect(mouse.y).toBe(400); // -200 + 600
  mouse.mouseUp(1);
});

test('Test Mouse.mouseMoved skips polar snap when a button is held down', () => {
  core.canvas.height = 600;
  const prevPolar = DesignCore.Settings.polar;
  DesignCore.Settings.polar = true;
  const polarSpy = jest.spyOn(core.scene.inputManager.snapping, 'polarSnap');
  try {
    mouse.lastClick = 0;
    mouse.mouseDown(1);
    mouse.mouseMoved(200, 300);
    expect(polarSpy).not.toHaveBeenCalled();
    mouse.mouseUp(1);
  } finally {
    DesignCore.Settings.polar = prevPolar;
    polarSpy.mockRestore();
  }
});

test('Test Mouse.mouseMoved skips ortho snap when a button is held down', () => {
  core.canvas.height = 600;
  const prevPolar = DesignCore.Settings.polar;
  const prevOrtho = DesignCore.Settings.ortho;
  DesignCore.Settings.polar = false;
  DesignCore.Settings.ortho = true;
  const orthoSpy = jest.spyOn(core.scene.inputManager.snapping, 'orthoSnap');
  try {
    mouse.lastClick = 0;
    mouse.mouseDown(1);
    mouse.mouseMoved(200, 300);
    expect(orthoSpy).not.toHaveBeenCalled();
    mouse.mouseUp(1);
  } finally {
    DesignCore.Settings.polar = prevPolar;
    DesignCore.Settings.ortho = prevOrtho;
    orthoSpy.mockRestore();
  }
});

test('Test Mouse.setPosFromScenePoint', () => {
  core.canvas.matrix = new Matrix();
  core.canvas.height = 600;

  const scenePoint = new Point(100, 200);
  mouse.setPosFromScenePoint(scenePoint);

  // Convert back to verify round-trip
  const result = mouse.pointOnScene();
  expect(result.x).toBeCloseTo(scenePoint.x, 5);
  expect(result.y).toBeCloseTo(scenePoint.y, 5);
});

test('Test Mouse.isDoubleClick', () => {
  // First click is never a double click
  mouse.lastClick = 0;
  expect(mouse.isDoubleClick(0)).toBe(false);

  // Immediate second click should be a double click
  expect(mouse.isDoubleClick(0)).toBe(true);
});

test('Test Mouse.isDoubleClick with different buttons', () => {
  // Different buttons in quick succession should not be a double click
  mouse.lastClick = 0;
  mouse.isDoubleClick(0); // first click - left button
  expect(mouse.isDoubleClick(1)).toBe(false); // second click - middle button
});

test('Test Mouse.wheel delegates to canvas', () => {
  const scaleBefore = core.canvas.getScale();
  mouse.wheel(1);
  expect(core.canvas.getScale()).not.toBe(scaleBefore);
});

// ─── isDoubleClick ────────────────────────────────────────────────────────────

test('Test Mouse.isDoubleClick - slow second click is not a double click', () => {
  const doubleClickThreshold = 250;
  mouse.lastClick = 0;
  mouse.isDoubleClick(0); // first click
  // advance lastClick far enough back to exceed the threshold
  mouse.lastClick = new Date().getTime() - doubleClickThreshold - 1;
  expect(mouse.isDoubleClick(0)).toBe(false);
});

test('Test Mouse.isDoubleClick - updates lastButton', () => {
  mouse.lastClick = 0;
  mouse.lastButton = 0;
  mouse.isDoubleClick(2);
  expect(mouse.lastButton).toBe(2);
});

// ─── doubleClick ──────────────────────────────────────────────────────────────

test('Test Mouse.doubleClick delegates to Canvas.doubleClick', () => {
  const spy = jest.spyOn(core.canvas, 'doubleClick').mockImplementation(() => {});
  mouse.doubleClick(0);
  expect(spy).toHaveBeenCalledWith(0);
  spy.mockRestore();
});

test('Test Mouse.mouseDown triggers doubleClick on rapid second click', () => {
  const spy = jest.spyOn(mouse, 'doubleClick').mockImplementation(() => {});
  mouse.lastClick = 0;
  mouse.mouseDown(0); // first click
  mouse.mouseUp(0);
  mouse.mouseDown(0); // immediate second click — should be double click
  expect(spy).toHaveBeenCalledWith(0);
  spy.mockRestore();
  mouse.mouseUp(0);
});

// ─── mouseDown / mouseUp – unhandled button ───────────────────────────────────

test('Test Mouse.mouseDown with unhandled button does not change state', () => {
  mouse.buttonOneDown = false;
  mouse.buttonTwoDown = false;
  mouse.buttonThreeDown = false;
  mouse.lastClick = 0;
  mouse.mouseDown(99);
  expect(mouse.buttonOneDown).toBe(false);
  expect(mouse.buttonTwoDown).toBe(false);
  expect(mouse.buttonThreeDown).toBe(false);
});

test('Test Mouse.mouseUp with unhandled button does not change state', () => {
  mouse.buttonOneDown = true;
  mouse.buttonTwoDown = true;
  mouse.buttonThreeDown = true;
  mouse.mouseUp(99);
  expect(mouse.buttonOneDown).toBe(true);
  expect(mouse.buttonTwoDown).toBe(true);
  expect(mouse.buttonThreeDown).toBe(true);
  // restore
  mouse.buttonOneDown = false;
  mouse.buttonTwoDown = false;
  mouse.buttonThreeDown = false;
});

// ─── mouseUp – delegates to Canvas ───────────────────────────────────────────

test('Test Mouse.mouseUp delegates to Canvas.mouseUp', () => {
  mouse.lastClick = 0;
  mouse.mouseDown(0);
  const spy = jest.spyOn(core.canvas, 'mouseUp').mockImplementation(() => {});
  mouse.mouseUp(0);
  expect(spy).toHaveBeenCalledWith(0);
  spy.mockRestore();
});

// ─── mouseMoved – delegates to Canvas ────────────────────────────────────────

test('Test Mouse.mouseMoved delegates to Canvas.mouseMoved', () => {
  const spy = jest.spyOn(core.canvas, 'mouseMoved').mockImplementation(() => {});
  mouse.mouseMoved(10, 20);
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

// ─── positionString – correct coordinate values ───────────────────────────────

test('Test Mouse.positionString reports current scene coordinates', () => {
  mouse.buttonOneDown = false;
  mouse.buttonTwoDown = false;
  mouse.buttonThreeDown = false;
  const scenePoint = mouse.pointOnScene();
  const str = mouse.positionString();
  expect(str).toContain(`X: ${scenePoint.x.toFixed(1)}`);
  expect(str).toContain(`Y: ${scenePoint.y.toFixed(1)}`);
});

// ─── setPosFromScenePoint – x/y updated directly ─────────────────────────────

test('Test Mouse.setPosFromScenePoint sets x and y from scene coordinates', () => {
  core.canvas.height = 600;

  const scenePoint = new Point(123, 456);
  mouse.setPosFromScenePoint(scenePoint);

  // The canvas point is what transformToCanvas returns
  const expected = mouse.transformToCanvas(scenePoint);
  expect(mouse.x).toBeCloseTo(expected.x, 5);
  expect(mouse.y).toBeCloseTo(expected.y, 5);
});
