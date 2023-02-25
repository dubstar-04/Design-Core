import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';

export class Distance {
  constructor() {
    // Define Properties
    this.type = 'Distance';
    this.family = 'Tools';
    this.movement = 'None';
    this.minPoints = 2;
    this.selectionRequired = false;
    this.helper_geometry = false;
    this.showPreview = false;
  }

  static register() {
    const command = {command: 'Distance', shortcut: 'DI'}; // , type: 'Tool'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.START;

    expectedType[1] = ['object'];
    prompt[1] = Strings.Input.END;

    expectedType[2] = ['object'];
    prompt[2] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === this.minPoints) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  preview(num) {
    // console.log('TO DO: Draw a preview of the measurement');
  }

  action(core) {
    const di = (' Length: ' + Utils.distBetweenPoints(core.scene.points[0].x, core.scene.points[0].y, core.scene.points[1].x, core.scene.points[1].y).toFixed(1) +
            ' - X delta: ' + (core.scene.points[1].x - core.scene.points[0].x).toFixed(1) + ' - Y delta:' + (core.scene.points[1].y - core.scene.points[0].y).toFixed(1));
    core.notify(di);
  }
}
