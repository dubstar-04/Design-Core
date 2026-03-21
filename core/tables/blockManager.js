// import {DesignCore} from '../designCore.js';
// import {Strings} from '../lib/strings.js';
import { TableManagerBase } from './tableManagerBase.js';
import { Block } from './block.js';
import { DesignCore } from '../designCore.js';

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

  /**
   * Add a block to the list of items and assign a block record handle
   * @param {Object} item
   * @param {boolean} overwrite
   * @return {Object}
   */
  addItem(item, overwrite = false) {
    const newItem = super.addItem(item, overwrite);
    if (newItem.blockRecordHandle === undefined) {
      newItem.blockRecordHandle = DesignCore.HandleManager.next();
    }
    return newItem;
  }
}
