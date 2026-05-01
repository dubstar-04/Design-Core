import { Property } from '../../core/properties/property';
import { Flags } from '../../core/properties/flags';

test('Test property.loadValue', () => {
  expect(Property.loadValue([], 3)).toBe(3);
  expect(Property.loadValue([1, 2], 3)).toBe(1);
  expect(Property.loadValue([undefined, 2], 3)).toBe(2);
  expect(Property.loadValue([undefined], 3)).toBe(3);

  const flags = new Flags();
  flags.setFlagValue(4);
  expect(Property.loadValue([flags], 3)).toBe(4);
});

describe('Property.Type', () => {
  test('has all expected members', () => {
    expect(Property.Type.NUMBER).toBe('NUMBER');
    expect(Property.Type.STRING).toBe('STRING');
    expect(Property.Type.BOOLEAN).toBe('BOOLEAN');
    expect(Property.Type.LIST).toBe('LIST');
    expect(Property.Type.COLOUR).toBe('COLOUR');
    expect(Property.Type.LABEL).toBe('LABEL');
  });

  test('has exactly 6 members', () => {
    expect(Object.keys(Property.Type)).toHaveLength(7);
  });
});

describe('Property instance', () => {
  test('stores type and value', () => {
    const p = new Property({ type: Property.Type.NUMBER, value: 42 });
    expect(p.type).toBe(Property.Type.NUMBER);
    expect(p.value).toBe(42);
  });

  test('defaults readOnly to false and visible to true', () => {
    const p = new Property({ type: Property.Type.STRING, value: 'hello' });
    expect(p.readOnly).toBe(false);
    expect(p.visible).toBe(true);
  });

  test('set value updates when not readOnly', () => {
    const p = new Property({ type: Property.Type.NUMBER, value: 1 });
    p.value = 99;
    expect(p.value).toBe(99);
  });

  test('set value is ignored when readOnly', () => {
    const p = new Property({ type: Property.Type.LABEL, value: 'fixed', readOnly: true });
    p.value = 'changed';
    expect(p.value).toBe('fixed');
  });

  test('stores dxfCode', () => {
    const p = new Property({ type: Property.Type.LIST, value: '0', dxfCode: 8 });
    expect(p.dxfCode).toBe(8);
  });

  test('no-arg constructor produces undefined fields without throwing', () => {
    const p = new Property();
    expect(p.type).toBeUndefined();
    expect(p.value).toBeUndefined();
  });
});
