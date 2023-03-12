import {Section} from './section.js';

export class Blocks extends Section {
  constructor() {
    super();

    this.blocks = [];
  }

  read(iterator) {
    let currentBlock = {};
    while (iterator.next().trim() !== 'ENDSEC') {
      const currentValue = iterator.current().trim();
      switch (true) {
        case (currentValue === '0' && !iterator.odd()):

          if (['BLOCK'].includes(iterator.nextValue())) {
            if (Object.keys(currentBlock).length) {
              this.blocks.push(currentBlock);
            }

            currentBlock = {children: []};
            this.parseValue(iterator, currentBlock);
            break;
          }

          if (['ENDBLK'].includes(iterator.nextValue())) {
            currentBlock.children.push(this.parseChild(iterator));
            break;
          }

        case (!iterator.odd()):
          this.parseValue(iterator, currentBlock);
          break;
      }
    }

    return this.blocks;
  }
}
