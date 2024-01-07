import {DimStyle} from '../../core/styles/dimStyle';

test('Test DimStyle.getValue', () => {
  const style = new DimStyle();
  expect(style.getValue('DIMSE1')).toBe(false);
  expect(style.getValue('DIMASZ')).toBe(2.5);
});

test('Test DimStyle.vertical', () => {
  const style = new DimStyle();
  expect(style.vertical).toBe(false);
  expect(style.standardFlags).toBe(0);

  style.vertical = true;
  expect(style.vertical).toBe(true);
  expect(style.standardFlags).toBe(4);
});


