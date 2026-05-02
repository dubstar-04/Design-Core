import { Core } from '../../core/core/core.js';
import { Block } from '../../core/tables/block.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';

import { File } from '../test-helpers/test-helpers.js';
import { Flags } from '../../core/properties/flags.js';
import { DesignCore } from '../../core/designCore.js';
import { Utils } from '../../core/lib/utils.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';

new Core();

test('Test Block', () => {
  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  const flags = new Flags();
  flags.addValue(1);
  const block = new Block({ entities: [line], flags: flags });

  expect(block.entities.length).toBe(1);
  expect(block.flags.getFlagValue()).toBe(1);
});

test('Test Block.clearItems', () => {
  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  const block = new Block({ entities: [line] });
  expect(block.entities.length).toBe(1);

  block.clearEntities();
  expect(block.entities.length).toBe(0);
});

test('Test Block.snaps', () => {
  const block = new Block();
  expect(block.snaps()).toBeInstanceOf(Array);
  expect(block.snaps()).toHaveLength(0);

  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  block.addEntity(line);
  expect(block.snaps()).toBeInstanceOf(Array);
  expect(block.snaps()).not.toHaveLength(0);
});

test('Test Block', () => {
  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  const flags = new Flags();
  flags.addValue(1);
  const block = new Block({ entities: [line], flags: flags });

  expect(block.entities.length).toBe(1);
  expect(block.flags.getFlagValue()).toBe(1);
});

test('Test Block.closestPoint', () => {
  const block = new Block();
  const point = new Point();

  expect(block.closestPoint(point)).toBeInstanceOf(Array);
  expect(block.closestPoint(point)).toHaveLength(2);
  expect(block.closestPoint(point)[0]).toBeInstanceOf(Point);
  expect(block.closestPoint(point)[0].x).toBe(0);
  expect(block.closestPoint(point)[0].y).toBe(0);
  expect(block.closestPoint(point)[1]).toBe(Infinity);

  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  block.addEntity(line);
  expect(block.closestPoint(point)).toBeInstanceOf(Array);
  expect(block.closestPoint(point)).toHaveLength(2);
  expect(block.closestPoint(point)[0]).toBeInstanceOf(Point);
  expect(block.closestPoint(point)[0].x).not.toBe(0);
  expect(block.closestPoint(point)[0].y).not.toBe(0);
  expect(block.closestPoint(point)[1]).not.toBe(Infinity);
});

test('Test Block.dxf', () => {
  const block = new Block({ handle: '1', endblkHandle: '1' });
  const line = new Line({ handle: '1', points: [new Point(101, 102), new Point(201, 202)] });
  block.addEntity(line);

  const file = new File();
  block.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
BLOCK
5
1
100
AcDbEntity
8
0
100
AcDbBlockBegin
2

70
0
10
0
20
0
30
0
3

1

0
LINE
5
1
100
AcDbEntity
100
AcDbLine
8
0
6
ByLayer
10
101
20
102
30
0.0
11
201
21
202
31
0.0
39
1
0
ENDBLK
5
1
100
AcDbEntity
100
AcDbBlockEnd
`;

  expect(file.contents).toEqual(dxfString);
});

test('Test Block.touched', () => {
  const block = new Block();

  // Selection {min, max}
  const selectionExtremesTrue = { min: new Point(110, 90), max: new Point(190, 210) };
  const selectionExtremesFalse = { min: new Point(250, 250), max: new Point(400, 400) };

  expect(block.touched(selectionExtremesTrue)).toBe(false);

  const line = new Line({ points: [new Point(101, 102), new Point(201, 202)] });
  block.addEntity(line);
  expect(block.touched(selectionExtremesTrue)).toBe(true);
  expect(block.touched(selectionExtremesFalse)).toBe(false);
});

test('Test Block.dxf throws when a block item has an undefined handle', () => {
  const block = new Block({ handle: '1', endblkHandle: '2' });
  // cloneObject clears the handle, simulating an item added without a handle assignment
  const line = new Line({ handle: '3', points: [new Point(0, 0), new Point(1, 1)] });
  const clone = Utils.cloneObject(line);
  expect(clone.getProperty('handle')).toBeUndefined();
  block.addEntity(clone);

  // Use a real DXFFile (R2000+) so the version-gated handle validation fires
  const file = new DXFFile('R2000');
  expect(() => block.dxf(file)).toThrow();
});

test('Test Block.dxf succeeds when block items have valid handles', () => {
  const block = new Block({ handle: '1', endblkHandle: '2' });
  const line = new Line({ handle: '3', points: [new Point(0, 0), new Point(1, 1)] });
  const clone = Utils.cloneObject(line);
  // simulate the handle assignment done in Block.execute()
  clone.setProperty('handle', DesignCore.HandleManager.next());
  expect(clone.getProperty('handle')).toMatch(/^[0-9A-F]+$/i);
  block.addEntity(clone);

  const file = new DXFFile('R2000');
  expect(() => block.dxf(file)).not.toThrow();
  expect(file.contents).toContain(clone.getProperty('handle'));
});
