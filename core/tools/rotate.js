import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Utils } from '../lib/utils.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';
import { RubberBand } from '../lib/auxiliary/rubberBand.js';

/**
 * Rotate Command Class
 * @extends Tool
 */
export class Rotate extends Tool {
  static type = 'Rotate';

  /** Create a Rotate command */
  constructor() {
    super();
    this.baseAngle = 0;
    this.basePoint = null;
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
      if (input1 === undefined) return;
      this.points.push(input1);

      while (this.points.length < 2) {
        const op3 = new PromptOptions(Strings.Input.ROTATION, [Input.Type.POINT, Input.Type.NUMBER], ['Reference']);
        const input2 = await DesignCore.Scene.inputManager.requestInput(op3);
        if (input2 === undefined) return;

        if (Input.getType(input2) === Input.Type.STRING) {
          // set the base angle to null to prevent the preview
          this.baseAngle = null;
          const op4 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
          const refBase = await DesignCore.Scene.inputManager.requestInput(op4);
          if (refBase === undefined) return;
          // set the base point to the reference start point
          this.basePoint = refBase;

          const op5 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
          const refEnd = await DesignCore.Scene.inputManager.requestInput(op5);
          if (refEnd === undefined) return;
          // set the base angle to the reference
          this.baseAngle = refBase.angle(refEnd);
          // set the base point to null
          this.basePoint = null;
          // restore inputPoint to the rotation centre so the tracking line
          // uses the correct origin for the final angle input
          DesignCore.Scene.inputManager.inputPoint = this.points[0];
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

    if (this.points.length >= 1 && this.baseAngle !== null || this.basePoint !== null) {
      // Draw a rubber-band line from centre to mouse
      const centre = this.basePoint === null ? this.points.at(0) : this.basePoint;
      DesignCore.Scene.auxiliaryEntities.add(new RubberBand([centre, mousePoint]));
    }

    if (this.points.length >= 1) {
      const ang = this.points[0].angle(mousePoint);
      const theta = this.baseAngle === null ? 0 : ang - this.baseAngle;
      const centre = this.points[0];

      for (let i = 0; i < DesignCore.Scene.selectionManager.selectedEntities.length; i++) {
        const entity = DesignCore.Scene.selectionManager.selectedEntities[i];
        // get the original points from the scene entities
        const entityIndex = DesignCore.Scene.selectionManager.selectionSet.selectionSet[i];
        const originalEntity = DesignCore.Scene.entities.get(entityIndex);
        entity.setProperty('points', this.getRotatedPoints(originalEntity.points, centre, theta));
      }
    }
  };

  /**
   * Perform the command
   */
  action() {
    const ang = this.points[0].angle(this.points[1]);
    const theta = ang - this.baseAngle;
    const centre = this.points[0];

    const stateChanges = [];

    for (let index = 0; index < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; index++) {
      const entity = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[index]);
      const stateChange = new UpdateState(entity, { points: this.getRotatedPoints(entity.points, centre, theta) });
      stateChanges.push(stateChange);
    }

    DesignCore.Scene.commit(stateChanges);
  };

  /**
 * Get rotated points
 * @param {Array} points
 * @param {Point} centre
 * @param {number} theta
 * @return {Array} rotatedPoints
 */
  getRotatedPoints(points, centre, theta) {
    const rotatedPoints = points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).rotate(centre, theta));
    return rotatedPoints;
  }
}
