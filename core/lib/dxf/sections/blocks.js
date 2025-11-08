import { Section } from './section.js';

/**
 * Blocks Class
 * @extends Section
 */
export class Blocks extends Section {
  /** Create Blocks */
  constructor() {
    super();

    this.blocks = [];
  }

  /**
   * Add Block
   * @param {Object} block
   */
  addBlock(block) {
    if (Object.keys(block).length) {
      this.blocks.push(block);
    }
  }

  /**
   * Read
   * @param {Object} iterator
   * @return {Array}
   */
  read(iterator) {
    let currentBlock = {};
    while (iterator.nextPair().value !== 'ENDSEC') {
      const currentPair = iterator.currentPair();
      switch (true) {
        case (currentPair.code === '0'):

          if (['BLOCK'].includes(currentPair.value)) {
            this.addBlock(currentBlock);
            currentBlock = { children: [] };
            this.parseValue(iterator, currentBlock);
            break;
          } else {
            currentBlock.children.push(this.parseChild(iterator));
            break;
          }

        default:
          this.parseValue(iterator, currentBlock);
      }
    }

    this.addBlock(currentBlock);
    return this.blocks;
  }
}
