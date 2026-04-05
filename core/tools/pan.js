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
        const down = await DesignCore.Scene.inputManager.requestInput(new PromptOptions('', [Input.Type.MOUSEDOWN], [], undefined, Input.CursorState.GRAB));
        if (down === undefined) return;
        this.panning = true;
        const up = await DesignCore.Scene.inputManager.requestInput(new PromptOptions('', [Input.Type.MOUSEUP], [], undefined, Input.CursorState.GRABBING));
        this.panning = false;
        if (up === undefined) return;
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


