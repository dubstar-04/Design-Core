import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

/**
 * Purge Command Class
 * @extends Tool
 */
export class Purge extends Tool {
  /** Create a Purge command */
  constructor() {
    super();
    this.option = '';
    this.options = ['Blocks', 'Layers', 'LTypes', 'All'];
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = {command: 'Purge', shortcut: 'PU'};
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      const op = new PromptOptions(`${Strings.Input.OPTION} <${this.options[3]}>`, [], this.options);
      this.option = await DesignCore.Scene.inputManager.requestInput(op);

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    // No Preview
  }

  /**
   * Perform the command
   */
  action() {
    let purgedCount = 0;

    if (this.option === 'Blocks' || this.option === 'All') {
      const intialitemCount = DesignCore.Scene.blockManager.itemCount();
      DesignCore.Scene.blockManager.purge();
      const finalitemCount = DesignCore.Scene.blockManager.itemCount();
      purgedCount += (intialitemCount - finalitemCount);
    }

    if (this.option === 'Layers'|| this.option === 'All') {
      const intialLayerCount = DesignCore.LayerManager.itemCount();
      DesignCore.LayerManager.purge();
      const finalLayerCount = DesignCore.LayerManager.itemCount();
      purgedCount += (intialLayerCount - finalLayerCount);
    }

    if (this.option === 'LTypes'|| this.option === 'All') {
      const intialLTypeCount = DesignCore.LTypeManager.itemCount();
      DesignCore.LTypeManager.purge();
      const finalLTypeCount = DesignCore.LTypeManager.itemCount();
      purgedCount += (intialLTypeCount - finalLTypeCount);
    }

    DesignCore.Core.notify(`${this.type} ${this.option}: ${purgedCount} ${Strings.Strings.ITEMS} ${Strings.Strings.REMOVED}`);
  }
}
