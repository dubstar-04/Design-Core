
import {Header} from './sections/header.js';
import {Entities} from './sections/entities.js';
import {Blocks} from './sections/blocks.js';
import {Tables} from './sections/tables.js';
import {DxfIterator} from './dxfIterator.js';

export class DXFReader {
  constructor() {
    this.iterator = new DxfIterator();
    this.blocks = [];
    this.header = new Header();
    this.entities = [];
    this.tables = [];
  }

  read(file) {
    this.iterator.loadFile(file);
    this.parseFile();
  }

  parseFile() {
    // TODO: check the file contains data and ends with EOF
    while (this.iterator.next().trim() !== 'EOF') {
      const currentValue = this.iterator.current().trim();
      switch (currentValue) {
        case 'HEADER':
          log('read:', currentValue);
          this.header.read(this.iterator);
          break;
        case 'TABLES':
          log('read:', currentValue);
          const tables = new Tables();
          this.tables = tables.read(this.iterator);
          break;
        case 'BLOCKS':
          log('read:', currentValue);
          const blocks = new Blocks();
          this.blocks = blocks.read(this.iterator);
          break;
        case 'ENTITIES':
          log('read:', currentValue);
          const entities = new Entities();
          this.entities = entities.read(this.iterator);
          break;
      }
    }
  }
}
