import {DesignCore} from '../designCore.js';

export class BlockManager {
  constructor() {
    this.blocks = [];
  }

  /**
   * Get blocks
   * @returns list of blocks
   */
  getBlocks() {
    return this.blocks;
  }

  /**
   * Get block count
   * @returns number of blocks
   */
  blockCount() {
    return this.blocks.length;
  }

  /**
   * Create new block
   * @param {block} blockData
   */
  newBlock(blockData) {
    // Create a new item, send it the entity data
    const block = DesignCore.CommandManager.createNew('Block', blockData);
    this.blocks.push(block);
    return block;
  }

  /**
   * Add standard blocks
   */
  addDefaultBlocks() {
    this.blocks.push(new Block({'name': '*Model_Space'}));
    this.blocks.push(new Block({'name': '*Paper_Space'}));
  }

  /**
   * Delete a block using the block index
   * @param {number} blockIndex
   * @returns undefined
   */
  deleteBlock(blockIndex) {
    if (this.blocks[blockIndex] === undefined) {
      return;
    }

    // Delete The block
    this.blocks.splice(blockIndex, 1);
  }

  /**
   * Find the index of blockName
   * @param {string} blockName
   * @returns index of the block or -1 if block doesn't exist
   */
  getBlockIndex(blockName) {
    return this.blocks.findIndex((block) => block.name.toUpperCase() === blockName.toUpperCase());
  }

  /**
   * Check if a block exists
   * @param {string} blockName
   * @returns true or false
   */
  blockExists(blockName) {
    const blockExists = this.blocks.some((el) => el.name.toUpperCase() === blockName.toUpperCase());
    return blockExists;
  }

  /**
   * get a block matching blockname
   * @param {string} blockName
   * @returns block object
   */
  getBlockByName(blockName) {
    for (let i = 0; i < this.blockCount(); i++) {
      if (this.blocks[i].name.toUpperCase() === blockName.toUpperCase()) {
        return this.blocks[i];
      }
    }

    const msg = 'Invalid Block Name';
    const err = (`${this.constructor.name} - ${msg}: ${blockName}`);
    throw Error(err);
  }
}
