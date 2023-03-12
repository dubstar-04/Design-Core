import {Section} from './section.js';

export class Entities extends Section {
  constructor() {
    super();

    this.entities = [];
  }

  read(iterator) {
    let currentEntity = {};
    while (iterator.next().trim() !== 'ENDSEC') {
      const currentValue = iterator.current().trim();
      switch (true) {
        case (currentValue === '0' && !iterator.odd()):

          if (['VERTEX'].includes(iterator.nextValue())) {
            console.log('VERTEX not handled');
            const child = this.parseChild(iterator);
            break;
          }

          if (Object.keys(currentEntity).length) {
            this.entities.push(currentEntity);
          }

          currentEntity = {};
          // Add the current code and the next value to the entity
          this.parseValue(iterator, currentEntity);
          break;

        default:
          if (!iterator.odd()) {
            this.parseValue(iterator, currentEntity);
          }
          break;
      }
    }

    return this.entities;
  }
}
