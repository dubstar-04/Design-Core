import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Move extends Tool {
  constructor() {
    super();
  }

  static register() {
    const command = {command: 'Move', shortcut: 'M', type: 'Tool'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.SELECTENTITIES;

    expectedType[1] = ['object'];
    prompt[1] = `${core.scene.selection.selectionSet.length}  ${Strings.Input.SELECTED}`;

    expectedType[2] = ['boolean'];
    prompt[2] = Strings.Input.BASEPOINT;

    expectedType[3] = ['object'];
    prompt[3] = Strings.Input.DESTINATIONORDISTANCE;

    expectedType[4] = ['object', 'number'];
    prompt[4] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === 4) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  action(core) {
    const xDelta = core.scene.points[1].x - core.scene.points[0].x;
    const yDelta = core.scene.points[1].y - core.scene.points[0].y;

    for (let i = 0; i < core.scene.selection.selectionSet.length; i++) {
      for (let j = 0; j < core.scene.selection.selectedItems[i].points.length; j++) {
        core.scene.items[core.scene.selection.selectionSet[i]].points[j].x = core.scene.items[core.scene.selection.selectionSet[i]].points[j].x + xDelta;
        core.scene.items[core.scene.selection.selectionSet[i]].points[j].y = core.scene.items[core.scene.selection.selectionSet[i]].points[j].y + yDelta;
      }
    }
  }

  preview(core) {
    const xDelta = core.scene.tempPoints[1].x - core.scene.tempPoints[0].x;
    const yDelta = core.scene.tempPoints[1].y - core.scene.tempPoints[0].y;

    for (let i = 0; i < core.scene.selection.selectionSet.length; i++) {
      for (let j = 0; j < core.scene.selection.selectedItems[i].points.length; j++) {
        core.scene.selection.selectedItems[i].points[j].x = core.scene.items[core.scene.selection.selectionSet[i]].points[j].x + xDelta;
        core.scene.selection.selectedItems[i].points[j].y = core.scene.items[core.scene.selection.selectionSet[i]].points[j].y + yDelta;
      }
    }
  }
}
