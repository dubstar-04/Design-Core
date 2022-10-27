import {Intersection} from '../lib/intersect.js';

export class Trim {
  constructor() {
    // Define Properties
    this.type = 'Trim';
    this.family = 'Tools';
    this.movement = 'Modify';
    this.minPoints = 2;
    this.selectionRequired = true;
    this.helper_geometry = false;
    this.showPreview = false;
  }

  static register() {
    const command = {command: 'Trim', shortcut: 'TR'};
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
    prompt[2] = 'Select object to Trim:';

    expectedType[3] = ['object'];
    prompt[3] = 'Select another object to Trim or press ESC to quit:';

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

    return [prompt[core.scene.inputArray.length], reset, action, validInput];
  }

  action(core) {
    console.log('Trim.js: action');

    console.log('Trim.js: core.scene.selectionSet length:', core.scene.selectionSet.length);

    const item = core.scene.findClosestItem();

    if (item !== undefined) {
      const intersectPoints = [];
      let TrimItem;

      for (let i = 0; i < core.scene.selectionSet.length; i++) {
        if (core.scene.selectionSet[i] !== item) {
          const boundaryItem = core.scene.items[core.scene.selectionSet[i]];
          TrimItem = core.scene.items[item];

          console.log('boundary.type:', boundaryItem.type, 'Trim.type:', TrimItem.type);

          const functionName = 'intersect' + boundaryItem.type + TrimItem.type;
          console.log('Trim.js - call function:', functionName);
          const intersect = Intersection[functionName](boundaryItem.intersectPoints(), TrimItem.intersectPoints());

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
        TrimItem.trim(intersectPoints, core);
      }
    }
  }

  preview() {
    // console.log("Trim.js - preview")
  }
}

