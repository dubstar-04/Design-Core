import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Identify extends Tool {
  constructor() {
    super();
    this.selectionRequired = false;
    this.minPoints = 1;
  }

  static register() {
    const command = {command: 'Identify', shortcut: 'ID'};
    return command;
  }

  processInput(num, input, inputType, core) {
    const expectedType = [];
    const prompt = [];

    prompt[1] = Strings.Input.START;
    expectedType[1] = ['Point'];

    return {expectedType: expectedType, prompt: prompt, reset: (num === prompt.length - 1), action: (num === prompt.length - 1)};
  }

  action(core) {
    const x = core.scene.points.at(-1).x.toFixed(1);
    const y = core.scene.points.at(-1).y.toFixed(1);
    const id = (`X:${x} Y:${y}`);
    core.notify(id);
  }
}
