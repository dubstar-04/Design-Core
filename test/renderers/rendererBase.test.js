import { RendererBase } from '../../core/lib/renderers/rendererBase.js';

// Concrete subclass used throughout — only implements what the tests need.
class TestRenderer extends RendererBase {}

// ─── RendererBase.Styles ──────────────────────────────────────────────────────

describe('RendererBase.Styles', () => {
  // Use lowercase aliases to satisfy the new-cap lint rule
  const applyNone = RendererBase.Styles.NONE;
  const applyMono = RendererBase.Styles.MONOCHROME;
  const applyGrey = RendererBase.Styles.GREYSCALE;

  test('NONE returns colour unchanged', () => {
    expect(applyNone({ r: 100, g: 150, b: 200 })).toEqual({ r: 100, g: 150, b: 200 });
  });

  test('MONOCHROME returns black for any colour', () => {
    expect(applyMono({ r: 255, g: 128, b: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('MONOCHROME returns black even for white', () => {
    expect(applyMono({ r: 255, g: 255, b: 255 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('GREYSCALE produces equal r/g/b channels', () => {
    const result = applyGrey({ r: 255, g: 0, b: 0 });
    expect(result.r).toBe(result.g);
    expect(result.g).toBe(result.b);
  });

  test('GREYSCALE pure red uses BT.601 red coefficient (~76)', () => {
    // 0.299 * 255 = 76.245 → rounds to 76
    const result = applyGrey({ r: 255, g: 0, b: 0 });
    expect(result.r).toBe(76);
  });

  test('GREYSCALE pure green uses BT.601 green coefficient (~150)', () => {
    // 0.587 * 255 = 149.685 → rounds to 150
    const result = applyGrey({ r: 0, g: 255, b: 0 });
    expect(result.r).toBe(150);
  });

  test('GREYSCALE pure blue uses BT.601 blue coefficient (~29)', () => {
    // 0.114 * 255 = 29.07 → rounds to 29
    const result = applyGrey({ r: 0, g: 0, b: 255 });
    expect(result.r).toBe(29);
  });

  test('GREYSCALE white maps to white (255, 255, 255)', () => {
    expect(applyGrey({ r: 255, g: 255, b: 255 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('GREYSCALE black maps to black (0, 0, 0)', () => {
    expect(applyGrey({ r: 0, g: 0, b: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });
});

// ─── setBackgroundColour / getBackgroundColour ────────────────────────────────

test('getBackgroundColour returns null before any set', () => {
  const r = new TestRenderer();
  expect(r.getBackgroundColour()).toBeNull();
});

test('setBackgroundColour stores and getBackgroundColour returns the colour', () => {
  const r = new TestRenderer();
  const colour = { r: 255, g: 255, b: 255 };
  r.setBackgroundColour(colour);
  expect(r.getBackgroundColour()).toBe(colour);
});

test('setBackgroundColour can be updated', () => {
  const r = new TestRenderer();
  r.setBackgroundColour({ r: 0, g: 0, b: 0 });
  const updated = { r: 255, g: 0, b: 0 };
  r.setBackgroundColour(updated);
  expect(r.getBackgroundColour()).toBe(updated);
});

test('setBackgroundColour accepts null to clear', () => {
  const r = new TestRenderer();
  r.setBackgroundColour({ r: 0, g: 0, b: 0 });
  r.setBackgroundColour(null);
  expect(r.getBackgroundColour()).toBeNull();
});

// ─── setStyle / applyStyle ────────────────────────────────────────────────────

test('applyStyle defaults to NONE (colour passes through unchanged)', () => {
  const r = new TestRenderer();
  expect(r.applyStyle({ r: 10, g: 20, b: 30 })).toEqual({ r: 10, g: 20, b: 30 });
});

test('setStyle to MONOCHROME causes applyStyle to return black', () => {
  const r = new TestRenderer();
  r.setStyle(RendererBase.Styles.MONOCHROME);
  expect(r.applyStyle({ r: 100, g: 150, b: 200 })).toEqual({ r: 0, g: 0, b: 0 });
});

test('setStyle to GREYSCALE causes applyStyle to return grey', () => {
  const r = new TestRenderer();
  r.setStyle(RendererBase.Styles.GREYSCALE);
  const result = r.applyStyle({ r: 255, g: 0, b: 0 });
  expect(result.r).toBe(result.g);
  expect(result.g).toBe(result.b);
});

test('setStyle falls back to NONE when passed a falsy value', () => {
  const r = new TestRenderer();
  r.setStyle(RendererBase.Styles.MONOCHROME);
  r.setStyle(null);
  expect(r.applyStyle({ r: 10, g: 20, b: 30 })).toEqual({ r: 10, g: 20, b: 30 });
});

test('setStyle can be changed multiple times', () => {
  const r = new TestRenderer();
  r.setStyle(RendererBase.Styles.MONOCHROME);
  r.setStyle(RendererBase.Styles.NONE);
  expect(r.applyStyle({ r: 50, g: 100, b: 150 })).toEqual({ r: 50, g: 100, b: 150 });
});

// ─── Abstract methods throw ───────────────────────────────────────────────────

test('drawShape throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.drawShape({}, [])).toThrow('TestRenderer: drawShape() not implemented');
});

test('drawText throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.drawText({}, [], 'Arial', 12)).toThrow('TestRenderer: drawText() not implemented');
});

test('tracePath throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.tracePath([])).toThrow('TestRenderer: tracePath() not implemented');
});

test('drawSegments throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.drawSegments([])).toThrow('TestRenderer: drawSegments() not implemented');
});

test('beginPath throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.beginPath()).toThrow('TestRenderer: beginPath() not implemented');
});

test('stroke throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.stroke()).toThrow('TestRenderer: stroke() not implemented');
});

test('closePath throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.closePath()).toThrow('TestRenderer: closePath() not implemented');
});

test('setColour throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.setColour({ r: 0, g: 0, b: 0 })).toThrow('TestRenderer: setColour() not implemented');
});

test('setLineWidth throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.setLineWidth(1)).toThrow('TestRenderer: setLineWidth() not implemented');
});

test('setDash throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.setDash([])).toThrow('TestRenderer: setDash() not implemented');
});

test('setHighlight throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.setHighlight(true)).toThrow('TestRenderer: setHighlight() not implemented');
});

test('setTransform throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.setTransform({})).toThrow('TestRenderer: setTransform() not implemented');
});

test('fillBackground throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.fillBackground({ x: 0, y: 0 }, 800, 600, 1)).toThrow('TestRenderer: fillBackground() not implemented');
});

test('applyTransform throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.applyTransform({})).toThrow('TestRenderer: applyTransform() not implemented');
});

test('save throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.save()).toThrow('TestRenderer: save() not implemented');
});

test('restore throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.restore()).toThrow('TestRenderer: restore() not implemented');
});

test('measureText throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.measureText('hello')).toThrow('TestRenderer: measureText() not implemented');
});

test('measureCharWidth throws with renderer name in message', () => {
  const r = new TestRenderer();
  expect(() => r.measureCharWidth('A')).toThrow('TestRenderer: measureCharWidth() not implemented');
});
