import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';

const core = new Core();
const layerManager = core.layerManager;

test('Test LayerManager.getItems', () => {
  const layers = layerManager.getItems();
  expect(layers).toHaveLength(2);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
});

test('Test LayerManager.itemCount', () => {
  const count = layerManager.itemCount();
  expect(count).toBe(2);
});

test('Test LayerManager.newItem', () => {
  const count = layerManager.itemCount();
  layerManager.newItem();
  expect(layerManager.itemCount()).toBe(count + 1);
});

test('Test LayerManager.getUniqueName', () => {
  // existing defpoints layer
  let name = layerManager.getUniqueName('DEFPOINTS');
  expect(name).toBe('DEFPOINTS_1');
  // existing NEW_LAYER layer
  name = layerManager.getUniqueName('NEW_LAYER');
  expect(name).toBe('NEW_LAYER_1');
  // unique layer
  name = layerManager.getUniqueName('UNIQUE_LAYER');
  expect(name).toBe('UNIQUE_LAYER');
});

test('Test LayerManager.addItem', () => {
  const count = layerManager.itemCount();
  layerManager.addItem({ 'name': 'test', 'colour': '#00BFFF' });
  expect(layerManager.itemCount()).toBe(count + 1);
});

test('Test LayerManager.deleteStyle', () => {
  const count = layerManager.itemCount();
  // defpoints can't be deleted
  layerManager.deleteStyle('DEFPOINTS');
  expect(layerManager.itemCount()).toBe(count);

  // clayer can't be deleted
  layerManager.deleteStyle(layerManager.getCstyle());
  expect(layerManager.itemCount()).toBe(count);

  // test should be deleted
  layerManager.deleteStyle(layerManager.getItemIndex('test'));
  expect(layerManager.itemCount()).toBe(count - 1);
});

test('Test LayerManager.deleteStyle', () => {
  const count = layerManager.itemCount();
  layerManager.deleteStyle(2);
  expect(layerManager.itemCount()).toBe(count - 1);
});

test('Test LayerManager.getCstyle', () => {
  const clayer = layerManager.getCstyle();
  expect(clayer).toBe('0');
});

test('Test LayerManager.setCstyle', () => {
  const layer = layerManager.getItems().at(-1).name;
  layerManager.setCstyle(layer);
  expect(layerManager.getCstyle()).toBe(layer);
});

test('Test LayerManager.itemExists', () => {
  expect(layerManager.itemExists('DEFPOINTS')).toBe(true);
  expect(layerManager.itemExists('OBSCURE_LAYER_NAME')).toBe(false);
});

test('Test LayerManager.checkStyles', () => {
  layerManager.layers = [];

  const newItemName = 'checkStyles';
  const startPoint = new Point();
  const endPoint = new Point(10, 10);

  const data = {
    points: [startPoint, endPoint],
    colour: '#FFFFFF',
    layer: newItemName,
  };

  core.scene.addItem('Line', data);

  layerManager.checkStyles();
  const layers = layerManager.getItems();
  expect(layers).toHaveLength(3);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
  expect(layers[2]).toHaveProperty('name', newItemName);
});

test('Test LayerManager.addStandardItems', () => {
  layerManager.clearItems();

  layerManager.addStandardItems();

  const layers = layerManager.getItems();
  expect(layers).toHaveLength(2);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
});

test('Test LayerManager.getItemIndex', () => {
  layerManager.addItem({ 'name': 'addItem', 'colour': '#00BFFF' });
  // get index for test layer - should be the last layer
  expect(layerManager.getItemIndex('addItem')).toBe(layerManager.itemCount() - 1);
  // get index for a layer that doesn't exist
  expect(layerManager.getItemIndex('no-exist')).toBe(-1);
});

test('Test LayerManager.getItemByName', () => {
  layerManager.addItem({ 'name': 'test' });
  const layer = layerManager.getItemByName('test');
  expect(layer.name).toBe('test');
  // get a layer that doesn't exist
  expect(() => {
    layerManager.getItemByName('no-exist');
  }).toThrow();
});

test('Test LayerManager.getItemByIndex', () => {
  const testLayer = layerManager.getItemByName('test');
  const layer = layerManager.getItemByIndex(layerManager.getItemIndex('test'));
  expect(testLayer === layer).toBe(true);
  // get a layer that doesn't exist
  expect(layerManager.getItemByIndex(1000)).toBeUndefined();
});

test('Test LayerManager.renameStyle', () => {
  const index = layerManager.getItemIndex('test');
  const newItemname = 'RENAMED_TEST';
  layerManager.renameStyle(index, newItemname);

  expect(layerManager.getItemIndex(newItemname)).toBe(index);
  expect(layerManager.getItemIndex('test')).toBe(-1);
});
