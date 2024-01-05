import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';
import {Utils} from '../lib/utils.js';
import {Input, PromptOptions} from '../lib/inputManager.js';
import {Logging} from '../lib/logging.js';

import {DesignCore} from '../designCore.js';


export class Rotate extends Tool {
  constructor() {
    super();
  }

  static register() {
    const command = {command: 'Rotate', shortcut: 'RO', type: 'Tool'};
    return command;
  }

  async execute() {
    try {
      const op = new PromptOptions(Strings.Input.SELECTIONSET, [Input.Type.SELECTIONSET]);

      if (!DesignCore.Scene.selectionManager.selectionSet.selectionSet.length) {
        await DesignCore.Scene.inputManager.requestInput(op);
      }

      const op2 = new PromptOptions(Strings.Input.BASEPOINT, [Input.Type.POINT]);
      const pt1 = await DesignCore.Scene.inputManager.requestInput(op2);
      this.points.push(pt1);

      const op3 = new PromptOptions(Strings.Input.START, [Input.Type.POINT]);
      const pt2 = await DesignCore.Scene.inputManager.requestInput(op3);
      this.points.push(pt2);

      const op4 = new PromptOptions(Strings.Input.ROTATION, [Input.Type.POINT, Input.Type.NUMBER]);
      const pt3 = await DesignCore.Scene.inputManager.requestInput(op4);
      if (Input.getType(pt3) === Input.Type.POINT) {
        this.points.push(pt3);
      } else if (Input.getType(pt3) === Input.Type.NUMBER) {
        const basePoint = this.points.at(0);
        const startPoint = this.points.at(1);
        const angle = Utils.degrees2radians(pt3);
        const point = startPoint.rotate(basePoint, angle);
        this.points.push(point);
      }


      DesignCore.Scene.inputManager.executeCommand();
    } catch (err) {
      Logging.instance.error(`${this.type} - ${err}`);
    }
  }

  preview() {
    const mousePoint = DesignCore.Mouse.pointOnScene();

    if (this.points.length >= 1) {
      // Draw a line
      const points = [this.points.at(0), mousePoint];

      DesignCore.Scene.createTempItem('Line', {points: points});
    }

    if (this.points.length >= 2) {
      const A = this.points[0].x - this.points[1].x;
      const O = this.points[0].y - this.points[1].y;

      const A1 = this.points[0].x - mousePoint.x;
      const O1 = this.points[0].y - mousePoint.y;

      const ang1 = Math.atan2(O, A);
      const ang2 = Math.atan2(O1, A1);

      const theta = ang2 - ang1;

      for (let i = 0; i <DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
        for (let j = 0; j <DesignCore.Scene.selectionManager.selectedItems[i].points.length; j++) {
          const x = this.points[0].x + (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x - this.points[0].x) * Math.cos(theta) - (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y - this.points[0].y) * Math.sin(theta);
          const y = this.points[0].y + (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x - this.points[0].x) * Math.sin(theta) + (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y - this.points[0].y) * Math.cos(theta);

          DesignCore.Scene.selectionManager.selectedItems[i].points[j].x = x;
          DesignCore.Scene.selectionManager.selectedItems[i].points[j].y = y;
        }
      }
    }
  };


  action() {
    const A = this.points[0].x - this.points[1].x;
    const O = this.points[0].y - this.points[1].y;

    const A1 = this.points[0].x - this.points[2].x;
    const O1 = this.points[0].y - this.points[2].y;

    const ang1 = Math.atan2(O, A);
    const ang2 = Math.atan2(O1, A1);

    const theta = ang2 - ang1;

    for (let i = 0; i <DesignCore.Scene.selectionManager.selectionSet.selectionSet.length; i++) {
      for (let j = 0; j <DesignCore.Scene.selectionManager.selectedItems[i].points.length; j++) {
        const x = this.points[0].x + (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x - this.points[0].x) * Math.cos(theta) - (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y - this.points[0].y) * Math.sin(theta);
        const y = this.points[0].y + (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x - this.points[0].x) * Math.sin(theta) + (DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y - this.points[0].y) * Math.cos(theta);

        DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].x = x;
        DesignCore.Scene.items[DesignCore.Scene.selectionManager.selectionSet.selectionSet[i]].points[j].y = y;
      }
    }
  };
}
