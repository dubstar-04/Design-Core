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
        case (currentValue === '0' && !iterator.odd()):

          if (['TABLE'].includes(iterator.nextValue())) {
            currentTable = {children: []};
            this.parseValue(iterator, currentTable);
            break;
          }

          if (['ENDTAB', 'ENDSEC'].includes(iterator.nextValue().trim()) === false) {
            currentTable.children.push(this.parseChild(iterator));
            break;
          }

          if (['ENDTAB', 'ENDSEC'].includes(iterator.nextValue().trim())) {
            this.tables.push(currentTable);
            break;
          }
        case (!iterator.odd()):
          this.parseValue(iterator, currentTable);
          break;
      }
    }

    return this.tables;
  }
}
