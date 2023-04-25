import {Intersection} from '../lib/intersect.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

export class Trim extends Tool {
  constructor() {
    super();
    this.selectedIndex;
  }

  static register() {
    const command = {command: 'Trim', shortcut: 'TR', type: 'Tool'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.BOUNDARY, [Input.Type.SELECTIONSET]);

      if (!core.scene.selectionManager.selectionSet.selectionSet.length) {
        await core.scene.inputManager.requestInput(op);
      }

      const op2 = new PromptOptions(Strings.Input.SELECT, [Input.Type.SINGLESELECTION]);
      while (true) {
        const selection = await core.scene.inputManager.requestInput(op2);
        this.selectedIndex = selection.selectedItemIndex;
        core.scene.inputManager.actionCommand();
      }
    } catch (error) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  action(core) {
    // const item = core.scene.selectionManager.findClosestItem(core.mouse.pointOnScene());

    const item = this.selectedIndex;

    if (item !== undefined) {
      const intersectPoints = [];
      let TrimItem;

      for (let i = 0; i < core.scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (core.scene.selectionManager.selectionSet.selectionSet[i] !== item) {
          const boundaryItem = core.scene.items[core.scene.selectionManager.selectionSet.selectionSet[i]];
          TrimItem = core.scene.items[item];

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
        TrimItem.trim(intersectPoints, core);
      }

      this.selectedIndex = undefined;
    }
  }
}

