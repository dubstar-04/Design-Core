import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

export class Distance extends Tool {
  constructor() {
    super();
  }

  static register() {
    const command = {command: 'Distance', shortcut: 'DI'}; // , type: 'Tool'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt2 = await core.scene.inputManager.requestInput(op2);
      this.points.push(pt2);


      core.scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview(core) {
    // TODO: Draw a preview of the measurement
  }

  action(core) {
    const length = Utils.distBetweenPoints(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y).toFixed(1);
    const x = (this.points[1].x - this.points[0].x).toFixed(1);
    const y = (this.points[1].y - this.points[0].y).toFixed(1);
    const di = (`${Strings.Strings.LENGTH}: ${length} &#916;X: ${x} &#916;Y: ${y}`);
    core.notify(di);
  }
}
