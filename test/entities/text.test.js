import {Point} from '../../core/entities/point';
import {Text} from '../../core/entities/text';

import {File} from '../test-helpers/test-helpers.js';

test('Test Text.closestPoint', () => {
  const text = new Text({points: [new Point(100, 100)]});
  const point1 = new Point(90, 90);
  const closest1 = text.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(105);
  expect(closest1[0].y).toBeCloseTo(105);
  expect(closest1[1]).toBeCloseTo(21.21);
});

test('Test Text.setRotation', () => {
  const setRotText = new Text({points: [new Point()]});

  // Zero
  setRotText.setRotation(0);
  expect(setRotText.rotation).toBe(0);

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
  const text = new Text({points: [new Point(11, 12)]});
  expect(text.boundingBox().xMin).toBeCloseTo(11);
  expect(text.boundingBox().xMax).toBeCloseTo(21);
  expect(text.boundingBox().yMin).toBeCloseTo(12);
  expect(text.boundingBox().yMax).toBeCloseTo(22);
});

test('Test Text.dxf', () => {
  const text = new Text({points: [new Point(100, 200)]});
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
