import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { CornerEntity } from '../../core/tools/cornerEntity.js';
import { expect, jest } from '@jest/globals';

const core = new Core();

// ─── activeSeg ────────────────────────────────────────────────────────────────

test('CornerEntity.activeSeg returns entity when segment is null', () => {
  const corner = new CornerEntity();
  const entity = {};
  corner.entity = entity;
  expect(corner.activeSeg).toBe(entity);
});

test('CornerEntity.activeSeg returns segment when segment is set', () => {
  const corner = new CornerEntity();
  corner.entity = {};
  const seg = {};
  corner.segment = seg;
  expect(corner.activeSeg).toBe(seg);
});

// ─── direction ────────────────────────────────────────────────────────────────

test('CornerEntity.direction returns lineEnd minus lineStart', () => {
  const corner = new CornerEntity();
  corner.lineStart = new Point(1, 2);
  corner.lineEnd = new Point(4, 6);
  const dir = corner.direction;
  expect(dir.x).toBeCloseTo(3);
  expect(dir.y).toBeCloseTo(4);
});

// ─── resolveEndpoints ─────────────────────────────────────────────────────────

test('CornerEntity.resolveEndpoints returns true and sets lineStart/lineEnd for a Line', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  const line = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = line;

  expect(corner.resolveEndpoints()).toBe(true);
  expect(corner.lineStart).toBe(line.points[0]);
  expect(corner.lineEnd).toBe(line.points[1]);
});

test('CornerEntity.resolveEndpoints returns false and leaves endpoints null for a non-Line', () => {
  core.scene.clear();
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });
  const circle = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = circle;

  expect(corner.resolveEndpoints()).toBe(false);
  expect(corner.lineStart).toBeNull();
  expect(corner.lineEnd).toBeNull();
});

// ─── setEntity ────────────────────────────────────────────────────────────────

test('CornerEntity.setEntity returns true and clears segment for a plain Line entity', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  const line = core.scene.entities.get(0);

  const corner = new CornerEntity();
  expect(corner.setPick(line, new Point(5, 0), 'error')).toBe(true);
  expect(corner.segment).toBeNull();
  expect(corner.segmentIndex).toBeNull();
});

test('CornerEntity.setEntity sets segment and segmentIndex for a polyline straight segment', () => {
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  expect(corner.setPick(poly, new Point(5, 0), 'error')).toBe(true); // near first (horizontal) segment
  expect(corner.segment).toBeInstanceOf(Line);
  expect(corner.segmentIndex).toBe(1);
});

test('CornerEntity.setEntity notifies and returns false for a polyline arc segment', () => {
  core.scene.clear();
  const notifySpy = jest.spyOn(core, 'notify');

  // bulge on the start point makes the segment an arc
  const arcStart = new Point(0, 0);
  arcStart.bulge = 1;
  core.scene.addItem('Lwpolyline', { points: [arcStart, new Point(10, 0)] });
  const poly = core.scene.entities.get(0);

  const errorMsg = 'arc segment error';
  expect(new CornerEntity().setPick(poly, new Point(5, 2), errorMsg)).toBe(false);
  expect(notifySpy).toHaveBeenCalledWith(errorMsg);
  notifySpy.mockRestore();
});

// ─── click-side geometry getters ─────────────────────────────────────────────

test('CornerEntity click-side geometry methods return correct values', () => {
  // Horizontal line (0,0)→(10,0), intersection at (5,0), click at (3,2)
  // clickOnLine = perpendicular foot of (3,2) on the line = (3,0)
  // clickDir = (3,0)−(5,0) = (−2,0)
  // clickDistance = 2, clickUnit = (−1,0)
  // lineKeptEnd = lineStart because clickDir points toward start
  const corner = new CornerEntity();
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(3, 2);
  const ip = new Point(5, 0);

  expect(corner.clickDistance(ip)).toBeCloseTo(2);
  expect(corner.clickDir(ip).x).toBeCloseTo(-2);
  expect(corner.clickDir(ip).y).toBeCloseTo(0);
  expect(corner.clickUnit(ip).x).toBeCloseTo(-1);
  expect(corner.clickUnit(ip).y).toBeCloseTo(0);
  expect(corner.lineKeptEnd(ip)).toBe(corner.lineStart);
});

test('CornerEntity.clickDistance is near zero when click projects exactly to intersection', () => {
  // clickOnLine = (5,0) = intersectionPoint → clickDistance = 0 → ambiguous corner
  const corner = new CornerEntity();
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(5, 0);

  expect(corner.clickDistance(new Point(5, 0))).toBeCloseTo(0);
});

test('CornerEntity.lineKeptEnd is lineEnd when click is past intersection', () => {
  // Click at (8,1): clickOnLine = (8,0), clickDir from (5,0) = (3,0) → points toward end
  const corner = new CornerEntity();
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(8, 1);

  expect(corner.lineKeptEnd(new Point(5, 0))).toBe(corner.lineEnd);
});

// ─── keepStart ───────────────────────────────────────────────────────────────

test('CornerEntity.keepStart returns true when segment start is on the click side', () => {
  // Polyline: (0,0)→(10,0)→(10,10), click at (3,2), intersection=(10,0)
  // clickOnLine=(3,0), clickDir=(−7,0) → points toward start side
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = poly;
  corner.segmentIndex = 1;
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(3, 2);

  expect(corner.keepStart(new Point(10, 0))).toBe(true);
});

test('CornerEntity.keepStart returns false when segment end is on the click side', () => {
  // Same polyline, click at (8,2), intersection=(0,0)
  // clickOnLine=(8,0), clickDir=(8,0) → points toward end side
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = poly;
  corner.segmentIndex = 1;
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(8, 2);

  expect(corner.keepStart(new Point(0, 0))).toBe(false);
});

test('CornerEntity.keepStart handles closing segment of closed polyline (segmentIndex === points.length)', () => {
  // Closed polyline: (0,0)→(10,0)→(10,10), closing segment is index 3 (back to (0,0))
  // segmentIndex === points.length wraps segEnd to points[0] = (0,0)
  // lineStart=(10,10), lineEnd=(0,0), click at (9,9), intersection=(10,0)
  // clickOnLine=(10,9.something...) but we just need keepStart not to throw
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = poly;
  corner.segmentIndex = poly.points.length; // closing segment
  corner.lineStart = new Point(10, 10);
  corner.lineEnd = new Point(0, 0);
  corner.clickPoint = new Point(9, 9);

  // Should not throw; segEnd wraps to points[0] = (0,0)
  expect(() => corner.keepStart(new Point(10, 0))).not.toThrow();
});
