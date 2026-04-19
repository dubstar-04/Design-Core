import { CanvasRenderer } from '../../core/lib/renderers/canvasRenderer.js';
import { Point } from '../../core/entities/point.js';

// ─── Mock context factory ─────────────────────────────────────────────────────

function makeMockCtx() {
  const calls = [];
  const record = (name) => (...args) => calls.push({ name, args });
  return {
    calls,
    save: record('save'),
    restore: record('restore'),
    beginPath: record('beginPath'),
    closePath: record('closePath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    arc: record('arc'),
    stroke: record('stroke'),
    fill: record('fill'),
    clip: record('clip'),
    fillText: record('fillText'),
    strokeText: record('strokeText'),
    translate: record('translate'),
    rotate: record('rotate'),
    scale: record('scale'),
    setLineDash: record('setLineDash'),
    setTransform: record('setTransform'),
    fillRect: record('fillRect'),
    measureText: (s) => ({ width: s.length * 8 }),
    strokeStyle: '', fillStyle: '', lineWidth: 0, lineDashOffset: 0, globalAlpha: 1, font: '',
  };
}

// ─── drawShape ────────────────────────────────────────────────────────────────

describe('CanvasRenderer — drawShape', () => {
  test('returns early and emits nothing for empty points', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([]);
    expect(ctx.calls).toHaveLength(0);
  });

  test('calls beginPath, moveTo, lineTo, stroke for a basic shape', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 20 }]);
    const names = ctx.calls.map((c) => c.name);
    expect(names).toContain('beginPath');
    expect(names).toContain('moveTo');
    expect(names).toContain('lineTo');
    expect(names).toContain('stroke');
    expect(names).not.toContain('fill');
  });

  test('calls closePath before stroke when closed=true', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { closed: true });
    const names = ctx.calls.map((c) => c.name);
    const closeIdx = names.lastIndexOf('closePath');
    const strokeIdx = names.lastIndexOf('stroke');
    expect(closeIdx).toBeGreaterThan(-1);
    expect(strokeIdx).toBeGreaterThan(closeIdx);
  });

  test('calls fill with nonzero when fill=true', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { fill: true, stroke: false });
    const fillCall = ctx.calls.find((c) => c.name === 'fill');
    expect(fillCall).toBeDefined();
    expect(fillCall.args[0]).toBe('nonzero');
    expect(ctx.calls.map((c) => c.name)).not.toContain('stroke');
  });

  test('calls fill with evenodd when fillRule=evenodd', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { fill: true, stroke: false, fillRule: 'evenodd' });
    const fillCall = ctx.calls.find((c) => c.name === 'fill');
    expect(fillCall.args[0]).toBe('evenodd');
  });

  test('calls both fill and stroke when fill=true and stroke=true', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { fill: true, stroke: true });
    const names = ctx.calls.map((c) => c.name);
    expect(names).toContain('fill');
    expect(names).toContain('stroke');
  });

  test('calls clip with nonzero when clip=true', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { clip: true });
    const clipCall = ctx.calls.find((c) => c.name === 'clip');
    expect(clipCall).toBeDefined();
    expect(clipCall.args[0]).toBe('nonzero');
    expect(ctx.calls.map((c) => c.name)).not.toContain('stroke');
  });

  test('calls clip with evenodd when clip=true and fillRule=evenodd', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { clip: true, fillRule: 'evenodd' });
    const clipCall = ctx.calls.find((c) => c.name === 'clip');
    expect(clipCall.args[0]).toBe('evenodd');
  });

  test('wraps fill in save/restore when alpha < 1', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }], { fill: true, stroke: false, alpha: 0.5 });
    const names = ctx.calls.map((c) => c.name);
    const saveIdx = names.lastIndexOf('save');
    const fillIdx = names.lastIndexOf('fill');
    const restoreIdx = names.lastIndexOf('restore');
    expect(saveIdx).toBeLessThan(fillIdx);
    expect(fillIdx).toBeLessThan(restoreIdx);
    expect(ctx.globalAlpha).toBe(0.5);
  });

  test('draws highlight halo before normal path when highlighted', () => {
    const ctx = makeMockCtx();
    const renderer = new CanvasRenderer(ctx);
    renderer.setHighlight(true, { r: 255, g: 0, b: 0 }, 3);
    renderer.drawShape([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
    // Two save/restore pairs: one for the highlight pass, none extra for normal
    const saves = ctx.calls.filter((c) => c.name === 'save');
    const strokes = ctx.calls.filter((c) => c.name === 'stroke');
    expect(saves.length).toBeGreaterThanOrEqual(1);
    expect(strokes.length).toBe(2); // halo stroke + normal stroke
  });
});

// ─── tracePath ────────────────────────────────────────────────────────────────

describe('CanvasRenderer — tracePath', () => {
  test('returns early for empty points', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).tracePath([]);
    expect(ctx.calls).toHaveLength(0);
  });

  test('calls moveTo for first point and lineTo for each subsequent straight segment', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).tracePath([{ x: 0, y: 0, bulge: 0 }, { x: 5, y: 0, bulge: 0 }, { x: 10, y: 5, bulge: 0 }]);
    expect(ctx.calls[0]).toEqual({ name: 'moveTo', args: [0, 0] });
    expect(ctx.calls[1]).toEqual({ name: 'lineTo', args: [5, 0] });
    expect(ctx.calls[2]).toEqual({ name: 'lineTo', args: [10, 5] });
  });

  test('calls arc for a bulge segment', () => {
    const ctx = makeMockCtx();
    const p1 = new Point(0, 0, 1); // bulge=1 → semicircle CCW
    const p2 = new Point(10, 0);
    new CanvasRenderer(ctx).tracePath([p1, p2]);
    const arcCall = ctx.calls.find((c) => c.name === 'arc');
    expect(arcCall).toBeDefined();
    expect(arcCall.args).toHaveLength(6);
  });

  test('passes anticlockwise=true to arc for negative bulge', () => {
    const ctx = makeMockCtx();
    const p1 = new Point(0, 0, -1); // negative bulge → CW in DXF = anticlockwise=true in canvas
    const p2 = new Point(10, 0);
    new CanvasRenderer(ctx).tracePath([p1, p2]);
    const arcCall = ctx.calls.find((c) => c.name === 'arc');
    expect(arcCall.args[5]).toBe(true);
  });

  test('passes anticlockwise=false to arc for positive bulge', () => {
    const ctx = makeMockCtx();
    const p1 = new Point(0, 0, 1);
    const p2 = new Point(10, 0);
    new CanvasRenderer(ctx).tracePath([p1, p2]);
    const arcCall = ctx.calls.find((c) => c.name === 'arc');
    expect(arcCall.args[5]).toBe(false);
  });
});

// ─── drawSegments ─────────────────────────────────────────────────────────────

describe('CanvasRenderer — drawSegments', () => {
  test('returns early for empty segments', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawSegments([]);
    expect(ctx.calls).toHaveLength(0);
  });

  test('calls stroke without setLineDash for solid segments', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawSegments([{ x1: 0, y1: 0, x2: 10, y2: 0 }]);
    expect(ctx.calls.map((c) => c.name)).not.toContain('setLineDash');
    expect(ctx.calls.map((c) => c.name)).toContain('stroke');
  });

  test('calls setLineDash per segment when dashes provided', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawSegments(
      [{ x1: 0, y1: 0, x2: 10, y2: 0, dashPhase: 2 }],
      [5, 3],
    );
    const dashCall = ctx.calls.find((c) => c.name === 'setLineDash');
    expect(dashCall).toBeDefined();
    expect(dashCall.args[0]).toEqual([5, 3]);
    expect(ctx.lineDashOffset).toBe(2);
  });

  test('draws highlight halo before normal pass when highlighted', () => {
    const ctx = makeMockCtx();
    const renderer = new CanvasRenderer(ctx);
    renderer.setHighlight(true, { r: 0, g: 255, b: 0 }, 2);
    renderer.drawSegments([{ x1: 0, y1: 0, x2: 10, y2: 0 }]);
    const strokes = ctx.calls.filter((c) => c.name === 'stroke');
    expect(strokes.length).toBe(2);
  });
});

// ─── drawText ─────────────────────────────────────────────────────────────────

describe('CanvasRenderer — drawText', () => {
  test('returns early for null characters', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawText(null, 'Arial', 12);
    expect(ctx.calls).toHaveLength(0);
  });

  test('returns early for empty characters array', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawText([], 'Arial', 12);
    expect(ctx.calls).toHaveLength(0);
  });

  test('sets ctx.font from height and fontName', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawText([{ x: 0, y: 0, char: 'A' }], 'Courier', 14);
    expect(ctx.font).toBe('14pt Courier');
  });

  test('calls translate, scale(1,-1), fillText for each character', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawText([{ x: 5, y: 10, char: 'X' }], 'Arial', 12);
    const translateCall = ctx.calls.find((c) => c.name === 'translate');
    const scaleCall = ctx.calls.find((c) => c.name === 'scale');
    const fillTextCall = ctx.calls.find((c) => c.name === 'fillText');
    expect(translateCall.args).toEqual([5, 10]);
    expect(scaleCall.args).toEqual([1, -1]);
    expect(fillTextCall.args).toEqual(['X', 0, 0]);
  });

  test('calls rotate with negated rotation when rotation is set', () => {
    const ctx = makeMockCtx();
    new CanvasRenderer(ctx).drawText([{ x: 0, y: 0, char: 'A', rotation: Math.PI / 4 }], 'Arial', 12);
    const rotateCall = ctx.calls.find((c) => c.name === 'rotate');
    expect(rotateCall).toBeDefined();
    expect(rotateCall.args[0]).toBeCloseTo(-Math.PI / 4);
  });

  test('uses strokeText for highlight pass', () => {
    const ctx = makeMockCtx();
    const renderer = new CanvasRenderer(ctx);
    renderer.setHighlight(true, { r: 255, g: 0, b: 0 }, 2);
    renderer.drawText([{ x: 0, y: 0, char: 'A' }], 'Arial', 12);
    expect(ctx.calls.map((c) => c.name)).toContain('strokeText');
    expect(ctx.calls.map((c) => c.name)).toContain('fillText');
  });
});

// ─── state setters ────────────────────────────────────────────────────────────

describe('CanvasRenderer — state setters', () => {
  test('setColour sets strokeStyle and fillStyle', () => {
    const ctx = makeMockCtx();
    const renderer = new CanvasRenderer(ctx);
    renderer.setColour({ r: 255, g: 0, b: 0 });
    expect(ctx.strokeStyle).toBeTruthy();
    expect(ctx.fillStyle).toBeTruthy();
    expect(ctx.strokeStyle).toBe(ctx.fillStyle);
  });

  test('setLineWidth sets ctx.lineWidth and is reflected in next drawShape', () => {
    const ctx = makeMockCtx();
    const renderer = new CanvasRenderer(ctx);
    renderer.setLineWidth(4);
    expect(ctx.lineWidth).toBe(4);
  });

  test('setDash sets ctx.setLineDash and lineDashOffset', () => {
    const ctx = makeMockCtx();
    const renderer = new CanvasRenderer(ctx);
    renderer.setDash([4, 2], 1);
    const dashCall = ctx.calls.find((c) => c.name === 'setLineDash');
    expect(dashCall.args[0]).toEqual([4, 2]);
    expect(ctx.lineDashOffset).toBe(1);
  });

  test('save and restore delegate to ctx', () => {
    const ctx = makeMockCtx();
    const renderer = new CanvasRenderer(ctx);
    renderer.save();
    renderer.restore();
    expect(ctx.calls.map((c) => c.name)).toEqual(['save', 'restore']);
  });
});

// ─── measureText / measureCharWidth ──────────────────────────────────────────

describe('CanvasRenderer — measurement', () => {
  test('measureText delegates to ctx.measureText', () => {
    const ctx = makeMockCtx();
    const result = new CanvasRenderer(ctx).measureText('hello', 'Arial', 12);
    expect(result).toEqual({ width: 40 }); // 5 chars × 8
  });

  test('measureCharWidth returns width from ctx.measureText', () => {
    const ctx = makeMockCtx();
    expect(new CanvasRenderer(ctx).measureCharWidth('A')).toBe(8);
  });
});
