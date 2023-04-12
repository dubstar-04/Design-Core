import {Intersection} from '../lib/intersect.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Trim extends Tool {
  constructor() {
    super();
    // remove this.movement
    this.movement = 'Modify';
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
    prompt[1] = `${core.scene.selection.selectionSet.length}  ${Strings.Input.SELECTED}`;

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
    const item = core.scene.selection.findClosestItem();

    if (item !== undefined) {
      const intersectPoints = [];
      let TrimItem;

      for (let i = 0; i < core.scene.selection.selectionSet.length; i++) {
        if (core.scene.selection.selectionSet[i] !== item) {
          const boundaryItem = core.scene.items[core.scene.selection.selectionSet[i]];
          TrimItem = core.scene.items[item];

          const functionName = 'intersect' + boundaryItem.type + TrimItem.type;
          const intersect = Intersection[functionName](boundaryItem.intersectPoints(), TrimItem.intersectPoints());

          if (intersect.points.length) {
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
}

