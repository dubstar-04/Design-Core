import { Intersection } from '../lib/intersect.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';

import { DesignCore } from '../designCore.js';

/**
 * Extend Command Class
 * @extends Tool
 */
export class Extend extends Tool {
  /** Create an Extend command */
  constructor() {
    super();
    this.selectedItem = null;
    this.selectedBoundaryItems = [];
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Extend', shortcut: 'EX', type: 'Tool' };
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

      // add all selected items to boundary items
      for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const boundaryItem = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
        this.selectedBoundaryItems.push(boundaryItem);
      }

      const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
      while (true) {
        const selection = await DesignCore.Scene.inputManager.requestInput(op2);
        this.selectedItem = DesignCore.Scene.entities.get(selection.selectedItemIndex);
        DesignCore.Scene.selectionManager.removeLastSelection();
        DesignCore.Scene.inputManager.actionCommand();
      }
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
    if (this.selectedItem && this.selectedBoundaryItems.length) {
      const intersectPoints = [];

      for (const boundaryItem of this.selectedBoundaryItems) {
        if (boundaryItem !== this.selectedItem) {
          const functionName = 'intersect' + boundaryItem.type + this.selectedItem.type;
          try {
            const intersect = Intersection[functionName](boundaryItem.intersectPoints(), this.selectedItem.intersectPoints(), true);
            if (intersect.points.length) {
              for (let point = 0; point < intersect.points.length; point++) {
                intersectPoints.push(intersect.points[point]);
              }
            }
          } catch {
            Logging.instance.warn(`${this.constructor.name}: Error intersecting between ${boundaryItem.type} and ${this.selectedItem.type}`);
            continue;
          }
        }
      }

      if (intersectPoints) {
        const stateChanges = this.selectedItem.extend(intersectPoints);
        if (stateChanges?.length) {
          DesignCore.Scene.commit(stateChanges);
        }
      }
    }

    // reset selected item
    this.selectedItem = null;
  }
}

