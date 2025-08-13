import { DimStyle } from '../../core/tables/dimStyle';

test('Test DimStyle.getValue', () => {
  const style = new DimStyle();
  expect(style.getValue('DIMSE1')).toBe(false);
  expect(style.getValue('DIMASZ')).toBe(2.5);
});

test('Test DimStyle.vertical', () => {
  const style = new DimStyle();
  expect(style.vertical).toBe(false);
  expect(style.standardFlags.getFlagValue()).toBe(0);

  style.vertical = true;
  expect(style.vertical).toBe(true);
  expect(style.standardFlags.hasFlag(4)).toBe(true);
  expect(style.standardFlags.getFlagValue()).toBe(4);
});


