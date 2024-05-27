import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

export class Purge extends Tool {
  constructor() {
    super();
    this.option = '';
    this.options = ['Blocks', 'Layers', 'LTypes', 'All'];
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
    if (this.option === 'Blocks' || this.option === 'All') {
      DesignCore.Scene.blockManager.purge();
    }

    if (this.option === 'Layers'|| this.option === 'All') {
      DesignCore.LayerManager.purge();
    }

    if (this.option === 'LTypes'|| this.option === 'All') {
      DesignCore.LTypeManager.purge();
    }

    DesignCore.Core.notify(`${this.type} ${this.option}: ${Strings.Message.COMPLETED}`);
  }
}
