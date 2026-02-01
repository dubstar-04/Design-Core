import { BlockManager } from '../../core/tables/blockManager.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

const blockManager = new BlockManager();

// mock block data
blockManager.items = [{ name: 'blockOne' }, { name: 'blockTwo' }];

test('Test blockManager.getItems', () => {
  const blocks = blockManager.getItems();
  expect(blocks).toHaveLength(2);

  expect(blocks[0]).toHaveProperty('name', 'blockOne');
  expect(blocks[1]).toHaveProperty('name', 'blockTwo');
});

test('Test blockManager.itemCount', () => {
  const count = blockManager.itemCount();
  expect(count).toBe(2);
});

test('Test blockManager.addItem', () => {
  const count = blockManager.itemCount();
  blockManager.addItem({ name: 'blockThree' });
  expect(blockManager.itemCount()).toBe(count + 1);
});

test('Test blockManager.deleteblock', () => {
  const count = blockManager.itemCount();

  // get block index
  const blockIndex = blockManager.getItemIndex('blockThree');
  blockManager.deleteItem(blockIndex);
  expect(blockManager.itemCount()).toBe(count - 1);
});

test('Test blockManager.getItemIndex', () => {
  expect(blockManager.getItemIndex('blockOne')).toBe(0);
  expect(blockManager.getItemIndex('blockTwo')).toBe(1);
});

test('Test blockManager.getItemByName', () => {
  // add a new block to blocks
  blockManager.items.push({ 'name': 'test' });
  const block = blockManager.getItemByName('test');
  expect(block.name).toBe('test');
  // get a block that doesn't exist
  expect(blockManager.getItemByName('Non-Existent')).toBeUndefined();
});
