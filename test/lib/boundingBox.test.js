import {Point} from '../../core/entities/point';
import {BoundingBox} from '../../core/lib/boundingBox';

const firstCorner = new Point(101, 102);
const secondCorner = new Point(201, 202);
const bb = new BoundingBox(firstCorner, secondCorner);

test('Test BoundingBox.xMin', () => {
  expect(bb.xMin).toBe(101);
});

test('Test BoundingBox.xMax', () => {
  expect(bb.xMax).toBe(201);
});

test('Test BoundingBox.yMin', () => {
  expect(bb.yMin).toBe(102);
});

test('Test BoundingBox.yMax', () => {
  expect(bb.yMax).toBe(202);
});

test('Test BoundingBox.xLength', () => {
  expect(bb.xLength).toBe(100);
});

test('Test BoundingBox.yLength', () => {
  expect(bb.yLength).toBe(100);
});


test('Test BoundingBox.arcBoundingBox', () => {
  // circle
  let arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(200, 100), new Point(200, 100));
  expect(arcBB.xMin).toBeCloseTo(0);
  expect(arcBB.xMax).toBeCloseTo(200);
  expect(arcBB.yMin).toBeCloseTo(0);
  expect(arcBB.yMax).toBeCloseTo(200);

  // clockwise 45 degrees: 0 - 45
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71));
  expect(arcBB.xMin).toBeCloseTo(170.71);
  expect(arcBB.xMax).toBeCloseTo(200);
  expect(arcBB.yMin).toBeCloseTo(100);
  expect(arcBB.yMax).toBeCloseTo(170.71);

  // anticlockwise 45 degrees: 0 - 45
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(200, 100), new Point(170.71, 170.71), -1);
  expect(arcBB.xMin).toBeCloseTo(0);
  expect(arcBB.xMax).toBeCloseTo(200);
  expect(arcBB.yMin).toBeCloseTo(0);
  expect(arcBB.yMax).toBeCloseTo(200);

  // Anticlockwise 45 degrees: 45 - 0
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(170.71, 170.71), new Point(200, 100), -1);
  expect(arcBB.xMin).toBeCloseTo(170.71);
  expect(arcBB.xMax).toBeCloseTo(200);
  expect(arcBB.yMin).toBeCloseTo(100);
  expect(arcBB.yMax).toBeCloseTo(170.71);

  // clockwise 45 degrees: 45 - 90
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(170.71, 170.71), new Point(100, 200));
  expect(arcBB.xMin).toBeCloseTo(100);
  expect(arcBB.xMax).toBeCloseTo(170.71);
  expect(arcBB.yMin).toBeCloseTo(170.71);
  expect(arcBB.yMax).toBeCloseTo(200);

  // clockwise 45 degrees: 67.5 - 112.5 - crosses 90 deg (Y Axis)
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(138.268, 192.388), new Point(61.732, 192.388));
  expect(arcBB.xMin).toBeCloseTo(61.732);
  expect(arcBB.xMax).toBeCloseTo(138.268);
  expect(arcBB.yMin).toBeCloseTo(192.388);
  expect(arcBB.yMax).toBeCloseTo(200);

  // clockwise 45 degrees: 202.5 - 247.5
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(7.612, 61.732), new Point(61.732, 7.612));
  expect(arcBB.xMin).toBeCloseTo(7.612);
  expect(arcBB.xMax).toBeCloseTo(61.732);
  expect(arcBB.yMin).toBeCloseTo(7.612);
  expect(arcBB.yMax).toBeCloseTo(61.732);

  // clockwise 90 degrees: 0 - 90
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(200, 100), new Point(100, 200));
  expect(arcBB.xMin).toBe(100);
  expect(arcBB.xMax).toBe(200);
  expect(arcBB.yMin).toBe(100);
  expect(arcBB.yMax).toBe(200);

  // clockwise 90 degrees: 45 - 135
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(170.71, 170.71), new Point(29.29, 170.71));
  expect(arcBB.xMin).toBeCloseTo(29.29);
  expect(arcBB.xMax).toBeCloseTo(170.71);
  expect(arcBB.yMin).toBeCloseTo(170.71);
  expect(arcBB.yMax).toBeCloseTo(200);

  // clockwise 180 degrees: 0 - 180
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(200, 100), new Point(0, 100));
  expect(arcBB.xMin).toBe(0);
  expect(arcBB.xMax).toBe(200);
  expect(arcBB.yMin).toBe(100);
  expect(arcBB.yMax).toBe(200);

  // anticlockwise 180 degrees: 0 - 180
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(200, 100), new Point(0, 100), -1);
  expect(arcBB.xMin).toBe(0);
  expect(arcBB.xMax).toBe(200);
  expect(arcBB.yMin).toBe(0);
  expect(arcBB.yMax).toBe(100);

  // clockwise 180 degrees: -45 - 135
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(170.71, 29.29), new Point(29.29, 170.71));
  expect(arcBB.xMin).toBeCloseTo(29.29);
  expect(arcBB.xMax).toBeCloseTo(200);
  expect(arcBB.yMin).toBeCloseTo(29.29);
  expect(arcBB.yMax).toBeCloseTo(200);

  // clockwise 270 degrees: 0 - 270
  arcBB = BoundingBox.arcBoundingBox(new Point(100, 100), new Point(200, 100), new Point(100, -100));
  expect(arcBB.xMin).toBe(0);
  expect(arcBB.xMax).toBe(200);
  expect(arcBB.yMin).toBe(0);
  expect(arcBB.yMax).toBe(200);
});

test('Test BoundingBox.fromPoints', () => {
  // clockwise 270 degrees: 0 - 270
  const bbFromPoints = BoundingBox.fromPoints([new Point(100, 100), new Point(200, 100), new Point(100, -100)]);
  expect(bbFromPoints.xMin).toBeCloseTo(100);
  expect(bbFromPoints.xMax).toBeCloseTo(200);
  expect(bbFromPoints.yMin).toBeCloseTo(-100);
  expect(bbFromPoints.yMax).toBeCloseTo(100);
});
