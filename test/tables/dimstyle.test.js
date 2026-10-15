import { DimStyle } from '../../core/tables/dimStyle';
import { DesignCore } from '../../core/designCore.js';

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

  test('DimStyle text-related properties and edge cases', () => {
    // Test default text style properties
    expect(style.getValue('DIMTXSTY')).toBeDefined(); // Text style name
    expect(typeof style.getValue('DIMTXT')).toBe('number'); // Text height
    expect(typeof style.getValue('DIMGAP')).toBe('number'); // Gap between text and dimension line
    expect(typeof style.getValue('DIMTAD')).toBe('number'); // Text vertical position
    expect(typeof style.getValue('DIMJUST')).toBe('number'); // Text justification
    expect(typeof style.getValue('DIMTIH')).toBe('number'); // Text inside horizontal
    expect(typeof style.getValue('DIMTOH')).toBe('number'); // Text outside horizontal

    // Set and get a custom value
    style.setValue('DIMTXT', 3.14);
    expect(style.getValue('DIMTXT')).toBe(3.14);

    // Unknown property returns undefined or default
    expect(style.getValue('DOES_NOT_EXIST')).toBeUndefined();

    // Test setting and getting string property
    style.setValue('DIMTXSTY', 'MyTextStyle');
    expect(style.getValue('DIMTXSTY')).toBe('MyTextStyle');

    // Test boolean property
    style.setValue('DIMTIX', true);
    expect(style.getValue('DIMTIX')).toBe(1);
    style.setValue('DIMTIX', false);
    expect(style.getValue('DIMTIX')).toBe(0);

    // Test numeric property edge case
    style.setValue('DIMTAD', 99);
    expect(style.getValue('DIMTAD')).toBe(99);
  });

  test('setValue sets property correctly', () => {
    style.setValue('DIMTXT', 42);
    expect(style.DIMTXT).toBe(42);
    expect(style.getValue('DIMTXT')).toBe(42);
    style.setValue('customProp', 'hello');
    expect(style.customProp).toBeUndefined();
  });

  describe('getTextStyleHandle', () => {
    beforeEach(() => {
      DesignCore.Core = {
        styleManager: {
          getItems: () => [
            { name: 'STANDARD', handle: '19' },
            { name: '19', handle: '2A' },
          ],
        },
      };
    });

    test('resolves a style name by name', () => {
      expect(new DimStyle({ DIMTXSTY: '19' }).getTextStyleHandle()).toBe('2A');
    });

    test('resolves an imported group 340 value strictly as a handle', () => {
      expect(new DimStyle({ 340: '19' }).getTextStyleHandle()).toBe('19');
    });

    test('falls back to the Standard style when the reference is unknown', () => {
      expect(new DimStyle({ 340: 'FF' }).getTextStyleHandle()).toBe('19');
    });

    test('setValue switches DIMTXSTY back to a name reference', () => {
      const dimStyle = new DimStyle({ 340: '19' });
      dimStyle.setValue('DIMTXSTY', '19');
      expect(dimStyle.getTextStyleHandle()).toBe('2A');
    });
  });
});


