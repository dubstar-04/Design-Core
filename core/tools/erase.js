import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { RemoveState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

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
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Erase', shortcut: 'E', type: 'Tool' };
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
    } catch (err) {
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

    const stateChanges = [];

    for (let i = 0; i < selections.length; i++) {
      const stateChange = new RemoveState(DesignCore.Scene.entities.get(selections[i]), {});
      stateChanges.push(stateChange);
    }

    // delete each of the selections from the scene items
    DesignCore.Scene.commit(stateChanges);
  }
}
