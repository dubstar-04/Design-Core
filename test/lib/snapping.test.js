import { jest } from '@jest/globals';
import { Core } from '../../core/core/core.js';
import { Snapping } from '../../core/lib/snapping.js';
import { SnapPoint } from '../../core/lib/auxiliary/snapPoint.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';

const core = new Core();
const snapping = new Snapping();

// Add a valid item to scene
core.scene.addItem('Line', { points: [new Point(10, 10), new Point(100, 10)] });

afterEach(() => {
  // Reset all mouse button states so tests don't affect each other via
  // Canvas.mouseMoved() / InputManager.mouseMoved() behaviour
  core.mouse.buttonOneDown = false;
  core.mouse.buttonTwoDown = false;
  core.mouse.buttonThreeDown = false;
});


test('Test Snapping.getSnapPoint', () => {
  // set the mouse position
  core.mouse.mouseMoved(8, 8);
  // Get the snap point
  const snapPoint1 = snapping.getSnapPoint();
  expect(snapPoint1.snapPoint.x).toBe(10);
  expect(snapPoint1.snapPoint.y).toBe(10);


  // set the mouse position
  core.mouse.mouseMoved(101, 11);
  // Get the snap point
  const snapPoint2 = snapping.getSnapPoint();
  expect(snapPoint2.snapPoint.x).toBe(100);
  expect(snapPoint2.snapPoint.y).toBe(10);

  // set the mouse position
  core.mouse.mouseMoved(100, 100);
  // Get the snap point
  expect(snapping.getSnapPoint()).toBeUndefined();
});

test('Test Snapping.snap active', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  snapping.active = true;
  // mouse near (10, 10) endpoint of the line
  core.mouse.mouseMoved(8, 8);
  const result = snapping.snap();
  expect(result).toBeDefined();
  expect(result.snapPoint.x).toBe(10);
  expect(result.snapPoint.y).toBe(10);
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBeGreaterThan(0);
});

test('Test Snapping.snap inactive', () => {
  snapping.active = false;
  core.mouse.mouseMoved(8, 8);
  expect(snapping.snap()).toBeUndefined();
});

test('Test Snapping.addSnapPoint', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  snapping.addSnapPoint(new SnapPoint(new Point(10, 10)));
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(1);
});

test('Test SnapPoint.draw', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  snapping.addSnapPoint(new SnapPoint(new Point(0.5, 0.5), SnapPoint.Type.CENTRE));
  const snapPointEntity = DesignCore.Scene.auxiliaryEntities.get(0);
  const renderer = makeSnapRenderer();
  snapPointEntity.draw(renderer, 1);
  expect(renderer.setColour).toHaveBeenCalled();
  expect(renderer.drawShape).toHaveBeenCalled();
});

test('Test Snapping.addTrackingLine', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  snapping.addTrackingLine(new Point(0.2, 0.5), new Point(0.8, 0.5));
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(1);
});

test('Test TrackingLine.draw', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // horizontal tracking line within the default scene bounds ([0,1] x [-1,0])
  // note: the default matrix has d=-1, so scene y is in [-1, 0] for a 1x1 canvas
  snapping.addTrackingLine(new Point(0.2, -0.5), new Point(0.8, -0.5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const renderer = makeTrackingRenderer();
  trackingLine.draw(renderer, 1);
  expect(renderer.save).toHaveBeenCalled();
  expect(renderer.drawShape).toHaveBeenCalled();
  expect(renderer.restore).toHaveBeenCalled();
});

test('Test TrackingLine.draw degenerate zero direction', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // inputPoint equals snapPoint → direction is zero vector → draw returns early
  snapping.addTrackingLine(new Point(0.5, 0.5), new Point(0.5, 0.5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const renderer = makeTrackingRenderer();
  trackingLine.draw(renderer, 1);
  expect(renderer.drawShape).not.toHaveBeenCalled();
  expect(renderer.restore).not.toHaveBeenCalled();
});

test('Test Snapping.polarSnap', () => {
  // set the mouse position
  // note mouseMoved flips the y axis
  core.mouse.mouseMoved(100, -100);
  const button = 0;
  core.mouse.mouseDown(button);
  snapping.active = true;

  // Get the snap point
  // previousPoint = 90, 95
  // mousePoint = 100, 100
  expect(snapping.polarSnap(new Point(90, 95))).toBeUndefined();

  // Get the snap point
  // previousPoint = 80, 99
  // mousePoint = 100, 100
  // const polarSnapOne = snapping.polarSnap(new Point(80, 99));
  // expect(polarSnapOne.x).toBeCloseTo(100.02498);
  // expect(polarSnapOne.y).toBeCloseTo(100);
});

test('Test Snapping.polarSnap within tolerance', () => {
  snapping.active = true;
  // Mouse at (100, 2) from previous (0, 0): angle ≈ 1.15° which is within 4° tolerance of 0°
  core.mouse.mouseMoved(100, 2);
  const snapPoint = snapping.polarSnap(new Point(0, 0));
  expect(snapPoint).toBeDefined();
  // Snapped to 0° direction → y should be approximately 0
  expect(snapPoint.y).toBeCloseTo(0, 0);
});

test('Test Snapping.polarSnap inactive', () => {
  snapping.active = false;
  core.mouse.mouseMoved(100, 2);
  expect(snapping.polarSnap(new Point(0, 0))).toBeUndefined();
});

test('Test Snapping.orthoSnap', () => {
  snapping.active = true;

  // Mouse far right of previous: x delta dominates → y locked to previous y
  // note: mouseMoved(x, -y) maps to scene (x, y) due to y-axis flip in the matrix
  core.mouse.mouseMoved(100, -20); // scene (100, 20), previous (0, 0): |dx|=100 > |dy|=20
  const snapPointX = snapping.orthoSnap(new Point(0, 0));
  expect(snapPointX).toBeDefined();
  expect(snapPointX.x).toBeCloseTo(100);
  expect(snapPointX.y).toBeCloseTo(0);

  // Mouse far above previous: y delta dominates → x locked to previous x
  core.mouse.mouseMoved(20, -100); // scene (20, 100), previous (0, 0): |dx|=20 < |dy|=100
  const snapPointY = snapping.orthoSnap(new Point(0, 0));
  expect(snapPointY).toBeDefined();
  expect(snapPointY.x).toBeCloseTo(0);
  expect(snapPointY.y).toBeCloseTo(100);

  // Inactive: returns undefined
  snapping.active = false;
  core.mouse.mouseMoved(100, -20);
  expect(snapping.orthoSnap(new Point(0, 0))).toBeUndefined();
});

// ─── Renderer mock helpers ──────────────────────────────────────────────────

/** @return {object} mock renderer for SnapPoint.draw tests */
function makeSnapRenderer() {
  return {
    setColour: jest.fn(),
    setLineWidth: jest.fn(),
    setDash: jest.fn(),
    drawShape: jest.fn(),
  };
}

/** @return {object} mock renderer for TrackingLine.draw tests */
function makeTrackingRenderer() {
  return {
    save: jest.fn(),
    restore: jest.fn(),
    setColour: jest.fn(),
    setLineWidth: jest.fn(),
    setDash: jest.fn(),
    drawShape: jest.fn(),
  };
}

// ─── Snapping.reset ──────────────────────────────────────────────────────────

test('Test Snapping.reset', () => {
  snapping.active = true;
  snapping.snapOverride = SnapPoint.Type.END;
  snapping.reset();
  expect(snapping.active).toBe(false);
  expect(snapping.snapOverride).toBeNull();
});

// ─── Snapping.setSnapOverride ────────────────────────────────────────────────

test('Test Snapping.setSnapOverride valid type', () => {
  snapping.setSnapOverride(SnapPoint.Type.END);
  expect(snapping.snapOverride).toBe(SnapPoint.Type.END);
});

test('Test Snapping.setSnapOverride null clears override', () => {
  snapping.setSnapOverride(SnapPoint.Type.END);
  snapping.setSnapOverride(null);
  expect(snapping.snapOverride).toBeNull();
});

test('Test Snapping.setSnapOverride NONE type', () => {
  snapping.setSnapOverride(SnapPoint.Type.NONE);
  expect(snapping.snapOverride).toBe(SnapPoint.Type.NONE);
  snapping.setSnapOverride(null);
});

test('Test Snapping.setSnapOverride invalid type throws', () => {
  expect(() => snapping.setSnapOverride('invalid')).toThrow('Invalid snap override type: invalid');
});

// ─── Snapping.getSnapPoint with snap override ────────────────────────────────

test('Test Snapping.getSnapPoint with END override returns end snap', () => {
  snapping.setSnapOverride(SnapPoint.Type.END);
  core.mouse.mouseMoved(8, 8);
  const result = snapping.getSnapPoint();
  expect(result).toBeDefined();
  expect(result.type).toBe(SnapPoint.Type.END);
  snapping.setSnapOverride(null);
});

test('Test Snapping.getSnapPoint with NONE override suppresses all snaps', () => {
  snapping.setSnapOverride(SnapPoint.Type.NONE);
  core.mouse.mouseMoved(8, 8);
  const result = snapping.getSnapPoint();
  expect(result).toBeUndefined();
  snapping.setSnapOverride(null);
});

test('Test Snapping.getSnapPoint with non-matching override returns undefined', () => {
  // Mouse near end of line at (10,10); mid-point is at (55,10), well outside aperture
  snapping.setSnapOverride(SnapPoint.Type.MID);
  core.mouse.mouseMoved(8, 8);
  const result = snapping.getSnapPoint();
  expect(result).toBeUndefined();
  snapping.setSnapOverride(null);
});

// ─── SnapPoint.draw – all snap types ────────────────────────────────────────

test('Test SnapPoint.draw END type draws closed polygon', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.END);
  const renderer = makeSnapRenderer();
  sp.draw(renderer, 1);
  expect(renderer.drawShape).toHaveBeenCalledTimes(1);
  expect(renderer.drawShape).toHaveBeenCalledWith(null, expect.any(Array), expect.objectContaining({ closed: true }));
});

test('Test SnapPoint.draw MID type draws closed polygon', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.MID);
  const renderer = makeSnapRenderer();
  sp.draw(renderer, 1);
  expect(renderer.drawShape).toHaveBeenCalledTimes(1);
  expect(renderer.drawShape).toHaveBeenCalledWith(null, expect.any(Array), expect.objectContaining({ closed: true }));
});

test('Test SnapPoint.draw QUADRANT type draws closed polygon', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.QUADRANT);
  const renderer = makeSnapRenderer();
  sp.draw(renderer, 1);
  expect(renderer.drawShape).toHaveBeenCalledTimes(1);
  expect(renderer.drawShape).toHaveBeenCalledWith(null, expect.any(Array), expect.objectContaining({ closed: true }));
});

test('Test SnapPoint.draw NEAREST type draws closed polygon', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.NEAREST);
  const renderer = makeSnapRenderer();
  sp.draw(renderer, 1);
  expect(renderer.drawShape).toHaveBeenCalledTimes(1);
  expect(renderer.drawShape).toHaveBeenCalledWith(null, expect.any(Array), expect.objectContaining({ closed: true }));
});

test('Test SnapPoint.draw TANGENT type draws circle and tangent line', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.TANGENT);
  const renderer = makeSnapRenderer();
  sp.draw(renderer, 1);
  expect(renderer.drawShape).toHaveBeenCalledTimes(2);
});

test('Test SnapPoint.draw NODE type draws circle and X lines', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.NODE);
  const renderer = makeSnapRenderer();
  sp.draw(renderer, 1);
  expect(renderer.drawShape).toHaveBeenCalledTimes(3);
});

test('Test SnapPoint.draw PERPENDICULAR type draws L-shape', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.PERPENDICULAR);
  const renderer = makeSnapRenderer();
  sp.draw(renderer, 1);
  expect(renderer.drawShape).toHaveBeenCalledTimes(1);
  expect(renderer.drawShape).not.toHaveBeenCalledWith(null, expect.any(Array), expect.objectContaining({ closed: true }));
});

// ─── TrackingLine.draw – out-of-bounds cases ─────────────────────────────────

test('Test TrackingLine.draw vertical line outside x bounds', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // dir.x === 0 and from.x = 2 > boundsMax.x = 1 → draw returns early
  snapping.addTrackingLine(new Point(2, -0.5), new Point(2, 0.5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const renderer = makeTrackingRenderer();
  trackingLine.draw(renderer, 1);
  expect(renderer.drawShape).not.toHaveBeenCalled();
  expect(renderer.restore).not.toHaveBeenCalled();
});

test('Test TrackingLine.draw horizontal line outside y bounds', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // dir.y === 0 and from.y = -5 < boundsMin.y = -1 → draw returns early
  snapping.addTrackingLine(new Point(0.5, -5), new Point(0.8, -5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const renderer = makeTrackingRenderer();
  trackingLine.draw(renderer, 1);
  expect(renderer.drawShape).not.toHaveBeenCalled();
  expect(renderer.restore).not.toHaveBeenCalled();
});

test('Test TrackingLine.draw line does not intersect canvas bounds', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // from = (2, -0.5), dir = (1, 1): x-clamp gives t ∈ [-2, -1], y-clamp gives t ∈ [-0.5, 0.5]
  // tMax (-1) < tMin (-0.5) → draw returns early
  snapping.addTrackingLine(new Point(2, -0.5), new Point(3, 0.5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const renderer = makeTrackingRenderer();
  trackingLine.draw(renderer, 1);
  expect(renderer.drawShape).not.toHaveBeenCalled();
  expect(renderer.restore).not.toHaveBeenCalled();
});
