import { Core } from '../../core/core/core.js';
import { Arc } from '../../core/entities/arc.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';

import { File } from '../test-helpers/test-helpers.js';

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
  const origInputManager = DesignCore.Scene.inputManager;
  let callCount = 0;
  DesignCore.Scene.inputManager = {
    requestInput: async () => {
      callCount++;
      if (callCount === 1) return input1;
      if (callCount === 2) return input2;
      if (callCount === 3) return input3;
      return input3;
    },
    executeCommand: () => {},
  };

  const arc = new Arc({});
  await arc.execute();

  expect(arc.points.length).toBe(3);
  expect(arc.points[0]).toBe(input1);
  expect(arc.points[1]).toBe(input2);
  const expPt2 = expectedPt2(input1, input2, input3);
  expect(arc.points[2].x).toBeCloseTo(expPt2.x);
  expect(arc.points[2].y).toBeCloseTo(expPt2.y);

  // if (checkAngles) {
  expect(arc.startAngle()).toBe(expectedStart);
  expect(arc.endAngle()).toBeCloseTo(expectedEnd);
  // }

  // Restore original inputManager
  DesignCore.Scene.inputManager = origInputManager;
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
  const arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)] });
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
10
100
20
100
30
0.0
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


test('Test Arc.decompose', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 0 });
  let decomposedArc = arc.decompose();
  expect(decomposedArc[0].x).toBe(200);
  expect(decomposedArc[0].y).toBe(100);
  expect(decomposedArc[0].bulge).toBeCloseTo(-5.02734);

  expect(decomposedArc[1].x).toBeCloseTo(170.71);
  expect(decomposedArc[1].y).toBeCloseTo(170.71);
  expect(decomposedArc[1].bulge).toBeCloseTo(0);


  // counter clockwise 45 degrees 0 - 45
  arc = new Arc({ points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 1 });
  decomposedArc = arc.decompose();
  expect(decomposedArc[0].x).toBe(200);
  expect(decomposedArc[0].y).toBe(100);
  expect(decomposedArc[0].bulge).toBeCloseTo(0.1989);

  expect(decomposedArc[1].x).toBeCloseTo(170.71);
  expect(decomposedArc[1].y).toBeCloseTo(170.71);
  expect(decomposedArc[1].bulge).toBeCloseTo(0);
});

test('Arc constructor handles missing/invalid data', () => {
  // No points
  expect(() => new Arc({})).not.toThrow();
  // Invalid points
  expect(() => new Arc({ points: [null, undefined, {}] })).not.toThrow();
});

