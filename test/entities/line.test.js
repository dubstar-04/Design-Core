import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { AddState, RemoveState } from '../../core/lib/stateManager.js';
import { File } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

const inputScenarios = [
  {
    desc: 'horizontal line',
    input1: new Point(0, 0),
    input2: new Point(10, 0),
    expectedLength: 10,
    expectedMid: { x: 5, y: 0 },
  },
  {
    desc: 'vertical line',
    input1: new Point(0, 0),
    input2: new Point(0, 10),
    expectedLength: 10,
    expectedMid: { x: 0, y: 5 },
  },
  {
    desc: 'diagonal line',
    input1: new Point(0, 0),
    input2: new Point(3, 4),
    expectedLength: 5,
    expectedMid: { x: 1.5, y: 2 },
  },
  {
    desc: 'same point',
    input1: new Point(2, 2),
    input2: new Point(2, 2),
    expectedLength: 0,
    expectedMid: { x: 2, y: 2 },
  },
];

test.each(inputScenarios)('Line.execute handles $desc', async ({ input1, input2, expectedLength, expectedMid }) => {
  // Mock DesignCore.Scene.inputManager.requestInput to return points
  const origInputManager = DesignCore.Scene.inputManager;

  let callCount = 0;
  DesignCore.Scene.inputManager = {
    requestInput: async () => {
      callCount++;
      if (callCount === 1) return input1;
      if (callCount === 2) return input2;
    },
    executeCommand: () => {},
  };

  const line = new Line({});
  await line.execute();

  expect(line.points.length).toBe(2);
  expect(line.points[0]).toBe(input1);
  expect(line.points[1]).toBe(input2);

  expect(line.length()).toBeCloseTo(expectedLength);
  expect(line.midPoint().x).toBeCloseTo(expectedMid.x);
  expect(line.midPoint().y).toBeCloseTo(expectedMid.y);

  // Restore original inputManager
  DesignCore.Scene.inputManager = origInputManager;
});

test('Test Line.closestPoint', () => {
  const points = [new Point(100, 100), new Point(200, 100)];
  const line = new Line({ points: points });
  // line segment
  const point1 = new Point(150, 85);
  const closest1 = line.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(150);
  expect(closest1[0].y).toBeCloseTo(100);
  expect(closest1[1]).toBeCloseTo(15);
});

test('Test Line.boundingBox', () => {
  let line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  expect(line.boundingBox().xMin).toBeCloseTo(101);
  expect(line.boundingBox().xMax).toBeCloseTo(201);
  expect(line.boundingBox().yMin).toBeCloseTo(102);
  expect(line.boundingBox().yMax).toBeCloseTo(202);

  line = new Line({ points: [new Point(101, 102), new Point(-201, 202)] });
  expect(line.boundingBox().xMin).toBeCloseTo(-201);
  expect(line.boundingBox().xMax).toBeCloseTo(101);
  expect(line.boundingBox().yMin).toBeCloseTo(102);
  expect(line.boundingBox().yMax).toBeCloseTo(202);
});

test('Test Line.dxf', () => {
  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  let file = new File();
  line.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
LINE
5
1
100
AcDbEntity
100
AcDbLine
8
0
10
101
20
102
30
0.0
11
201
21
202
31
0.0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newLine = new Line(line);
  file = new File();
  newLine.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Test Line.decompose', () => {
  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  const decomposedLine = line.decompose();
  expect(decomposedLine[0].x).toBe(101);
  expect(decomposedLine[0].y).toBe(102);
  expect(decomposedLine[0].bulge).toBe(0);

  expect(decomposedLine[1].x).toBe(201);
  expect(decomposedLine[1].y).toBe(202);
  expect(decomposedLine[1].bulge).toBe(0);
});


test('Test Line.trim returns remove and add states', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(100, 0)] });

  // intersections along the line
  const i1 = new Point(30, 0);
  const i2 = new Point(60, 0);

  // place mouse between intersections so trim targets that segment
  DesignCore.Mouse.pointOnScene = () => new Point(45, 0);

  const changes = line.trim([i1, i2]);

  expect(Array.isArray(changes)).toBe(true);
  expect(changes.length).toBeGreaterThanOrEqual(2);
  expect(changes[0]).toBeInstanceOf(AddState);
  expect(changes[1]).toBeInstanceOf(AddState);
  expect(changes[2]).toBeInstanceOf(RemoveState);
});


test('Test Line.trim returns empty array when provided with empty intersection list', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(100, 0)] });

  expect(line.trim([])).toEqual([]);
  expect(line.trim()).toEqual([]);
});
