import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Utils } from '../lib/utils.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';

import { DesignCore } from '../designCore.js';

/**
 * Rotate Command Class
 * @extends Tool
 */
export class Rotate extends Tool {
  /** Create a Rotate command */
  constructor() {
    super();
    this.baseAngle = 0;
    this.lastAngle = 0;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Rotate', shortcut: 'RO', type: 'Tool' };
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
      const input1 = await DesignCore.Scene.inputManager.requestInput(op2);
      this.points.push(input1);

      while (this.points.length < 2) {
        const op3 = new PromptOptions(Strings.Input.ROTATION, [Input.Type.POINT, Input.Type.NUMBER], ['Reference']);
        const input2 = await DesignCore.Scene.inputManager.requestInput(op3);

        if (Input.getType(input2) === Input.Type.STRING) {
          // set the base angle to null to prevent the preview
          this.baseAngle = null;
          const op4 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
          const refBase = await DesignCore.Scene.inputManager.requestInput(op4);

          const op5 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
          const refEnd = await DesignCore.Scene.inputManager.requestInput(op5);
          // set the base angle to the reference
          this.baseAngle = refBase.angle(refEnd);
        } else if (Input.getType(input2) === Input.Type.NUMBER) {
          const basePoint = this.points.at(0);
          const angle = Utils.degrees2radians(input2);
          const point = basePoint.project(angle, 100);
          this.points.push(point);
        } else if (Input.getType(input2) === Input.Type.POINT) {
          this.points.push(input2);
        }
      }

      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    const mousePoint = DesignCore.Mouse.pointOnScene();

    if (this.points.length >= 1 && this.baseAngle !== null) {
      // Draw a line
      const points = [this.points.at(0), mousePoint];

      DesignCore.Scene.createTempItem('Line', { points: points });
    }

    if (this.points.length >= 1) {
      const ang = this.points[0].angle(mousePoint);
      const theta = this.baseAngle === null ? 0 : ang - this.baseAngle - this.lastAngle;
      this.lastAngle = ang;
      const center = this.points[0];

      for (let i = 0; i < DesignCore.Scene.selectionManager.selectedItems.length; i++) {
        const item = DesignCore.Scene.selectionManager.selectedItems[i];

        if (item.hasOwnProperty('childEntities')) {
          item.childEntities.forEach((child) => {
            child.setProperty('points', this.getRotatedPoints(child.points, center, theta));
          });
        } else {
          item.setProperty('points', this.getRotatedPoints(item.points, center, theta));
        }
      }
    }
  };

  /**
   * Perform the command
   */
  action() {
    const ang = this.points[0].angle(this.points[1]);
    const theta = ang - this.baseAngle;
    const center = this.points[0];

    for (let index = 0; index < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; index++) {
      const item = DesignCore.Scene.getItem(DesignCore.Scene.selectionManager.selectionSet.selectionSet[index]);
      if (item.hasOwnProperty('childEntities')) {
        item.childEntities.forEach((child) => {
          child.setProperty('points', this.getRotatedPoints(child.points, center, theta));
        });
        // set the angle of the main item if it has one
        // item.setProperty('angle', item.angle+= Utils.radians2degrees(theta));
      } else {
        DesignCore.Scene.updateItem(index, { points: this.getRotatedPoints(item.points, center, theta) });
      }
    }
  };

  /**
 * Get rotated points
 * @param {Array} points
 * @param {Point} delta
 * @return {Array} rotatedPoints
 */
  getRotatedPoints(points, center, theta) {
    const rotatedPoints = points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).rotate(center, theta));
    return rotatedPoints;
  }
}
