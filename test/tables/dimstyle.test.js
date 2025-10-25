import { DimStyle } from '../../core/tables/dimStyle';

describe('DimStyle', () => {
  let style;

  beforeEach(() => {
    const data = {};
    style = new DimStyle(data);
  });

  test('getValue returns correct default values', () => {
    expect(style.getValue('DIMSE1')).toBe(0); // Suppress first extension line
    expect(style.getValue('DIMASZ')).toBe(0.18); // Arrow size
  });

  test('vertical flag getter and setter', () => {
    expect(style.vertical).toBe(false);
    expect(style.standardFlags.getFlagValue()).toBe(0);

    style.vertical = true;
    expect(style.vertical).toBe(true);
    expect(style.standardFlags.hasFlag(4)).toBe(true);
    expect(style.standardFlags.getFlagValue()).toBe(4);

    style.vertical = false;
    expect(style.vertical).toBe(false);
    expect(style.standardFlags.hasFlag(4)).toBe(false);
    expect(style.standardFlags.getFlagValue()).toBe(0);
  });
});


