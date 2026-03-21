// import {DesignCore} from '../designCore.js';
// import {Strings} from '../lib/strings.js';
import { TableManagerBase } from './tableManagerBase.js';
import { Block } from './block.js';

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

  /** Get the item class */
  get itemClass() {
    return Block;
  }

  /**
   * Add standard blocks
   */
  addStandardItems() {
    this.addItem({ 'name': '*Model_Space' });
    this.addItem({ 'name': '*Paper_Space' });
  }
}
