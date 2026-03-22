import { Section } from './section.js';

/**
 * Objects Class
 * @extends Section
 */
export class Objects extends Section {
  /** Create Objects */
  constructor() {
    super();

    this.objects = [];
  }

  /**
   * Read
   * @param {Object} iterator
   * @return {Array}
   */
  read(iterator) {
    while (iterator.nextPair().value !== 'ENDSEC') {
      const currentPair = iterator.currentPair();
      switch (true) {
        case (currentPair.code === '0'):
          const object = this.parseChild(iterator);
          this.objects.push(object);
          break;

        default:
          break;
      }
    }

    return this.objects;
  }
}
