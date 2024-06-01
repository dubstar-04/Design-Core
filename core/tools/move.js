import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';

/**
 * Move Command Class
 * @extends Tool
 */
export class Move extends Tool {
  /** Create a Move command */
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
    const command = {command: 'Move', shortcut: 'M', type: 'Tool'};
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      const op2 = new PromptOptions(Strings.Input.BASEPOINT, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op2);
      this.points.push(pt1);

      const op3 = new PromptOptions(Strings.Input.DESTINATION, [Input.Type.POINT, Input.Type.DYNAMIC]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op3);
      this.points.push(pt2);


      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    if (this.points.length >= 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();

      // Draw a line
      const points = [this.points.at(-1), mousePoint];

      DesignCore.Scene.createTempItem('Line', {points: points});

      const xDelta = mousePoint.x - this.points[0].x;
      const yDelta = mousePoint.y - this.points[0].y;

      for (let i = 0; i <DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        for (let j = 0; j <DesignCore.Scene.selectionManager.selectedItems[i].points.length; j++) {
          DesignCore.Scene.selectionManager.selectedItems[i].points[j].x = DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x + xDelta;
          DesignCore.Scene.selectionManager.selectedItems[i].points[j].y = DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y + yDelta;
        }
      }
    }
  }

  action() {
    const xDelta = this.points[1].x - this.points[0].x;
    const yDelta = this.points[1].y - this.points[0].y;

    for (let i = 0; i <DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      for (let j = 0; j <DesignCore.Scene.selectionManager.selectedItems[i].points.length; j++) {
        DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x = DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x + xDelta;
        DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y = DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y + yDelta;
      }
    }
  }
}
