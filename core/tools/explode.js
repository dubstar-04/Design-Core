import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';
import {Insert} from '../entities/insert.js';

import {DesignCore} from '../designCore.js';

/**
 * Explode Command Class
 * @extends Tool
 */
export class Explode extends Tool {
  /** Create an Explode command */
  constructor() {
    super();
  }

  /**
   * Register the command
   * @returns {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = {command: 'Explode', shortcut: 'X'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      DesignCore.Scene.inputManager.executeCommand();
    } catch (error) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    // No Preview
  }

  action() {
    // count how many items couldn't be exploded
    let counter = 0;
    // get a copy of the selection set
    const selections = DesignCore.Scene.selectionManager.selectionSet.selectionSet.slice();
    // sort the selection in descending order
    selections.sort((a, b) => b - a);

    for (let i = 0; i < selections.length; i++) {
      const item = DesignCore.Scene.items[selections[i]];

      // check the selected item in an insert
      if (!(item instanceof Insert)) {
        counter++;
        continue;
      }

      // check the insert has a block and
      // check the block has items
      if (item.block === undefined || item.block.items.length == 0) {
        counter++;
        continue;
      }

      const insert = DesignCore.Scene.items.splice(selections[i], 1)[0];
      const insertPoint = insert.points[0];
      const block = insert.block;
      const blockItems = block.items;

      blockItems.forEach((blockItem) => {
        const copyofitem = Utils.cloneObject(blockItem);

        for (let j = 0; j < copyofitem.points.length; j++) {
          copyofitem.points[j].x = copyofitem.points[j].x + insertPoint.x;
          copyofitem.points[j].y = copyofitem.points[j].y + insertPoint.y;
        }

        DesignCore.Scene.items.push(copyofitem);
      });
    }

    if (counter) {
      DesignCore.Core.notify(`${this.type} - ${counter} ${Strings.Strings.ITEMS} ${Strings.Message.CANNOTBEACTIONED}`);
    }
  };
}
