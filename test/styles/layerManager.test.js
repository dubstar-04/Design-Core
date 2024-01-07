import {Core} from '../../core/core/core.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();
const layerManager = core.layerManager;

test('Test LayerManager.getStyles', () => {
  const layers = layerManager.getStyles();
  expect(layers).toHaveLength(2);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
});

test('Test LayerManager.styleCount', () => {
  const count = layerManager.styleCount();
  expect(count).toBe(2);
});

test('Test LayerManager.newStyle', () => {
  const count = layerManager.styleCount();
  layerManager.newStyle();
  expect(layerManager.styleCount()).toBe(count + 1);
});

test('Test LayerManager.getUniqueName', () => {
  // existing defpoints layer
  let name = layerManager.getUniqueName('DEFPOINTS');
  expect(name).toBe('DEFPOINTS_1');
  // existing NEW_LAYER layer
  name = layerManager.getUniqueName('NEW_STYLE');
  expect(name).toBe('NEW_STYLE_1');
  // unique layer
  name = layerManager.getUniqueName('UNIQUE_LAYER');
  expect(name).toBe('UNIQUE_LAYER');
});

test('Test LayerManager.addStyle', () => {
  const count = layerManager.styleCount();
  layerManager.addStyle({'name': 'test', 'colour': '#00BFFF'});
  expect(layerManager.styleCount()).toBe(count + 1);
});

test('Test LayerManager.deleteStyle', () => {
  const count = layerManager.styleCount();
  // defpoints can't be deleted
  layerManager.deleteStyle('DEFPOINTS');
  expect(layerManager.styleCount()).toBe(count);

  // clayer can't be deleted
  layerManager.deleteStyle(layerManager.getCstyle());
  expect(layerManager.styleCount()).toBe(count);

  // test should be deleted
  layerManager.deleteStyle(layerManager.getStyleIndex('test'));
  expect(layerManager.styleCount()).toBe(count - 1);
});

test('Test LayerManager.deleteStyle', () => {
  const count = layerManager.styleCount();
  layerManager.deleteStyle(2);
  expect(layerManager.styleCount()).toBe(count - 1);
});

test('Test LayerManager.getCstyle', () => {
  const clayer = layerManager.getCstyle();
  expect(clayer).toBe('0');
});

test('Test LayerManager.setCstyle', () => {
  const layer = layerManager.getStyles().at(-1).name;
  layerManager.setCstyle(layer);
  expect(layerManager.getCstyle()).toBe(layer);
});

test('Test LayerManager.styleExists', () => {
  expect(layerManager.styleExists('DEFPOINTS')).toBe(true);
  expect(layerManager.styleExists('OBSCURE_LAYER_NAME')).toBe(false);
});

test('Test LayerManager.checkStyles', () => {
  layerManager.layers = [];

  const newStyleName = 'checkStyles';
  const startPoint = new Point();
  const endPoint = new Point(10, 10);

  const data = {
    points: [startPoint, endPoint],
    colour: '#FFFFFF',
    layer: newStyleName,
  };

  core.scene.addItem('Line', data, false);

  layerManager.checkStyles();
  const layers = layerManager.getStyles();
  expect(layers).toHaveLength(3);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
  expect(layers[2]).toHaveProperty('name', newStyleName);
});

test('Test LayerManager.addStandardStyles', () => {
  layerManager.clearStyles();

  layerManager.addStandardStyles();

  const layers = layerManager.getStyles();
  expect(layers).toHaveLength(2);

  expect(layers[0]).toHaveProperty('name', '0');
  expect(layers[1]).toHaveProperty('name', 'DEFPOINTS');
});

test('Test LayerManager.getStyleIndex', () => {
  layerManager.addStyle({'name': 'addStyle', 'colour': '#00BFFF'});
  // get index for test layer - should be the last layer
  expect(layerManager.getStyleIndex('addStyle')).toBe(layerManager.styleCount() - 1);
  // get index for a layer that doesn't exist
  expect(layerManager.getStyleIndex('no-exist')).toBe(-1);
});

test('Test LayerManager.getStyleByName', () => {
  layerManager.addStyle({'name': 'test'});
  const layer = layerManager.getStyleByName('test');
  expect(layer.name).toBe('test');
  // get a layer that doesn't exist
  expect(() => {
    layerManager.getStyleByName('no-exist');
  }).toThrow();
});

test('Test LayerManager.getStyleByIndex', () => {
  const testLayer = layerManager.getStyleByName('test');
  const layer = layerManager.getStyleByIndex(layerManager.getStyleIndex('test'));
  expect(testLayer === layer).toBe(true);
  // get a layer that doesn't exist
  expect(layerManager.getStyleByIndex(1000)).toBeUndefined();
});

test('Test LayerManager.renameStyle', () => {
  const index = layerManager.getStyleIndex('test');
  const newStylename = 'RENAMED_TEST';
  layerManager.renameStyle(index, newStylename);

  expect(layerManager.getStyleIndex(newStylename)).toBe(index);
  expect(layerManager.getStyleIndex('test')).toBe(-1);
});
