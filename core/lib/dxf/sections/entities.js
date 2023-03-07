import {Section} from './section.js';

export class Entities extends Section {
  constructor() {
    super();

    this.entities = [];
  }

  read(iterator) {
    let currentEntity;
    let currentPoint;
    while (iterator.next().trim() !== 'ENDSEC') {
      const currentValue = iterator.current().trim();
      // log('Entity:', currentValue);
      switch (true) {
        case (currentValue === '0'):

          if (currentEntity !== undefined && Object.keys(currentEntity).length) {
            this.entities.push(currentEntity);

            if (currentPoint !== undefined && Object.keys(currentPoint).length) {
              currentEntity.points.push(currentPoint);
              currentPoint = undefined;
            }

            log(currentEntity);
          }

          iterator.setReferenceIndex();
          currentEntity = {points: []};

          // Add the current code and the next value to the entity
          const code = currentValue.trim();
          const value = this.getGroupValue(code, iterator.nextValue());
          currentEntity[code] = value;

          break;
        case (currentValue === '10'):
          if (currentPoint !== undefined && Object.keys(currentPoint).length) {
            currentEntity.points.push(currentPoint);
            currentPoint = undefined;
          }
          currentPoint = {};
          const gpCode = currentValue.trim();
          const gpValue = this.getGroupValue(gpCode, iterator.next());
          currentPoint['x'] = gpValue;
          break;
        case (currentValue === '20'):
          const gCode = currentValue.trim();
          const gValue = this.getGroupValue(gCode, iterator.next());
          currentPoint['y'] = gValue;
          break;
        default:
          if (!iterator.odd()) {
            const code = currentValue.trim();
            const value = this.getGroupValue(code, iterator.next());
            currentEntity[code] = value;
          }
          break;
      }
    }
  }
}
