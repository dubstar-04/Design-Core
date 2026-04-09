import { Utils } from '../lib/utils.js';
import { Strings } from '../lib/strings.js';
import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';
import { AddState, UpdateState } from '../lib/stateManager.js';

import { DesignCore } from '../designCore.js';
import { RubberBand } from '../lib/rubberBand.js';

/**
 * Mirror Command Class
 * @extends Tool
 */
export class Mirror extends Tool {
  static type = 'Mirror';

  /** Create a Mirror command */
  constructor() {
    super();
    this.eraseSource = false;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Mirror', shortcut: 'MI' }; // , type: 'Tool' };
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

      const op2 = new PromptOptions(Strings.Input.MIRRORFIRST, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op2);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      const op3 = new PromptOptions(Strings.Input.MIRRORSECOND, [Input.Type.POINT]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op3);
      if (pt2 === undefined) return;
      this.points.push(pt2);

      const op4 = new PromptOptions(Strings.Input.ERASESOURCE, [], ['Yes', 'No'], 'N');
      const eraseInput = await DesignCore.Scene.inputManager.requestInput(op4);
      this.eraseSource = (eraseInput === 'Yes');

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
      const pt1 = this.points[0];
      const pt2 = this.points.length >= 2 ? this.points[1] : mousePoint;

      // Draw the mirror line as a rubber-band indicator
      DesignCore.Scene.auxiliaryEntities.add(new RubberBand([pt1, pt2]));

      // Preview mirrored entities (skip if mirror line has zero length)
      if (!pt1.isSame(pt2)) {
        for (let i = 0; i < DesignCore.Scene.selectionManager.selectedItems.length; i++) {
          const item = DesignCore.Scene.selectionManager.selectedItems[i];
          const entityIndex = DesignCore.Scene.selectionManager.selectionSet.selectionSet[i];
          const originalItem = DesignCore.Scene.entities.get(entityIndex);
          item.setProperty('points', this.getMirroredPoints(originalItem.points, pt1, pt2));
          if (originalItem.direction !== undefined) {
            item.setProperty('direction', -originalItem.direction);
          }
        }
      }
    }
  }

  /**
   * Perform the command
   */
  action() {
    const pt1 = this.points[0];
    const pt2 = this.points[1];

    if (pt1.isSame(pt2)) {
      DesignCore.Core.notify(`${this.type} - ${Strings.Error.ZEROLENGTH}`);
      return;
    }

    const stateChanges = [];

    for (let i = 0; i < DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      const entityIndex = DesignCore.Scene.selectionManager.selectionSet.selectionSet[i];
      const item = DesignCore.Scene.entities.get(entityIndex);
      const mirroredPoints = this.getMirroredPoints(item.points, pt1, pt2);

      if (this.eraseSource) {
        // Replace the original with its mirrored version
        const updates = { points: mirroredPoints };
        if (item.direction !== undefined) updates.direction = -item.direction;
        const stateChange = new UpdateState(item, updates);
        stateChanges.push(stateChange);
      } else {
        // Keep the original and add a mirrored copy
        const copyOfItem = Utils.cloneObject(item);
        copyOfItem.setProperty('points', mirroredPoints);
        if (copyOfItem.direction !== undefined) copyOfItem.setProperty('direction', -copyOfItem.direction);
        const stateChange = new AddState(copyOfItem);
        stateChanges.push(stateChange);
      }
    }

    DesignCore.Scene.commit(stateChanges);
  }

  /**
   * Get mirrored points across the line defined by pt1 and pt2
   * @param {Array} points
   * @param {Point} pt1 - first point on the mirror line
   * @param {Point} pt2 - second point on the mirror line
   * @return {Array} mirroredPoints
   */
  getMirroredPoints(points, pt1, pt2) {
    return points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).mirror(pt1, pt2));
  }
}
