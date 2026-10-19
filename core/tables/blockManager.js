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
   * Add a block and assign its block record, end block and child companion handles.
   * @param {Object} item
   * @param {boolean} overwrite
   * @return {Object}
   */
  addItem(item, overwrite = false) {
    const newItem = super.addItem(item, overwrite);
    if (newItem.blockRecordHandle === undefined) {
      newItem.blockRecordHandle = DesignCore.HandleManager.next();
    }
    if (newItem.endblkHandle === undefined) {
      newItem.endblkHandle = DesignCore.HandleManager.next();
    }
    newItem.entities.forEach((entity) => entity.assignHandles?.());
    return newItem;
  }
}
