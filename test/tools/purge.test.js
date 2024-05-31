import {Core} from '../../core/core/core.js';
import {Point} from '../../core/entities/point.js';
import {Purge} from '../../core/tools/purge.js';
import {DesignCore} from '../../core/designCore.js';

new Core();
const purge = new Purge();
const layerManager = DesignCore.LayerManager;
const ltypeManager = DesignCore.LTypeManager;
const blockManager = DesignCore.Scene.blockManager;

// Runc this before each test
beforeEach(() => {
// insert needed for block?
  blockManager.addItem({name: 'blockWithoutItems'});
  blockManager.addItem({name: 'blockWithItems'});

  layerManager.addItem({'name': 'layerWithoutItems'});
  layerManager.addItem({'name': 'layerWithItems'});

  ltypeManager.addItem({'name': 'ltypeWithoutItems'});
  ltypeManager.addItem({'name': 'ltypeWithItems'});

  const point1 = new Point();
  const point2 = new Point(0, 100);

  const data = {points: [point1, point2], layer: 'layerWithItems', lineType: 'ltypeWithItems'};

  DesignCore.Scene.addItem('Insert', {blockName: 'blockWithItems'});
  DesignCore.Scene.addItem('Line', data);
  DesignCore.Scene.addItem('Circle', data);
  DesignCore.Scene.addItem('Text', data);
});

test('Test purge.action', () => {
  expect(blockManager.itemCount()).toBe(4);
  purge.option = 'Blocks';
  purge.action();
  expect(blockManager.itemCount()).toBe(3);
  expect(blockManager.itemExists('blockWithoutItems')).toBe(false);
  expect(blockManager.itemExists('blockWithItems')).toBe(true);

  expect(layerManager.itemCount()).toBe(4);
  purge.option = 'Layers';
  purge.action();
  expect(layerManager.itemCount()).toBe(3);
  expect(layerManager.itemExists('layerWithoutItems')).toBe(false);
  expect(layerManager.itemExists('layerWithItems')).toBe(true);

  expect(ltypeManager.itemCount()).toBe(5);
  purge.option = 'LTypes';
  purge.action();
  expect(ltypeManager.itemCount()).toBe(4);
  expect(ltypeManager.itemExists('ltypeWithOutItems')).toBe(false);
  expect(ltypeManager.itemExists('ltypeWithItems')).toBe(true);
});

test('Test purge.action - All', () => {
  expect(blockManager.itemCount()).toBe(4);
  expect(layerManager.itemCount()).toBe(4);
  expect(ltypeManager.itemCount()).toBe(5);

  purge.option = 'All';
  purge.action();

  // Blocks
  expect(blockManager.itemCount()).toBe(3);
  expect(blockManager.itemExists('blockWithoutItems')).toBe(false);
  expect(blockManager.itemExists('blockWithItems')).toBe(true);

  // Layers
  expect(layerManager.itemCount()).toBe(3);
  expect(layerManager.itemExists('layerWithoutItems')).toBe(false);
  expect(layerManager.itemExists('layerWithItems')).toBe(true);

  // Ltypes
  expect(ltypeManager.itemCount()).toBe(4);
  expect(ltypeManager.itemExists('ltypeWithOutItems')).toBe(false);
  expect(ltypeManager.itemExists('ltypeWithItems')).toBe(true);
});

