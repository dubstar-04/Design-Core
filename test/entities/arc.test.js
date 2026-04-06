import { jest } from '@jest/globals';
import { Strings } from '../../core/lib/strings.js';

describe('Arc.execute input validation and notifications', () => {
  let notifySpy;
  beforeEach(() => {
    notifySpy = jest.spyOn(DesignCore.Core, 'notify').mockImplementation(() => {});
  });
  afterEach(() => {
    notifySpy.mockRestore();
  });

  test('Notifies when arc angle is too small (point input)', async () => {
    // Three points nearly colinear (angle ~0)
    const input1 = new Point(0, 0);
    const input2 = new Point(10, 0);
    const input3 = new Point(20, 0.0001); // Very small angle
    await withMockInput(DesignCore.Scene, [input1, input2, input3, new Point(10, 10)], async () => {
      const arc = new Arc({});
      await arc.execute();
      expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
      expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.MINVALUE));
    });
  });

  test('Notifies when arc angle is too small (angle input)', async () => {
    const input1 = new Point(0, 0);
    const input2 = new Point(10, 0);
    const input3 = 0.5; // degrees, too small
    await withMockInput(DesignCore.Scene, [input1, input2, input3, 90], async () => {
      const arc = new Arc({});
      await arc.execute();
      expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
      expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.MINVALUE));
    });
  });

  test('Notifies on invalid number input', async () => {
    const input1 = new Point(0, 0);
    const input2 = new Point(10, 0);
    const input3 = 'not-a-number';
    await withMockInput(DesignCore.Scene, [input1, input2, input3, 90], async () => {
      const arc = new Arc({});
      await arc.execute();
      expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INPUT));
    });
  });

  test('Notifies on invalid point input (duplicate)', async () => {
    const input1 = new Point(0, 0);
    const input2 = new Point(10, 0);
    const input3 = new Point(0, 0); // Same as center
    await withMockInput(DesignCore.Scene, [input1, input2, input3, new Point(10, 10)], async () => {
      const arc = new Arc({});
      await arc.execute();
      expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDPOINT));
    });
  });

  test('Accepts valid input and does not notify errors', async () => {
    const input1 = new Point(0, 0);
    const input2 = new Point(10, 0);
    const input3 = new Point(10, 10);
    await withMockInput(DesignCore.Scene, [input1, input2, input3], async () => {
      const arc = new Arc({});
      await arc.execute();
      // Should not notify any errors
      expect(notifySpy).not.toHaveBeenCalled();
    });
  });
});
import { Core } from '../../core/core/core.js';
import { Arc } from '../../core/entities/arc.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { AddState, RemoveState } from '../../core/lib/stateManager.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

const arcInputScenarios = [
  {
    desc: 'two points and an angle',
    input1: new Point(0, 0),
    input2: new Point(10, 0),
    input3: 90, // degrees
    expectedPt2: (input1, input2) => input2.rotate(input1, Math.PI / 2),
    expectedStart: 0,
    expectedEnd: Math.PI / 2,
  },
  {
    desc: 'three points',
    input1: new Point(0, 0),
    input2: new Point(10, 0),
    input3: new Point(10, 10),
    expectedPt2: (input1, input2, input3) => input3,
    expectedStart: 0,
    expectedEnd: Math.PI / 4,
  },
];

test.each(arcInputScenarios)('Arc.execute handles $desc', async (scenario) => {
  const { input1, input2, input3, expectedPt2, expectedStart, expectedEnd } = scenario;

  await withMockInput(DesignCore.Scene, [input1, input2, input3, input3], async () => {
    const arc = new Arc({});
    await arc.execute();

    expect(arc.points.length).toBe(3);
    expect(arc.points[0]).toBe(input1);
    expect(arc.points[1]).toBe(input2);
    const expPt2 = expectedPt2(input1, input2, input3);
    expect(arc.points[2].x).toBeCloseTo(expPt2.x);
    expect(arc.points[2].y).toBeCloseTo(expPt2.y);

    expect(arc.startAngle()).toBe(expectedStart);
    expect(arc.endAngle()).toBeCloseTo(expectedEnd);
  });
});

test('Test Arc.startAngle', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)] });
  expect(arc.startAngle()).toBe(0);

  // clockwise 45 degrees 45 - 90
  arc = new Arc({ points: [new Point(100, 100), new Point(170.71, 170.71), new Point(100, 200)] });
  expect(arc.startAngle()).toBeCloseTo(Math.PI / 4);
});

test('Test Arc.endAngle', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)] });
  expect(arc.endAngle()).toBe(Math.PI / 4);

  // clockwise 45 degrees 45 - 90
  arc = new Arc({ points: [new Point(100, 100), new Point(170.71, 170.71), new Point(100, 200)] });
  expect(arc.endAngle()).toBeCloseTo(Math.PI / 2);
});

test('Test Arc.totalAngle', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 0 });
  expect(arc.totalAngle).toBe(315);

  // clockwise 45 degrees 45 - 90
  arc = new Arc({ points: [new Point(100, 100), new Point(170.71, 170.71), new Point(100, 200)], direction: 0 });
  expect(arc.totalAngle).toBeCloseTo(315);

  // clockwise 90 degrees 0 - 90
  arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(100, 200)], direction: 0 });
  expect(arc.totalAngle).toBeCloseTo(270);

  // clockwise 90 degrees 45 - 315
  arc = new Arc({ points: [new Point(100, 100), new Point(170.71, 170.71), new Point(170.71, 29.29)], direction: 0 });
  expect(arc.totalAngle).toBeCloseTo(90);

  // clockwise 180 degrees 0 - 180
  arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(0, 100)], direction: 0 });
  expect(arc.totalAngle).toBeCloseTo(180);

  // clockwise 180 degrees 90 - 270
  arc = new Arc({ points: [new Point(100, 100), new Point(100, 200), new Point(100, 0)], direction: 0 });
  expect(arc.totalAngle).toBeCloseTo(180);

  // clockwise 360 degrees 0 - 360
  arc = new Arc({ points: [new Point(100, 100), new Point(100, 200), new Point(100, 200)], direction: 0 });
  expect(arc.totalAngle).toBeCloseTo(360);

  /* counter clockwise */

  // counter clockwise 45 degrees 0 - 45
  arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 1 });
  expect(arc.totalAngle).toBeCloseTo(-45);

  // counter clockwise 315 degrees 45 - 0
  arc = new Arc({ points: [new Point(100, 100), new Point(170.71, 170.71), new Point(200, 100)], direction: 1 });
  expect(arc.totalAngle).toBeCloseTo(-315);

  // counter clockwise 180 degrees 270 - 90
  arc = new Arc({ points: [new Point(100, 100), new Point(100, 0), new Point(100, 200)], direction: 1 });
  expect(arc.totalAngle).toBeCloseTo(-180);

  // counter clockwise 135 degrees 270 - 45
  arc = new Arc({ points: [new Point(100, 100), new Point(100, 0), new Point(170.71, 170.71)], direction: 1 });
  expect(arc.totalAngle).toBeCloseTo(-135);

  // counter clockwise 270 degrees 45 - 315
  arc = new Arc({ points: [new Point(100, 100), new Point(170.71, 170.71), new Point(170.71, 29.29)], direction: 1 });
  expect(arc.totalAngle).toBeCloseTo(-270);

  // clockwise 0 degrees 0 - 360
  arc = new Arc({ points: [new Point(100, 100), new Point(100, 200), new Point(100, 200)], direction: 1 });
  expect(arc.totalAngle).toBeCloseTo(-360);
});


test('Test Arc.closestPoint', () => {
  // clockwise 315 degrees 0 - 45
  // direction: ccw > 0, cw <= 0
  let arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 0 });
  // inside
  let point = new Point(128.3525, 169.4344);
  let closest = arc.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(137.8);
  expect(closest[0].y).toBeCloseTo(192.578);
  expect(closest[1]).toBeCloseTo(25);

  // outside
  point = new Point(147.2541, 215.7240);
  closest = arc.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(137.8);
  expect(closest[0].y).toBeCloseTo(192.578);
  expect(closest[1]).toBeCloseTo(25);

  // counter clockwise 45 degrees 0 - 45
  // direction: ccw > 0, cw <= 0
  arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 1 });
  // inside
  point = new Point(128.3525, 169.4344);
  closest = arc.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(point.x);
  expect(closest[0].y).toBeCloseTo(point.y);
  expect(closest[1]).toBeCloseTo(Infinity);

  // outside
  point = new Point(147.2541, 215.7240);
  closest = arc.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(point.x);
  expect(closest[0].y).toBeCloseTo(point.y);
  expect(closest[1]).toBeCloseTo(Infinity);
});

test('Test Arc.boundingBox', () => {
  // clockwise 315 degrees 0 - 45
  let arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)] });
  expect(arc.boundingBox().xMin).toBeCloseTo(170.71);
  expect(arc.boundingBox().xMax).toBeCloseTo(200);
  expect(arc.boundingBox().yMin).toBeCloseTo(100);
  expect(arc.boundingBox().yMax).toBeCloseTo(170.71);

  // anticlockwise 45 degrees: 0 - 45
  arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: -1 });
  expect(arc.boundingBox().xMin).toBeCloseTo(0);
  expect(arc.boundingBox().xMax).toBeCloseTo(200);
  expect(arc.boundingBox().yMin).toBeCloseTo(0);
  expect(arc.boundingBox().yMax).toBeCloseTo(200);
});

test('Test Arc.dxf', () => {
  const arc = new Arc({ handle: '1', points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)] });
  let file = new File();
  arc.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
ARC
5
1
100
AcDbEntity
100
AcDbCircle
8
0
6
ByLayer
10
100
20
100
30
0.0
39
2
40
100
100
AcDbArc
50
0
51
45
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newArc = new Arc(arc);
  file = new File();
  newArc.dxf(file);
  expect(file.contents).toEqual(dxfString);
});


test('Test Arc.toPolylinePoints', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 0 });
  let arcPoints = arc.toPolylinePoints();
  expect(arcPoints[0].x).toBe(200);
  expect(arcPoints[0].y).toBe(100);
  expect(arcPoints[0].bulge).toBeCloseTo(-5.02734);

  expect(arcPoints[1].x).toBeCloseTo(170.71);
  expect(arcPoints[1].y).toBeCloseTo(170.71);
  expect(arcPoints[1].bulge).toBeCloseTo(0);


  // counter clockwise 45 degrees 0 - 45
  arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 1 });
  arcPoints = arc.toPolylinePoints();
  expect(arcPoints[0].x).toBe(200);
  expect(arcPoints[0].y).toBe(100);
  expect(arcPoints[0].bulge).toBeCloseTo(0.1989);

  expect(arcPoints[1].x).toBeCloseTo(170.71);
  expect(arcPoints[1].y).toBeCloseTo(170.71);
  expect(arcPoints[1].bulge).toBeCloseTo(0);
});

test('Arc constructor handles missing/invalid data', () => {
  // No points
  expect(() => new Arc({})).not.toThrow();
  // Invalid points
  expect(() => new Arc({ points: [null, undefined, {}] })).not.toThrow();
});

test('Arc.trim returns empty for no intersections', () => {
  const arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)] });
  expect(arc.trim([])).toEqual([]);
  expect(arc.trim()).toEqual([]);
});


test('Arc.trim returns remove + add states when trimming between two intersections', () => {
  const arc = new Arc({ points: [new Point(), new Point(10, 0), new Point(-10, 0)], handle: 'B2' });
  // Intersection points on the arc.
  const i1 = new Point(7.71, 7.71);
  const i2 = new Point(-7.71, 7.71);
  const intersections = [i1, i2];

  // set the mouse position to mid point of the arc
  DesignCore.Mouse.pointOnScene = () => new Point(0, 10);

  const changes = arc.trim(intersections);

  expect(Array.isArray(changes)).toBe(true);
  expect(changes.length).toBeGreaterThanOrEqual(2);

  expect(changes[0]).toBeInstanceOf(AddState);
  expect(changes[1]).toBeInstanceOf(AddState);
  expect(changes[2]).toBeInstanceOf(RemoveState);

  // Verify trimmed arcs have unique handles (not the original)
  expect(changes[0].entity.handle).toBeUndefined();
  expect(changes[1].entity.handle).toBeUndefined();

  expect(changes[0].entity.points[0].x).toBe(0);
  expect(changes[0].entity.points[0].y).toBe(0);

  expect(changes[0].entity.points[1].x).toBeCloseTo(10);
  expect(changes[0].entity.points[1].y).toBeCloseTo(0);
  expect(changes[0].entity.points[2].x).toBeCloseTo(7.71);
  expect(changes[0].entity.points[2].y).toBeCloseTo(7.71);

  expect(changes[1].entity.points[1].x).toBeCloseTo(-7.71);
  expect(changes[1].entity.points[1].y).toBeCloseTo(7.71);
  expect(changes[1].entity.points[2].x).toBe(-10);
  expect(changes[1].entity.points[2].y).toBe(0);
});

test('Arc.getRadius returns the arc radius', () => {
  const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
  expect(arc.getRadius()).toBe(10);
});

test('Arc constructor loads from DXF group codes', () => {
  const arc = new Arc({ points: [new Point(100, 100)], 40: 50, 50: 0, 51: 90 });
  expect(arc.radius).toBe(50);
  expect(arc.points[1].x).toBeCloseTo(150);
  expect(arc.points[1].y).toBeCloseTo(100);
  expect(arc.points[2].x).toBeCloseTo(100);
  expect(arc.points[2].y).toBeCloseTo(150);
});

test('Arc constructor loads direction from data', () => {
  const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)], direction: -1 });
  expect(arc.direction).toBe(-1);
});

test('Arc.toPolylinePoints handles a full circle (360 degrees)', () => {
  const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 0)], direction: 1 });
  const pts = arc.toPolylinePoints();
  expect(pts).toHaveLength(3);
  expect(pts[0].bulge).toBe(1);
  expect(pts[1].bulge).toBe(1);
  expect(pts[2].x).toBeCloseTo(pts[0].x);
  expect(pts[2].y).toBeCloseTo(pts[0].y);
});

test('Arc.preview does not throw with 1, 2 or 3 points', () => {
  const origCreate = DesignCore.Scene.tempEntities.create;
  const origMouse = DesignCore.Mouse.pointOnScene;
  DesignCore.Scene.tempEntities.create = () => {};
  DesignCore.Mouse.pointOnScene = () => new Point(5, 5);

  const arc1 = new Arc({});
  arc1.points = [new Point(0, 0)];
  expect(() => arc1.preview()).not.toThrow();

  const arc2 = new Arc({});
  arc2.points = [new Point(0, 0), new Point(10, 0)];
  expect(() => arc2.preview()).not.toThrow();

  const arc3 = new Arc({});
  arc3.points = [new Point(0, 0), new Point(10, 0), new Point(0, 10)];
  expect(() => arc3.preview()).not.toThrow();

  DesignCore.Scene.tempEntities.create = origCreate;
  DesignCore.Mouse.pointOnScene = origMouse;
});

test('Arc.draw does not throw (ccw and cw)', () => {
  const ctx = { arc: jest.fn(), stroke: jest.fn() };
  const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)], direction: 1 });
  expect(() => arc.draw(ctx, 1)).not.toThrow();
  expect(ctx.arc).toHaveBeenCalledTimes(1);
  expect(ctx.stroke).toHaveBeenCalledTimes(1);

  const ctx2 = { arc: jest.fn(), stroke: jest.fn() };
  const arcCw = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)], direction: -1 });
  expect(() => arcCw.draw(ctx2, 1)).not.toThrow();
});

test('Arc.snaps returns end and centre snap points', () => {
  const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)], direction: 1 });

  const snaps = arc.snaps(new Point(5, 5), 10);
  expect(snaps.filter((s) => s.type === 'end').length).toBe(2);
  expect(snaps.filter((s) => s.type === 'centre').length).toBe(1);

  // Arc.closestPoint requires closest[2] === true which is never satisfied, so no nearest snap
  const nearSnaps = arc.snaps(new Point(10, 0), 100);
  expect(nearSnaps.filter((s) => s.type === 'nearest').length).toBe(0);
});

test('Arc.execute handles negative angle (clockwise)', async () => {
  const input1 = new Point(0, 0);
  const input2 = new Point(10, 0);
  const input3 = -90; // degrees — clockwise
  await withMockInput(DesignCore.Scene, [input1, input2, input3], async () => {
    const arc = new Arc({});
    await arc.execute();
    expect(arc.points.length).toBe(3);
    expect(arc.direction).toBe(-1);
  });
});

test('Arc.execute notifies on angle > 360', async () => {
  const notifySpy = jest.spyOn(DesignCore.Core, 'notify').mockImplementation(() => {});
  await withMockInput(DesignCore.Scene, [new Point(0, 0), new Point(10, 0), 361, 90], async () => {
    const arc = new Arc({});
    await arc.execute();
    expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Error.INVALIDNUMBER));
  });
  notifySpy.mockRestore();
});

test('Arc.trim returns empty when only intersection is at an endpoint', () => {
  const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(-10, 0)] });
  // intersection exactly at the start point — filtered out, nothing to trim
  const changes = arc.trim([new Point(10, 0)]);
  expect(changes).toEqual([]);
});

test('Arc.fromPolylinePoints round-trip preserves centre, radius and angles', () => {
  const arc = new Arc({ points: [new Point(0, 0), new Point(10, 0), new Point(0, 10)] });
  arc.radius = 10;
  const polyPts = arc.toPolylinePoints();
  const rebuilt = new Arc({});
  rebuilt.fromPolylinePoints(polyPts);
  expect(rebuilt.points[0].x).toBeCloseTo(0, 10);
  expect(rebuilt.points[0].y).toBeCloseTo(0, 10);
  expect(rebuilt.radius).toBeCloseTo(10, 10);
  expect(rebuilt.startAngle()).toBeCloseTo(arc.startAngle(), 10);
  expect(rebuilt.endAngle()).toBeCloseTo(arc.endAngle(), 10);
});

test('Arc.fromPolylinePoints precision drift is negligible', () => {
  const arc = new Arc({ points: [new Point(50, 50), new Point(50, 50).project(0.7, 30), new Point(50, 50).project(2.1, 30)] });
  arc.radius = 30;
  const polyPts = arc.toPolylinePoints();
  const rebuilt = new Arc({});
  rebuilt.fromPolylinePoints(polyPts);
  const centerDrift = Math.hypot(rebuilt.points[0].x - arc.points[0].x, rebuilt.points[0].y - arc.points[0].y);
  expect(centerDrift).toBeLessThan(1e-10);
  expect(Math.abs(rebuilt.radius - arc.radius)).toBeLessThan(1e-10);
});

