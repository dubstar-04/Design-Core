import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Strings } from '../lib/strings.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';

import { DesignCore } from '../designCore.js';

/**
 * PlotWindowPick Command Class
 * Internal tool used to interactively pick the two corners of a plot window.
 * Not shown in any toolbar; invoked programmatically (e.g. from the Plot dialog).
 * @extends Tool
 */
export class PlotWindowPick extends Tool {
  static type = 'PlotWindowPick';

  /** Create a PlotWindowPick command */
  constructor() {
    super();
    // called with (point1, point2) once both corners are picked
    this.onComplete = undefined;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   */
  static register() {
    const command = { command: 'PlotWindowPick', shortcut: 'PLOTWINDOWPICK' };
    return command;
  }

  /**
   * Execute method
   * requests the two corner points defining the plot window
   */
  async execute() {
    try {
      const op1 = new PromptOptions(Strings.Input.FIRSTCORNER, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op1);
      if (pt1 === undefined) return;
      this.points.push(pt1);

      const op2 = new PromptOptions(Strings.Input.SECONDCORNER, [Input.Type.POINT]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op2);
      if (pt2 === undefined) return;
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
    if (this.points.length === 1) {
      const mousePoint = DesignCore.Mouse.pointOnScene();
      const p1 = this.points[0];
      const p2 = mousePoint;

      const points = [
        new Point(p1.x, p1.y),
        new Point(p2.x, p1.y),
        new Point(p2.x, p2.y),
        new Point(p1.x, p2.y),
        new Point(p1.x, p1.y),
      ];

      DesignCore.Scene.previewEntities.create('Polyline', { points: points });
    }
  }

  /**
   * Perform the command
   * invokes the completion callback with the two picked points
   */
  action() {
    if (this.points.length === 2 && this.onComplete) {
      this.onComplete(this.points[0], this.points[1]);
    }
  }
}
