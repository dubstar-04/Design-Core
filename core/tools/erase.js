import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

export class Erase extends Tool {
  constructor() {
    super();
  }

  static register() {
    const command = {command: 'Erase', shortcut: 'E', type: 'Tool'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);

      if (!core.scene.selectionManager.selectionSet.selectionSet.length) {
        await core.scene.inputManager.requestInput(op);
      }

      core.scene.inputManager.executeCommand();
    } catch (error) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  action(core) {
    // get a copy of the selection set
    const selections = core.scene.selectionManager.selectionSet.selectionSet.slice();
    // sort the selection in descending order
    selections.sort((a, b)=>b-a);

    // delete each of the selections from the scene items
    // This is done in descending order to preserve the indices i.e if index 1 is deleted, index 2 becomes index 1
    for (let i = 0; i < selections.length; i++) {
      core.scene.items.splice((selections[i]), 1);
    }
  }
}
