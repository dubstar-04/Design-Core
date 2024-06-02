import {Intersection} from '../lib/intersect.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

/**
 * Extend Command Class
 * @extends Tool
 */
export class Extend extends Tool {
  /** Create an Extend command */
  constructor() {
    super();
    this.selectedIndex;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = {command: 'Extend', shortcut: 'EX', type: 'Tool'};
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.BOUNDARY, [Input.Type.SELECTIONSET]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
      while (true) {
        const selection = await DesignCore.Scene.inputManager.requestInput(op2);
        this.selectedIndex = selection.selectedItemIndex;
        DesignCore.Scene.inputManager.actionCommand();
      }
    } catch (error) {
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
    const item = this.selectedIndex;

    if (item !== undefined) {
      const intersectPoints = [];
      let extendItem;

      for (let i = 0; i <DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (DesignCore.Scene.selectionManager.selectionSet.selectionSet[i] !== item) {
          const boundaryItem = DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]];
          extendItem = DesignCore.Scene.items[item];

          const functionName = 'intersect' + boundaryItem.type + extendItem.type;
          const intersect = Intersection[functionName](boundaryItem.intersectPoints(), extendItem.intersectPoints(), true);

          if (intersect.points.length) {
            for (let point = 0; point < intersect.points.length; point++) {
              intersectPoints.push(intersect.points[point]);
            }
          }
        }
      }

      if (intersectPoints) {
        extendItem.extend(intersectPoints);
      }

      // remove item from selection set and reset the selectedIndex
      DesignCore.Scene.selectionManager.removeFromSelectionSet(this.selectedIndex);
      this.selectedIndex = undefined;
    }
  }
}

