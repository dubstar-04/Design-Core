import {Core} from '../../core/core/core.js';
import {Arc} from '../../core/entities/arc.js';
import {Point} from '../../core/entities/point.js';
import {DesignCore} from '../../core/designCore.js';

import {File} from '../test-helpers/test-helpers.js';

const core = new Core();
const commandline = core.commandLine;

test('Test Arc.execute', async () => {
  expect(DesignCore.Scene.items.length).toBe(0);

  // Create arc - point, point, angle
  commandline.handleKeys('A');
  commandline.enterPressed();

  commandline.command = '0,0';
  commandline.update();
  commandline.enterPressed();


  commandline.command = '100,0';
  commandline.update();
  commandline.enterPressed();


  commandline.command = '100,100';
  commandline.update();
  commandline.enterPressed();

  // TODO: work out how to test user input for commands
  // commented out because it fails. looks like the commands above run before the execute command because its async
  // need to await enter pressed or similar without affecting user experience
  // expect(DesignCore.Scene.items.length).toBe(1);
});

test('Test Arc.startAngle', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)]});
  expect(arc.startAngle()).toBe(0);

  // clockwise 45 degrees 45 - 90
  arc = new Arc({points: [new Point(100, 100), new Point(170.71, 170.71), new Point(100, 200)]});
  expect(arc.startAngle()).toBeCloseTo(Math.PI / 4);
});

test('Test Arc.endAngle', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)]});
  expect(arc.endAngle()).toBe(Math.PI / 4);

  // clockwise 45 degrees 45 - 90
  arc = new Arc({points: [new Point(100, 100), new Point(170.71, 170.71), new Point(100, 200)]});
  expect(arc.endAngle()).toBeCloseTo(Math.PI / 2);
});

test('Test Arc.totalAngle', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 0});
  expect(arc.totalAngle).toBe(315);

  // clockwise 45 degrees 45 - 90
  arc = new Arc({points: [new Point(100, 100), new Point(170.71, 170.71), new Point(100, 200)], direction: 0});
  expect(arc.totalAngle).toBeCloseTo(315);

  // clockwise 90 degrees 0 - 90
  arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(100, 200)], direction: 0});
  expect(arc.totalAngle).toBeCloseTo(270);

  // clockwise 90 degrees 45 - 315
  arc = new Arc({points: [new Point(100, 100), new Point(170.71, 170.71), new Point(170.71, 29.29)], direction: 0});
  expect(arc.totalAngle).toBeCloseTo(90);

  // clockwise 180 degrees 0 - 180
  arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(0, 100)], direction: 0});
  expect(arc.totalAngle).toBeCloseTo(180);

  // clockwise 180 degrees 90 - 270
  arc = new Arc({points: [new Point(100, 100), new Point(100, 200), new Point(100, 0)], direction: 0});
  expect(arc.totalAngle).toBeCloseTo(180);

  // clockwise 360 degrees 0 - 360
  arc = new Arc({points: [new Point(100, 100), new Point(100, 200), new Point(100, 200)], direction: 0});
  expect(arc.totalAngle).toBeCloseTo(360);

  /* counter clockwise */

  // counter clockwise 45 degrees 0 - 45
  arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 1});
  expect(arc.totalAngle).toBeCloseTo(-45);

  // counter clockwise 315 degrees 45 - 0
  arc = new Arc({points: [new Point(100, 100), new Point(170.71, 170.71), new Point(200, 100)], direction: 1});
  expect(arc.totalAngle).toBeCloseTo(-315);

  // counter clockwise 180 degrees 270 - 90
  arc = new Arc({points: [new Point(100, 100), new Point(100, 0), new Point(100, 200)], direction: 1});
  expect(arc.totalAngle).toBeCloseTo(-180);

  // counter clockwise 135 degrees 270 - 45
  arc = new Arc({points: [new Point(100, 100), new Point(100, 0), new Point(170.71, 170.71)], direction: 1});
  expect(arc.totalAngle).toBeCloseTo(-135);

  // counter clockwise 270 degrees 45 - 315
  arc = new Arc({points: [new Point(100, 100), new Point(170.71, 170.71), new Point(170.71, 29.29)], direction: 1});
  expect(arc.totalAngle).toBeCloseTo(-270);

  // clockwise 0 degrees 0 - 360
  arc = new Arc({points: [new Point(100, 100), new Point(100, 200), new Point(100, 200)], direction: 1});
  expect(arc.totalAngle).toBeCloseTo(-360);
});


test('Test Arc.closestPoint', () => {
  // clockwise 315 degrees 0 - 45
  // direction: ccw > 0, cw <= 0
  let arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 0});
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
  arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 1});
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
  let arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)]});
  expect(arc.boundingBox().xMin).toBeCloseTo(170.71);
  expect(arc.boundingBox().xMax).toBeCloseTo(200);
  expect(arc.boundingBox().yMin).toBeCloseTo(100);
  expect(arc.boundingBox().yMax).toBeCloseTo(170.71);

  // anticlockwise 45 degrees: 0 - 45
  arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: -1});
  expect(arc.boundingBox().xMin).toBeCloseTo(0);
  expect(arc.boundingBox().xMax).toBeCloseTo(200);
  expect(arc.boundingBox().yMin).toBeCloseTo(0);
  expect(arc.boundingBox().yMax).toBeCloseTo(200);
});

test('Test Arc.dxf', () => {
  const arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)]});
  const file = new File();
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
});


test('Test Arc.decompose', () => {
  // clockwise 45 degrees 0 - 45
  let arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 0});
  let decomposedArc = arc.decompose();
  expect(decomposedArc[0].x).toBe(200);
  expect(decomposedArc[0].y).toBe(100);
  expect(decomposedArc[0].bulge).toBeCloseTo(-5.02734);

  expect(decomposedArc[1].x).toBeCloseTo(170.71);
  expect(decomposedArc[1].y).toBeCloseTo(170.71);
  expect(decomposedArc[1].bulge).toBeCloseTo(0);


  // counter clockwise 45 degrees 0 - 45
  arc = new Arc({points: [new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71)], direction: 1});
  decomposedArc = arc.decompose();
  expect(decomposedArc[0].x).toBe(200);
  expect(decomposedArc[0].y).toBe(100);
  expect(decomposedArc[0].bulge).toBeCloseTo(0.1989);

  expect(decomposedArc[1].x).toBeCloseTo(170.71);
  expect(decomposedArc[1].y).toBeCloseTo(170.71);
  expect(decomposedArc[1].bulge).toBeCloseTo(0);
});

