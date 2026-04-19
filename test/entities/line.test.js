import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { File, withMockInput } from '../test-helpers/test-helpers.js';

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
  await withMockInput(DesignCore.Scene, [input1, input2], async () => {
    const line = new Line({});
    await line.execute();

    expect(line.points.length).toBe(2);
    expect(line.points[0]).toBe(input1);
    expect(line.points[1]).toBe(input2);

    expect(line.length()).toBeCloseTo(expectedLength);
    expect(line.midPoint().x).toBeCloseTo(expectedMid.x);
    expect(line.midPoint().y).toBeCloseTo(expectedMid.y);
  });
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
  const line = new Line({ handle: '1', points: [new Point(101, 102), new Point(201, 202)] });
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
6
ByLayer
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
39
1
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newLine = new Line(line);
  file = new File();
  newLine.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Test Line.toPolylinePoints', () => {
  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  const linePoints = line.toPolylinePoints();
  expect(linePoints[0].x).toBe(101);
  expect(linePoints[0].y).toBe(102);
  expect(linePoints[0].bulge).toBe(0);

  expect(linePoints[1].x).toBe(201);
  expect(linePoints[1].y).toBe(202);
  expect(linePoints[1].bulge).toBe(0);
});


test('Test Line.draw calls renderer.drawShape with toPolylinePoints', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(10, 5)] });
  let capturedPoints;
  const mockRenderer = {
    drawShape(points) {
      capturedPoints = points;
    },
  };
  line.draw(mockRenderer);
  expect(capturedPoints).toEqual(line.toPolylinePoints());
});



test('Line.execute handles Close option', async () => {
  const pt1 = new Point(0, 0);
  const pt2 = new Point(10, 0);
  const pt3 = new Point(10, 10);

  await withMockInput(DesignCore.Scene, [pt1, pt2, pt3, 'Close'], async () => {
    const line = new Line({});
    await line.execute();

    expect(line.points.length).toBe(4);
    expect(line.points[0]).toBe(pt1);
    expect(line.points[1]).toBe(pt2);
    expect(line.points[2]).toBe(pt3);
    expect(line.points[3]).toBe(pt1);
  }, { extraMethods: { actionCommand: () => {} } });
});

test('Line.fromPolylinePoints round-trip preserves points exactly', () => {
  const line = new Line({ points: [new Point(3, 7), new Point(15, -4)] });
  const polyPts = line.toPolylinePoints();
  const rebuilt = new Line({});
  rebuilt.fromPolylinePoints(polyPts);
  expect(rebuilt.points[0].x).toBe(3);
  expect(rebuilt.points[0].y).toBe(7);
  expect(rebuilt.points[1].x).toBe(15);
  expect(rebuilt.points[1].y).toBe(-4);
});

test('Line.snaps returns two end snaps at both endpoints', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const endSnaps = line.snaps(new Point(5, 0), 100).filter((s) => s.type === 'end');
  expect(endSnaps.length).toBe(2);
  expect(endSnaps.some((s) => s.snapPoint.x === 0 && s.snapPoint.y === 0)).toBe(true);
  expect(endSnaps.some((s) => s.snapPoint.x === 10 && s.snapPoint.y === 0)).toBe(true);
});

test('Line.snaps returns mid snap at midpoint', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const midSnaps = line.snaps(new Point(5, 0), 100).filter((s) => s.type === 'mid');
  expect(midSnaps.length).toBe(1);
  expect(midSnaps[0].snapPoint.x).toBe(5);
  expect(midSnaps[0].snapPoint.y).toBe(0);
});

test('Line.snaps nearest fires when mouse is close to the line', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  // mouse at (5, 0.5): distance to line = 0.5; delta=10 so delta/10=1; 0.5 < 1 → fires
  const snaps = line.snaps(new Point(5, 0.5), 10);
  expect(snaps.filter((s) => s.type === 'nearest').length).toBe(1);
});

test('Line.snaps nearest does not fire when mouse is too far from the line', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  // mouse at (5, 20): distance to line = 20; delta=1 so delta/10=0.1; 20 > 0.1 → no fire
  const snaps = line.snaps(new Point(5, 20), 1);
  expect(snaps.filter((s) => s.type === 'nearest').length).toBe(0);
});

test('Line.snaps perpendicular fires when foot falls on the segment', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const savedInputPoint = DesignCore.Scene.inputManager.inputPoint;
  // fromPoint=(5,5): foot of perpendicular = (5,0), which IS on the segment
  DesignCore.Scene.inputManager.inputPoint = new Point(5, 5);
  const snaps = line.snaps(new Point(5, 0), 100);
  const perpSnaps = snaps.filter((s) => s.type === 'perpendicular');
  expect(perpSnaps.length).toBe(1);
  expect(perpSnaps[0].snapPoint.x).toBeCloseTo(5);
  expect(perpSnaps[0].snapPoint.y).toBeCloseTo(0);
  DesignCore.Scene.inputManager.inputPoint = savedInputPoint;
});

test('Line.snaps perpendicular does not fire when foot falls off the segment', () => {
  const line = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const savedInputPoint = DesignCore.Scene.inputManager.inputPoint;
  // fromPoint=(20,5): foot = (20,0), which is BEYOND the segment end at (10,0)
  DesignCore.Scene.inputManager.inputPoint = new Point(20, 5);
  const snaps = line.snaps(new Point(5, 0), 100);
  expect(snaps.filter((s) => s.type === 'perpendicular').length).toBe(0);
  DesignCore.Scene.inputManager.inputPoint = savedInputPoint;
});
