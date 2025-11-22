import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';

import { DesignCore } from '../designCore.js';

/**
 * Copybase Command Class
 * @extends Tool
 */
export class Copybase extends Tool {
  /** Create a Copybase command */
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
    const command = { command: 'Copybase', shortcut: 'COPYBASE' };
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

      const op1 = new PromptOptions(Strings.Input.BASEPOINT, [Input.Type.POINT]);
      const pt0 = await DesignCore.Scene.inputManager.requestInput(op1);
      this.points.push(pt0);

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }


  /**
   * Perform the command
   */
  action() {
    // generate clipboard data from selected items
    const selectedItems = DesignCore.Scene.selectionManager.selectedItems;

    // create clipboard data
    DesignCore.Clipboard.Entities = selectedItems;
    // set base point
    DesignCore.Clipboard.BasePoint = this.points[0];
  };
}
