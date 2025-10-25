import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';

import { File } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

test('Line.execute creates points from user input', async () => {
  // Mock DesignCore.Scene.inputManager.requestInput to return points
  const origInputManager = DesignCore.Scene.inputManager;

  const pt0 = new Point(0, 0);
  const pt1 = new Point(10, 0);

  let callCount = 0;
  DesignCore.Scene.inputManager = {
    requestInput: async () => {
      callCount++;
      if (callCount === 1) return pt0;
      if (callCount === 2) return pt1;
      return pt2;
    },
    executeCommand: () => {},
  };

  const line = new Line({});
  await line.execute();

  expect(line.points.length).toBe(2);
  expect(line.points[0]).toBe(pt0);
  expect(line.points[1]).toBe(pt1);

  expect(line.length()).toBe(10);
  expect(line.midPoint().x).toBe(5);
  expect(line.midPoint().y).toBe(0);

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
