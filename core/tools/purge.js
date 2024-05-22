import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

export class Purge extends Tool {
  constructor() {
    super();
    this.option = '';
    this.options = ['Blocks', 'Layers', 'LTypes', 'All']
  }

  static register() {
    const command = {command: 'Purge', shortcut: 'PU'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.OPTION, [], this.options);
      this.option = await DesignCore.Scene.inputManager.requestInput(op);

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    // No preview
  }

  action() {

    const msg = (`Purged option: ${this.option}`);
    DesignCore.Core.notify(msg);
  }
}
