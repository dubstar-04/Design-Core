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

  processInput(num, input, inputType, core) {
    const expectedType = [];
    const prompt = [];

    const selection = `${core.scene.selection.selectionSet.length}  ${Strings.Input.SELECTED}`;
    const noSelection = Strings.Input.SELECTENTITIES;

    prompt[1] = core.scene.selection.selectionSet.length ? selection : noSelection;
    expectedType[1] = ['CanvasSelection', 'SelectionAccepted'];

    prompt[2] = Strings.Input.BASEPOINT;
    expectedType[2] = ['Point'];

    prompt[3] = Strings.Input.DESTINATIONORDISTANCE;
    expectedType[3] = ['Point', 'Number'];

    return {expectedType: expectedType, prompt: prompt, reset: (num === prompt.length - 1), action: (num === prompt.length - 1)};
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
