import {Matrix} from '../../core/lib/matrix';


test('Test Matrix.scale and Matrix.getScale', () => {
  const matrix = new Matrix();
  expect(matrix.getScale()).toBe(1);
  matrix.scale(10, 10);
  expect(matrix.getScale()).toBe(10);
  matrix.scale(0.5, 0.5);
  expect(matrix.getScale()).toBe(5);
});


test('Test Matrix.invert', () => {
  const matrix = new Matrix();
  matrix.scale(10, 10);
  let invMatrix = matrix.invert();
  expect(invMatrix.a).toBe(0.1);
  expect(invMatrix.b).toBe(0);
  expect(invMatrix.c).toBe(0);
  expect(invMatrix.d).toBe(-0.1);
  expect(invMatrix.e).toBeCloseTo(0);
  expect(invMatrix.f).toBeCloseTo(0);

  matrix.translate(10, 10);
  invMatrix = matrix.invert();
  expect(invMatrix.a).toBe(0.1);
  expect(invMatrix.b).toBeCloseTo(0);
  expect(invMatrix.c).toBeCloseTo(0);
  expect(invMatrix.d).toBe(-0.1);
  expect(invMatrix.e).toBe(-10);
  expect(invMatrix.f).toBe(-10);
});


test('Test Matrix.translate', () => {
  const matrix = new Matrix();

  matrix.translate(10, 10);
  expect(matrix.e).toBe(10);
  expect(matrix.f).toBe(-10);

  matrix.translate(-5, -5);
  expect(matrix.e).toBe(5);
  expect(matrix.f).toBe(-5);
});

test('Test Matrix.transformPoint', () => {
  const matrix = new Matrix();

  let transPoint = matrix.transformPoint(10, 10);
  expect(transPoint.x).toBe(10);
  expect(transPoint.y).toBe(-10);

  let invTransPoint = matrix.invert().transformPoint(10, 10);
  expect(invTransPoint.x).toBe(10);
  expect(invTransPoint.y).toBe(-10);

  matrix.translate(10, 10);
  transPoint = matrix.transformPoint(10, 10);
  expect(transPoint.x).toBe(20);
  expect(transPoint.y).toBe(-20);

  invTransPoint = matrix.invert().transformPoint(10, 10);
  expect(invTransPoint.x).toBe(0);
  expect(invTransPoint.y).toBe(-20);
});

