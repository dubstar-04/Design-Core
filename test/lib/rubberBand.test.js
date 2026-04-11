import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { RubberBand } from '../../core/lib/auxiliary/rubberBand.js';
import { jest } from '@jest/globals';

new Core();

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a mock HTML Canvas context (setLineDash succeeds)
 * @return {object} mock context
 */
function makeCanvasCtx() {
  return {
    strokeStyle: '',
    lineWidth: 0,
    setLineDash: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
  };
}

/**
 * Build a mock Cairo context where assigning strokeStyle throws,
 * exercising the Cairo fallback branch in RubberBand.draw().
 * @return {object} mock context
 */
function makeCairoCtx() {
  const ctx = {
    setSourceRGB: jest.fn(),
    setLineWidth: jest.fn(),
    setDash: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
  };
  // Assigning strokeStyle throws, triggering the Cairo catch-branch
  Object.defineProperty(ctx, 'strokeStyle', {
    set() {
      throw new Error('Cairo context has no strokeStyle');
    },
    configurable: true,
  });
  return ctx;
}

// ─── constructor ─────────────────────────────────────────────────────────────

test('RubberBand constructor stores points and defaults', () => {
  const pts = [new Point(0, 0), new Point(10, 0)];
  const rb = new RubberBand(pts);

  expect(rb.points).toBe(pts);
  expect(rb.lineWidth).toBe(1.5);
  expect(rb.dashPattern).toEqual([12, 6]);
});

// ─── draw – guard ─────────────────────────────────────────────────────────────

test('RubberBand.draw does nothing when points.length < 2', () => {
  const rb = new RubberBand([new Point(0, 0)]);
  const ctx = makeCanvasCtx();
  expect(() => rb.draw(ctx, 1)).not.toThrow();
  expect(ctx.stroke).not.toHaveBeenCalled();
});

test('RubberBand.draw does nothing when points is empty', () => {
  const rb = new RubberBand([]);
  const ctx = makeCanvasCtx();
  expect(() => rb.draw(ctx, 1)).not.toThrow();
  expect(ctx.stroke).not.toHaveBeenCalled();
});

// ─── draw – HTML Canvas path ──────────────────────────────────────────────────

test('RubberBand.draw with 2 points uses HTML Canvas path', () => {
  const rb = new RubberBand([new Point(0, 0), new Point(10, 5)]);
  const ctx = makeCanvasCtx();

  rb.draw(ctx, 1);

  expect(ctx.beginPath).toHaveBeenCalledTimes(1);
  expect(ctx.setLineDash).toHaveBeenCalledTimes(1);
  expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
  expect(ctx.lineTo).toHaveBeenCalledWith(10, 5);
  expect(ctx.stroke).toHaveBeenCalledTimes(1);
});

test('RubberBand.draw scales lineWidth and dashPattern by 1/scale', () => {
  const scale = 2;
  const rb = new RubberBand([new Point(0, 0), new Point(10, 0)]);
  const ctx = makeCanvasCtx();

  rb.draw(ctx, scale);

  expect(ctx.lineWidth).toBe(rb.lineWidth / scale);
  expect(ctx.setLineDash).toHaveBeenCalledWith([12 / scale, 6 / scale]);
});

test('RubberBand.draw with 3 points calls lineTo twice', () => {
  const pts = [new Point(0, 0), new Point(5, 5), new Point(10, 0)];
  const rb = new RubberBand(pts);
  const ctx = makeCanvasCtx();

  rb.draw(ctx, 1);

  expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
  expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 5, 5);
  expect(ctx.lineTo).toHaveBeenNthCalledWith(2, 10, 0);
  expect(ctx.stroke).toHaveBeenCalledTimes(1);
});

// ─── draw – Cairo path ────────────────────────────────────────────────────────

test('RubberBand.draw falls back to Cairo path when strokeStyle throws', () => {
  const rb = new RubberBand([new Point(0, 0), new Point(10, 5)]);
  const ctx = makeCairoCtx();

  expect(() => rb.draw(ctx, 1)).not.toThrow();

  expect(ctx.setSourceRGB).toHaveBeenCalledTimes(1);
  expect(ctx.setLineWidth).toHaveBeenCalledTimes(1);
  expect(ctx.setDash).toHaveBeenCalledTimes(1);
  expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
  expect(ctx.lineTo).toHaveBeenCalledWith(10, 5);
  expect(ctx.stroke).toHaveBeenCalledTimes(1);
});

test('RubberBand.draw Cairo path scales lineWidth and dashPattern by 1/scale', () => {
  const scale = 4;
  const rb = new RubberBand([new Point(0, 0), new Point(10, 0)]);
  const ctx = makeCairoCtx();

  rb.draw(ctx, scale);

  expect(ctx.setLineWidth).toHaveBeenCalledWith(rb.lineWidth / scale);
  expect(ctx.setDash).toHaveBeenCalledWith([12 / scale, 6 / scale], 0);
});
