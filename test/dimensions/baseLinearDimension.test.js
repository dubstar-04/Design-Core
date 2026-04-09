import { AlignedDimension } from '../../core/dimensions/alignedDimension.js';
import { BaseLinearDimension } from '../../core/dimensions/baseLinearDimension.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

// ─── constructor ─────────────────────────────────────────────────────────────

test('BaseLinearDimension can be instantiated', () => {
  const dim = new BaseLinearDimension();
  expect(dim).toBeInstanceOf(BaseLinearDimension);
  expect(dim.points).toBeDefined();
  expect(Array.isArray(dim.points)).toBe(true);
});

// ─── preview ─────────────────────────────────────────────────────────────────

test('BaseLinearDimension.preview - 0 points does nothing', () => {
  const dim = new AlignedDimension();
  DesignCore.Scene.auxiliaryEntities.clear();
  DesignCore.Scene.tempEntities.clear();

  expect(() => dim.preview()).not.toThrow();
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(0);
  expect(DesignCore.Scene.tempEntities.count()).toBe(0);
});

test('BaseLinearDimension.preview - 1 point adds RubberBand to auxiliaryEntities', () => {
  const dim = new AlignedDimension();
  dim.points = [new Point(0, 0)];

  const origAdd = DesignCore.Scene.auxiliaryEntities.add;
  const added = [];
  DesignCore.Scene.auxiliaryEntities.add = (item) => added.push(item);
  DesignCore.Scene.tempEntities.clear();

  expect(() => dim.preview()).not.toThrow();
  expect(added.length).toBeGreaterThanOrEqual(1);
  expect(DesignCore.Scene.tempEntities.count()).toBe(0);

  DesignCore.Scene.auxiliaryEntities.add = origAdd;
});

test('BaseLinearDimension.preview - >1 points creates temp entity', () => {
  const dim = new AlignedDimension();
  dim.points = [new Point(0, 0), new Point(10, 0)];

  const origCreate = DesignCore.Scene.tempEntities.create;
  const created = [];
  DesignCore.Scene.tempEntities.create = (type, data) => created.push({ type, data });
  DesignCore.Scene.auxiliaryEntities.clear();

  expect(() => dim.preview()).not.toThrow();
  expect(created.length).toBeGreaterThanOrEqual(1);
  expect(created[0].type).toBe(dim.type);
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(0);

  DesignCore.Scene.tempEntities.create = origCreate;
});
