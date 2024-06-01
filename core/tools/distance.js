import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

/**
 * Distance Command Class
 * @extends Tool
 */
export class Distance extends Tool {
/** Create a Distance command */
  constructor() {
    super();
  }

  static register() {
    const command = {command: 'Distance', shortcut: 'DI'}; // , type: 'Tool'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
      this.points.push(pt2);

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    // TODO: Draw a preview of the measurement
  }

  action() {
    const length = this.points[0].distance(this.points[1]).toFixed(1);
    const x = (this.points[1].x - this.points[0].x).toFixed(1);
    const y = (this.points[1].y - this.points[0].y).toFixed(1);
    const di = (`${Strings.Strings.LENGTH}: ${length} &#916;X: ${x} &#916;Y: ${y}`);
    DesignCore.Core.notify(di);
  }
}
