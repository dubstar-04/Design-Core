import { Point } from './point.js';
import { Strings } from '../lib/strings.js';
import { Entity } from './entity.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Logging } from '../lib/logging.js';
import { Polyline } from './polyline.js';

import { DesignCore } from '../designCore.js';

/**
 * Rectangle Entity Class
 * @extends Entity
 */
export class Rectangle extends Entity {
  /**
   * Create a Rectangle
   * @param {Array} data
   */
  constructor(data) {
    super(data);
    // There is no DXF representation of a Rectangle
    // Convenience entity to create a polyline from two points
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'Rectangle', shortcut: 'REC', type: 'Entity' };
    return command;
  }

  /**
   * Execute method
   * executes the workflow, requesting input required to create an entity
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op);
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
      this.points.push(pt2);

      const points = this.rectPoints(this.points[0], this.points[1]);
      const polyline = new Polyline({ points: points });

      DesignCore.Scene.inputManager.executeCommand(polyline);
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the entity during creation
   */
  preview() {
    if (this.points.length >= 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const points = this.rectPoints(this.points.at(-1), mousePoint);
      DesignCore.Scene.tempEntities.create('Polyline', { points: points });
    }
  }

  /**
   * Get the rectangle points
   * @param {Point} pt1
   * @param {Point} pt2
   * @return {Array} array of points for each corner
   */
  rectPoints(pt1, pt2) {
    const points = [];
    points.push(new Point(pt1.x, pt1.y));
    points.push(new Point(pt2.x, pt1.y));
    points.push(new Point(pt2.x, pt2.y));
    points.push(new Point(pt1.x, pt2.y));
    points.push(new Point(pt1.x, pt1.y));
    return points;
  }
}
