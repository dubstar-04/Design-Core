import {Section} from './section.js';

export class Blocks extends Section {
  constructor() {
    super();

    this.blocks = [];
  }

  read(iterator) {
    let currentTable;
    while (iterator.next().trim() !== 'ENDSEC') {
      const currentValue = iterator.current().trim();
      switch (true) {
        case (currentValue === 'BLOCK'):
          iterator.setReferenceIndex();
          currentTable = {};
          break;
        case (currentValue === 'ENDBLK'):
          this.blocks.push(currentTable);
          break;
        default:
          if (!iterator.odd()) {
            const code = iterator.prevValue().trim();
            currentTable[code] = this.getGroupValue(code, currentValue);
          }
          break;
      }
    }
  }
}
