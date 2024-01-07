import {Style} from '../../core/styles/style';

test('Test Style.vertical', () => {
  const style = new Style();
  expect(style.vertical).toBe(false);
  expect(style.standardFlags).toBe(0);

  style.vertical = true;
  expect(style.vertical).toBe(true);
  expect(style.standardFlags).toBe(4);
});


test('Test Style.backwards', () => {
  const style = new Style();
  expect(style.backwards).toBe(false);
  expect(style.flags).toBe(0);

  style.backwards = true;
  expect(style.backwards).toBe(true);
  expect(style.flags).toBe(2);
});

test('Test Style.upsideDown', () => {
  const style = new Style();
  expect(style.upsideDown).toBe(false);
  expect(style.flags).toBe(0);

  style.upsideDown = true;
  expect(style.upsideDown).toBe(true);
  expect(style.flags).toBe(4);
});

