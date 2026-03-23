import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Matrix } from '../../core/lib/matrix.js';

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
