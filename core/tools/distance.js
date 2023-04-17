import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Distance extends Tool {
  constructor() {
    super();
    this.selectionRequired = false;
  }

  static register() {
    const command = {command: 'Distance', shortcut: 'DI'}; // , type: 'Tool'};
    return command;
  }

  processInput(num, input, inputType, core) {
    const expectedType = [];
    const prompt = [];

    prompt[1] = Strings.Input.START;
    expectedType[1] = ['Point'];

    prompt[2] = Strings.Input.END;
    expectedType[2] = ['Point'];

    return {expectedType: expectedType, prompt: prompt, reset: (num === prompt.length - 1), action: (num === prompt.length - 1)};
  }

  preview(num) {
    // TODO: Draw a preview of the measurement
  }

  action(core) {
    const length = Utils.distBetweenPoints(core.scene.points[0].x, core.scene.points[0].y, core.scene.points[1].x, core.scene.points[1].y).toFixed(1);
    const x = (core.scene.points[1].x - core.scene.points[0].x).toFixed(1);
    const y = (core.scene.points[1].y - core.scene.points[0].y).toFixed(1);
    const di = (`${Strings.Strings.LENGTH}: ${length} &#916;X: ${x} &#916;Y: ${y}`);
    core.notify(di);
  }
}
