import {Section} from './section.js';

export class Tables extends Section {
  constructor() {
    super();

    this.tables = [];
  }

  read(iterator) {
    let currentTable;
    while (iterator.next().trim() !== 'ENDSEC') {
      const currentValue = iterator.current().trim();
      switch (true) {
        case (currentValue === 'TABLE'):
          iterator.setReferenceIndex();
          currentTable = {};
          break;
        case (currentValue === 'ENDTAB'):
          this.tables.push(currentTable);
          break;
        default:
          if (!iterator.odd()) {
            const code = iterator.prevValue().trim();
            currentTable[code] = currentValue;
          }
          break;
      }
    }
  }
}
