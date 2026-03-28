import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';

import { DesignCore } from '../designCore.js';

/**
 * Distance Command Class
 * @extends Tool
 */
export class Distance extends Tool {
  /** Create a Distance command */
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
    const command = { command: 'Distance', shortcut: 'DI' }; // , type: 'Tool'};
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
      if (pt2 === undefined) return;
      this.points.push(pt2);

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    // TODO: Draw a preview of the measurement
  }

  /**
   * Perform the command
   */
  action() {
    const dx = this.points[1].x - this.points[0].x;
    const dy = this.points[1].y - this.points[0].y;
    const length = this.points[0].distance(this.points[1]).toFixed(1);
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1);
    const x = dx.toFixed(1);
    const y = dy.toFixed(1);
    const di = (`${Strings.Strings.LENGTH}: ${length} Angle: ${angle}${Strings.Symbol.DEGREE} ${Strings.Symbol.DELTA}X: ${x} ${Strings.Symbol.DELTA}Y: ${y}`);
    DesignCore.Core.notify(di);
  }
}
