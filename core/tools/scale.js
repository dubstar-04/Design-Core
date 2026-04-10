import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';

/**
 * Scale Command Class
 * @extends Tool
 */
export class Scale extends Tool {
  static type = 'Scale';

  /** Create a Scale command */
  constructor() {
    super();
    this.scaleFactor = 1;
    this.referencePoint = null;
    this.referenceLength = null;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Scale', shortcut: 'SC' }; // , type: 'Tool' };
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
      const basePoint = await DesignCore.Scene.inputManager.requestInput(op2);
      if (basePoint === undefined) return;
      this.points.push(basePoint);

      while (this.points.length < 2) {
        const op3 = new PromptOptions(Strings.Input.SCALEFACTOR, [Input.Type.POINT, Input.Type.NUMBER], ['Reference']);
        const input = await DesignCore.Scene.inputManager.requestInput(op3);
        if (input === undefined) return;

        if (Input.getType(input) === Input.Type.STRING) {
          // Reference workflow: define a reference length then a new length
          // set referencePoint temporarily to prevent preview scaling
          this.referencePoint = basePoint;

          const op4 = new PromptOptions(Strings.Input.REFERENCELENGTH, [Input.Type.POINT, Input.Type.NUMBER]);
          const refInput = await DesignCore.Scene.inputManager.requestInput(op4);
          if (refInput === undefined) return;

          let referenceLength;
          if (Input.getType(refInput) === Input.Type.NUMBER) {
            referenceLength = refInput;
            this.referencePoint = null;
          } else {
            // refInput is a point — store it and ask for second point
            this.referencePoint = refInput;
            const op5 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
            const refEnd = await DesignCore.Scene.inputManager.requestInput(op5);
            if (refEnd === undefined) return;
            referenceLength = refInput.distance(refEnd);
            this.referencePoint = null;
          }

          if (referenceLength === 0) return;

          this.referenceLength = referenceLength;
          const op6 = new PromptOptions(Strings.Input.NEWLENGTH, [Input.Type.POINT, Input.Type.NUMBER]);
          const newInput = await DesignCore.Scene.inputManager.requestInput(op6);
          if (newInput === undefined) return;

          let newLength;
          if (Input.getType(newInput) === Input.Type.NUMBER) {
            newLength = newInput;
          } else {
            newLength = basePoint.distance(newInput);
          }

          this.scaleFactor = newLength / referenceLength;
          // Push a dummy second point to satisfy the loop condition
          this.points.push(basePoint);
        } else if (Input.getType(input) === Input.Type.NUMBER) {
          this.scaleFactor = input;
          this.points.push(basePoint);
        } else if (Input.getType(input) === Input.Type.POINT) {
          // Scale factor is the distance from the base point to the input point
          const distance = basePoint.distance(input);
          this.scaleFactor = distance;
          this.points.push(input);
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

    if (this.points.length >= 1 && this.referencePoint === null) {
      // Draw a line from base point to mouse
      const points = [this.points[0], mousePoint];
      DesignCore.Scene.previewEntities.create('Line', { points: points });

      const base = this.points[0];
      const distance = base.distance(mousePoint);
      if (distance === 0) return;

      const factor = this.referenceLength !== null ? distance / this.referenceLength : distance;

      for (let i = 0; i < DesignCore.Scene.selectionManager.selectedItems.length; i++) {
        const item = DesignCore.Scene.selectionManager.selectedItems[i];
        const entityIndex = DesignCore.Scene.selectionManager.selectionSet.selectionSet[i];
        const originalItem = DesignCore.Scene.entities.get(entityIndex);
        item.setProperty('points', this.getScaledPoints(originalItem.points, base, factor));
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    const base = this.points[0];
    const stateChanges = [];

    for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      const item = DesignCore.Scene.entities.get(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]);
      const stateChange = new UpdateState(item, { points: this.getScaledPoints(item.points, base, this.scaleFactor) });
      stateChanges.push(stateChange);
    }

    DesignCore.Scene.commit(stateChanges);
  }

  /**
   * Get scaled points about a base point
   * @param {Array} points
   * @param {Point} base
   * @param {number} factor
   * @return {Array} scaledPoints
   */
  getScaledPoints(points, base, factor) {
    return points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).scaleFrom(base, factor));
  }
}
