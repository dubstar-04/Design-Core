import {Section} from './section.js';
import {DxfIterator} from '../dxfIterator.js';
import {Strings} from '../../strings.js';

/**
 * Entities Class
 * @extends Section
 */
export class Entities extends Section {
  /** Create Entities */
  constructor() {
    super();

    this.entities = [];
  }

  /**
   * Add Entity
   * @param {Object} entity
   */
  addEntity(entity) {
    if (Object.keys(entity).length) {
      if (!entity.hasOwnProperty('points')) {
        DxfIterator.instance.dxfError(Strings.Error.INVALIDPOINT);
      }

      this.entities.push(entity);
    }
  }

  /**
   * Read
   * @param {Object} iterator
   * @return {Array}
   */
  read(iterator) {
    let currentEntity = {};
    while (iterator.nextPair().value !== 'ENDSEC') {
      const currentPair = iterator.currentPair();
      switch (true) {
        case (currentPair.code === '0'):

          if (['VERTEX', 'SEQEND'].includes(currentPair.value)) {
            const child = this.parseChild(iterator);

            if (currentEntity.hasOwnProperty('children') === false) {
              currentEntity.children = [];
            }

            currentEntity.children.push(child);
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
