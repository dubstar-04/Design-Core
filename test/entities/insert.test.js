import { Core } from '../../core/core/core.js';
import { Insert } from '../../core/entities/insert.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Utils } from '../../core/lib/utils.js';
import { jest } from '@jest/globals';

import { File } from '../test-helpers/test-helpers.js';

// initialise core
new Core();


const insert = new Insert({ handle: '1', points: [new Point()] });
const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
insert.block.addItem(line);

const rotatedInsert = new Insert({ points: [new Point()], rotation: 45 });
rotatedInsert.block.addItem(line);

test('Test Insert.snaps', () => {
  const point = new Point(100, 100);
  const snaps = insert.snaps(point, 1);
  const endSnaps = snaps.filter((s) => s.type === 'end');
  expect(endSnaps[0].snapPoint.x).toBeCloseTo(101);
  expect(endSnaps[0].snapPoint.y).toBeCloseTo(102);

  // Test snaps for a rotated block
  const rotatedSnaps = rotatedInsert.snaps(point);
  const rotatedEndSnaps = rotatedSnaps.filter((s) => s.type === 'end');
  expect(rotatedEndSnaps[0].snapPoint.x).toBeCloseTo(-0.7071);
  expect(rotatedEndSnaps[0].snapPoint.y).toBeCloseTo(143.5426);
});

test('Test Insert.closestPoint', () => {
  const point = new Point(100, 100);
  const closest = insert.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(101);
  expect(closest[0].y).toBeCloseTo(102);

  // Test closest for a rotated block
  const rotatedClosest = rotatedInsert.closestPoint(point);
  expect(rotatedClosest[0].x).toBeCloseTo(101);
  expect(rotatedClosest[0].y).toBeCloseTo(102);
});

test('Test Insert.boundingBox', () => {
  expect(insert.boundingBox().xMin).toBeCloseTo(101);
  expect(insert.boundingBox().xMax).toBeCloseTo(201);
  expect(insert.boundingBox().yMin).toBeCloseTo(102);
  expect(insert.boundingBox().yMax).toBeCloseTo(202);

  const line2 = new Line({ points: [new Point(1001, 1002), new Point(2001, 2002)] });
  insert.block.addItem(line2);

  expect(insert.boundingBox().xMin).toBeCloseTo(101);
  expect(insert.boundingBox().xMax).toBeCloseTo(2001);
  expect(insert.boundingBox().yMin).toBeCloseTo(102);
  expect(insert.boundingBox().yMax).toBeCloseTo(2002);
});

test('Test Insert.dxf', () => {
  let file = new File();
  insert.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
INSERT
5
1
100
AcDbEntity
8
0
100
AcDbBlockReference
2

10
0
20
0
30
0.0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newInsert = new Insert(insert);
  file = new File();
  newInsert.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Insert.snaps returns a node snap at points[0]', () => {
  const nodeInsert = new Insert({ points: [new Point(5, 10)] });
  const nodeSnaps = nodeInsert.snaps(new Point(0, 0), 100).filter((s) => s.type === 'node');
  expect(nodeSnaps.length).toBe(1);
  expect(nodeSnaps[0].snapPoint.x).toBe(5);
  expect(nodeSnaps[0].snapPoint.y).toBe(10);
});

describe('Test Insert.draw', () => {
  /**
   * Create a minimal mock context with jest spies for translate and rotate.
   * @return {Object} mock context
   */
  function makeMockCtx() {
    return {
      translate: jest.fn(),
      rotate: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      setLineDash: jest.fn(),
      beginPath: jest.fn(),
    };
  }

  test('draw() returns the block items array', () => {
    const ins = new Insert({ points: [new Point(0, 0)] });
    const line = new Line({ points: [new Point(0, 0), new Point(1, 1)] });
    ins.block.addItem(line);

    const result = ins.draw(makeMockCtx(), 1);
    expect(result).toBe(ins.block.items);
  });

  test('draw() returns empty array when block has no items', () => {
    const ins = new Insert({ points: [new Point(0, 0)] });
    const result = ins.draw(makeMockCtx(), 1);
    expect(result).toEqual([]);
    expect(result).toBe(ins.block.items);
  });

  test('draw() calls ctx.translate with the insert point coordinates', () => {
    const ins = new Insert({ points: [new Point(50, 75)] });
    const ctx = makeMockCtx();
    ins.draw(ctx, 1);
    expect(ctx.translate).toHaveBeenCalledWith(50, 75);
  });

  test('draw() calls ctx.rotate with rotation converted to radians', () => {
    const ins = new Insert({ points: [new Point(0, 0)], rotation: 90 });
    const ctx = makeMockCtx();
    ins.draw(ctx, 1);
    expect(ctx.rotate).toHaveBeenCalledWith(Utils.degrees2radians(90));
  });

  test('draw() calls ctx.rotate with 0 when rotation is 0', () => {
    const ins = new Insert({ points: [new Point(0, 0)] });
    const ctx = makeMockCtx();
    ins.draw(ctx, 1);
    expect(ctx.rotate).toHaveBeenCalledWith(0);
  });

  test('draw() calls translate before rotate', () => {
    const ins = new Insert({ points: [new Point(10, 20)], rotation: 45 });
    const callOrder = [];
    const ctx = makeMockCtx();
    ctx.translate.mockImplementation(() => callOrder.push('translate'));
    ctx.rotate.mockImplementation(() => callOrder.push('rotate'));
    ins.draw(ctx, 1);
    expect(callOrder).toEqual(['translate', 'rotate']);
  });

  test('draw() returns same items reference regardless of scale', () => {
    const ins = new Insert({ points: [new Point(0, 0)] });
    const line = new Line({ points: [new Point(0, 0), new Point(1, 1)] });
    ins.block.addItem(line);
    expect(ins.draw(makeMockCtx(), 1)).toBe(ins.block.items);
    expect(ins.draw(makeMockCtx(), 10)).toBe(ins.block.items);
  });
});
