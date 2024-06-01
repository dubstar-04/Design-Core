import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

/**
 * Erase Command Class
 * @extends Tool
 */
export class Erase extends Tool {
  /** Create an Erase command */
  constructor() {
    super();
  }

  /**
   * Register the command
   * @returns {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = {command: 'Erase', shortcut: 'E', type: 'Tool'};
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      DesignCore.Scene.inputManager.executeCommand();
    } catch (error) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    // No Preview
  }

  /**
   * Perform the command
   */
  action() {
    // get a copy of the selection set
    const selections = DesignCore.Scene.selectionManager.selectionSet.selectionSet.slice();
    // sort the selection in descending order
    selections.sort((a, b)=>b-a);

    // delete each of the selections from the scene items
    // This is done in descending order to preserve the indices i.e if index 1 is deleted, index 2 becomes index 1
    for (let i = 0; i < selections.length; i++) {
      DesignCore.Scene.items.splice((selections[i]), 1);
    }
  }
}
