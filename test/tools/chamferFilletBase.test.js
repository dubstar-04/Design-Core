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
  chamfer.firstPick.entity = core.scene.entities.get(0); // Circle
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(0, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);

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
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1); // Circle
  chamfer.firstPick.clickPoint = new Point(5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 0);

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
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(5, 0);
  chamfer.secondPick.clickPoint = new Point(5, 2);

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
  chamfer.firstPick.entity = core.scene.entities.get(0);
  chamfer.secondPick.entity = core.scene.entities.get(1);
  chamfer.firstPick.clickPoint = new Point(-5, 0);
  chamfer.secondPick.clickPoint = new Point(0, 5);

  expect(chamfer.resolveCornerGeometry('test-msg')).toBe(true);
  expect(chamfer.intersectionPoint.x).toBeCloseTo(0);
  expect(chamfer.intersectionPoint.y).toBeCloseTo(0);
  // Click on line1 is to the left of intersection → clickUnit points left
  expect(chamfer.firstPick.clickUnit(chamfer.intersectionPoint).x).toBeCloseTo(-1);
  expect(chamfer.firstPick.clickUnit(chamfer.intersectionPoint).y).toBeCloseTo(0);
  expect(chamfer.firstPick.lineKeptEnd(chamfer.intersectionPoint)).toBe(chamfer.firstPick.entity.points[0]); // (-10,0)
  // Click on line2 is above intersection → clickUnit points up
  expect(chamfer.secondPick.clickUnit(chamfer.intersectionPoint).x).toBeCloseTo(0);
  expect(chamfer.secondPick.clickUnit(chamfer.intersectionPoint).y).toBeCloseTo(1);
  expect(chamfer.secondPick.lineKeptEnd(chamfer.intersectionPoint)).toBe(chamfer.secondPick.entity.points[1]); // (0,10)
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
  chamfer.firstPick.entity = polyEntity;
  chamfer.firstPick.clickPoint = polyClickPoint;
  chamfer.firstPick.segment = polyEntity.getClosestSegment(polyClickPoint);
  chamfer.firstPick.segmentIndex = polyEntity.getClosestSegmentIndex(polyClickPoint);
  chamfer.secondPick.entity = lineEntity;
  chamfer.secondPick.clickPoint = new Point(5, 2);

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
  chamfer.firstPick.entity = lineA;
  chamfer.firstPick.lineStart = lineA.points[0]; // (0,0)
  chamfer.firstPick.lineEnd = lineA.points[1]; // (8,0)
  chamfer.firstPick.clickPoint = new Point(3, 2); // projects to (3,0) → lineKeptEnd = (0,0)
  chamfer.secondPick.entity = lineB;
  chamfer.secondPick.lineStart = lineB.points[0]; // (10,-10)
  chamfer.secondPick.lineEnd = lineB.points[1]; // (10,-2)
  chamfer.secondPick.clickPoint = new Point(8, -7); // projects to (10,-7) → lineKeptEnd = (10,-10)
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
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segmentIndex = 1;
  chamfer.secondPick.segmentIndex = 2;
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
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segmentIndex = 1; // open start
  chamfer.secondPick.segmentIndex = 3; // open end (lastIdx = 3)
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
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segmentIndex = 1;
  chamfer.secondPick.segmentIndex = polyEntity.points.length - 1; // lastIdx
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
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segmentIndex = 3;
  chamfer.secondPick.segmentIndex = 4; // closing segment (points.length)
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
  chamfer.firstPick.entity = polyEntity;
  chamfer.secondPick.entity = polyEntity;
  chamfer.firstPick.segmentIndex = 4; // closing segment
  chamfer.secondPick.segmentIndex = 1;
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
  // second=Poly, segmentIndex=2 (segment (-10,0)→(0,0)), click left of intersection → keepStart.
  // Result: Poly becomes [(-20,0),(-10,0),(0,0),(0,10)]; Line removed.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = lineEntity;
  chamfer.firstPick.lineStart = lineEntity.points[0]; // (0,0)
  chamfer.firstPick.lineEnd = lineEntity.points[1]; // (0,10)
  chamfer.firstPick.clickPoint = new Point(-1, 5); // projects to (0,5) → lineKeptEnd = (0,10)
  chamfer.secondPick.entity = polyEntity;
  chamfer.secondPick.segmentIndex = 2;
  chamfer.secondPick.lineStart = new Point(-10, 0); // polyEntity.points[1]
  chamfer.secondPick.lineEnd = new Point(0, 0); // polyEntity.points[2]
  chamfer.secondPick.clickPoint = new Point(-5, 2); // projects to (-5,0) → clickDir toward start
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
  // Same setup, but segmentIndex=3. click right of intersection → keepEnd.
  // Result: Poly becomes [(0,10),(0,0),(10,0)]; Line removed.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  const lineEntity = core.scene.entities.get(0);
  const polyEntity = core.scene.entities.get(1);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = lineEntity;
  chamfer.firstPick.lineStart = lineEntity.points[0]; // (0,0)
  chamfer.firstPick.lineEnd = lineEntity.points[1]; // (0,10)
  chamfer.firstPick.clickPoint = new Point(-1, 5); // projects to (0,5) → lineKeptEnd = (0,10)
  chamfer.secondPick.entity = polyEntity;
  chamfer.secondPick.segmentIndex = 3;
  chamfer.secondPick.lineStart = new Point(0, 0); // polyEntity.points[2]
  chamfer.secondPick.lineEnd = new Point(10, 0); // polyEntity.points[3]
  chamfer.secondPick.clickPoint = new Point(6, 2); // projects to (6,0) → clickDir toward end
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
  // firstIsPolyline=true → [poly, line] = [this.firstPick, this.secondPick].
  // Result should be the same: Poly becomes [(-20,0),(-10,0),(0,0),(0,10)]; Line removed.
  core.scene.clear();
  core.scene.addItem('Lwpolyline', { points: [new Point(-20, 0), new Point(-10, 0), new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 10)] });
  const polyEntity = core.scene.entities.get(0);
  const lineEntity = core.scene.entities.get(1);

  const chamfer = new Chamfer();
  chamfer.firstPick.entity = polyEntity;
  chamfer.firstPick.segmentIndex = 2;
  chamfer.firstPick.lineStart = new Point(-10, 0); // polyEntity.points[1]
  chamfer.firstPick.lineEnd = new Point(0, 0); // polyEntity.points[2]
  chamfer.firstPick.clickPoint = new Point(-5, 2); // projects to (-5,0) → clickDir toward start
  chamfer.secondPick.entity = lineEntity;
  chamfer.secondPick.lineStart = lineEntity.points[0]; // (0,0)
  chamfer.secondPick.lineEnd = lineEntity.points[1]; // (0,10)
  chamfer.secondPick.clickPoint = new Point(-1, 5); // projects to (0,5) → lineKeptEnd = (0,10)
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
