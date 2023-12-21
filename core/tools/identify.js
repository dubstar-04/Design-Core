import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

export class Identify extends Tool {
  constructor() {
    super();
  }

  static register() {
    const command = {command: 'Identify', shortcut: 'ID'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.POINT, [Input.Type.POINT]);
      const pt1 = await Core.Scene.inputManager.requestInput(op);
      this.points.push(pt1);

      Core.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  action() {
    const x = this.points.at(-1).x.toFixed(1);
    const y = this.points.at(-1).y.toFixed(1);
    const id = (`X:${x} Y:${y}`);
    core.notify(id);
  }
}
