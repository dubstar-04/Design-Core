export class Erase {
  constructor() {
    // Define Properties
    this.type = 'Erase';
    this.family = 'Tools';
    this.movement = 'None';
    this.minPoints = 0;
    this.selectionRequired = true;
    this.helper_geometry = false;
    this.showPreview = false;
  }

  static register() {
    const command = {command: 'Erase', shortcut: 'E', type: 'Tool'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = 'Select Items To ' + this.type;

    expectedType[1] = ['object'];
    prompt[1] = core.scene.selection.selectionSet.length + ' Item(s) selected: Add more or press Enter to Erase';

    expectedType[2] = ['boolean'];
    prompt[2] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === 2) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
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
