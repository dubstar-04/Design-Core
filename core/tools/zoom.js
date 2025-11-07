import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Strings} from '../lib/strings.js';
import {Logging} from '../lib/logging.js';
import {Point} from '../entities/point.js';

import {DesignCore} from '../designCore.js';

/**
 * Zoom Command Class
 * Provides: All, Extents, Window
 * @extends Tool
 */
export class Zoom extends Tool {
  /** Create a Zoom command */
  constructor() {
    super();
    this.modes = {
      ALL: 'All',
      EXTENTS: 'Extents',
      WINDOW: 'Window',
      OBJECT: 'Object',
    };
    this.mode = this.modes.WINDOW; // default to window mode
  }

  /**
   * Register the command
   * @return {Object}
   */
  static register() {
    const command = {command: 'Zoom', shortcut: 'Z'};
    return command;
  }

  /**
   * Execute method
   */
  async execute() {
    try {
      const op = new PromptOptions('Zoom', [], ['All', 'Extents', 'Window']);
      const option = await DesignCore.Scene.inputManager.requestInput(op);
      this.mode = option;

      if (option === 'All' || option === 'Extents') {
        DesignCore.Canvas.zoomExtents();
        DesignCore.Scene.inputManager.executeCommand();
        return;
      }

      if (option === 'Window') {
        const p1op = new PromptOptions(Strings.Input.FIRSTPOINT || 'First Point', [Input.Type.POINT]);
        const pt1 = await DesignCore.Scene.inputManager.requestInput(p1op);
        this.points.push(pt1);

        const p2op = new PromptOptions(Strings.Input.SECONDPOINT || 'Second Point', [Input.Type.POINT]);
        const pt2 = await DesignCore.Scene.inputManager.requestInput(p2op);
        this.points.push(pt2);

        DesignCore.Scene.inputManager.executeCommand();
      }
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  /**
   * Preview the command during execution
   */
  preview() {
    if (this.mode === 'Window' && this.points.length === 1) {
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

      DesignCore.Scene.createTempItem('Polyline', {points: points});
    }
  }

  /**
   * Perform the command
   */
  action() {
    if (this.mode === 'Window' && this.points.length === 2) {
      DesignCore.Canvas.zoomToWindow(this.points[0], this.points[1]);
    }
  }
}


