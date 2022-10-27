import {Intersection} from '../lib/intersect.js';

export class Extend {
  constructor() {
    // Define Properties
    this.type = 'Extend';
    this.family = 'Tools';
    this.movement = 'Modify';
    this.minPoints = 2;
    this.selectionRequired = true;
    this.helper_geometry = false;
    this.showPreview = false;
  }

  static register() {
    const command = {command: 'Extend', shortcut: 'EX'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    const reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = 'Select boundary edges:';

    expectedType[1] = ['object'];
    prompt[1] = core.scene.selectionSet.length + ' Item(s) selected: Add more or press Enter to accept';

    expectedType[2] = ['boolean'];
    prompt[2] = 'Select object to extend:';

    expectedType[3] = ['object'];
    prompt[3] = 'Select another object to Extend or press ESC to quit:';

    expectedType[4] = expectedType[3];
    prompt[4] = prompt[3];

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput || num > 3) {
      core.scene.inputArray.pop();
    }

    if (core.scene.inputArray.length === 3) {
      action = true;
      // reset = true
    }

    return {promptInput:prompt[core.scene.inputArray.length], resetBool:reset, actionBool:action, validInput:validInput};
  }

  action(core) {
    console.log('Extend.js: action');

    console.log('Extend.js: core.scene.selectionSet length:', core.scene.selectionSet.length);

    const item = core.scene.findClosestItem();

    if (item !== undefined) {
      const intersectPoints = [];
      let extendItem;

      for (let i = 0; i < core.scene.selectionSet.length; i++) {
        if (core.scene.selectionSet[i] !== item) {
          const boundaryItem = core.scene.items[core.scene.selectionSet[i]];
          extendItem = core.scene.items[item];

          console.log('boundary.type:', boundaryItem.type, 'extend.type:', extendItem.type);

          const functionName = 'intersect' + boundaryItem.type + extendItem.type;
          console.log('extend.js - call function:', functionName);
          const intersect = Intersection[functionName](boundaryItem.intersectPoints(), extendItem.intersectPoints(), true);

          console.log(intersect.status);
          if (intersect.points.length) {
            console.log('intersect points:', intersect.points.length);
            for (let point = 0; point < intersect.points.length; point++) {
              intersectPoints.push(intersect.points[point]);
            }
          }
        }
      }

      if (intersectPoints) {
        extendItem.extend(intersectPoints, core);
      }
    }
  }

  preview() {
    // console.log("extend.js - preview")
  }
}

