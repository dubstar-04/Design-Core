import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

/**
 * Identity Command Class
 * @extends Tool
 */
export class Identify extends Tool {
  /** Create an Identify command */
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
    const command = {command: 'Identify', shortcut: 'ID'};
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.POINT, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      this.points.push(pt1);

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
    const x = this.points.at(-1).x.toFixed(1);
    const y = this.points.at(-1).y.toFixed(1);
    const id = (`X:${x} Y:${y}`);
    DesignCore.Core.notify(id);
  }
}
