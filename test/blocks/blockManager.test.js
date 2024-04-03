import {BlockManager} from '../../core/blocks/blockManager.js';
import {Core} from '../../core/core/core.js';

// initialise core
new Core();

const blockManager = new BlockManager();

// mock block data
blockManager.blocks = [{name: 'blockOne'}, {name: 'blockTwo'}];

test('Test blockManager.getBlocks', () => {
  const blocks = blockManager.getBlocks();
  expect(blocks).toHaveLength(2);

  expect(blocks[0]).toHaveProperty('name', 'blockOne');
  expect(blocks[1]).toHaveProperty('name', 'blockTwo');
});

test('Test blockManager.blockCount', () => {
  const count = blockManager.blockCount();
  expect(count).toBe(2);
});

test('Test blockManager.newblock', () => {
  const count = blockManager.blockCount();
  blockManager.newBlock({name: 'blockThree'});
  expect(blockManager.blockCount()).toBe(count + 1);
});

test('Test blockManager.deleteblock', () => {
  const count = blockManager.blockCount();

  // get block index
  const blockIndex = blockManager.getBlockIndex('blockThree');
  blockManager.deleteBlock(blockIndex);
  expect(blockManager.blockCount()).toBe(count - 1);
});

test('Test blockManager.getBlockIndex', () => {
  expect(blockManager.getBlockIndex('blockOne')).toBe(0);
  expect(blockManager.getBlockIndex('blockTwo')).toBe(1);
});

test('Test blockManager.getblockByName', () => {
  // add a new block to blocks
  blockManager.blocks.push({'name': 'test'});
  const block = blockManager.getBlockByName('test');
  expect(block.name).toBe('test');
  // get a block that doesn't exist
  expect(() => {
    blockManager.getblockByName('no-exist');
  }).toThrow();
});
