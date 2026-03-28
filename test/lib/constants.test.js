import { Constants } from '../../core/lib/constants.js';

test('Constants.Tolerance.EPSILON is 1e-10', () => {
  expect(Constants.Tolerance.EPSILON).toBe(1e-10);
});

test('Constants.Precision.DECIMALPLACES is 5', () => {
  expect(Constants.Precision.DECIMALPLACES).toBe(5);
});
