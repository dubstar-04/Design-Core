import { Tool } from './tool.js';
import { Input, PromptOptions } from '../lib/inputManager.js';
import { Strings } from '../lib/strings.js';
import { Logging } from '../lib/logging.js';
import { Point } from '../entities/point.js';

import { DesignCore } from '../designCore.js';

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
    const command = { command: 'Zoom', shortcut: 'Z' };
    return command;
  }

  /**
   * Execute method
   */
  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.POINT, [Input.Type.POINT], [this.modes.ALL, this.modes.EXTENTS, this.modes.WINDOW, this.modes.OBJECT]);
      const input = await DesignCore.Scene.inputManager.requestInput(op);

      if (Object.values(this.modes).includes(input)) {
        // input matches one of the mode values
        this.mode = input;
      }

      // default window mode
      if (this.mode === this.modes.WINDOW) {
        if (Input.getType(input) === Input.Type.POINT) {
          this.points.push(input);
        } else {
          const p1op = new PromptOptions(Strings.Input.POINT, [Input.Type.POINT]);
          const pt1 = await DesignCore.Scene.inputManager.requestInput(p1op);
          this.points.push(pt1);
        }

        const p2op = new PromptOptions(Strings.Input.END, [Input.Type.POINT]);
        const pt2 = await DesignCore.Scene.inputManager.requestInput(p2op);
        this.points.push(pt2);
      }

      // Zoom to objects in selection
      if (this.mode === this.modes.OBJECT) {
        const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);

        if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
          await DesignCore.Scene.inputManager.requestInput(op);
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
    if (this.mode === this.modes.WINDOW && this.points.length === 1) {
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

      DesignCore.Scene.createTempItem('Polyline', { points: points });
    }
  }

  /**
   * Perform the command
   */
  action() {
    // Zoom to window
    if (this.mode === this.modes.WINDOW && this.points.length === 2) {
      DesignCore.Canvas.zoomToWindow(this.points[0], this.points[1]);
    }

    // Zoom Extents
    if (this.mode === this.modes.ALL || this.mode === this.modes.EXTENTS) {
      DesignCore.Canvas.zoomExtents();
    }

    // Zoom to Object(s)
    if (this.mode === this.modes.OBJECT) {
      let xmin = Infinity;
      let xmax = -Infinity;
      let ymin = Infinity;
      let ymax = -Infinity;

      // return if nothing selection
      if (DesignCore.Scene.selectionManager.selectionSet.selectionSet.length === 0) {
        return;
      }

      for (let i = 0; i <DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        const itemBoundingBox = DesignCore.Scene.getItem(DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]).boundingBox();

        xmin = Math.min(xmin, itemBoundingBox.xMin);
        xmax = Math.max(xmax, itemBoundingBox.xMax);
        ymin = Math.min(ymin, itemBoundingBox.yMin);
        ymax = Math.max(ymax, itemBoundingBox.yMax);
      }

      // if all values are zero return undefined
      if (xmin === 0 && xmax === 0, ymin === 0, ymax === 0) {
        return;
      }

      const Pt1 = new Point(xmin, ymin);
      const Pt2 = new Point(xmax, ymax);

      DesignCore.Canvas.zoomToWindow(Pt1, Pt2);
    }
  }
}


