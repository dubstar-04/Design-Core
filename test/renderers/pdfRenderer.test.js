import { PdfRenderer } from '../../core/lib/renderers/pdfRenderer.js';
import { Text } from '../../core/entities/text.js';

describe('PdfRenderer — getOutput()', () => {
  test('produces a valid PDF header', () => {
    const renderer = new PdfRenderer(100, 100);
    const output = renderer.getOutput();
    expect(output.startsWith('%PDF-1.4')).toBe(true);
  });

  test('ends with %%EOF', () => {
    const renderer = new PdfRenderer(100, 100);
    const output = renderer.getOutput();
    expect(output.endsWith('%%EOF')).toBe(true);
  });

  test('contains required PDF structural elements', () => {
    const renderer = new PdfRenderer(595, 842);
    const output = renderer.getOutput();
    expect(output).toContain('/Catalog');
    expect(output).toContain('/Pages');
    expect(output).toContain('/Page');
    expect(output).toContain('/MediaBox [0 0 595 842]');
    expect(output).toContain('/Helvetica');
    expect(output).toContain('xref');
    expect(output).toContain('trailer');
    expect(output).toContain('startxref');
  });
});

describe('PdfRenderer — drawing', () => {
  test('drawShape emits m, l, and S operators', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawShape([{ x: 0, y: 0 }, { x: 10, y: 20 }], {});
    const output = renderer.getOutput();
    expect(output).toContain('0 0 m');
    expect(output).toContain('10 20 l');
    expect(output).toContain('S');
  });

  test('drawShape with closed=true emits h before S', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }], { closed: true });
    const output = renderer.getOutput();
    const hPos = output.indexOf('\nh\n');
    const sPos = output.indexOf('\nS\n');
    expect(hPos).toBeGreaterThan(-1);
    expect(sPos).toBeGreaterThan(hPos);
  });

  test('drawShape with fill+stroke emits B operator', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { fill: true, stroke: true });
    const output = renderer.getOutput();
    expect(output).toContain('\nB\n');
  });

  test('drawShape with fill only emits f operator', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { fill: true, stroke: false });
    const output = renderer.getOutput();
    expect(output).toContain('\nf\n');
  });

  test('drawShape with bulge emits chord (straight line)', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawShape([{ x: 0, y: 0, bulge: 1 }, { x: 10, y: 0 }], {});
    const output = renderer.getOutput();
    // Chord approximation: bulge point emits l, not c
    expect(output).toContain('10 0 l');
  });

  test('drawSegments solid batches all segments with one S', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawSegments([
      { x1: 0, y1: 0, x2: 10, y2: 0 },
      { x1: 20, y1: 0, x2: 30, y2: 0 },
    ], []);
    const output = renderer.getOutput();
    expect(output).toContain('0 0 m');
    expect(output).toContain('10 0 l');
    expect(output).toContain('20 0 m');
    expect(output).toContain('30 0 l');
    // Only one S for the entire batch
    const streamStart = output.indexOf('stream\n') + 'stream\n'.length;
    const streamEnd = output.indexOf('\nendstream');
    const streamContent = output.slice(streamStart, streamEnd);
    expect(streamContent.split('\nS').length - 1).toBe(1);
  });

  test('drawSegments dashed emits d operator per segment', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawSegments([
      { x1: 0, y1: 0, x2: 10, y2: 0, dashPhase: 0 },
      { x1: 20, y1: 0, x2: 30, y2: 0, dashPhase: 5 },
    ], [5, 3]);
    const output = renderer.getOutput();
    expect(output).toContain('[5 3] 0 d');
    expect(output).toContain('[5 3] 5 d');
  });

  test('drawText emits BT block with character and position transform', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.drawText([{ char: 'A', x: 10, y: 20, rotation: 0 }], 'Helvetica', 5);
    const output = renderer.getOutput();
    expect(output).toContain('BT');
    expect(output).toContain('ET');
    expect(output).toContain('(A)');
    expect(output).toContain('10 20 cm');
  });

  test('drawText with rotation applies sin/cos transform', () => {
    const renderer = new PdfRenderer(100, 100);
    const r = Math.PI / 4; // 45 degrees
    renderer.drawText([{ char: 'X', x: 0, y: 0, rotation: r }], 'Helvetica', 5);
    const output = renderer.getOutput();
    // cos(π/4) ≈ 0.7071, sin(π/4) ≈ 0.7071
    expect(output).toContain('0.7071');
  });
});

describe('PdfRenderer — state methods', () => {
  test('setColour emits RG and rg operators', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.setColour({ r: 255, g: 0, b: 0 });
    const output = renderer.getOutput();
    expect(output).toContain('1 0 0 RG');
    expect(output).toContain('1 0 0 rg');
  });

  test('setLineWidth emits w operator', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.setLineWidth(2.5);
    const output = renderer.getOutput();
    expect(output).toContain('2.5 w');
  });

  test('setDash with array emits d operator', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.setDash([5, 3], 1);
    const output = renderer.getOutput();
    expect(output).toContain('[5 3] 1 d');
  });

  test('setDash with empty array emits solid line operator', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.setDash([], 0);
    const output = renderer.getOutput();
    expect(output).toContain('[] 0 d');
  });

  test('setHighlight is a no-op (does not add content)', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.setHighlight(true, { r: 255, g: 0, b: 0 }, 5);
    const streamContent = renderer.getOutput().match(/stream\n([\s\S]*?)\nendstream/)[1];
    expect(streamContent).toBe('');
  });

  test('fillBackground is a no-op (does not add content)', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.setBackgroundColour({ r: 0, g: 0, b: 0 });
    renderer.fillBackground();
    const streamContent = renderer.getOutput().match(/stream\n([\s\S]*?)\nendstream/)[1];
    expect(streamContent).toBe('');
  });
});

describe('PdfRenderer — transform methods', () => {
  test('setTransform emits cm operator with matrix values', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.setTransform({ a: 2, d: 2, e: 10, f: 20 });
    const output = renderer.getOutput();
    expect(output).toContain('2 0 0 2 10 20 cm');
  });

  test('applyTransform with no rotation emits identity-rotate cm', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.applyTransform({ x: 5, y: 10, rotation: 0 });
    const output = renderer.getOutput();
    expect(output).toContain('1 0 0 1 5 10 cm');
  });

  test('save emits q operator', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.save();
    const output = renderer.getOutput();
    expect(output).toContain('\nq\n');
  });

  test('restore emits Q operator', () => {
    const renderer = new PdfRenderer(100, 100);
    renderer.restore();
    const output = renderer.getOutput();
    expect(output).toContain('\nQ\n');
  });
});

describe('PdfRenderer — measurement', () => {
  test('measureText returns width matching Text.getApproximateWidth', () => {
    const renderer = new PdfRenderer(100, 100);
    const result = renderer.measureText('Hello', 'Helvetica', 10);
    expect(result).toEqual({ width: Text.getApproximateWidth('Hello', 10) });
  });

  test('measureCharWidth returns value matching Text.getApproximateWidth', () => {
    const renderer = new PdfRenderer(100, 100);
    const result = renderer.measureCharWidth('A');
    expect(result).toBe(Text.getApproximateWidth('A', 1));
  });
});
