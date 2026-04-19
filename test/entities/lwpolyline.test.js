import { jest } from '@jest/globals';
import { Lwpolyline } from '../../core/entities/lwpolyline.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Point } from '../../core/entities/point.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

// ─── constructor returns a Polyline ──────────────────────────────────────────

test('Lwpolyline constructor returns a Polyline instance', () => {
  const result = new Lwpolyline({ points: [new Point(0, 0), new Point(10, 0)] });
  expect(result).toBeInstanceOf(Polyline);
});

test('Lwpolyline with no data returns a Polyline instance', () => {
  const result = new Lwpolyline();
  expect(result).toBeInstanceOf(Polyline);
});

// ─── group code 90 vertex count validation ───────────────────────────────────

test('Lwpolyline logs no error when group code 90 matches points.length', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  new Lwpolyline({ 90: 2, points: [new Point(0, 0), new Point(10, 0)] });
  const errorCalls = spy.mock.calls.filter(([msg]) => msg.startsWith('Error:'));
  expect(errorCalls).toHaveLength(0);
  spy.mockRestore();
});

test('Lwpolyline logs error when group code 90 count does not match points.length', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  new Lwpolyline({ 90: 3, points: [new Point(0, 0), new Point(10, 0)] });
  const errorCalls = spy.mock.calls.filter(([msg]) => msg.startsWith('Error:'));
  expect(errorCalls).toHaveLength(1);
  expect(errorCalls[0][0]).toMatch(/specifies 3 vertices/);
  expect(errorCalls[0][0]).toMatch(/2 were parsed/);
  spy.mockRestore();
});

test('Lwpolyline logs error when group code 90 present but points is undefined', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  new Lwpolyline({ 90: 2 });
  const errorCalls = spy.mock.calls.filter(([msg]) => msg.startsWith('Error:'));
  expect(errorCalls).toHaveLength(1);
  expect(errorCalls[0][0]).toMatch(/points array is missing or invalid/);
  spy.mockRestore();
});

test('Lwpolyline logs error when group code 90 present but points is not an array', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  new Lwpolyline({ 90: 1, points: 'bad' });
  const errorCalls = spy.mock.calls.filter(([msg]) => msg.startsWith('Error:'));
  expect(errorCalls).toHaveLength(1);
  expect(errorCalls[0][0]).toMatch(/points array is missing or invalid/);
  spy.mockRestore();
});

test('Lwpolyline does not throw when group code 90 present but points is undefined', () => {
  expect(() => new Lwpolyline({ 90: 2 })).not.toThrow();
});

// ─── closed-polyline deduplication ───────────────────────────────────────────

test('Lwpolyline removes duplicate closing point and sets closed flag', () => {
  const pts = [
    new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 0),
  ];
  const result = new Lwpolyline({ points: pts });
  expect(result.points).toHaveLength(3);
  expect(result.flags.hasFlag(1)).toBe(true);
});

test('Lwpolyline preserves existing flags when setting closed bit', () => {
  const pts = [
    new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 0),
  ];
  // pass flag bit 2 (arbitrary extra flag)
  const result = new Lwpolyline({ points: pts, 70: 2 });
  const flagVal = result.flags.getFlagValue();
  expect(flagVal & 1).toBe(1); // closed bit set
  expect(flagVal & 2).toBe(2); // original bit preserved
});

test('Lwpolyline does not remove point when fewer than 4 points with matching ends', () => {
  const pts = [new Point(0, 0), new Point(10, 0), new Point(0, 0)];
  const result = new Lwpolyline({ points: pts });
  expect(result.points).toHaveLength(3);
  expect(result.flags.hasFlag(1)).toBe(false);
});

test('Lwpolyline does not modify open polyline', () => {
  const pts = [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(5, 5)];
  const result = new Lwpolyline({ points: pts });
  expect(result.points).toHaveLength(4);
  expect(result.flags.hasFlag(1)).toBe(false);
});

// ─── register ────────────────────────────────────────────────────────────────

test('Lwpolyline.register returns command object', () => {
  expect(Lwpolyline.register()).toEqual({ command: 'Lwpolyline' });
});
