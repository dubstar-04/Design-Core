// import {DesignCore} from '../designCore.js';
// import {Strings} from '../lib/strings.js';
import {TableManagerBase} from './tableManagerBase.js';
import {Block} from './block.js';

/**
 * BlockManager Class
 * @extends TableManagerBase
 */
export class BlockManager extends TableManagerBase {
  /** Create a BlockManager */
  constructor() {
    super();
    this.itemProperty = 'block';
    this.indelibleItems.push('*Model_Space', '*Paper_Space');
  }

  /**
   * Create a new block
   * @param {Object} block
   * @return {Object}
   */
  createItem(block) {
    return new Block(block);
  }

  /**
   * Add standard blocks
   */
  addStandardItems() {
    this.items.push(new Block({'name': '*Model_Space'}));
    this.items.push(new Block({'name': '*Paper_Space'}));
  }
}
