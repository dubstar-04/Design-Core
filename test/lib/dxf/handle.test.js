import { Handle } from '../../../core/lib/dxf/handle.js';

test('Test Handle.constructor', () => {
  const handle = new Handle();
  expect(handle.counter).toBe(10);
});

test('Test Handle.next', () => {
  const handle = new Handle();
  expect(handle.next()).toBe('A');
  expect(handle.next()).toBe('B');
  expect(handle.next()).toBe('C');
  expect(handle.counter).toBe(13);
});

test('Test Handle.format', () => {
  const handle = new Handle();
  expect(handle.format(0)).toBe('0');
  expect(handle.format(10)).toBe('A');
  expect(handle.format(15)).toBe('F');
  expect(handle.format(16)).toBe('10');
  expect(handle.format(255)).toBe('FF');
});

test('Test Handle.reset', () => {
  const handle = new Handle();
  handle.next();
  handle.next();
  expect(handle.counter).toBe(12);
  handle.reset();
  expect(handle.counter).toBe(10);
});

test('Test Handle.handseed getter', () => {
  const handle = new Handle();
  expect(handle.handseed).toBe('A');
  handle.next();
  expect(handle.handseed).toBe('B');
});

test('Test Handle.handseed setter', () => {
  const handle = new Handle();
  handle.handseed = 'FF';
  expect(handle.counter).toBe(255);
  expect(handle.next()).toBe('FF');
  expect(handle.next()).toBe('100');
});
