import {Property} from '../../core/properties/property';

test('Test property.loadValue', () => {
  expect(Property.loadValue([], 3)).toBe(3);
  expect(Property.loadValue([1, 2], 3)).toBe(1);
  expect(Property.loadValue([undefined, 2], 3)).toBe(2);
  expect(Property.loadValue([undefined], 3)).toBe(3);
});
