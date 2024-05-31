// import {DesignCore} from '../designCore.js';
// import {Strings} from '../lib/strings.js';
import {ItemManagerBase} from '../styles/itemManagerBase.js';
import {Block} from './block.js';

export class BlockManager extends ItemManagerBase {
  constructor() {
    super();
    this.itemProperty = 'block';
    this.indelibleItems.push('*Model_Space', '*Paper_Space');
  }

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
