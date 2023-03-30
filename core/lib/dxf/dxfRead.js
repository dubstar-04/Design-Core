
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
    while (this.iterator.nextPair().value !== 'EOF') {
      const currentPair = this.iterator.currentPair();
      switch (true) {
        case (currentPair.value === 'HEADER'):
          this.header.read(this.iterator);
          break;

        case (currentPair.value ==='TABLES'):
          const tables = new Tables();
          this.tables = tables.read(this.iterator);
          break;

        case (currentPair.value === 'BLOCKS'):
          const blocks = new Blocks();
          this.blocks = blocks.read(this.iterator);
          break;

        case (currentPair.value ==='ENTITIES'):
          const entities = new Entities();
          this.entities = entities.read(this.iterator);
          break;
      }
    }
  }
}
