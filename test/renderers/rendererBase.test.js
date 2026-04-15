import { RendererBase } from '../../core/lib/renderers/rendererBase.js';

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
