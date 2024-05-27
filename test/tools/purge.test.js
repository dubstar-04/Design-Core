import {Core} from '../../core/core/core.js';
import {Point} from '../../core/entities/point.js';
import {Purge} from '../../core/tools/purge.js';
import {DesignCore} from '../../core/designCore.js';

const core = new Core();
const purge = new Purge();
const layerManager = DesignCore.LayerManager;
const ltypeManager = DesignCore.LTypeManager;
const blockManager = DesignCore.Scene.blockManager;

// Runc this before each test
beforeEach(() => {
// insert needed for block?
  blockManager.newBlock({name: 'blockWithoutItems'});
  blockManager.newBlock({name: 'blockWithItems'});

  layerManager.addStyle({'name': 'layerWithoutItems'});
  layerManager.addStyle({'name': 'layerWithItems'});

  ltypeManager.addStyle({'name': 'ltypeWithoutItems'});
  ltypeManager.addStyle({'name': 'ltypeWithItems'});

  const point1 = new Point();
  const point2 = new Point(0, 100);

  const data = {points: [point1, point2], layer: 'layerWithItems', lineType: 'ltypeWithItems'};

  DesignCore.Scene.addItem('Insert', {blockName: 'blockWithItems'});
  DesignCore.Scene.addItem('Line', data);
  DesignCore.Scene.addItem('Circle', data);
  DesignCore.Scene.addItem('Text', data);
});

test('Test purge.action', () => {
  expect(blockManager.blockCount()).toBe(4);
  purge.option = 'Blocks';
  purge.action();
  expect(blockManager.blockCount()).toBe(3);
  expect(blockManager.blockExists('blockWithoutItems')).toBe(false);
  expect(blockManager.blockExists('blockWithItems')).toBe(true);

  expect(layerManager.styleCount()).toBe(4);
  purge.option = 'Layers';
  purge.action();
  expect(layerManager.styleCount()).toBe(3);
  expect(layerManager.styleExists('layerWithoutItems')).toBe(false);
  expect(layerManager.styleExists('layerWithItems')).toBe(true);

  expect(ltypeManager.styleCount()).toBe(5);
  purge.option = 'LTypes';
  purge.action();
  expect(ltypeManager.styleCount()).toBe(4);
  expect(ltypeManager.styleExists('ltypeWithOutItems')).toBe(false);
  expect(ltypeManager.styleExists('ltypeWithItems')).toBe(true);
});

test('Test purge.action - All', () => {
  expect(blockManager.blockCount()).toBe(4);
  expect(layerManager.styleCount()).toBe(4);
  expect(ltypeManager.styleCount()).toBe(5);

  purge.option = 'All';
  purge.action();

  // Blocks
  expect(blockManager.blockCount()).toBe(3);
  expect(blockManager.blockExists('blockWithoutItems')).toBe(false);
  expect(blockManager.blockExists('blockWithItems')).toBe(true);

  // Layers
  expect(layerManager.styleCount()).toBe(3);
  expect(layerManager.styleExists('layerWithoutItems')).toBe(false);
  expect(layerManager.styleExists('layerWithItems')).toBe(true);

  // Ltypes
  expect(ltypeManager.styleCount()).toBe(4);
  expect(ltypeManager.styleExists('ltypeWithOutItems')).toBe(false);
  expect(ltypeManager.styleExists('ltypeWithItems')).toBe(true);
});

