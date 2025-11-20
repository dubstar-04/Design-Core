import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Strings } from '../lib/strings.js';
import { Logging } from '../lib/logging.js';
import { UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * MatchProp Command Class
 * Provides: All, Extents, Window
 * @extends Tool
 */
export class MatchProp extends Tool {
  /** Create a MatchProp command */
  constructor() {
    super();
    // index of source item
    this.sourceIndex = null;
    // array of destination item indices
    this.destinationSetIndices = [];
    // properties to match
    this.properties = ['colour', 'layer', 'lineType', 'lineWidth', 'height', 'styleName', 'dimensionStyle'];
  }

  /**
   * Register the command
   * @return {Object}
   */
  static register() {
    const command = { command: 'MatchProp', shortcut: 'MA' };
    return command;
  }

  /**
   * Execute method
   */
  async execute() {
    try {
      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        const sourceSelection = new PromptOptions(Strings.Input.SOURCE, [Input.Type.SINGLESELECTION], []);
        const input = await DesignCore.Scene.inputManager.requestInput(sourceSelection);
        this.sourceIndex = input.selectedItemIndex;
      }


      const destinationSelection = new PromptOptions(Strings.Input.DESTINATIONSET, [Input.Type.SELECTIONSET]);
      const destInput = await DesignCore.Scene.inputManager.requestInput(destinationSelection);
      this.destinationSetIndices = destInput.selectionSet;


      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Perform the command
   */
  action() {
    // MatchProp

    // return if no source or destination set
    if (this.sourceIndex === null || this.destinationSetIndices.length === 0) {
      return;
    }

    // get source item
    const sourceItem = DesignCore.Scene.entities.get(this.sourceIndex);

    const stateChanges = [];

    // loop through destination set
    for (let i = 0; i < this.destinationSetIndices.length; i++) {
      const targetItem = DesignCore.Scene.entities.get(this.destinationSetIndices[i]);
      const propertySet = {};
      // loop through properties and match
      for (let p = 0; p < this.properties.length; p++) {
        // check property exists on both items
        const prop = this.properties[p];
        if (sourceItem.hasOwnProperty(prop)) {
          propertySet[prop] = sourceItem[prop];
        }
      }

      // only add state change if there are properties to change
      if (Object.keys(propertySet).length > 0) {
        const stateChange = new UpdateState(targetItem, propertySet);
        stateChanges.push(stateChange);
      }
    }
    // apply the updates
    if (stateChanges.length > 0) {
      DesignCore.Scene.commit(stateChanges);
    }
  }
}


