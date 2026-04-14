import { SvgRenderer } from '../../core/lib/renderers/svgRenderer.js';
import { Point } from '../../core/entities/point.js';
import { Text } from '../../core/entities/text.js';

describe('SvgRenderer — getOutput()', () => {
  test('produces valid SVG with XML declaration', () => {
    const renderer = new SvgRenderer(100, 100);
    expect(renderer.getOutput().startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  test('contains svg element with correct dimensions', () => {
    const renderer = new SvgRenderer(595, 842);
    const output = renderer.getOutput();
    expect(output).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842"');
    expect(output).toContain('viewBox="0 0 595 842"');
  });

  test('contains Y-flip group for scene coordinate conversion', () => {
    const renderer = new SvgRenderer(100, 200);
    expect(renderer.getOutput()).toContain('translate(0,200) scale(1,-1)');
  });

  test('ends with </svg>', () => {
    const renderer = new SvgRenderer(100, 100);
    expect(renderer.getOutput().trim().endsWith('</svg>')).toBe(true);
  });

  test('fillBackground emits rect before Y-flip group', () => {
    const renderer = new SvgRenderer(200, 100);
    renderer.fillBackground({ r: 30, g: 30, b: 30 }, null, 200, 100, 1);
    const output = renderer.getOutput();
    const rectPos = output.indexOf('<rect');
    const flipPos = output.indexOf('scale(1,-1)');
    expect(rectPos).toBeGreaterThan(-1);
    expect(flipPos).toBeGreaterThan(rectPos);
    expect(output).toContain('fill="rgb(30,30,30)"');
  });
});

describe('SvgRenderer — drawing', () => {
  test('drawShape emits path element with M and L commands', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 10, y: 20 }], {});
    const output = renderer.getOutput();
    expect(output).toContain('<path');
    expect(output).toContain('M 0 0');
    expect(output).toContain('L 10 20');
  });

  test('drawShape with closed=true emits Z in path d', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }], { closed: true });
    expect(renderer.getOutput()).toContain('Z');
  });

  test('drawShape defaults to stroke=true with fill="none"', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 255, g: 0, b: 0 });
    renderer.setLineWidth(1);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 10, y: 0 }], {});
    const output = renderer.getOutput();
    expect(output).toContain('stroke="rgb(255,0,0)"');
    expect(output).toContain('fill="none"');
  });

  test('drawShape with fill=true, stroke=false emits fill colour and stroke="none"', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 128, b: 0 });
    renderer.setLineWidth(1);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 10, y: 0 }], { fill: true, stroke: false });
    const output = renderer.getOutput();
    expect(output).toContain('fill="rgb(0,128,0)"');
    expect(output).toContain('stroke="none"');
  });

  test('drawShape with bulge emits A arc command', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    // bulge = 1 → semicircle CCW
    const p1 = new Point(100, 50, 1);
    const p2 = new Point(-100, 50);
    renderer.drawShape(null, [p1, p2], {});
    expect(renderer.getOutput()).toContain(' A ');
  });

  test('drawShape arc: large-arc-flag is 0 for |bulge| <= 1', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    const p1 = new Point(10, 0, 1); // bulge=1 → semicircle, |bulge| not > 1
    const p2 = new Point(-10, 0);
    renderer.drawShape(null, [p1, p2], {});
    // A rx ry 0 0 sweep x y — large-arc-flag = 0
    expect(renderer.getOutput()).toMatch(/A [\d.]+ [\d.]+ 0 0 /);
  });

  test('drawShape arc: large-arc-flag is 1 for |bulge| > 1', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    const p1 = new Point(10, 0, 2); // |bulge| > 1 → major arc
    const p2 = new Point(-10, 0);
    renderer.drawShape(null, [p1, p2], {});
    // A rx ry 0 1 sweep x y — large-arc-flag = 1
    expect(renderer.getOutput()).toMatch(/A [\d.]+ [\d.]+ 0 1 /);
  });

  test('drawShape arc: sweep-flag is 1 for bulge > 0 (CCW in Y-up)', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    const p1 = new Point(10, 0, 1); // CCW
    const p2 = new Point(-10, 0);
    renderer.drawShape(null, [p1, p2], {});
    // A rx ry 0 large-arc 1 x y
    expect(renderer.getOutput()).toMatch(/A [\d.]+ [\d.]+ 0 \d 1 /);
  });

  test('drawShape arc: sweep-flag is 0 for bulge < 0 (CW in Y-up)', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    const p1 = new Point(10, 0, -1); // CW
    const p2 = new Point(-10, 0);
    renderer.drawShape(null, [p1, p2], {});
    // A rx ry 0 large-arc 0 x y
    expect(renderer.getOutput()).toMatch(/A [\d.]+ [\d.]+ 0 \d 0 /);
  });

  test('drawSegments solid emits one path element', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    renderer.drawSegments([
      { x1: 0, y1: 0, x2: 10, y2: 0 },
      { x1: 20, y1: 0, x2: 30, y2: 0 },
    ], []);
    const output = renderer.getOutput();
    expect(output).toContain('M 0 0 L 10 0');
    expect(output).toContain('M 20 0 L 30 0');
    // Both segments in one <path>
    expect((output.match(/<path/g) ?? []).length).toBe(1);
  });

  test('drawSegments dashed emits one path per segment with stroke-dasharray', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    renderer.drawSegments([
      { x1: 0, y1: 0, x2: 10, y2: 0, dashPhase: 0 },
      { x1: 20, y1: 0, x2: 30, y2: 0, dashPhase: 5 },
    ], [5, 3]);
    const output = renderer.getOutput();
    expect(output).toContain('stroke-dasharray="5,3"');
    expect(output).toContain('stroke-dashoffset="0"');
    expect(output).toContain('stroke-dashoffset="5"');
    expect((output.match(/<path/g) ?? []).length).toBe(2);
  });

  test('drawText emits text element with character and transform', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.drawText(null, [{ char: 'A', x: 10, y: 20, rotation: 0 }], 'Helvetica', 5);
    const output = renderer.getOutput();
    expect(output).toContain('<text');
    expect(output).toContain('>A<');
    expect(output).toContain('font-family="Helvetica"');
    expect(output).toContain('font-size="5"');
    expect(output).toContain('translate(10,20)');
  });

  test('drawText with rotation includes rotate in transform', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    const r = Math.PI / 4; // 45 degrees
    renderer.drawText(null, [{ char: 'X', x: 0, y: 0, rotation: r }], 'Helvetica', 5);
    // -45 degrees in transform (negated for Y-flip compensation)
    expect(renderer.getOutput()).toContain('rotate(-45)');
  });

  test('drawText escapes XML special characters', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.drawText(null, [{ char: '<', x: 0, y: 0, rotation: 0 }], 'Helvetica', 5);
    expect(renderer.getOutput()).toContain('&lt;');
  });
});

describe('SvgRenderer — state methods', () => {
  test('setColour affects stroke and fill on subsequent drawShape', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 100, g: 150, b: 200 });
    renderer.setLineWidth(1);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 1, y: 0 }], {});
    expect(renderer.getOutput()).toContain('rgb(100,150,200)');
  });

  test('setLineWidth affects stroke-width on drawShape', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(3.5);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 1, y: 0 }], {});
    expect(renderer.getOutput()).toContain('stroke-width="3.5"');
  });

  test('setDash with array emits stroke-dasharray on drawShape', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    renderer.setDash([5, 3], 1);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 10, y: 0 }], {});
    const output = renderer.getOutput();
    expect(output).toContain('stroke-dasharray="5,3"');
    expect(output).toContain('stroke-dashoffset="1"');
  });

  test('setHighlight is a no-op (does not add content)', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setHighlight(true, { r: 255, g: 0, b: 0 }, 5);
    const output = renderer.getOutput();
    // Only the structural SVG tags — no extra elements
    expect((output.match(/<path/g) ?? []).length).toBe(0);
    expect((output.match(/<text/g) ?? []).length).toBe(0);
  });
});

describe('SvgRenderer — transform methods', () => {
  test('setTransform emits matrix group', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setTransform({ a: 2, d: 2, e: 10, f: 20 });
    expect(renderer.getOutput()).toContain('matrix(2 0 0 2 10 20)');
  });

  test('setTransform group is automatically closed in getOutput()', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.setTransform({ a: 1, d: 1, e: 0, f: 0 });
    const output = renderer.getOutput();
    // Every <g must have a matching </g>
    const opens = (output.match(/<g[\s>]/g) ?? []).length;
    const closes = (output.match(/<\/g>/g) ?? []).length;
    expect(opens).toBe(closes);
  });

  test('save and restore emit balanced <g> and </g>', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.save();
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(1);
    renderer.drawShape(null, [{ x: 0, y: 0 }, { x: 1, y: 0 }], {});
    renderer.restore();
    const output = renderer.getOutput();
    const opens = (output.match(/<g[\s>]/g) ?? []).length;
    const closes = (output.match(/<\/g>/g) ?? []).length;
    expect(opens).toBe(closes);
  });

  test('applyTransform updates innermost plain <g> with transform attribute', () => {
    const renderer = new SvgRenderer(100, 100);
    renderer.save();
    renderer.applyTransform({ x: 5, y: 10, rotation: 0 });
    renderer.restore();
    expect(renderer.getOutput()).toContain('translate(5,10)');
  });
});

describe('SvgRenderer — measurement', () => {
  test('measureText returns width matching Text.getApproximateWidth', () => {
    const renderer = new SvgRenderer(100, 100);
    const result = renderer.measureText('Hello', 'Helvetica', 10);
    expect(result.width).toBeCloseTo(Text.getApproximateWidth('Hello', 10), 5);
  });

  test('measureCharWidth returns per-character width', () => {
    const renderer = new SvgRenderer(100, 100);
    expect(renderer.measureCharWidth('M')).toBeCloseTo(Text.getApproximateWidth('M', 1), 5);
  });
});
