import { Constants } from '../../core/lib/constants.js';

test('Constants.Tolerance.EPSILON is 1e-10', () => {
  expect(Constants.Tolerance.EPSILON).toBe(1e-10);
});

test('Constants.Precision.DECIMALPLACES is 5', () => {
  expect(Constants.Precision.DECIMALPLACES).toBe(5);
});

describe('Constants.PageSizes', () => {
  test('A4 portrait is 595 × 842', () => {
    expect(Constants.PageSizes['A4']).toEqual({ width: 595, height: 842 });
  });

  test('A3 portrait is 842 × 1191', () => {
    expect(Constants.PageSizes['A3']).toEqual({ width: 842, height: 1191 });
  });

  test('Letter portrait is 612 × 792', () => {
    expect(Constants.PageSizes['Letter']).toEqual({ width: 612, height: 792 });
  });

  test('all sizes have portrait orientation (width < height)', () => {
    for (const [, size] of Object.entries(Constants.PageSizes)) {
      expect(size.width).toBeLessThan(size.height);
    }
  });

  test('contains all expected ISO and ANSI sizes', () => {
    const expected = ['A4', 'A3', 'A2', 'A1', 'A0', 'Letter', 'Legal', 'Tabloid', 'ANSI C', 'ANSI D', 'ANSI E'];
    for (const name of expected) {
      expect(Constants.PageSizes).toHaveProperty(name);
    }
  });
});
