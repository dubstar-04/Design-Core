import {Section} from './section.js';

export class Header extends Section {
  constructor() {
    super();

    // Properties are dynamically created during read
    // TODO: add critical header values here?
    this.$ACADVER = '';
    this.$CLAYER = '0';
  }

  read(iterator) {
    let currentVariable;
    while (iterator.next().trim() !== 'ENDSEC') {
      const currentValue = iterator.current().trim();
      switch (true) {
        case (currentValue.at(0) === '$'):
          currentVariable = currentValue;
          this[currentVariable] = {};
          break;
        case (currentValue === '9'):
          // TODO: Handle header values better
          // This code currently misses the endsec and adds it to the last property
          break;
        default:
          if (!iterator.odd()) {
            this.parseValue(iterator, this[currentVariable]);
          }
          break;
      }
    }
  }
}
