import {Core} from '../../core/core.js';
import {Arc} from '../../core/entities/arc.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();
const commandline = Core.CommandLine;

test('Test Arc.execute', () => {
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
  // expect(Core.Scene.items.length).toBe(1),
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

test('Test Arc.closestPoint', () => {
  // clockwise 45 degrees 0 - 45
  const arc = new Arc({points: [new Point(100, 100), new Point(170.71, 170.71), new Point(200, 100)]});
  // inside
  const point1 = new Point(128.3525, 169.4344);
  const closest1 = arc.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(137.8);
  expect(closest1[0].y).toBeCloseTo(192.578);
  expect(closest1[1]).toBeCloseTo(25);

  // outside
  const point2 = new Point(147.2541, 215.7240);
  const closest2 = arc.closestPoint(point2);
  expect(closest2[0].x).toBeCloseTo(137.8);
  expect(closest2[0].y).toBeCloseTo(192.578);
  expect(closest2[1]).toBeCloseTo(25);
});

test('Test Arc.boundingBox', () => {
  // clockwise 45 degrees 45 - 0
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
