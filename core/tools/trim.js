import {Intersection} from '../lib/intersect.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {Core} from '../core.js';

export class Trim extends Tool {
  constructor() {
    super();
    this.selectedIndex;
  }

  static register() {
    const command = {command: 'Trim', shortcut: 'TR', type: 'Tool'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.BOUNDARY, [Input.Type.SELECTIONSET]);

      if (!Core.Scene.selectionManager.selectionSet.selectionSet.length) {
        await Core.Scene.inputManager.requestInput(op);
      }

      const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
      while (true) {
        const selection = await Core.Scene.inputManager.requestInput(op2);
        this.selectedIndex = selection.selectedItemIndex;
        Core.Scene.inputManager.actionCommand();
      }
    } catch (error) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  action() {
    // const item = Core.Scene.selectionManager.findClosestItem(Core.Mouse.pointOnScene());

    const item = this.selectedIndex;

    if (item !== undefined) {
      const intersectPoints = [];
      let TrimItem;

      for (let i = 0; i < Core.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (Core.Scene.selectionManager.selectionSet.selectionSet[i] !== item) {
          const boundaryItem = Core.Scene.items[Core.Scene.selectionManager.selectionSet.selectionSet[i]];
          TrimItem = Core.Scene.items[item];

          const functionName = 'intersect' + boundaryItem.type + TrimItem.type;
          const intersect = Intersection[functionName](boundaryItem.intersectPoints(), TrimItem.intersectPoints());

          if (intersect.points.length) {
            for (let point = 0; point < intersect.points.length; point++) {
              intersectPoints.push(intersect.points[point]);
            }
          }
        }
      }

      if (intersectPoints) {
        TrimItem.trim(intersectPoints);
      }

      this.selectedIndex = undefined;
    }
  }
}

