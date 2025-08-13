
import { Flags } from '../../core/properties/flags';

test('Test flags set/get FlagValue', () => {
  const flags = new Flags();
  flags.setFlagValue(10);
  expect(flags.getFlagValue()).toBe(10);
  flags.setFlagValue(5);
  expect(flags.getFlagValue()).toBe(5);
});

test('Test flags.hasFlag', () => {
  const flags = new Flags();
  expect(flags.hasFlag(1)).toBe(false);

  // set flag value to 17
  flags.addValue(17);
  /* bit masked value
  | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
    0     0    0    1    0   0   0   1
  */
  // 1 should exist
  expect(flags.hasFlag(1)).toBe(true);
  // 2 shouldn't exist
  expect(flags.hasFlag(2)).toBe(false);
  // 3 shouldn't exist
  expect(flags.hasFlag(3)).toBe(false);
  // 4 shouldn't exist
  expect(flags.hasFlag(4)).toBe(false);
  // 5 shouldn't exist
  expect(flags.hasFlag(5)).toBe(false);
  // 6 shouldn't exist
  expect(flags.hasFlag(6)).toBe(false);
  // 8 shouldn't exist
  expect(flags.hasFlag(8)).toBe(false);
  // 16 shouldn't exist
  expect(flags.hasFlag(16)).toBe(true);
  // 32 shouldn't exist
  expect(flags.hasFlag(32)).toBe(false);
  // 64 shouldn't exist
  expect(flags.hasFlag(64)).toBe(false);
  // 128 shouldn't exist
  expect(flags.hasFlag(128)).toBe(false);

  // add flag value  3; total 19
  flags.addValue(3);
  /* bit masked value
    | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
      0     0    0    1    0   0   1   1
  */
  // 1 should exist
  expect(flags.hasFlag(1)).toBe(true);
  // 2 shouldn't exist
  expect(flags.hasFlag(2)).toBe(true);
  // 3 shouldn't exist
  expect(flags.hasFlag(3)).toBe(true);
  // 4 shouldn't exist
  expect(flags.hasFlag(4)).toBe(false);
  // 5 shouldn't exist
  expect(flags.hasFlag(5)).toBe(false);
  // 6 shouldn't exist
  expect(flags.hasFlag(6)).toBe(false);
  // 8 shouldn't exist
  expect(flags.hasFlag(8)).toBe(false);
  // 16 shouldn't exist
  expect(flags.hasFlag(16)).toBe(true);
  // 32 shouldn't exist
  expect(flags.hasFlag(32)).toBe(false);
  // 64 shouldn't exist
  expect(flags.hasFlag(64)).toBe(false);
  // 128 shouldn't exist
  expect(flags.hasFlag(128)).toBe(false);

  // try and add 3 again
  // add flag value 3 again; total still 19
  flags.addValue(3);
  /* bit masked value
      | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
        0     0    0    1    0   0   1   1
  */
  // 1 should exist
  expect(flags.hasFlag(1)).toBe(true);
  // 2 shouldn't exist
  expect(flags.hasFlag(2)).toBe(true);
  // 3 shouldn't exist
  expect(flags.hasFlag(3)).toBe(true);
  // 4 shouldn't exist
  expect(flags.hasFlag(4)).toBe(false);
  // 5 shouldn't exist
  expect(flags.hasFlag(5)).toBe(false);
  // 6 shouldn't exist
  expect(flags.hasFlag(6)).toBe(false);
  // 8 shouldn't exist
  expect(flags.hasFlag(8)).toBe(false);
  // 16 shouldn't exist
  expect(flags.hasFlag(16)).toBe(true);
  // 32 shouldn't exist
  expect(flags.hasFlag(32)).toBe(false);
  // 64 shouldn't exist
  expect(flags.hasFlag(64)).toBe(false);
  // 128 shouldn't exist
  expect(flags.hasFlag(128)).toBe(false);
});

test('Test flags.addValue', () => {
  const flags = new Flags();
  // 2 shouldn't exist
  expect(flags.hasFlag(2)).toBe(false);
  // add flag value 2
  flags.addValue(2);
  // 2 should exist
  expect(flags.hasFlag(2)).toBe(true);
  // add flag value 3
  flags.addValue(3);
  // 3 should exist
  expect(flags.hasFlag(1)).toBe(true);
  expect(flags.hasFlag(2)).toBe(true);
  expect(flags.hasFlag(3)).toBe(true);
  expect(flags.hasFlag(4)).toBe(false);
  expect(flags.getFlagValue()).toBe(3);

  // add flag value 3 again
  flags.addValue(3);
  // 3 should still exist
  expect(flags.hasFlag(3)).toBe(true);
  // flags value should still be 3
  expect(flags.getFlagValue()).toBe(3);

  // set flag value to 0
  flags.setFlagValue(2);
  // add flag value 2
  flags.addValue(2);
  // 2 should exist
  expect(flags.hasFlag(2)).toBe(true);
  // flag value should be 2
  expect(flags.getFlagValue()).toBe(2);

  // repeat add to check for unwanted behaviour
  // add flag value 2 a second time
  flags.addValue(2);
  // 2 should exist
  expect(flags.hasFlag(2)).toBe(true);
  // flag value should still be 2
  expect(flags.getFlagValue()).toBe(2);
});

test('Test flags.removeValue', () => {
  const flags = new Flags();
  // 2 shouldn't exist
  expect(flags.hasFlag(2)).toBe(false);
  // add flag value 2
  flags.addValue(2);
  // 2 should exist
  expect(flags.hasFlag(2)).toBe(true);
  // remove flag value 2
  flags.removeValue(2);
  // 2 shouldn't exist again
  expect(flags.hasFlag(2)).toBe(false);

  // repeat remove to check for unwanted behaviour
  flags.removeValue(2);
  // 2 shouldn't exist again
  expect(flags.hasFlag(2)).toBe(false);
});
