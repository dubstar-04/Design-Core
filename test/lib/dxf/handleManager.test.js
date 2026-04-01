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

test('Test HandleManager.checkHandle coerces numeric handle to string', () => {
  const handle = new HandleManager();
  handle.checkHandle(255);
  // String(255) = '255', which is valid hex (0x255 = 597)
  expect(handle.usedHandles.has('255')).toBe(true);
  expect(handle.counter).toBe(598);
});

test('Test HandleManager.checkHandle ignores undefined and null', () => {
  const handle = new HandleManager();
  const counterBefore = handle.counter;
  handle.checkHandle(undefined);
  handle.checkHandle(null);
  expect(handle.counter).toBe(counterBefore);
  expect(handle.usedHandles.size).toBe(0);
});

test('Test HandleManager.checkHandle ignores invalid hex strings', () => {
  const handle = new HandleManager();
  const counterBefore = handle.counter;
  handle.checkHandle('XYZ');
  handle.checkHandle('');
  expect(handle.counter).toBe(counterBefore);
  expect(handle.usedHandles.size).toBe(0);
});

test('Test HandleManager.releaseHandle removes handle from usedHandles', () => {
  const handle = new HandleManager();
  const h = handle.next(); // allocates 'A'
  expect(handle.usedHandles.has('A')).toBe(true);
  handle.releaseHandle(h);
  expect(handle.usedHandles.has('A')).toBe(false);
});

test('Test HandleManager.releaseHandle ignores undefined and null', () => {
  const handle = new HandleManager();
  handle.next();
  const sizeBefore = handle.usedHandles.size;
  handle.releaseHandle(undefined);
  handle.releaseHandle(null);
  expect(handle.usedHandles.size).toBe(sizeBefore);
});

test('Test HandleManager.releaseHandle allows handle to be re-registered without duplicate error', () => {
  const handle = new HandleManager();
  const h = handle.next(); // allocates 'A'
  handle.releaseHandle(h);
  // After release the handle is gone, so checkHandle should re-register it cleanly
  handle.checkHandle(h);
  // The handle should be back in usedHandles with no duplicate detection
  expect(handle.usedHandles.has('A')).toBe(true);
  // Only one entry — no duplication
  expect(handle.usedHandles.size).toBe(1);
});
