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
      const op = new PromptOptions(`${Strings.Input.OPTION} <${this.options[3]}>`, [], this.options);
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
    let purgedCount = 0;

    if (this.option === 'Blocks' || this.option === 'All') {
      const intialBlockCount = DesignCore.Scene.blockManager.blockCount();
      DesignCore.Scene.blockManager.purge();
      const finalBlockCount = DesignCore.Scene.blockManager.blockCount();
      purgedCount += (intialBlockCount - finalBlockCount);
    }

    if (this.option === 'Layers'|| this.option === 'All') {
      const intialLayerCount = DesignCore.LayerManager.styleCount();
      DesignCore.LayerManager.purge();
      const finalLayerCount = DesignCore.LayerManager.styleCount();
      purgedCount += (intialLayerCount - finalLayerCount);
    }

    if (this.option === 'LTypes'|| this.option === 'All') {
      const intialLTypeCount = DesignCore.LTypeManager.styleCount();
      DesignCore.LTypeManager.purge();
      const finalLTypeCount = DesignCore.LTypeManager.styleCount();
      purgedCount += (intialLTypeCount - finalLTypeCount);
    }

    DesignCore.Core.notify(`${this.type} ${this.option}: ${purgedCount} ${Strings.Strings.ITEMS} ${Strings.Strings.REMOVED}`);
  }
}
