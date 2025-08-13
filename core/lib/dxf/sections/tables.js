import { Section } from './section.js';

/**
 * Tables Class
 * @extends Section
 */
export class Tables extends Section {
  /** Create Tables */
  constructor() {
    super();

    this.tables = [];
  }

  /**
   * Add Table
   * @param {Object} table
   */
  addTable(table) {
    if (Object.keys(table).length) {
      this.tables.push(table);
    }
  }

  /**
   * Read
   * @param {Object} iterator
   * @return {Object}
   */
  read(iterator) {
    let currentTable;
    while (iterator.nextPair().value !== 'ENDSEC') {
      const currentPair = iterator.currentPair();
      switch (true) {
        case (currentPair.code === '0'):

          if (['TABLE'].includes(currentPair.value)) {
            currentTable = { children: [] };
            this.parseValue(iterator, currentTable);
            break;
          } else if (['ENDTAB'].includes(currentPair.value)) {
            this.addTable(currentTable);
            currentTable = {};
            break;
          } else {
            currentTable.children.push(this.parseChild(iterator));
            break;
          }

        default:
          this.parseValue(iterator, currentTable);
          break;
      }
    }

    this.addTable(currentTable);
    return this.tables;
  }
}
