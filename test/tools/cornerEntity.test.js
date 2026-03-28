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

// ─── resolveSegment ───────────────────────────────────────────────────────────

test('CornerEntity.resolveSegment returns true without changes for a plain Line entity', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  const line = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = line;
  corner.clickPoint = new Point(5, 0);

  expect(corner.resolveSegment('error')).toBe(true);
  expect(corner.segment).toBeNull();
  expect(corner.segmentIndex).toBeNull();
});

test('CornerEntity.resolveSegment sets segment and segmentIndex for a polyline straight segment', () => {
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = poly;
  corner.clickPoint = new Point(5, 0); // near first (horizontal) segment

  expect(corner.resolveSegment('error')).toBe(true);
  expect(corner.segment).toBeInstanceOf(Line);
  expect(corner.segmentIndex).toBe(1);
});

test('CornerEntity.resolveSegment notifies and returns false for a polyline arc segment', () => {
  core.scene.clear();
  const notifySpy = jest.spyOn(core, 'notify');

  // bulge on the start point makes the segment an arc
  const arcStart = new Point(0, 0);
  arcStart.bulge = 1;
  core.scene.addItem('Lwpolyline', { points: [arcStart, new Point(10, 0)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = poly;
  corner.clickPoint = new Point(5, 2);

  const errorMsg = 'arc segment error';
  expect(corner.resolveSegment(errorMsg)).toBe(false);
  expect(notifySpy).toHaveBeenCalledWith(errorMsg);
  notifySpy.mockRestore();
});

// ─── resolveGeometry ─────────────────────────────────────────────────────────

test('CornerEntity.resolveGeometry populates all click-side geometry fields', () => {
  // Horizontal line (0,0)→(10,0), intersection at (5,0), click at (3,2)
  // clickOnLine = perpendicular foot of (3,2) on the line = (3,0)
  // clickDir = (3,0)−(5,0) = (−2,0)
  // clickDistance = 2, clickUnit = (−1,0)
  // lineKeptEnd = lineStart because clickDir points toward start
  const corner = new CornerEntity();
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(3, 2);

  corner.resolveGeometry(new Point(5, 0));

  expect(corner.clickDistance).toBeCloseTo(2);
  expect(corner.clickDir.x).toBeCloseTo(-2);
  expect(corner.clickDir.y).toBeCloseTo(0);
  expect(corner.clickUnit.x).toBeCloseTo(-1);
  expect(corner.clickUnit.y).toBeCloseTo(0);
  expect(corner.lineKeptEnd).toBe(corner.lineStart);
});

test('CornerEntity.resolveGeometry returns false when click projects to intersection point', () => {
  // clickOnLine = (5,0) = intersectionPoint → clickDistance = 0 → division by zero guard
  const corner = new CornerEntity();
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(5, 0); // exactly on the line at the intersection

  expect(corner.resolveGeometry(new Point(5, 0))).toBe(false);
  expect(corner.clickUnit).toBeNull();
});

test('CornerEntity.resolveGeometry selects lineEnd as kept end when click is past intersection', () => {
  // Click at (8,1): clickOnLine = (8,0), clickDir from (5,0) = (3,0) → points toward end
  const corner = new CornerEntity();
  corner.lineStart = new Point(0, 0);
  corner.lineEnd = new Point(10, 0);
  corner.clickPoint = new Point(8, 1);

  corner.resolveGeometry(new Point(5, 0));

  expect(corner.lineKeptEnd).toBe(corner.lineEnd);
});

// ─── keepStart ───────────────────────────────────────────────────────────────

test('CornerEntity.keepStart returns true when segment start is on the click side', () => {
  // Polyline: (0,0)→(10,0)→(10,10), segmentIndex=1, intersection=(10,0)
  // clickDir=(−1,0): dot with segStart−int=(−10,0) = 10, dot with segEnd−int=(0,0) = 0 → true
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = poly;
  corner.segmentIndex = 1;
  corner.clickDir = new Point(-1, 0);

  expect(corner.keepStart(new Point(10, 0))).toBe(true);
});

test('CornerEntity.keepStart returns false when segment end is on the click side', () => {
  // Same polyline, segmentIndex=1, intersection=(0,0)
  // clickDir=(1,0): dot with segStart−int=(0,0) = 0, dot with segEnd−int=(10,0) = 10 → false
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10)] });
  const poly = core.scene.entities.get(0);

  const corner = new CornerEntity();
  corner.entity = poly;
  corner.segmentIndex = 1;
  corner.clickDir = new Point(1, 0);

  expect(corner.keepStart(new Point(0, 0))).toBe(false);
});
