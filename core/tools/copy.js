import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Copy Command Class
 * @extends Tool
 */
export class Copy extends Tool {
  /** Create a Copy command */
  constructor() {
    super();
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Copy', shortcut: 'CO', type: 'Tool' };
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

  /**
   * Preview the command during execution
   */
  preview() {
    if (this.points.length >= 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();

      // Draw a line
      const points = [this.points.at(-1), mousePoint];
      DesignCore.Scene.tempEntities.create('Line', { points: points });

      const delta = mousePoint.subtract(this.lastMousePoint || this.points[0]);
      this.lastMousePoint = mousePoint;

      for (let i = 0; i < DesignCore.Scene.selectionManager.selectedItems.length; i++) {
        const item = DesignCore.Scene.selectionManager.selectedItems[i];
        const offsetPoints = item.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).add(delta));
        item.setProperty('points', offsetPoints);
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    const delta = this.points[1].subtract(this.points[0]);
    const stateChanges = [];

    for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      const copyofitem = Utils.cloneObject(DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]));
      const offsetPoints = copyofitem.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).add(delta));
      copyofitem.setProperty('points', offsetPoints);
      const stateChange = new AddState(copyofitem, {});
      stateChanges.push(stateChange);
    }

    DesignCore.Scene.commit(stateChanges);
  };
}
