import { jest } from '@jest/globals';
import { Core } from '../../core/core/core.js';
import { Snapping, SnapPoint } from '../../core/lib/snapping.js';
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
  const ctx = {
    strokeStyle: '',
    lineWidth: 0,
    setLineDash: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    arc: jest.fn(),
    stroke: jest.fn(),
  };
  snapPointEntity.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.arc).toHaveBeenCalledWith(0.5, 0.5, expect.any(Number), 0, 6.283);
  expect(ctx.stroke).toHaveBeenCalled();
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
  const ctx = {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
    setLineDash: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
  };
  trackingLine.draw(ctx, 1);
  expect(ctx.save).toHaveBeenCalled();
  expect(ctx.moveTo).toHaveBeenCalled();
  expect(ctx.lineTo).toHaveBeenCalled();
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.restore).toHaveBeenCalled();
});

test('Test TrackingLine.draw degenerate zero direction', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // inputPoint equals snapPoint → direction is zero vector → draw returns early
  snapping.addTrackingLine(new Point(0.5, 0.5), new Point(0.5, 0.5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const ctx = {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
    setLineDash: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
  };
  trackingLine.draw(ctx, 1);
  expect(ctx.moveTo).not.toHaveBeenCalled();
  expect(ctx.stroke).not.toHaveBeenCalled();
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

// ─── Context mock helpers ────────────────────────────────────────────────────

function makeSnapCtx() {
  return {
    strokeStyle: '',
    lineWidth: 0,
    setLineDash: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    arc: jest.fn(),
    stroke: jest.fn(),
  };
}

function makeTrackingCtx() {
  return {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
    setLineDash: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
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

test('Test SnapPoint.draw END type draws closed polygon without arc', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.END);
  const ctx = makeSnapCtx();
  sp.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.closePath).toHaveBeenCalled();
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.arc).not.toHaveBeenCalled();
});

test('Test SnapPoint.draw MID type draws closed polygon without arc', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.MID);
  const ctx = makeSnapCtx();
  sp.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.closePath).toHaveBeenCalled();
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.arc).not.toHaveBeenCalled();
});

test('Test SnapPoint.draw QUADRANT type draws closed polygon without arc', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.QUADRANT);
  const ctx = makeSnapCtx();
  sp.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.closePath).toHaveBeenCalled();
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.arc).not.toHaveBeenCalled();
});

test('Test SnapPoint.draw NEAREST type draws closed polygon without arc', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.NEAREST);
  const ctx = makeSnapCtx();
  sp.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.closePath).toHaveBeenCalled();
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.arc).not.toHaveBeenCalled();
});

test('Test SnapPoint.draw TANGENT type draws arc with tangent line', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.TANGENT);
  const ctx = makeSnapCtx();
  sp.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.arc).toHaveBeenCalledWith(5, 5, expect.any(Number), 0, 6.283);
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.closePath).not.toHaveBeenCalled();
});

test('Test SnapPoint.draw NODE type draws arc with X inside', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.NODE);
  const ctx = makeSnapCtx();
  sp.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.arc).toHaveBeenCalledWith(5, 5, expect.any(Number), 0, 6.283);
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.closePath).not.toHaveBeenCalled();
});

test('Test SnapPoint.draw PERPENDICULAR type draws L-shape without arc', () => {
  const sp = new SnapPoint(new Point(5, 5), SnapPoint.Type.PERPENDICULAR);
  const ctx = makeSnapCtx();
  sp.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.stroke).toHaveBeenCalled();
  expect(ctx.closePath).not.toHaveBeenCalled();
  expect(ctx.arc).not.toHaveBeenCalled();
});

// ─── TrackingLine.draw – out-of-bounds cases ─────────────────────────────────

test('Test TrackingLine.draw vertical line outside x bounds', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // dir.x === 0 and from.x = 2 > boundsMax.x = 1 → draw returns early
  snapping.addTrackingLine(new Point(2, -0.5), new Point(2, 0.5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const ctx = makeTrackingCtx();
  trackingLine.draw(ctx, 1);
  expect(ctx.moveTo).not.toHaveBeenCalled();
  expect(ctx.stroke).not.toHaveBeenCalled();
});

test('Test TrackingLine.draw horizontal line outside y bounds', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // dir.y === 0 and from.y = -5 < boundsMin.y = -1 → draw returns early
  snapping.addTrackingLine(new Point(0.5, -5), new Point(0.8, -5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const ctx = makeTrackingCtx();
  trackingLine.draw(ctx, 1);
  expect(ctx.moveTo).not.toHaveBeenCalled();
  expect(ctx.stroke).not.toHaveBeenCalled();
});

test('Test TrackingLine.draw line does not intersect canvas bounds', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  // from = (2, -0.5), dir = (1, 1): x-clamp gives t ∈ [-2, -1], y-clamp gives t ∈ [-0.5, 0.5]
  // tMax (-1) < tMin (-0.5) → draw returns early
  snapping.addTrackingLine(new Point(2, -0.5), new Point(3, 0.5));
  const trackingLine = DesignCore.Scene.auxiliaryEntities.get(0);
  const ctx = makeTrackingCtx();
  trackingLine.draw(ctx, 1);
  expect(ctx.moveTo).not.toHaveBeenCalled();
  expect(ctx.stroke).not.toHaveBeenCalled();
});
