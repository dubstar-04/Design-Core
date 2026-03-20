import { HandleManager } from '../../../core/lib/dxf/handleManager.js';

test('Test HandleManager.constructor', () => {
  const handle = new HandleManager();
  expect(handle.counter).toBe(10);
});

test('Test HandleManager.next', () => {
  const handle = new HandleManager();
  expect(handle.next()).toBe('A');
  expect(handle.next()).toBe('B');
  expect(handle.next()).toBe('C');
  expect(handle.counter).toBe(13);
});

test('Test HandleManager.format', () => {
  const handle = new HandleManager();
  expect(handle.format(0)).toBe('0');
  expect(handle.format(10)).toBe('A');
  expect(handle.format(15)).toBe('F');
  expect(handle.format(16)).toBe('10');
  expect(handle.format(255)).toBe('FF');
});

test('Test HandleManager.reset', () => {
  const handle = new HandleManager();
  handle.next();
  handle.next();
  expect(handle.counter).toBe(12);
  handle.reset();
  expect(handle.counter).toBe(10);
});

test('Test HandleManager.handseed getter', () => {
  const handle = new HandleManager();
  expect(handle.handseed).toBe('A');
  handle.next();
  expect(handle.handseed).toBe('B');
});

test('Test HandleManager.handseed setter', () => {
  const handle = new HandleManager();
  handle.handseed = 'FF';
  expect(handle.counter).toBe(255);
  expect(handle.next()).toBe('FF');
  expect(handle.next()).toBe('100');
});
