import {Intersection} from '../lib/intersect.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';

export class Extend extends Tool {
  constructor() {
    super();
    // remove this.movement
    // this.movement = 'Modify';
    // this.minPoints = 0;
    this.selectedIndex;
  }

  static register() {
    const command = {command: 'Extend', shortcut: 'EX', type: 'Tool'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.BOUNDARY, [Input.Type.SELECTIONSET]);

      if (!core.scene.selectionManager.selectionSet.selectionSet.length) {
        await core.scene.inputManager.requestInput(op);
      }

      const op2 = new PromptOptions(Strings.Input.SELECTORQUIT, [Input.Type.SINGLESELECTION]);
      while (true) {
        const selection = await core.scene.inputManager.requestInput(op2);
        this.selectedIndex = selection.selectedItemIndex;
        core.scene.inputManager.actionCommand();
      }
    } catch (error) {
      log(this.type, error);
    }
  }

  action(core) {
    // const item = core.scene.selectionManager.findClosestItem(core.mouse.pointOnScene());

    const item = this.selectedIndex;

    if (item !== undefined) {
      const intersectPoints = [];
      let extendItem;

      for (let i = 0; i < core.scene.selectionManager.selectionSet.selectionSet.length; i++) {
        if (core.scene.selectionManager.selectionSet.selectionSet[i] !== item) {
          const boundaryItem = core.scene.items[core.scene.selectionManager.selectionSet.selectionSet[i]];
          extendItem = core.scene.items[item];

          const functionName = 'intersect' + boundaryItem.type + extendItem.type;
          const intersect = Intersection[functionName](boundaryItem.intersectPoints(), extendItem.intersectPoints(), true);

          if (intersect.points.length) {
            for (let point = 0; point < intersect.points.length; point++) {
              intersectPoints.push(intersect.points[point]);
            }
          }
        }
      }

      if (intersectPoints) {
        extendItem.extend(intersectPoints, core);
      }

      this.selectedIndex = undefined;
    }
  }

  preview() {
  }
}

