import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Identify extends Tool {
  constructor() {
    super();
    this.selectionRequired = false;
  }

  static register() {
    const command = {command: 'Identify', shortcut: 'ID'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.POINT;

    expectedType[1] = ['object'];
    prompt[1] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === 1) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  action(core) {
    const x = core.scene.points[0].x.toFixed(1);
    const y = core.scene.points[0].y.toFixed(1);
    const id = (`X:${x} Y:${y}`);
    core.notify(id);
  }
}
