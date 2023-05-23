import {Point} from '../../core/entities/point';
import {Text} from '../../core/entities/text';


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


test('Test Text.boundingBox', () => {
  const text = new Text({points: [new Point(11, 12)]});
  expect(text.boundingBox().xMin).toBeCloseTo(11);
  expect(text.boundingBox().xMax).toBeCloseTo(21);
  expect(text.boundingBox().yMin).toBeCloseTo(12);
  expect(text.boundingBox().yMax).toBeCloseTo(22);
});
