import {Core} from '../../core/core.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();
const layerManager = core.layerManager;

test('Test LayerManager.getLayers', () => {
  const layers = layerManager.getLayers();
  expect(layers).toHaveLength(2);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
});

test('Test LayerManager.layerCount', () => {
  const count = layerManager.layerCount();
  expect(count).toBe(2);
});

test('Test LayerManager.newLayer', () => {
  const count = layerManager.layerCount();
  layerManager.newLayer();
  expect(layerManager.layerCount()).toBe(count + 1);
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

test('Test LayerManager.addLayer', () => {
  const count = layerManager.layerCount();
  layerManager.addLayer({'name': 'test', 'colour': '#00BFFF'});
  expect(layerManager.layerCount()).toBe(count + 1);
});

test('Test LayerManager.deleteLayerName', () => {
  const count = layerManager.layerCount();
  // defpoints can't be deleted
  layerManager.deleteLayerName('DEFPOINTS');
  expect(layerManager.layerCount()).toBe(count);

  // clayer can't be deleted
  layerManager.deleteLayerName(layerManager.getCLayer());
  expect(layerManager.layerCount()).toBe(count);

  // test should be deleted
  layerManager.deleteLayerName('test');
  expect(layerManager.layerCount()).toBe(count - 1);
});

test('Test LayerManager.deleteLayer', () => {
  const count = layerManager.layerCount();
  layerManager.deleteLayer(2);
  expect(layerManager.layerCount()).toBe(count - 1);
});

test('Test LayerManager.getCLayer', () => {
  const clayer = layerManager.getCLayer();
  expect(clayer).toBe('0');
});

test('Test LayerManager.setCLayer', () => {
  const layer = layerManager.getLayers().at(-1).name;
  layerManager.setCLayer(layer);
  expect(layerManager.getCLayer()).toBe(layer);
});

test('Test LayerManager.layerExists', () => {
  expect(layerManager.layerExists({'name': 'DEFPOINTS'})).toBe(true);
  expect(layerManager.layerExists({'name': 'OBSCURE_LAYER_NAME'})).toBe(false);
});

test('Test LayerManager.checkLayers', () => {
  layerManager.layers = [];

  const newLayerName = 'checkLayers';
  const startPoint = new Point();
  const endPoint = new Point(10, 10);

  const data = {
    points: [startPoint, endPoint],
    colour: '#FFFFFF',
    layer: newLayerName,
  };

  core.scene.addToScene('Line', data, false);

  layerManager.checkLayers();
  const layers = layerManager.getLayers();
  expect(layers).toHaveLength(3);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
  expect(layers[2]).toHaveProperty('name', newLayerName);
});

test('Test LayerManager.addStandardLayers', () => {
  layerManager.layers = [];

  layerManager.addStandardLayers();

  const layers = layerManager.getLayers();
  expect(layers).toHaveLength(2);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
});

test('Test LayerManager.getLayerIndex', () => {
  layerManager.getLayerIndex('test');
  // get index for test layer - should be the last layer
  expect(layerManager.getLayerIndex('test')).toBe(layerManager.layerCount() - 1);
  // get index for a layer that doesn't exist
  expect(layerManager.getLayerIndex('no-exist')).toBe(-1);
});

test('Test LayerManager.getLayerByName', () => {
  const layer = layerManager.getLayerByName('test');
  expect(layer.name).toBe('test');
  // get a layer that doesn't exist
  expect(layerManager.getLayerByName('no-exist')).toBeUndefined();
});

test('Test LayerManager.getLayerByIndex', () => {
  const testLayer = layerManager.getLayerByName('test');
  const layer = layerManager.getLayerByIndex(layerManager.getLayerIndex('test'));
  expect(testLayer === layer).toBe(true);
  // get a layer that doesn't exist
  expect(layerManager.getLayerByIndex(1000)).toBeUndefined();
});

test('Test LayerManager.renameLayer', () => {
  const index = layerManager.getLayerIndex('test');
  const newLayername = 'RENAMED_TEST';
  layerManager.renameLayer(index, newLayername);

  expect(layerManager.getLayerIndex(newLayername)).toBe(index);
  expect(layerManager.getLayerIndex('test')).toBe(-1);
});
