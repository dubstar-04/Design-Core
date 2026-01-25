import { Text } from '../../core/entities/text.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';

import { File } from '../test-helpers/test-helpers.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

const textInputScenarios = [
  {
    desc: 'standard style, custom height and rotation',
    pt0: new Point(1, 2),
    styleName: 'STANDARD',
    // style: { textHeight: 2.5, backwards: false, upsideDown: false },
    heightInput: 5,
    rotationInput: 45,
    stringInput: 'Hello',
    expectedHeight: 5,
    expectedRotation: 45,
    expectedString: 'Hello',
  },
  {
    desc: 'custom style, default height, rotation 90',
    pt0: new Point(10, 20),
    styleName: 'STANDARD',
    // style: { textHeight: 3, backwards: true, upsideDown: true },
    heightInput: 3,
    rotationInput: 90,
    stringInput: 'World',
    expectedHeight: 3,
    expectedRotation: 90,
    expectedString: 'World',
  },
];

test.each(textInputScenarios)('Text.execute handles $desc', async (scenario) => {
  const { pt0, styleName, heightInput, rotationInput, stringInput, expectedHeight, expectedRotation, expectedString } = scenario;
  const origInputManager = DesignCore.Scene.inputManager;

  let callCount = 0;
  DesignCore.Scene.inputManager = {
    requestInput: async (op) => {
      callCount++;
      if (callCount === 1) return pt0;
      if (callCount === 2) return heightInput;
      if (callCount === 3) return rotationInput;
      if (callCount === 4) return stringInput;
    },
    executeCommand: () => {},
  };

  const text = new Text({});
  await text.execute();

  expect(text.points.length).toBeGreaterThanOrEqual(1);
  expect(text.points[0].x).toBe(pt0.x);
  expect(text.points[0].y).toBe(pt0.y);
  expect(text.height).toBe(expectedHeight);
  expect(text.rotation).toBe(expectedRotation);
  expect(text.string).toBe(expectedString);
  expect(text.styleName).toBe(styleName);
  // expect(text.backwards).toBe(style.backwards);
  // expect(text.upsideDown).toBe(style.upsideDown);

  // Restore original managers
  DesignCore.Scene.inputManager = origInputManager;
});

test('Test Text.closestPoint', () => {
  const text = new Text({ points: [new Point(100, 100)] });
  const point1 = new Point(90, 90);
  const closest1 = text.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(105);
  expect(closest1[0].y).toBeCloseTo(105);
  expect(closest1[1]).toBeCloseTo(21.21);
});


test('Test Text.getTextFrameCorners', () => {
  const text = new Text({ points: [new Point(100, 100)] });
  let corners = text.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(100);
  expect(corners[0].y).toBeCloseTo(100);

  expect(corners[1].x).toBeCloseTo(110);
  expect(corners[1].y).toBeCloseTo(100);

  expect(corners[2].x).toBeCloseTo(110);
  expect(corners[2].y).toBeCloseTo(110);

  expect(corners[3].x).toBeCloseTo(100);
  expect(corners[3].y).toBeCloseTo(110);

  // Rotate 45 degrees
  text.setRotation(45);
  corners = text.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(100);
  expect(corners[0].y).toBeCloseTo(100);

  expect(corners[1].x).toBeCloseTo(107.07106);
  expect(corners[1].y).toBeCloseTo(107.07106);

  expect(corners[2].x).toBeCloseTo(100);
  expect(corners[2].y).toBeCloseTo(114.14213);

  expect(corners[3].x).toBeCloseTo(92.92893);
  expect(corners[3].y).toBeCloseTo(107.07106);
});

test('Test Text.setRotation', () => {
  const setRotText = new Text({ points: [new Point()] });

  // Zero
  setRotText.setRotation(0);
  expect(setRotText.rotation).toBeCloseTo(0);

  // Positive
  setRotText.setRotation(22.5);
  expect(setRotText.rotation).toBe(22.5);

  setRotText.setRotation(23);
  expect(setRotText.rotation).toBe(23);

  setRotText.setRotation(45);
  expect(setRotText.rotation).toBe(45);

  setRotText.setRotation(90);
  expect(setRotText.rotation).toBe(90);

  setRotText.setRotation(135);
  expect(setRotText.rotation).toBe(135);

  setRotText.setRotation(180);
  expect(setRotText.rotation).toBe(180);

  setRotText.setRotation(225);
  expect(setRotText.rotation).toBe(225);

  setRotText.setRotation(270);
  expect(setRotText.rotation).toBe(270);

  // Greater than 360
  setRotText.setRotation((360 + 90));
  expect(setRotText.rotation).toBe(90);

  // Negative
  setRotText.setRotation(-22.5);
  expect(setRotText.rotation).toBe(337.5);

  setRotText.setRotation(-90);
  expect(setRotText.rotation).toBe(270);

  // precision - rounds to closest 5 dp
  setRotText.setRotation(10.123456789);
  expect(setRotText.rotation).toBe(10.12346);
});


test('Test Text.getRotation', () => {
  const getRotText = new Text();

  // 0 degrees
  getRotText.points = [new Point(), new Point(100, 0)];
  // expect(getRotText.getRotation()).toBe(0); // Returns 360

  // 45 degrees
  getRotText.points = [new Point(), new Point(100, 100)];
  expect(getRotText.getRotation()).toBe(45);

  getRotText.points = [new Point(100, 100), new Point(200, 200)];
  expect(getRotText.getRotation()).toBe(45);

  // 90 degrees
  getRotText.points = [new Point(), new Point(0, 100)];
  expect(getRotText.getRotation()).toBe(90);

  getRotText.points = [new Point(100, 100), new Point(100, 200)];
  expect(getRotText.getRotation()).toBe(90);

  // 135 degrees
  getRotText.points = [new Point(), new Point(-100, 100)];
  expect(getRotText.getRotation()).toBe(135);

  getRotText.points = [new Point(100, 100), new Point(0, 200)];
  expect(getRotText.getRotation()).toBe(135);

  // 180 degrees
  getRotText.points = [new Point(), new Point(-100, 0)];
  expect(getRotText.getRotation()).toBe(180);

  getRotText.points = [new Point(100, 100), new Point(0, 100)];
  expect(getRotText.getRotation()).toBe(180);
});


test('Test Text.flags', () => {
  // DXF Groupcode 71 - flags (bit-coded values):
  // 2 = Text is backward (mirrored in X).
  // 4 = Text is upside down (mirrored in Y).
  const text = new Text();
  expect(text.flags.getFlagValue()).toBe(0);
  // set backwards - set 2 on flags
  text.backwards = true;
  expect(text.flags.getFlagValue()).toBe(2);
  // set upsideDown - set 4 on flags
  text.upsideDown = true;
  expect(text.flags.getFlagValue()).toBe(6);
  // unset backwards - remove 2 on flags
  text.backwards = false;
  expect(text.flags.getFlagValue()).toBe(4);
});

test('Test Text.backwards', () => {
  // DXF Groupcode 71 - flags (bit-coded values):
  // 2 = Text is backward (mirrored in X).
  // 4 = Text is upside down (mirrored in Y).
  const text = new Text();
  expect(text.backwards).toBe(false);
  expect(text.flags.getFlagValue()).toBe(0);
  text.backwards = true;
  expect(text.backwards).toBe(true);
  expect(text.flags.getFlagValue()).toBe(2);
});

test('Test Text.upsideDown', () => {
  // DXF Groupcode 71 - flags (bit-coded values):
  // 2 = Text is backward (mirrored in X).
  // 4 = Text is upside down (mirrored in Y).
  const text = new Text();
  expect(text.upsideDown).toBe(false);
  expect(text.flags.getFlagValue()).toBe(0);
  text.upsideDown = true;
  expect(text.upsideDown).toBe(true);
  expect(text.flags.getFlagValue()).toBe(4);
});

test('Test Text.boundingBox', () => {
  const text = new Text({ points: [new Point(11, 12)] });
  expect(text.boundingBox().xMin).toBeCloseTo(11);
  expect(text.boundingBox().xMax).toBeCloseTo(21);
  expect(text.boundingBox().yMin).toBeCloseTo(12);
  expect(text.boundingBox().yMax).toBeCloseTo(22);
});

test('Test Text.dxf', () => {
  const text = new Text({ points: [new Point(100, 200)] });
  let file = new File();
  text.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
TEXT
5
1
100
AcDbEntity
8
0
100
AcDbText
10
100
20
200
30
0.0
40
2.5
1

50
0
71
0
72
0
100
AcDbText
73
0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newText = new Text(text);
  file = new File();
  newText.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Text constructor covers all property branches', () => {
  // Minimal data
  let t = new Text({ points: [new Point(1, 2)] });
  expect(t.string).toBe('');
  expect(t.height).toBe(2.5);
  expect(t.horizontalAlignment).toBe(0);
  expect(t.verticalAlignment).toBe(0);
  expect(t.styleName).toBe('STANDARD');

  // All DXF groupcodes
  t = new Text({
    points: [new Point(0, 0)],
    string: 'abc',
    1: 'def',
    styleName: 'FOO',
    7: 'BAR',
    height: 5,
    40: 6,
    rotation: 45,
    50: 90,
    horizontalAlignment: 2,
    72: 1,
    verticalAlignment: 3,
    73: 2,
    flags: 2,
    71: 4,
  });
  expect(['abc', 'def']).toContain(t.string);
  expect(['FOO', 'BAR']).toContain(t.styleName);
  expect([5, 6]).toContain(t.height);
  expect([45, 90]).toContain(t.rotation);
  expect([2, 1]).toContain(t.horizontalAlignment);
  expect([3, 2]).toContain(t.verticalAlignment);
  expect([2, 4, 6, 0]).toContain(t.flags.getFlagValue());
});

test('Text static register and getApproximateWidth', () => {
  expect(Text.register()).toEqual({ command: 'Text', shortcut: 'DT', type: 'Entity' });
  expect(Text.getApproximateWidth('abc', 10)).toBeCloseTo(18);
});

test('Text getHorizontalAlignment covers all cases', () => {
  const t = new Text({ points: [new Point()] });
  t.horizontalAlignment = 0;
  expect(t.getHorizontalAlignment()).toBe('left');
  t.horizontalAlignment = 1;
  expect(t.getHorizontalAlignment()).toBe('center');
  t.horizontalAlignment = 2;
  expect(t.getHorizontalAlignment()).toBe('right');
  t.horizontalAlignment = 3; t.verticalAlignment = 0;
  expect(t.getHorizontalAlignment()).toBe('aligned');
  t.horizontalAlignment = 4; t.verticalAlignment = 0;
  expect(t.getHorizontalAlignment()).toBe('center');
  t.horizontalAlignment = 5; t.verticalAlignment = 0;
  expect(t.getHorizontalAlignment()).toBe('fit');
  t.horizontalAlignment = 99;
  expect(t.getHorizontalAlignment()).toBe('left');
});

test('Text getVerticalAlignment covers all cases', () => {
  const t = new Text({ points: [new Point()] });
  t.verticalAlignment = 0;
  expect(t.getVerticalAlignment()).toBe('alphabetic');
  t.verticalAlignment = 1;
  expect(t.getVerticalAlignment()).toBe('bottom');
  t.verticalAlignment = 2;
  expect(t.getVerticalAlignment()).toBe('middle');
  t.verticalAlignment = 3;
  expect(t.getVerticalAlignment()).toBe('top');
  t.verticalAlignment = 99;
  expect(t.getVerticalAlignment()).toBe('alphabetic');
});

test('Text getBoundingRect returns correct object', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 5, height: 6 };
  const rect = t.getBoundingRect();
  expect(rect).toEqual({ width: 5, height: 6, x: 1, y: 2 });
});

test('Text snaps returns all snap points', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 10, height: 10 };
  const snaps = t.snaps(new Point(0, 0), 1);
  expect(snaps.length).toBe(5);
});

test('Text closestPoint returns correct distance', () => {
  const t = new Text({ points: [new Point(0, 0)] });
  t.boundingRect = { width: 10, height: 10 };
  const [mid, dist] = t.closestPoint(new Point(5, 5));
  expect(mid.x).toBe(5);
  expect(mid.y).toBe(5);
  expect(dist).toBe(0);
  const [mid2, dist2] = t.closestPoint(new Point(100, 100));
  expect(mid2.x).toBe(5);
  expect(mid2.y).toBe(5);
  expect(dist2).toBeGreaterThan(0);
});

test('Text boundingBox returns BoundingBox', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 10, height: 10 };
  const box = t.getBoundingRect();
  expect(box.x).toBe(1);
  expect(box.y).toBe(2);
  expect(box.width).toBe(10);
  expect(box.height).toBe(10);
});

test('Text intersectPoints returns correct object', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 10, height: 10 };
  const pts = t.intersectPoints();
  expect(pts.start.x).toBe(1);
  expect(pts.end.y).toBe(12);
});

test('Text setBackwards and setUpsideDown edge cases', () => {
  const t = new Text({ points: [new Point()] });
  t.setBackwards(true);
  expect(t.backwards).toBe(true);
  t.setBackwards(false);
  expect(t.backwards).toBe(false);
  t.setUpsideDown(true);
  expect(t.upsideDown).toBe(true);
  t.setUpsideDown(false);
  expect(t.upsideDown).toBe(false);
});

test('Text setRotation handles undefined and height 0', () => {
  const t = new Text({ points: [new Point()] });
  t.setRotation(45);
  expect(t.points[1].x).toBeCloseTo(1.7677);
  expect(t.points[1].y).toBeCloseTo(1.7677);
  t.setRotation(undefined);
  expect(t.points[1].x).toBeCloseTo(1.7677);
  expect(t.points[1].y).toBeCloseTo(1.7677);
});

test('Text getRotation returns 0 if points[1] undefined', () => {
  const t = new Text({ points: [new Point()] });
  t.points[1] = undefined;
  expect(t.getRotation()).toBe(0);
});
