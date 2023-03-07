
import {Header} from './sections/header.js';
import {Entities} from './sections/entities.js';
import {Blocks} from './sections/blocks.js';
import {Tables} from './sections/tables.js';
import {DxfIterator} from './dxfIterator.js';

export class DXFReader {
  constructor() {
    this.iterator = new DxfIterator();
    this.blocks = new Blocks();
    this.header = new Header();
    this.entities = new Entities();
    this.tables = new Tables();
  }

  read(file) {
    this.iterator.loadFile(file);
    this.parseFile();
  }

  parseFile() {
    // TODO: check the file contains data and ends with EOF
    while (this.iterator.next().trim() !== 'EOF') {
      // log('Parsing:', this.iterator.current());
      const currentValue = this.iterator.current().trim();
      switch (currentValue) {
        case 'HEADER':
          log('read:', currentValue);
          this.header.read(this.iterator);
          break;
        case 'TABLES':
          log('read:', currentValue);
          this.tables.read(this.iterator);
          break;
        case 'BLOCKS':
          log('read:', currentValue);
          this.blocks.read(this.iterator);
          break;
        case 'ENTITIES':
          log('read:', currentValue);
          this.entities.read(this.iterator);
          break;
      }
    }
  }
}
