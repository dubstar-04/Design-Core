import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Chamfer } from '../../core/tools/chamfer.js';
import { Strings } from '../../core/lib/strings.js';
import { expect, jest } from '@jest/globals';

const core = new Core();

// ─── resolveCornerGeometry ────────────────────────────────────────────────────

test('ChamferFilletBase.resolveCornerGeometry returns false and notifies when first segment is not a Line', () => {
  core.scene.clear();
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  const notifySpy = jest.spyOn(core, 'notify');
  const chamfer = new Chamfer();
  chamfer.first.entity = core.scene.entities.get(0); // Circle
  chamfer.second.entity = core.scene.entities.get(1);
  chamfer.first.clickPoint = new Point(0, 0);
  chamfer.second.clickPoint = new Point(0, 5);

  expect(chamfer.resolveCornerGeometry('test-msg')).toBe(false);
  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining('test-msg'));
  notifySpy.mockRestore();
});

test('ChamferFilletBase.resolveCornerGeometry returns false and notifies when second segment is not a Line', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(5, 0)] });

  const notifySpy = jest.spyOn(core, 'notify');
  const chamfer = new Chamfer();
  chamfer.first.entity = core.scene.entities.get(0);
  chamfer.second.entity = core.scene.entities.get(1); // Circle
  chamfer.first.clickPoint = new Point(5, 0);
  chamfer.second.clickPoint = new Point(0, 0);

  expect(chamfer.resolveCornerGeometry('test-msg')).toBe(false);
  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining('test-msg'));
  notifySpy.mockRestore();
});

test('ChamferFilletBase.resolveCornerGeometry returns false and notifies for parallel lines', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 2), new Point(10, 2)] });

  const notifySpy = jest.spyOn(core, 'notify');
  const chamfer = new Chamfer();
  chamfer.first.entity = core.scene.entities.get(0);
  chamfer.second.entity = core.scene.entities.get(1);
  chamfer.first.clickPoint = new Point(5, 0);
  chamfer.second.clickPoint = new Point(5, 2);

  expect(chamfer.resolveCornerGeometry('test-msg')).toBe(false);
  expect(notifySpy).toHaveBeenCalledWith(Strings.Error.PARALLELLINES);
  notifySpy.mockRestore();
});

test('ChamferFilletBase.resolveCornerGeometry returns true and computes intersection for L-corner', () => {
  // Horizontal (-10,0)→(0,0) and vertical (0,0)→(0,10); infinite lines meet at (0,0)
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(0, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });

  const chamfer = new Chamfer();
  chamfer.first.entity = core.scene.entities.get(0);
  chamfer.second.entity = core.scene.entities.get(1);
  chamfer.first.clickPoint = new Point(-5, 0);
  chamfer.second.clickPoint = new Point(0, 5);

  expect(chamfer.resolveCornerGeometry('test-msg')).toBe(true);
  expect(chamfer.intersectionPoint.x).toBeCloseTo(0);
  expect(chamfer.intersectionPoint.y).toBeCloseTo(0);
  // Click on line1 is to the left of intersection → clickUnit points left
  expect(chamfer.first.clickUnit.x).toBeCloseTo(-1);
  expect(chamfer.first.clickUnit.y).toBeCloseTo(0);
  expect(chamfer.first.lineKeptEnd).toBe(chamfer.first.entity.points[0]); // (-10,0)
  // Click on line2 is above intersection → clickUnit points up
  expect(chamfer.second.clickUnit.x).toBeCloseTo(0);
  expect(chamfer.second.clickUnit.y).toBeCloseTo(1);
  expect(chamfer.second.lineKeptEnd).toBe(chamfer.second.entity.points[1]); // (0,10)
});

test('ChamferFilletBase.resolveCornerGeometry uses polyline activeSeg for first entity', () => {
  // Polyline [(-10,0),(0,0),(0,10)], click near segment 1 (y=0).
  // Paired with vertical line x=5; lines meet at (5,0).
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-10, 0), new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Line', { points: [new Point(5, -5), new Point(5, 5)] });

  const polyEntity = core.scene.entities.get(0);
  const lineEntity = core.scene.entities.get(1);
  const polyClickPoint = new Point(-5, 0);

  const chamfer = new Chamfer();
  chamfer.first.entity = polyEntity;
  chamfer.first.clickPoint = polyClickPoint;
  chamfer.first.segment = polyEntity.getClosestSegment(polyClickPoint);
  chamfer.first.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  chamfer.second.entity = lineEntity;
  chamfer.second.clickPoint = new Point(5, 2);

  expect(chamfer.resolveCornerGeometry('test-msg')).toBe(true);
  expect(chamfer.intersectionPoint.x).toBeCloseTo(5);
  expect(chamfer.intersectionPoint.y).toBeCloseTo(0);
});

// ─── applySharpTrim: Line + Line ──────────────────────────────────────────────

test('ChamferFilletBase.applySharpTrim trims two Lines to the intersection point', () => {
  // Line1: (0,0)→(8,0); Line2: (10,-10)→(10,-2). Infinite lines meet at (10,0).
  // keepEnd for Line1 = (0,0); keepEnd for Line2 = (10,-10).
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(8, 0)] });
  core.scene.addItem('Line', { points: [new Point(10, -10), new Point(10, -2)] });
  const lineA = core.scene.entities.get(0);
  const lineB = core.scene.entities.get(1);

  const chamfer = new Chamfer();
  chamfer.first.entity = lineA;
  chamfer.second.entity = lineB;
  chamfer.first.lineKeptEnd = lineA.points[0]; // (0,0) — far end
  chamfer.second.lineKeptEnd = lineB.points[0]; // (10,-10) — far end
  chamfer.intersectionPoint = new Point(10, 0);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  const updatedA = core.scene.entities.get(0);
  const updatedB = core.scene.entities.get(1);
  expect(updatedA.points[0].x).toBeCloseTo(0);
  expect(updatedA.points[0].y).toBeCloseTo(0);
  expect(updatedA.points[1].x).toBeCloseTo(10);
  expect(updatedA.points[1].y).toBeCloseTo(0);
  expect(updatedB.points[0].x).toBeCloseTo(10);
  expect(updatedB.points[0].y).toBeCloseTo(-10);
  expect(updatedB.points[1].x).toBeCloseTo(10);
  expect(updatedB.points[1].y).toBeCloseTo(0);
});

// ─── applySharpTrim: Poly + Poly, same entity ─────────────────────────────────

test('ChamferFilletBase.applySharpTrim poly+poly consecutive segments: replaces corner vertex with intersection', () => {
  // L-shaped polyline [(-10,0),(0,0),(0,10)]; segments 1 and 2 share vertex (0,0).
  // Intersection of infinite lines is also (0,0), so splice replaces vertex with itself.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-10, 0), new Point(0, 0), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);

  const chamfer = new Chamfer();
  chamfer.first.entity = polyEntity;
  chamfer.second.entity = polyEntity;
  chamfer.first.segmentIndex = 1;
  chamfer.second.segmentIndex = 2;
  chamfer.intersectionPoint = new Point(0, 0);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(3);
  expect(poly.points[1].x).toBeCloseTo(0);
  expect(poly.points[1].y).toBeCloseTo(0);
});

test('ChamferFilletBase.applySharpTrim poly+poly open ends: moves both endpoints to intersection', () => {
  // 4-vertex polyline: [(-5,2),(0,2),(3,4),(3,8)].
  // Seg 1 is on y=2, seg 3 (lastIdx=3) is on x=3 → infinite lines meet at (3,2).
  // Both open endpoints (index 0 and 3) are moved to (3,2).
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-5, 2), new Point(0, 2), new Point(3, 4), new Point(3, 8)] });
  const polyEntity = core.scene.entities.get(0);

  const chamfer = new Chamfer();
  chamfer.first.entity = polyEntity;
  chamfer.second.entity = polyEntity;
  chamfer.first.segmentIndex = 1; // open start
  chamfer.second.segmentIndex = 3; // open end (lastIdx = 3)
  chamfer.intersectionPoint = new Point(3, 2);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  // Both endpoints trimmed to intersection
  expect(poly.points[0].x).toBeCloseTo(3);
  expect(poly.points[0].y).toBeCloseTo(2);
  expect(poly.points[3].x).toBeCloseTo(3);
  expect(poly.points[3].y).toBeCloseTo(2);
  // Middle points unchanged
  expect(poly.points[1].x).toBeCloseTo(0);
  expect(poly.points[1].y).toBeCloseTo(2);
  expect(poly.points[2].x).toBeCloseTo(3);
  expect(poly.points[2].y).toBeCloseTo(4);
});

test('ChamferFilletBase.applySharpTrim poly+poly closed polyline seg1+lastIdx: corner-splice path, not open-ends', () => {
  // Closed 4-vertex polyline: [(-10,0),(0,0),(0,10),(close)].
  // flags bit 1 set → polyline is closed.
  // segmentIndex 1 and lastIdx 3 would look like open-ends by index alone, but the
  // closed-polyline guard must send this to the corner-splice path instead.
  // The shared corner is at index min(1,3)=1, so corner vertex (0,0) is replaced with
  // the intersection point (0,0) — a no-op on coordinates but proves the splice path ran.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-10, 0), new Point(0, 0), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1); // mark as closed

  const chamfer = new Chamfer();
  chamfer.first.entity = polyEntity;
  chamfer.second.entity = polyEntity;
  chamfer.first.segmentIndex = 1;
  chamfer.second.segmentIndex = polyEntity.points.length - 1; // lastIdx
  chamfer.intersectionPoint = new Point(0, 0);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  // Corner-splice: replaces vertex at cornerIdx=1 with intersectionPoint — point count unchanged
  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(3);
  // endpoints NOT moved (open-ends path would have moved points[0] and points[lastIdx])
  expect(poly.points[0].x).toBeCloseTo(-10);
  expect(poly.points[0].y).toBeCloseTo(0);
});

test('ChamferFilletBase.applySharpTrim closed poly last-regular-seg + closing-seg: replaces last vertex', () => {
  // Square: [( 0,0),(10,0),(10,10),(0,10)], closed.
  // Segments: 1=(0,0)→(10,0), 2=(10,0)→(10,10), 3=(10,10)→(0,10), 4(closing)=(0,10)→(0,0).
  // Corner at (0,10) shared by seg 3 and seg 4. segDiff=1 → corner-splice path.
  // cornerIdx = min(3,4) = 3 → replaces points[3]=(0,10) with intersectionPoint (0,10).
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  const chamfer = new Chamfer();
  chamfer.first.entity = polyEntity;
  chamfer.second.entity = polyEntity;
  chamfer.first.segmentIndex = 3;
  chamfer.second.segmentIndex = 4; // closing segment (points.length)
  chamfer.intersectionPoint = new Point(0, 10);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
  // Other vertices not affected
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(0);
});

test('ChamferFilletBase.applySharpTrim closed poly closing-seg + seg-1: replaces first vertex (index 0)', () => {
  // Same square. Corner at (0,0) shared by closing seg 4 and seg 1.
  // segDiff = |4-1| = 3 (not 1), closing-wrap detected → cornerIdx = 0.
  // Replaces points[0]=(0,0) with intersectionPoint (0,0).
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  polyEntity.flags.setFlagValue(1);

  const chamfer = new Chamfer();
  chamfer.first.entity = polyEntity;
  chamfer.second.entity = polyEntity;
  chamfer.first.segmentIndex = 4; // closing segment
  chamfer.second.segmentIndex = 1;
  chamfer.intersectionPoint = new Point(0, 0);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(0);
  // Other vertices not affected
  expect(poly.points[1].x).toBeCloseTo(10);
  expect(poly.points[1].y).toBeCloseTo(0);
  // endpoints not moved (open-ends path must not fire)
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

// ─── applySharpTrim: Line + Poly ─────────────────────────────────────────────

test('ChamferFilletBase.applySharpTrim first=Line second=Poly keepStart: line consumed, poly start portion kept', () => {
  // Line: (0,0)→(0,10); Poly: [(-20,0),(-10,0),(0,0),(10,0)].
  // second=Poly, segmentIndex=2 (segment (-10,0)→(0,0)), clickDir=(-1,0) → keepStart.
  // Result: Poly becomes [(-20,0),(-10,0),(0,0),(0,10)]; Line removed.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);

  const chamfer = new Chamfer();
  chamfer.first.entity = lineEntity;
  chamfer.first.lineKeptEnd = new Point(0, 10);
  chamfer.second.entity = polyEntity;
  chamfer.second.segmentIndex = 2;
  chamfer.second.clickDir = new Point(-1, 0);
  chamfer.intersectionPoint = new Point(0, 0);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-20);
  expect(poly.points[0].y).toBeCloseTo(0);
  expect(poly.points[1].x).toBeCloseTo(-10);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(0);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});

test('ChamferFilletBase.applySharpTrim first=Line second=Poly keepEnd: line consumed, poly end portion kept', () => {
  // Same setup, but segmentIndex=3. clickDir=(1,0) points toward (10,0) → keepEnd.
  // Result: Poly becomes [(0,10),(0,0),(10,0)]; Line removed.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);

  const chamfer = new Chamfer();
  chamfer.first.entity = lineEntity;
  chamfer.first.lineKeptEnd = new Point(0, 10);
  chamfer.second.entity = polyEntity;
  chamfer.second.segmentIndex = 3;
  chamfer.second.clickDir = new Point(1, 0);
  chamfer.intersectionPoint = new Point(0, 0);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(3);
  expect(poly.points[0].x).toBeCloseTo(0);
  expect(poly.points[0].y).toBeCloseTo(10);
  expect(poly.points[1].x).toBeCloseTo(0);
  expect(poly.points[1].y).toBeCloseTo(0);
  expect(poly.points[2].x).toBeCloseTo(10);
  expect(poly.points[2].y).toBeCloseTo(0);
});

// ─── applySharpTrim: Poly + Line ─────────────────────────────────────────────

test('ChamferFilletBase.applySharpTrim first=Poly second=Line: poly/line ordering assigned correctly', () => {
  // Identical geometry to the keepStart test but with first=Poly and second=Line.
  // firstIsPolyline=true → [poly, line] = [this.first, this.second].
  // Result should be the same: Poly becomes [(-20,0),(-10,0),(0,0),(0,10)]; Line removed.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  const lineEntity = core.scene.entities.get(1);

  const chamfer = new Chamfer();
  chamfer.first.entity = polyEntity;
  chamfer.first.segmentIndex = 2;
  chamfer.first.clickDir = new Point(-1, 0);
  chamfer.second.entity = lineEntity;
  chamfer.second.lineKeptEnd = new Point(0, 10);
  chamfer.intersectionPoint = new Point(0, 0);

  const stateChanges = chamfer.applySharpTrim();
  DesignCore.Scene.commit(stateChanges);

  expect(core.scene.entities.count()).toBe(1);
  const poly = core.scene.entities.get(0);
  expect(poly.points.length).toBe(4);
  expect(poly.points[0].x).toBeCloseTo(-20);
  expect(poly.points[1].x).toBeCloseTo(-10);
  expect(poly.points[2].x).toBeCloseTo(0);
  expect(poly.points[2].y).toBeCloseTo(0);
  expect(poly.points[3].x).toBeCloseTo(0);
  expect(poly.points[3].y).toBeCloseTo(10);
});
