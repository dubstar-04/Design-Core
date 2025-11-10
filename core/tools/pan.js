import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';

import { DesignCore } from '../designCore.js';

/**
 * Pan Command Class
 * @extends Tool
 */
export class Pan extends Tool {
  /** Create a Pan command */
  constructor() {
    super();
    this.panning = false;
  }

  /**
   * Register the command
   * @return {Object}
   */
  static register() {
    const command = { command: 'Pan', shortcut: 'P' };
    return command;
  }

  /**
   * Execute method
   */
  async execute() {
    try {
      while (DesignCore.Scene.inputManager.activeCommand) {
        const mouseState = new PromptOptions('', [Input.Type.MOUSESTATECHANGE]);
        // wait for mouse down
        await DesignCore.Scene.inputManager.requestInput(mouseState);
        this.panning = DesignCore.Mouse.buttonOneDown ? true : false;
        // wait for mouse up
        await DesignCore.Scene.inputManager.requestInput(mouseState);
        this.panning = false;
      }
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    if (this.panning) {
      DesignCore.Canvas.pan();
    }
  }
}


