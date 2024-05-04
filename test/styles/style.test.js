import {Style} from '../../core/styles/style';

test('Test Style.vertical', () => {
  const style = new Style();
  expect(style.vertical).toBe(false);
  expect(style.standardFlags.getFlagValue()).toBe(0);

  style.vertical = true;
  expect(style.vertical).toBe(true);
  expect(style.standardFlags.hasFlag(4)).toBe(true);
  expect(style.standardFlags.getFlagValue()).toBe(4);
});


test('Test Style.backwards', () => {
  const style = new Style();
  expect(style.backwards).toBe(false);
  expect(style.flags.getFlagValue()).toBe(0);

  style.backwards = true;
  expect(style.backwards).toBe(true);
  expect(style.flags.hasFlag(2)).toBe(true);
  expect(style.flags.getFlagValue()).toBe(2);

  style.backwards = false;
  expect(style.backwards).toBe(false);
  expect(style.flags.hasFlag(2)).toBe(false);
});

test('Test Style.upsideDown', () => {
  const style = new Style();
  expect(style.upsideDown).toBe(false);
  expect(style.flags.getFlagValue()).toBe(0);

  style.upsideDown = true;
  expect(style.upsideDown).toBe(true);
  expect(style.flags.hasFlag(4)).toBe(true);
  expect(style.flags.getFlagValue()).toBe(4);

  style.upsideDown = false;
  expect(style.upsideDown).toBe(false);
  expect(style.flags.hasFlag(4)).toBe(false);
});

