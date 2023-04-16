import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Erase extends Tool {
  constructor() {
    super();
    this.minPoints = 0;
  }

  static register() {
    const command = {command: 'Erase', shortcut: 'E', type: 'Tool'};
    return command;
  }

  processInput(num, input, inputType, core) {
    const expectedType = [];
    const prompt = [];

    const selection = `${core.scene.selection.selectionSet.length}  ${Strings.Input.SELECTED}`;
    const noSelection = Strings.Input.SELECTENTITIES;

    prompt[1] = core.scene.selection.selectionSet.length ? selection : noSelection;
    expectedType[1] = ['CanvasSelection', 'SelectionAccepted'];

    const accepted = (inputType === 'SelectionAccepted');

    return {expectedType: expectedType, prompt: prompt, reset: accepted, action: accepted};
  }

  action(core) {
    // get a copy of the selection set
    const selections = core.scene.selection.selectionSet.slice();
    // sort the selection in descending order
    selections.sort((a, b)=>b-a);

    // delete each of the selections from the scene items
    // This is done in descending order to preserve the indices i.e if index 1 is deleted, index 2 becomes index 1
    for (let i = 0; i < selections.length; i++) {
      core.scene.items.splice((selections[i]), 1);
    }
  }
}
