import { jest } from '@jest/globals';
import { Core } from '../../../core/core/core.js';
import { DesignCore } from '../../../core/designCore.js';
import { DXF } from '../../../core/lib/dxf/dxf.js';
import { Logging } from '../../../core/lib/logging.js';
import { Point } from '../../../core/entities/point.js';

beforeEach(() => {
  new Core();
});

test('DXF prepares points before entity-specific geometry normalisation', () => {
  const dxf = new DXF();
  dxf.reader = {
    entities: [
      { 0: 'CIRCLE', 40: 5, points: [{ x: 2, y: 3 }] },
      { 0: 'ARC', 40: 2, 50: 0, 51: 90, points: [{ x: 0, y: 0 }] },
      { 0: 'TEXT', 1: 'Rotated', 40: 2, 50: 90, points: [{ x: 10, y: 10 }] },
    ],
  };
  dxf.loadEntities();

  const [circle, arc, text] = DesignCore.Scene.entities.getAll();
  expect(circle.getRadius()).toBe(5);
  expect(arc.points).toHaveLength(3);
  expect(arc.points[1].isSame(new Point(2, 0))).toBe(true);
  expect(arc.points[2].isSame(new Point(0, 2))).toBe(true);
  expect(text.points[1].isSame(new Point(10, 12))).toBe(true);
  expect(dxf.reader.entities[0].points).toHaveLength(1);
  expect(dxf.reader.entities[0].points[0]).not.toBeInstanceOf(Point);
});

test('DXF normalisation errors are reported without preventing other records from loading', () => {
  const warn = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  try {
    const dxf = new DXF();
    dxf.reader = {
      entities: [
        { 0: 'ARC', points: null },
        { 0: 'CIRCLE', 40: 2, points: [{ x: 0, y: 0 }] },
      ],
    };
    dxf.loadEntities();

    expect(dxf.unsupportedElements).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ARC'));
    expect(DesignCore.Scene.entities.count()).toBe(1);
    expect(DesignCore.Scene.entities.get(0).getRadius()).toBe(2);
  } finally {
    warn.mockRestore();
  }
});

test('DXF still reports unsupported records after reference linking', () => {
  const warn = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  try {
    const dxf = new DXF();
    dxf.reader = {
      entities: [
        { 0: 'UNSUPPORTED_ENTITY', 5: 'AA' },
        { 0: 'CIRCLE', 40: 2, points: [{ x: 0, y: 0 }] },
      ],
    };
    dxf.loadEntities();
    expect(dxf.unsupportedElements).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UNSUPPORTED_ENTITY'));
    expect(DesignCore.Scene.entities.count()).toBe(1);
  } finally {
    warn.mockRestore();
  }
});

test('DXF clears previous scene entities even when all incoming records fail normalisation', () => {
  DesignCore.Scene.entities.create('Circle', { points: [new Point()], radius: 2 });
  const warn = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
  try {
    const dxf = new DXF();
    dxf.reader = { entities: [{ 0: 'ARC', points: null }] };
    dxf.loadEntities();
    expect(DesignCore.Scene.entities.count()).toBe(0);
    expect(dxf.unsupportedElements).toBe(true);
    expect(warn).toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
