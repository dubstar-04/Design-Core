import {AlignedDimension} from './alignedDimension.js';
import {DiametricDimension} from './diametricDimension.js';
import {AngularDimension} from './angularDimension.js';
import {RadialDimension} from './radialDimension.js';

import {Core} from '../core.js';

export class Dimension {
  constructor(data) {
    // map dimensions type to the class name
    const dimensionMap = {
      0: AlignedDimension,
      1: AlignedDimension,
      2: AngularDimension,
      3: DiametricDimension,
      4: RadialDimension,
      5: null,
      6: null,
    };

    if (data) {
      const dimType = data[70] % 32;
      console.log('dim type:', dimType);

      const item = new dimensionMap[dimType](data);

      // find the block linked to this dimension
      const linkedBlockIndex = Core.Scene.findItem('BLOCK', 'name', data[2]);
      // remove the block from the scene, dimensions manage their block internally
      const removed = Core.Scene.removeItem(linkedBlockIndex[0]);

      return item;
    }
  }


  static register() {
    const command = {command: 'Dimension', shortcut: 'DIM'};
    return command;
  }
}
