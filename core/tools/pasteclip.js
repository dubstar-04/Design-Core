import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Pasteclip Command Class
 * @extends Tool
 */
export class Pasteclip extends Tool {
  /** Create a Pasteclip command */
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
    const command = { command: 'Pasteclip', shortcut: 'Pasteclip' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to perform the command
   */
  async execute() {
    try {
      if (!DesignCore.Clipboard.isValid) {
        throw new Error(Strings.Error.INVALIDCLIPBOARD);
      }

      const op2 = new PromptOptions(Strings.Input.BASEPOINT, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op2);
      this.points.push(pt1);

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
      DesignCore.Scene.inputManager.reset();
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    // get the mouse position
    const mousePosition = DesignCore.Mouse.pointOnScene();
    const basePoint = DesignCore.Clipboard.BasePoint;
    const delta = mousePosition.subtract(basePoint);

    for (const entity of DesignCore.Clipboard.Entities) {
      const tempEntity = Utils.cloneObject(entity);
      const offsetPoints = tempEntity.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).add(delta));
      tempEntity.setProperty('points', offsetPoints);
      DesignCore.Scene.tempEntities.add(tempEntity);
    }
  }

  /**
   * Perform the command
   */
  action() {
    const stateChanges = [];

    // get the mouse position
    const mousePosition = this.points[0];
    const basePoint = DesignCore.Clipboard.BasePoint;
    const delta = mousePosition.subtract(basePoint);

    for (const entity of DesignCore.Clipboard.Entities) {
      const pastedEntity = Utils.cloneObject(entity);
      const offsetPoints = pastedEntity.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).add(delta));
      pastedEntity.setProperty('points', offsetPoints);

      const stateChange = new AddState(pastedEntity);
      stateChanges.push(stateChange);
    }

    DesignCore.Scene.commit(stateChanges);
  }
}
