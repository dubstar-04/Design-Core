import {Utils} from '../../core/lib/utils.js';

test('Test Utils.degrees2radians', () => {
  // Positive
  expect(Utils.degrees2radians(22.5)).toBe(Math.PI/8);
  expect(Utils.degrees2radians(45)).toBe(Math.PI/4);
  expect(Utils.degrees2radians(90)).toBe(Math.PI/2);
  expect(Utils.degrees2radians(180)).toBe(Math.PI);

  // Negative
  expect(Utils.degrees2radians(-22.5)).toBe(-Math.PI/8);
});

test('Test Utils.radians2degrees', () => {
  // Positive
  expect(Utils.radians2degrees(Math.PI/8)).toBe(22.5);
  expect(Utils.radians2degrees(Math.PI/4)).toBe(45);
  expect(Utils.radians2degrees(Math.PI/2)).toBe(90);
  expect(Utils.radians2degrees(Math.PI)).toBe(180);

  // Negative
  expect(Utils.radians2degrees(-Math.PI/8)).toBe(-22.5);
});

test('Test Utils.round', () => {
  // Positive
  expect(Utils.round(1.234567)).toBe(1.23457);

  // Negative
  expect(Utils.round(-1.234567)).toBe(-1.23457);
});

test('Test Utils.getLevenshteinDistance', () => {
  expect(Utils.getLevenshteinDistance('design', 'resign')).toBe(1);
  expect(Utils.getLevenshteinDistance('design', 'sign')).toBe(2);
});
