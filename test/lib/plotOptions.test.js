import { PlotOptions } from '../../core/lib/plotOptions.js';
import { RendererBase } from '../../core/lib/renderers/rendererBase.js';

// ─── Constructor ─────────────────────────────────────────────────────────────

test('constructor stores pageWidth and pageHeight', () => {
  const po = new PlotOptions(595, 842);
  expect(po.pageWidth).toBe(595);
  expect(po.pageHeight).toBe(842);
});

test('constructor sets default plotScale to null', () => {
  const po = new PlotOptions(595, 842);
  expect(po.plotScale).toBeNull();
});

test('constructor sets default plotArea to PlotOptions.Area.EXTENTS', () => {
  const po = new PlotOptions(595, 842);
  expect(po.plotArea).toBe(PlotOptions.Area.EXTENTS);
});

test('constructor sets default style to RendererBase.Styles.NONE', () => {
  const po = new PlotOptions(595, 842);
  expect(po.style).toBe(RendererBase.Styles.NONE);
});

test('constructor sets default fileType to pdf', () => {
  const po = new PlotOptions(595, 842);
  expect(po.fileType).toBe('pdf');
});

test('constructor throws when pageWidth is missing', () => {
  expect(() => new PlotOptions(undefined, 842)).toThrow('pageWidth');
});

test('constructor throws when pageHeight is missing', () => {
  expect(() => new PlotOptions(595, undefined)).toThrow('pageHeight');
});

test('constructor throws when pageWidth is zero', () => {
  expect(() => new PlotOptions(0, 842)).toThrow('pageWidth');
});

test('constructor throws when pageWidth is negative', () => {
  expect(() => new PlotOptions(-1, 842)).toThrow('pageWidth');
});

test('constructor throws when pageHeight is zero', () => {
  expect(() => new PlotOptions(595, 0)).toThrow('pageHeight');
});

test('constructor throws when pageWidth is a string', () => {
  expect(() => new PlotOptions('595', 842)).toThrow('pageWidth');
});

// ─── static Area ─────────────────────────────────────────────────────────────

test('PlotOptions.Area.EXTENTS is defined', () => {
  expect(PlotOptions.Area.EXTENTS).toBeDefined();
});

test('PlotOptions.Area.DISPLAY is defined', () => {
  expect(PlotOptions.Area.DISPLAY).toBeDefined();
});

test('PlotOptions.Area.EXTENTS and DISPLAY are distinct values', () => {
  expect(PlotOptions.Area.EXTENTS).not.toBe(PlotOptions.Area.DISPLAY);
});

// ─── setOption — pageWidth / pageHeight ──────────────────────────────────────

test('setOption updates pageWidth to a valid value', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('pageWidth', 420);
  expect(po.pageWidth).toBe(420);
});

test('setOption throws for non-positive pageWidth', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('pageWidth', 0)).toThrow('pageWidth');
});

test('setOption throws for non-numeric pageHeight', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('pageHeight', 'tall')).toThrow('pageHeight');
});

// ─── setOption — plotScale ────────────────────────────────────────────────────

test('setOption accepts null for plotScale', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('plotScale', null);
  expect(po.plotScale).toBeNull();
});

test('setOption accepts a positive number for plotScale', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('plotScale', 0.5);
  expect(po.plotScale).toBe(0.5);
});

test('setOption throws for zero plotScale', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('plotScale', 0)).toThrow('plotScale');
});

test('setOption throws for negative plotScale', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('plotScale', -1)).toThrow('plotScale');
});

test('setOption throws for non-null non-number plotScale', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('plotScale', 'fit')).toThrow('plotScale');
});

// ─── setOption — plotArea ─────────────────────────────────────────────────────

test('setOption accepts PlotOptions.Area.EXTENTS for plotArea', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('plotArea', PlotOptions.Area.EXTENTS);
  expect(po.plotArea).toBe(PlotOptions.Area.EXTENTS);
});

test('setOption accepts PlotOptions.Area.DISPLAY for plotArea', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('plotArea', PlotOptions.Area.DISPLAY);
  expect(po.plotArea).toBe(PlotOptions.Area.DISPLAY);
});

test('setOption throws for an unknown plotArea value', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('plotArea', 'Window')).toThrow('plotArea');
});

// ─── setOption — style ────────────────────────────────────────────────────────

test('setOption accepts RendererBase.Styles.NONE for style', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('style', RendererBase.Styles.NONE);
  expect(po.style).toBe(RendererBase.Styles.NONE);
});

test('setOption accepts RendererBase.Styles.MONOCHROME for style', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('style', RendererBase.Styles.MONOCHROME);
  expect(po.style).toBe(RendererBase.Styles.MONOCHROME);
});

test('setOption throws when style is not a function', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('style', 'monochrome')).toThrow('style');
});

// ─── setOption — fileType ─────────────────────────────────────────────────────

test('setOption accepts pdf for fileType', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('fileType', 'pdf');
  expect(po.fileType).toBe('pdf');
});

test('setOption accepts svg for fileType', () => {
  const po = new PlotOptions(595, 842);
  po.setOption('fileType', 'svg');
  expect(po.fileType).toBe('svg');
});

test('setOption throws for an unknown fileType', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('fileType', 'png')).toThrow('fileType');
});

// ─── setOption — unknown key ──────────────────────────────────────────────────

test('setOption throws for an unknown key', () => {
  const po = new PlotOptions(595, 842);
  expect(() => po.setOption('colour', 'red')).toThrow("unknown option 'colour'");
});
