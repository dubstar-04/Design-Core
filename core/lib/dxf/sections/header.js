import { Section } from './section.js';

/**
 * Header Class
 * @extends Section
 */
export class Header extends Section {
  /** Create Header */
  constructor() {
    super();

    // Properties are dynamically created during read
    // TODO: add critical header values here?
    this.$ACADVER = '';
    this.$CLAYER = '0';
  }

  /**
   * Read
   * @param {Object} iterator
   */
  read(iterator) {
    let currentVariable;
    while (iterator.nextPair().value !== 'ENDSEC') {
      const currentPair = iterator.currentPair();
      switch (true) {
        case (currentPair.code === '9'):
          // TODO: Handle header values better
          // This code currently misses the endsec and adds it to the last property
          if (currentPair.value.at(0) === '$') {
            currentVariable = currentPair.value;
            this[currentVariable] = {};
          }
          break;
        default:
          this.parseValue(iterator, this[currentVariable]);
          break;
      }
    }
  }
}
