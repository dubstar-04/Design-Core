import { Layer } from '../../core/tables/layer';

import { File } from '../test-helpers/test-helpers.js';

test('Test Layer.frozen', () => {
  const layer = new Layer();
  expect(layer.frozen).toBe(false);
  expect(layer.flags.getFlagValue()).toBe(0);

  layer.frozen = true;
  expect(layer.frozen).toBe(true);
  expect(layer.flags.hasFlag(1)).toBe(true);
  expect(layer.flags.getFlagValue()).toBe(1);

  layer.frozen = false;
  expect(layer.frozen).toBe(false);
  expect(layer.flags.hasFlag(1)).toBe(false);
  expect(layer.flags.getFlagValue()).toBe(0);
});

test('Test Layer.locked', () => {
  const layer = new Layer();
  expect(layer.locked).toBe(false);
  expect(layer.flags.getFlagValue()).toBe(0);

  layer.locked = true;
  expect(layer.locked).toBe(true);
  expect(layer.flags.hasFlag(4)).toBe(true);
  expect(layer.flags.getFlagValue()).toBe(4);

  layer.locked = false;
  expect(layer.locked).toBe(false);
  expect(layer.flags.hasFlag(4)).toBe(false);
  expect(layer.flags.getFlagValue()).toBe(0);
});

test('Test Layer.isVisible', () => {
  const layer = new Layer();
  expect(layer.isVisible).toBe(true);

  layer.frozen = true;
  expect(layer.isVisible).toBe(false);

  layer.frozen = false;
  expect(layer.isVisible).toBe(true);
});

test('Test Layer.isSelectable', () => {
  const layer = new Layer();
  expect(layer.isSelectable).toBe(true);

  layer.frozen = true;
  expect(layer.isSelectable).toBe(false);

  layer.frozen = false;
  expect(layer.isSelectable).toBe(true);

  layer.locked = true;
  expect(layer.isSelectable).toBe(false);

  layer.locked = false;
  expect(layer.isSelectable).toBe(true);
});

test('Test Layer.isPlottable - defaults to true', () => {
  const layer = new Layer();
  expect(layer.isPlottable).toBe(true);
});

test('Test Layer.isPlottable - false when plotting is false', () => {
  const layer = new Layer();
  layer.plotting = false;
  expect(layer.isPlottable).toBe(false);
});

test('Test Layer.isPlottable - false when layer is frozen', () => {
  const layer = new Layer();
  layer.frozen = true;
  expect(layer.isPlottable).toBe(false);
});

test('Test Layer.isPlottable - false when layer is off', () => {
  const layer = new Layer();
  layer.on = false;
  expect(layer.isPlottable).toBe(false);
});

test('Test Layer.isPlottable - false when both plotting false and frozen', () => {
  const layer = new Layer();
  layer.plotting = false;
  layer.frozen = true;
  expect(layer.isPlottable).toBe(false);
});

test('Test Layer.dxf', () => {
  const layer = new Layer({ handle: 'A', name: 'TestLayer' });
  const file = new File();
  layer.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
LAYER
5
A
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
TestLayer
70
0
62
7
6
CONTINUOUS
290
1
390
0
`;

  expect(file.contents).toEqual(dxfString);
});

