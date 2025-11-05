import { BaseDimension } from '../../core/dimensions/baseDimension.js';
import { Point } from '../../core/entities/point.js';
import { Core } from '../../core/core/core.js';
import { Text } from '../../core/entities/text.js';
// import { DimType } from '../../core/properties/dimType.js';

// initialise core
new Core();

describe('BaseDimension', () => {
  let baseDim;

  beforeEach(() => {
    baseDim = new BaseDimension({});
    baseDim.points = [new Point(1, 2, 0), new Point(3, 4, 0)];
  });

  test('constructor sets default properties', () => {
    expect(baseDim.textOverride).toBe('');
    expect(baseDim.blockName).toBe('');
    expect(baseDim.dimensionStyle).toBe('STANDARD');
    expect(baseDim.leaderLength).toBe(0);
    expect(baseDim.linearDimAngle).toBe(0);
  });

  test('getDimensionValue formats values by type', () => {
    baseDim.dimType.setDimType(0);
    expect(baseDim.getDimensionValue(12.3456)).toBe('12.3456');
    baseDim.dimType.setDimType(2);
    expect(baseDim.getDimensionValue(45)).toContain('°');
    baseDim.dimType.setDimType(3);
    expect(baseDim.getDimensionValue(10)).toContain('Ø');
    baseDim.dimType.setDimType(4);
    expect(baseDim.getDimensionValue(5)).toContain('R');
    baseDim.dimType.setDimType(6);
    expect(baseDim.getDimensionValue(7)).toContain('7.00');
  });

  test('constructor throws on invalid dimType', () => {
    expect(() => new BaseDimension({ 70: 999 })).toThrow(/Invalid Dimension Type/);
  });

  test('getDimensionValue uses textOverride', () => {
    baseDim.textOverride = 'foo <> bar';
    expect(baseDim.getDimensionValue(10)).toBe('foo 10.0000 bar');
  });

  test('getDimensionText returns a Text object with correct values', () => {
    const text = baseDim.getDimensionText(10, new Point(1, 2), Math.PI / 4);
    expect(text).toBeInstanceOf(Text);
    expect(text.height).toBe(0.18);
    expect(text.points[0].x).toBe(1);
    expect(text.points[0].y).toBe(2);
    expect(typeof text.string).toBe('string');
  });

  test('getTextDirection flips angle in lower half', () => {
    expect(baseDim.getTextDirection(Math.PI)).toBeCloseTo(Math.PI * 2);
    expect(baseDim.getTextDirection(0)).toBe(0);
  });

  test('alignedOrOpposite returns true for aligned/opposite angles', () => {
    expect(baseDim.alignedOrOpposite(0, 0)).toBe(true);
    expect(baseDim.alignedOrOpposite(0, Math.PI)).toBe(true);
    expect(baseDim.alignedOrOpposite(0, Math.PI / 2)).toBe(false);
  });

  // test('getDimensionStyle returns style object', () => {
  //  expect(baseDim.getDimensionStyle()).toBe(styleMock);
  // });

  test('getPointBySequence returns correct point', () => {
    baseDim.points = [Object.assign(new Point(1, 2), { sequence: 10 }), Object.assign(new Point(3, 4), { sequence: 15 })];
    expect(baseDim.getPointBySequence(baseDim.points, 15).x).toBe(3);
    expect(baseDim.getPointBySequence(baseDim.points, 99)).toBeNull();
  });

  test('getArrowHead returns a Solid', () => {
    const solid = baseDim.getArrowHead(new Point(0, 0), 0);
    expect(solid).toBeDefined();
    expect(solid.points.length).toBe(3);
  });

  test('getCentreMark returns lines for markStyle > 0', () => {
    const lines = baseDim.getCentreMark(new Point(0, 0));
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });


  test('snaps returns empty array', () => {
    expect(baseDim.snaps(new Point(0, 0), 1)).toEqual([]);
  });

  test('closestPoint delegates to block', () => {
    baseDim.block = { closestPoint: () => 'foo' };
    expect(baseDim.closestPoint(new Point(0, 0))).toBe('foo');
  });

  test('boundingBox delegates to block', () => {
    baseDim.block = { boundingBox: () => 'box' };
    expect(baseDim.boundingBox()).toBe('box');
  });

  test('within delegates to block', () => {
    baseDim.block = { within: () => true };
    expect(baseDim.within([])).toBe(true);
  });

  test('intersectPoints delegates to block', () => {
    baseDim.block = { intersectPoints: () => 'ip' };
    expect(baseDim.intersectPoints()).toBe('ip');
  });

  test('touched delegates to block', () => {
    baseDim.block = { touched: () => false };
    expect(baseDim.touched([])).toBe(false);
  });
});
