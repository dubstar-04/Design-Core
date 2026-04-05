import { jest } from '@jest/globals';
import { Core } from '../../core/core/core.js';
import { Snapping } from '../../core/lib/snapping.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';

const core = new Core();
const snapping = new Snapping();

// Add a valid item to scene
core.scene.addItem('Line', { points: [new Point(10, 10), new Point(100, 10)] });


test('Test Snapping.getSnapPoint', () => {
  // set the mouse position
  core.mouse.mouseMoved(8, 8);
  // Get the snap point
  const snapPoint1 = snapping.getSnapPoint();
  expect(snapPoint1.x).toBe(10);
  expect(snapPoint1.y).toBe(10);


  // set the mouse position
  core.mouse.mouseMoved(101, 11);
  // Get the snap point
  const snapPoint2 = snapping.getSnapPoint();
  expect(snapPoint2.x).toBe(100);
  expect(snapPoint2.y).toBe(10);

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
  expect(result.x).toBe(10);
  expect(result.y).toBe(10);
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBeGreaterThan(0);
});

test('Test Snapping.snap inactive', () => {
  snapping.active = false;
  core.mouse.mouseMoved(8, 8);
  expect(snapping.snap()).toBeUndefined();
});

test('Test Snapping.addSnapPoint', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  snapping.addSnapPoint(new Point(10, 10));
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(1);
});

test('Test SnapPoint.draw', () => {
  DesignCore.Scene.auxiliaryEntities.clear();
  snapping.addSnapPoint(new Point(0.5, 0.5));
  const snapPointEntity = DesignCore.Scene.auxiliaryEntities.get(0);
  const ctx = {
    fillStyle: '',
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
  };
  snapPointEntity.draw(ctx, 1);
  expect(ctx.beginPath).toHaveBeenCalled();
  expect(ctx.arc).toHaveBeenCalledWith(0.5, 0.5, expect.any(Number), 0, 6.283);
  expect(ctx.fill).toHaveBeenCalled();
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
