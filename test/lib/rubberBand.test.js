import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { RubberBand } from '../../core/lib/auxiliary/rubberBand.js';
import { jest } from '@jest/globals';

new Core();

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a mock renderer that records calls to setColour, setLineWidth, setDash, drawShape.
 * @return {object} mock renderer
 */
function makeRenderer() {
  return {
    setColour: jest.fn(),
    setLineWidth: jest.fn(),
    setDash: jest.fn(),
    drawShape: jest.fn(),
  };
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
  const renderer = makeRenderer();
  expect(() => rb.draw(renderer, 1)).not.toThrow();
  expect(renderer.drawShape).not.toHaveBeenCalled();
});

test('RubberBand.draw does nothing when points is empty', () => {
  const rb = new RubberBand([]);
  const renderer = makeRenderer();
  expect(() => rb.draw(renderer, 1)).not.toThrow();
  expect(renderer.drawShape).not.toHaveBeenCalled();
});

// ─── draw ─────────────────────────────────────────────────────────────────────

test('RubberBand.draw with 2 points calls drawShape with the points array', () => {
  const pts = [new Point(0, 0), new Point(10, 5)];
  const rb = new RubberBand(pts);
  const renderer = makeRenderer();

  rb.draw(renderer, 1);

  expect(renderer.setColour).toHaveBeenCalledTimes(1);
  expect(renderer.setDash).toHaveBeenCalledTimes(1);
  expect(renderer.drawShape).toHaveBeenCalledWith(pts);
  expect(renderer.drawShape).toHaveBeenCalledTimes(1);
});

test('RubberBand.draw scales lineWidth and dashPattern by 1/scale', () => {
  const scale = 2;
  const rb = new RubberBand([new Point(0, 0), new Point(10, 0)]);
  const renderer = makeRenderer();

  rb.draw(renderer, scale);

  expect(renderer.setLineWidth).toHaveBeenCalledWith(rb.lineWidth / scale);
  expect(renderer.setDash).toHaveBeenCalledWith([12 / scale, 6 / scale], 0);
});

test('RubberBand.draw with 3 points passes all 3 points to drawShape', () => {
  const pts = [new Point(0, 0), new Point(5, 5), new Point(10, 0)];
  const rb = new RubberBand(pts);
  const renderer = makeRenderer();

  rb.draw(renderer, 1);

  expect(renderer.drawShape).toHaveBeenCalledWith(pts);
});
