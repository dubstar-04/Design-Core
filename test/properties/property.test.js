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
