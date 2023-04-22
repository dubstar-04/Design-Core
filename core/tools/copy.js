import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Input, PromptOptions} from '../lib/inputManager.js';

export class Copy extends Tool {
  constructor() {
    super();
  }

  static register() {
    const command = {command: 'Copy', shortcut: 'CO', type: 'Tool'};
    return command;
  }

  async execute(core) {
    try {
      const op = new PromptOptions(Strings.Input.SELECTENTITIES, [Input.Type.SELECTIONSET]);

      if (!core.scene.selectionManager.selectionSet.selectionSet.length) {
        await core.scene.inputManager.requestInput(op);
      }

      const op2 = new PromptOptions(Strings.Input.BASEPOINT, [Input.Type.POINT]);
      const pt1 = await core.scene.inputManager.requestInput(op2);
      this.points.push(pt1);

      const op3 = new PromptOptions(Strings.Input.DESTINATIONORDISTANCE, [Input.Type.POINT, Input.Type.NUMBER]);
      const pt2 = await core.scene.inputManager.requestInput(op3);

      if (Input.getType(pt2) === Input.Type.POINT) {
        this.points.push(pt2);
      } else if (Input.getType(pt2) === Input.Type.NUMBER) {
        const basePoint = this.points.at(-1);
        const angle = Utils.degrees2radians(core.mouse.inputAngle());
        const point = basePoint.project(angle, pt2);
        this.points.push(point);
      }

      core.scene.inputManager.executeCommand();
    } catch (error) {
      log(this.type, error);
    }
  }

  action(core) {
    const xDelta = this.points[1].x - this.points[0].x;
    const yDelta = this.points[1].y - this.points[0].y;

    for (let i = 0; i < core.scene.selectionManager.selectionSet.selectionSet.length; i++) {
      const copyofitem = Utils.cloneObject(core, core.scene.items[core.scene.selectionManager.selectionSet.selectionSet[i]]);

      for (let j = 0; j < copyofitem.points.length; j++) {
        copyofitem.points[j].x = core.scene.items[core.scene.selectionManager.selectionSet.selectionSet[i]].points[j].x + xDelta;
        copyofitem.points[j].y = core.scene.items[core.scene.selectionManager.selectionSet.selectionSet[i]].points[j].y + yDelta;
      }

      core.scene.items.push(copyofitem);
    }
  };

  preview(core) {
    if (this.points.length >= 1) {
      const mousePoint = core.mouse.pointOnScene();

      // Draw a line
      const points = [this.points.at(-1), mousePoint];

      const data = {
        points: points,
        colour: core.settings.helpergeometrycolour.toString(),
      };

      core.scene.addToTempItems('Line', data);

      const xDelta = mousePoint.x - this.points[0].x;
      const yDelta = mousePoint.y - this.points[0].y;

      for (let i = 0; i < core.scene.selectionManager.selectionSet.selectionSet.length; i++) {
        for (let j = 0; j < core.scene.selectionManager.selectedItems[i].points.length; j++) {
          core.scene.selectionManager.selectedItems[i].points[j].x = core.scene.items[core.scene.selectionManager.selectionSet.selectionSet[i]].points[j].x + xDelta;
          core.scene.selectionManager.selectedItems[i].points[j].y = core.scene.items[core.scene.selectionManager.selectionSet.selectionSet[i]].points[j].y + yDelta;
        }
      }
    }
  }
}
