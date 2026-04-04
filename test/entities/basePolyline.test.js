import { BasePolyline } from '../../core/entities/basePolyline.js';
import { Point } from '../../core/entities/point';
import { Polyline } from '../../core/entities/polyline.js';
import { Line } from '../../core/entities/line.js';
import { Arc } from '../../core/entities/arc.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { Flags } from '../../core/properties/flags.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

const inputScenarios = [
  {
    desc: 'two points and an angle',
    inputs: [new Point(0, 0), new Point(10, 0)],
    expectedPoints: 2,
  },
  {
    desc: 'three points with arc segment',
    inputs: [new Point(0, 0), new Point(10, 0), 'Arc', new Point(10, 10)],
    expectedPoints: 3,
  },
];

test.each(inputScenarios)('Polyline.execute handles $desc', async (scenario) => {
  const { inputs, expectedPoints } = scenario;

  await withMockInput(DesignCore.Scene, inputs, async () => {
    const polyline = new BasePolyline({});
    await polyline.execute();

    expect(polyline.points.length).toBe(expectedPoints);
    expect(polyline.points[0]).toBe(inputs[0]);
    expect(polyline.points[0].bulge).toBe(0);
    expect(polyline.points[1]).toBe(inputs[1]);

    // validate arc segment bulge and end point
    if (inputs.length > 2) {
      expect(polyline.points[1].bulge).toBeCloseTo(1);
      expect(polyline.points[2]).toBe(inputs[3]);
    }
  }, { extraMethods: { actionCommand: () => {} } });
});

test('Test BasePolyline.getClosestSegment', () => {
  // Polyline with a line and an arc segment
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10)];
  points[1].bulge = 1; // Arc from (10,0) to (10,10)
  const polyline = new BasePolyline({ points });

  // Closest to the line segment
  const testPoint1 = new Point(5, 2);
  const segment1 = polyline.getClosestSegment(testPoint1);
  expect(segment1).toBeInstanceOf(Line);

  // Closest to the arc segment
  const testPoint2 = new Point(12, 5);
  const segment2 = polyline.getClosestSegment(testPoint2);
  expect(segment2).toBeInstanceOf(Arc);
});

// ─── closing segment (closed polylines) ──────────────────────────────────────

test('BasePolyline.getClosestSegmentIndex returns closing-segment index for closed polyline', () => {
  // Square: P0=(0,0) P1=(10,0) P2=(10,10) P3=(0,10), closed flag set.
  // Closing segment is P3→P0. A point near the left edge (0,5) is closest to that segment.
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)];
  const poly = new BasePolyline({ points });
  poly.flags.setFlagValue(1);

  const closestIdx = poly.getClosestSegmentIndex(new Point(0, 5));
  // Closing segment index = points.length = 4
  expect(closestIdx).toBe(4);
});

test('BasePolyline.getClosestSegment returns closing segment as a Line for closed polyline', () => {
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)];
  const poly = new BasePolyline({ points });
  poly.flags.setFlagValue(1);

  const seg = poly.getClosestSegment(new Point(0, 5));
  expect(seg).toBeInstanceOf(Line);
  // The segment spans P3=(0,10) → P0=(0,0)
  expect(seg.points[0].x).toBeCloseTo(0);
  expect(seg.points[0].y).toBeCloseTo(10);
  expect(seg.points[1].x).toBeCloseTo(0);
  expect(seg.points[1].y).toBeCloseTo(0);
});

test('BasePolyline.areConsecutiveSegments returns false for non-adjacent segments on a closed polyline', () => {
  // 4-point closed poly: segments 1 and 3 are NOT adjacent (bug: old code returned true).
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)];
  const poly = new BasePolyline({ points });
  poly.flags.setFlagValue(1);

  expect(poly.areConsecutiveSegments(1, 3)).toBe(false);
});

test('BasePolyline.areConsecutiveSegments returns true for closing segment and its neighbours', () => {
  // 4-point closed poly, N=4 (closing segment index).
  // Seg N-1=3 ends at P3, closing seg starts at P3 → consecutive (diff=1).
  // Closing seg ends at P0, seg 1 starts at P0 → consecutive (wrap case).
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)];
  const poly = new BasePolyline({ points });
  poly.flags.setFlagValue(1);

  expect(poly.areConsecutiveSegments(3, 4)).toBe(true); // diff = 1
  expect(poly.areConsecutiveSegments(4, 1)).toBe(true); // wrap
  expect(poly.areConsecutiveSegments(1, 4)).toBe(true); // wrap (order reversed)
});

test('BasePolyline.closestPointOnSegment handles closing-segment index correctly', () => {
  // 4-point square, closing segment = P3=(0,10)→P0=(0,0).  Index = 4.
  // Closest point on that segment to (0, 5) should be (0, 5).
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)];
  const poly = new BasePolyline({ points });
  poly.flags.setFlagValue(1);

  const closest = poly.closestPointOnSegment(new Point(0, 5), 4);
  expect(closest.x).toBeCloseTo(0);
  expect(closest.y).toBeCloseTo(5);
});


test('Test BasePolyline.closestPoint', () => {
  const points = [new Point(100, 100), new Point(200, 100, -1), new Point(200, 50)];
  const polyline = new BasePolyline({ points: points });
  // line segment
  const point1 = new Point(150, 85);
  const closest1 = polyline.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(150);
  expect(closest1[0].y).toBeCloseTo(100);
  expect(closest1[1]).toBeCloseTo(15);

  // arc segment
  const point2 = new Point(210, 65);
  const closest2 = polyline.closestPoint(point2);
  expect(closest2[0].x).toBeCloseTo(217.6777);
  expect(closest2[0].y).toBeCloseTo(57.3223);
  expect(closest2[1]).toBeCloseTo(10.857);
});

test('Test BasePolyline.boundingBox', () => {
  let polyline = new BasePolyline({ points: [new Point(101, 102), new Point(201, 202)] });
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(201);
  expect(polyline.boundingBox().yMin).toBeCloseTo(102);
  expect(polyline.boundingBox().yMax).toBeCloseTo(202);

  polyline = new BasePolyline({ points: [new Point(101, 102), new Point(-201, 202)] });
  expect(polyline.boundingBox().xMin).toBeCloseTo(-201);
  expect(polyline.boundingBox().xMax).toBeCloseTo(101);
  expect(polyline.boundingBox().yMin).toBeCloseTo(102);
  expect(polyline.boundingBox().yMax).toBeCloseTo(202);


  let points = [new Point(101, 102), new Point(200, 102), new Point(200, 0)];
  // set the bulge
  points[1].bulge = -1;
  polyline = new BasePolyline({ points: points });
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(251);
  expect(polyline.boundingBox().yMin).toBeCloseTo(0);
  expect(polyline.boundingBox().yMax).toBeCloseTo(102);

  points = [new Point(101, 102), new Point(200, 102), new Point(200, 0)];
  // set the bulge
  points[1].bulge = -1;
  polyline = new BasePolyline({ points: points });
  expect(polyline.boundingBox().xMin).toBeCloseTo(101);
  expect(polyline.boundingBox().xMax).toBeCloseTo(251);
  expect(polyline.boundingBox().yMin).toBeCloseTo(0);
  expect(polyline.boundingBox().yMax).toBeCloseTo(102);
});

test('Test BasePolyline.getBulgeFromSegment', () => {
  // start point: 100,0
  // center: 100,50
  // radius: 50
  const points = [new Point(), new Point(100, 0)];
  const polyline = new BasePolyline({ points: points });

  // zero delta angle:
  // bulge: 0
  expect(polyline.getBulgeFromSegment(new Point(200, 0))).toBe(0);

  // delta angle: 22.5
  // included angle: 45
  // bulge:
  // end point: 135.3553, 14.6447
  let angle = Math.PI * 0.25;
  let bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, 14.6447))).toBeCloseTo(bulge);

  // delta angle: 22.5
  // included angle: 45
  // bulge:
  // end point: 135.3553, -14.6447
  angle = -Math.PI * 0.25;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, -14.6447))).toBeCloseTo(bulge);

  // delta angle: 45
  // included angle: 90
  // bulge:
  // end point: 150, 50
  angle = Math.PI * 0.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(150, 50))).toBeCloseTo(bulge);

  // delta angle: -45
  // included angle: 90
  // bulge:
  // end point: 150, -50
  angle = -Math.PI * 0.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(150, -50))).toBeCloseTo(bulge);

  // delta angle: 67.5
  // included angle: 135
  // bulge:
  // end point: 135.3553, 85.3553
  angle = Math.PI * 0.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, 85.3553))).toBeCloseTo(bulge);

  // delta angle: -67.5
  // included angle: 135
  // bulge:
  // end point: 135.3553, -85.3553
  angle = -Math.PI * 0.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(135.3553, -85.3553))).toBeCloseTo(bulge);

  // delta angle: 90
  // included angle: 180
  // bulge: 1
  // end point: 100,100
  angle = Math.PI;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(100, 100))).toBeCloseTo(bulge);

  // delta angle: -90
  // included angle: 180
  // bulge: -1
  // end point: 100, -100
  angle = -Math.PI;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(100, -100))).toBeCloseTo(bulge);

  // delta angle: 112.5
  // included angle: 225
  // bulge: ??
  // end point: 64.6447, 85.3553
  angle = Math.PI * 1.25;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, 85.3553))).toBeCloseTo(bulge);

  // delta angle: -112.5
  // included angle: 225
  // bulge: ??
  // end point: 64.6447, -85.3553
  angle = -Math.PI * 1.25;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, -85.3553))).toBeCloseTo(bulge);

  // delta angle: 135
  // included angle: 270
  // bulge: ??
  // end point: 50, 50
  angle = Math.PI * 1.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(50, 50))).toBeCloseTo(bulge);

  // delta angle: -135
  // included angle: 270
  // bulge: ??
  // end point: 50, -50
  angle = -Math.PI * 1.5;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(50, -50))).toBeCloseTo(bulge);

  // delta angle: 157.5
  // included angle: 315
  // bulge: ??
  // end point: 64.6447, 14.6447
  angle = Math.PI * 1.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, 14.6447))).toBeCloseTo(bulge);

  // delta angle: -157.5
  // included angle: 315
  // bulge: ??
  // end point: 64.6447, -14.6447
  angle = -Math.PI * 1.75;
  bulge = Math.tan(angle / 4);
  expect(polyline.getBulgeFromSegment(new Point(64.6447, -14.6447))).toBeCloseTo(bulge);
});

test('Test Polyline.dxf', () => {
  const points = [new Point(100, 100), new Point(200, 100), new Point(200, 50)];
  points[1].bulge = -1;
  const polyline = new Polyline({ handle: '1', points: points });
  let file = new File();
  polyline.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
LWPOLYLINE
5
1
100
AcDbEntity
100
AcDbPolyline
8
0
6
ByLayer
39
2
90
3
70
0
10
100
20
100
42
0
10
200
20
100
42
-1
10
200
20
50
42
0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newPolyline = new Polyline(polyline);
  file = new File();
  newPolyline.dxf(file);

  expect(file.contents).toEqual(dxfString);
});

test('Test Polyline.dxf R12', () => {
  const points = [new Point(100, 100), new Point(200, 100), new Point(200, 50)];
  points[1].bulge = -1;
  const polyline = new Polyline({ handle: '1', points: points });
  const file = new DXFFile('R12');
  polyline.dxf(file);

  const dxfString = `0
POLYLINE
8
0
6
ByLayer
66
1
70
0
0
VERTEX
8
0
10
100
20
100
30
0.0
42
0
0
VERTEX
8
0
10
200
20
100
30
0.0
42
-1
0
VERTEX
8
0
10
200
20
50
30
0.0
42
0
0
SEQEND
8
0
`;

  expect(file.contents).toEqual(dxfString);
});

test('Test BasePolyline.toPolylinePoints', () => {
  const points = [new Point(100, 100), new Point(200, 100), new Point(200, 50)];
  points[1].bulge = -1;
  const polyline = new BasePolyline({ points: points });

  const polylinePoints = polyline.toPolylinePoints();
  expect(polylinePoints[0].x).toBe(100);
  expect(polylinePoints[0].y).toBe(100);
  expect(polylinePoints[0].bulge).toBe(0);

  expect(polylinePoints[1].x).toBe(200);
  expect(polylinePoints[1].y).toBe(100);
  expect(polylinePoints[1].bulge).toBe(-1);

  expect(polylinePoints[2].x).toBe(200);
  expect(polylinePoints[2].y).toBe(50);
  expect(polylinePoints[2].bulge).toBe(0);
});

test('Test BasePolyline.toPolylinePoints returns defensive copy for open polyline', () => {
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10)];
  points[1].bulge = -1;
  const polyline = new BasePolyline({ points: points });

  const result = polyline.toPolylinePoints();
  // Mutate the returned array and one of the returned points
  result.reverse();
  result[0].bulge = 99;

  // Original this.points must be unaffected
  expect(polyline.points.length).toBe(3);
  expect(polyline.points[0].x).toBe(0);
  expect(polyline.points[1].bulge).toBe(-1);
});

test('Test BasePolyline.toPolylinePoints closed polyline appends closure point', () => {
  // A triangle closed via the Close command (flag bit 1 set, no duplicate
  // point stored in this.points).
  const points = [new Point(0, 0), new Point(10, 0), new Point(5, 10)];
  const flags = new Flags();
  flags.addValue(1); // closed flag
  const polyline = new BasePolyline({ points: points, flags: flags });

  const polylinePoints = polyline.toPolylinePoints();
  // Should have 4 points: the 3 vertices plus the closure point
  expect(polylinePoints.length).toBe(4);
  // Closure point matches the first point
  expect(polylinePoints[3].x).toBe(polylinePoints[0].x);
  expect(polylinePoints[3].y).toBe(polylinePoints[0].y);
  // The original this.points array is not mutated
  expect(polyline.points.length).toBe(3);
});

test('Polyline.execute handles Close option', async () => {
  const pt1 = new Point(0, 0);
  const pt2 = new Point(10, 0);
  const pt3 = new Point(10, 10);

  await withMockInput(DesignCore.Scene, [pt1, pt2, pt3, 'Close'], async () => {
    const polyline = new Polyline({});
    await polyline.execute();

    expect(polyline.points.length).toBe(3);
    expect(polyline.points[0]).toBe(pt1);
    expect(polyline.points[1]).toBe(pt2);
    expect(polyline.points[2]).toBe(pt3);
    expect(polyline.flags.hasFlag(1)).toBe(true);
  }, { extraMethods: { actionCommand: () => 0 } });
});

// ─── Polyline interactive options: Undo, Close, Arc, Line ───────────────

test('Polyline.execute supports Undo in line mode', async () => {
  const inputs = [new Point(0, 0), new Point(10, 0), new Point(20, 0), 'Undo', new Point(10, 10), 'Close'];
  await withMockInput(DesignCore.Scene, inputs, async () => {
    const polyline = new BasePolyline({});
    await polyline.execute();
    expect(polyline.points.length).toBe(3);
    expect(polyline.points[0]).toEqual(inputs[0]);
    expect(polyline.points[1]).toEqual(inputs[1]);
    expect(polyline.points[2]).toEqual(inputs[4]);
    expect(polyline.flags.hasFlag(1)).toBe(true); // closed
  }, { extraMethods: { actionCommand: () => {} } });
});

test('Polyline.execute supports Undo in arc mode', async () => {
  const inputs = [new Point(0, 0), new Point(10, 0), 'Arc', new Point(10, 10), new Point(20, 20), 'Undo', 'Line', new Point(10, 20), 'Close'];
  await withMockInput(DesignCore.Scene, inputs, async () => {
    const polyline = new BasePolyline({});
    await polyline.execute();
    expect(polyline.points.length).toBe(4);
    expect(polyline.points[0]).toEqual(inputs[0]);
    expect(polyline.points[1]).toEqual(inputs[1]);
    expect(polyline.points[2]).toEqual(inputs[3]);
    expect(polyline.points[3]).toEqual(inputs[7]);
    expect(polyline.flags.hasFlag(1)).toBe(true); // closed
    // After undo in arc mode
    expect(polyline.points[2].bulge).toBeCloseTo(0);
    expect(polyline.points[3].bulge).toBeCloseTo(0);
    // console.log(polyline.points);
  }, { extraMethods: { actionCommand: () => {} } });
});

test('Polyline.execute supports Arc/Line mode switching', async () => {
  const inputs = [new Point(0, 0), new Point(10, 0), 'Arc', new Point(10, 10), 'Line', new Point(20, 10), 'Close'];
  await withMockInput(DesignCore.Scene, inputs, async () => {
    const polyline = new BasePolyline({});
    await polyline.execute();
    expect(polyline.points.length).toBe(4);
    expect(polyline.points[0]).toEqual(inputs[0]);
    expect(polyline.points[1]).toEqual(inputs[1]);
    expect(polyline.points[2]).toEqual(inputs[3]);
    expect(polyline.points[3]).toEqual(inputs[5]);
    expect(polyline.flags.hasFlag(1)).toBe(true); // closed
    // Arc segment bulge should be set, line segment bulge should be 0
    expect(polyline.points[1].bulge).not.toBe(0);
    expect(polyline.points[2].bulge).toBe(0);
  }, { extraMethods: { actionCommand: () => {} } });
});

// ─── Auto-close when first and last point are the same ───────────────────────

test('BasePolyline constructor auto-closes when last point matches first', () => {
  // Simulate a polyline loaded with a redundant closing point (e.g. from DXF data)
  const points = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 0)];
  const polyline = new BasePolyline({ points });

  // Duplicate point should be removed and the closed flag set
  expect(polyline.points.length).toBe(3);
  expect(polyline.flags.hasFlag(1)).toBe(true);
});

test('BasePolyline constructor does not auto-close when fewer than 3 unique points', () => {
  // Only 2 unique points — not enough to form a closed polygon
  const points = [new Point(0, 0), new Point(0, 0)];
  const polyline = new BasePolyline({ points });

  expect(polyline.points.length).toBe(2);
  expect(polyline.flags.hasFlag(1)).toBe(false);
});

test('Polyline.execute auto-closes when start point is re-entered', async () => {
  const pt1 = new Point(0, 0);
  const pt2 = new Point(10, 0);
  const pt3 = new Point(10, 10);
  const pt4 = new Point(0, 0); // same as pt1

  // Track how many times actionCommand is called with data that has the closed flag set
  let autoClosedCount = 0;
  const mockActionCommand = (entity) => {
    // The constructor will have auto-closed the entity when pt4 == pt1
    if (entity.points.length === 4 && entity.points.at(-1).isSame(pt1)) {
      // simulate what the constructor does: a new entity created from this data would auto-close
      const rebuilt = new BasePolyline({ points: [...entity.points] });
      if (rebuilt.flags.hasFlag(1)) autoClosedCount++;
    }
    return 0;
  };

  await withMockInput(DesignCore.Scene, [pt1, pt2, pt3, pt4], async () => {
    const polyline = new BasePolyline({});
    await polyline.execute();
    // execute does not exit early — the duplicate point is on the instance
    expect(polyline.points.length).toBe(4);
    // The scene entity (rebuilt in actionCommand) would be auto-closed
    expect(autoClosedCount).toBe(1);
  }, { extraMethods: { actionCommand: mockActionCommand } });
});
