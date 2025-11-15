import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Line } from '../../core/entities/line.js';
import { Circle } from '../../core/entities/circle.js';
import { Point } from '../../core/entities/point.js';

// initialise core (also activates DesignCore facade)
new Core();

describe('EntityManager', () => {
  beforeEach(() => {
    // reset scene entities before each test
    DesignCore.Scene.clear();
  });

  test('create adds a new entity with current layer', () => {
    const mgr = DesignCore.Scene.entities;
    const p1 = new Point(0, 0);
    const p2 = new Point(10, 0);

    mgr.create('Line', { points: [p1, p2] });

    expect(mgr.count()).toBe(1);
    const ent = mgr.get(0);
    expect(ent).toBeInstanceOf(Line);
    expect(ent.layer).toBe(DesignCore.LayerManager.getCstyle());
  });

  test('add/get/count manage entities correctly', () => {
    const mgr = DesignCore.Scene.entities;
    const line = new Line({ points: [new Point(0, 0), new Point(1, 1)] });
    expect(mgr.count()).toBe(0);
    mgr.add(line);
    expect(mgr.count()).toBe(1);
    expect(mgr.get(0)).toBe(line);
  });

  test('replace swaps entity at index', () => {
    const mgr = DesignCore.Scene.entities;
    const line = new Line({ points: [new Point(0, 0), new Point(1, 1)] });
    const circle = new Circle({ points: [new Point(5, 5)], radius: 2 });
    mgr.add(line);
    expect(mgr.get(0)).toBeInstanceOf(Line);
    mgr.replace(0, circle);
    expect(mgr.get(0)).toBe(circle);
    expect(mgr.get(0)).toBeInstanceOf(Circle);
  });

  test('remove deletes entity at index', () => {
    const mgr = DesignCore.Scene.entities;
    const l1 = new Line({ points: [new Point(0, 0), new Point(1, 0)] });
    const l2 = new Line({ points: [new Point(0, 1), new Point(1, 1)] });
    mgr.add(l1);
    mgr.add(l2);
    expect(mgr.count()).toBe(2);
    mgr.remove(0);
    expect(mgr.count()).toBe(1);
    expect(mgr.get(0)).toBe(l2);
  });

  test('find returns indices matching type and property', () => {
    const mgr = DesignCore.Scene.entities;
    const l1 = new Line({ points: [new Point(0, 0), new Point(1, 0)], lineWidth: 5 });
    const l2 = new Line({ points: [new Point(0, 1), new Point(1, 1)], lineWidth: 2 });
    mgr.add(l1);
    mgr.add(l2);

    const found = mgr.find('Line', 'lineWidth', 5);
    console.log('FOUND:', found);
    expect(found).toEqual([0]);

    const anyFound = mgr.find('ANY', 'lineWidth', 2);
    expect(anyFound).toEqual([1]);
  });

  test('findClosest returns index of nearest selectable entity', () => {
    const mgr = DesignCore.Scene.entities;
    // two horizontal lines at y=0 and y=10
    const l1 = new Line({ points: [new Point(0, 0), new Point(100, 0)] });
    const l2 = new Line({ points: [new Point(0, 10), new Point(100, 10)] });
    mgr.add(l1);
    mgr.add(l2);

    // point closer to y=10 line
    const p = new Point(50, 9.9);
    const idx = mgr.findClosest(p);
    expect(idx).toBe(1);
  });

  test('update applies setProperty for existing keys only', () => {
    const mgr = DesignCore.Scene.entities;
    const l = new Line({ points: [new Point(0, 0), new Point(1, 1)] });
    mgr.add(l);

    const newP1 = new Point(2, 2);
    const newP2 = new Point(3, 3);
    mgr.update(0, { points: [newP1, newP2], nonExistent: 123 });

    expect(mgr.get(0).points[0].x).toBe(2);
    expect(mgr.get(0).points[0].y).toBe(2);
    expect(mgr.get(0).points[1].x).toBe(3);
    expect(mgr.get(0).points[1].y).toBe(3);
    // nonExistent should be ignored
    expect(mgr.get(0).nonExistent).toBeUndefined();
  });

  test('count and clear reflect entity storage size', () => {
    const mgr = DesignCore.Scene.entities;
    mgr.add(new Line({ points: [new Point(0, 0), new Point(1, 0)] }));
    mgr.add(new Line({ points: [new Point(0, 1), new Point(1, 1)] }));
    expect(mgr.count()).toBe(2);
    mgr.clear();
    expect(mgr.count()).toBe(0);
  });
});


