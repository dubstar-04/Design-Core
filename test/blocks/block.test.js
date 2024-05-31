import {Core} from '../../core/core/core.js';
import {Block} from '../../core/tables/block.js';
import {Line} from '../../core/entities/line.js';
import {Point} from '../../core/entities/point.js';

import {File} from '../test-helpers/test-helpers.js';
import {Flags} from '../../core/properties/flags.js';

new Core();

test('Test Block', () => {
  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  const flags = new Flags();
  flags.addValue(1);
  const block = new Block({items: [line], flags: flags});

  expect(block.items.length).toBe(1);
  expect(block.flags.getFlagValue()).toBe(1);
});

test('Test Block.clearItems', () => {
  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  const block = new Block({items: [line]});
  expect(block.items.length).toBe(1);

  block.clearItems();
  expect(block.items.length).toBe(0);
});

test('Test Block.snaps', () => {
  const block = new Block();
  expect(block.snaps()).toBeInstanceOf(Array);
  expect(block.snaps()).toHaveLength(0);

  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  block.addItem(line);
  expect(block.snaps()).toBeInstanceOf(Array);
  expect(block.snaps()).not.toHaveLength(0);
});

test('Test Block', () => {
  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  const flags = new Flags();
  flags.addValue(1);
  const block = new Block({items: [line], flags: flags});

  expect(block.items.length).toBe(1);
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

  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  block.addItem(line);
  expect(block.closestPoint(point)).toBeInstanceOf(Array);
  expect(block.closestPoint(point)).toHaveLength(2);
  expect(block.closestPoint(point)[0]).toBeInstanceOf(Point);
  expect(block.closestPoint(point)[0].x).not.toBe(0);
  expect(block.closestPoint(point)[0].y).not.toBe(0);
  expect(block.closestPoint(point)[1]).not.toBe(Infinity);
});

test('Test Block.dxf', () => {
  const block = new Block();
  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  block.addItem(line);

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

  // Selection Extremes xmin, xmax, ymin, ymax
  const selectionExtremesTrue = [110, 190, 90, 210];
  const selectionExtremesFalse = [250, 400, 250, 400];

  expect(block.touched(selectionExtremesTrue)).toBe(false);

  const line = new Line({points: [new Point(101, 102), new Point(201, 202)]});
  block.addItem(line);
  expect(block.touched(selectionExtremesTrue)).toBe(true);
  expect(block.touched(selectionExtremesFalse)).toBe(false);
});
