import {Section} from './section.js';

export class Entities extends Section {
  constructor() {
    super();

    this.entities = [];
  }

  addEntity(entity) {
    if (Object.keys(entity).length) {
      // log('currentEntity', currentEntity);
      this.entities.push(entity);
    }
  }

  read(iterator) {
    let currentEntity = {};
    while (iterator.nextPair().value !== 'ENDSEC') {
      const currentPair = iterator.currentPair();
      switch (true) {
        case (currentPair.code === '0'):

          if (['VERTEX'].includes(currentPair.value)) {
            console.log('VERTEX not handled');
            const child = this.parseChild(iterator);
            break;
          }

          this.addEntity(currentEntity);
          currentEntity = {};
          this.parseValue(iterator, currentEntity);
          break;

        default:
          this.parseValue(iterator, currentEntity);
          break;
      }
    }

    this.addEntity(currentEntity);
    return this.entities;
  }
}
