import {Intersection} from '../lib/intersect.js';
import {Strings} from '../lib/strings.js';

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
    const command = {command: 'Trim', shortcut: 'TR', type: 'Tool'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    const reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.BOUNDARY;

    expectedType[1] = ['object'];
    prompt[1] = `${core.scene.selecting.selectionSet.length}  ${Strings.Input.SELECTED}`;

    expectedType[2] = ['boolean'];
    prompt[2] = Strings.Input.SELECTENTITIES;

    expectedType[3] = ['object'];
    prompt[3] = Strings.Input.SELECTORQUIT;

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

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  action(core) {
    // console.log('Trim.js: action');

    // console.log('Trim.js: core.scene.selecting.selectionSet length:', core.scene.selecting.selectionSet.length);

    const item = core.scene.selecting.findClosestItem();

    if (item !== undefined) {
      const intersectPoints = [];
      let TrimItem;

      for (let i = 0; i < core.scene.selecting.selectionSet.length; i++) {
        if (core.scene.selecting.selectionSet[i] !== item) {
          const boundaryItem = core.scene.items[core.scene.selecting.selectionSet[i]];
          TrimItem = core.scene.items[item];

          // console.log('boundary.type:', boundaryItem.type, 'Trim.type:', TrimItem.type);

          const functionName = 'intersect' + boundaryItem.type + TrimItem.type;
          // console.log('Trim.js - call function:', functionName);
          const intersect = Intersection[functionName](boundaryItem.intersectPoints(), TrimItem.intersectPoints());

          // console.log(intersect.status);
          if (intersect.points.length) {
            // console.log('intersect points:', intersect.points.length);
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

