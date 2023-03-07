import {Section} from './section.js';

export class Header extends Section {
  constructor() {
    super();

    // Properties are dynamically created during read

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
          iterator.setReferenceIndex();
          this[currentVariable] = {};
          break;
        case (currentValue === '9'):
          break;
        default:
          if (!iterator.odd()) {
            const code = iterator.prevValue().trim();
            this[currentVariable][code] = currentValue;
          }
          break;
      }
    }
  }
}
