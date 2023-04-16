import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Rotate extends Tool {
  constructor() {
    super();
    this.showHelperGeometry = true;
  }

  static register() {
    const command = {command: 'Rotate', shortcut: 'RO', type: 'Tool'};
    return command;
  }

  processInput(num, input, inputType, core) {
    const expectedType = [];
    const prompt = [];

    const selection = `${core.scene.selection.selectionSet.length}  ${Strings.Input.SELECTED}`;
    const noSelection = Strings.Input.SELECTENTITIES;

    prompt[1] = core.scene.selection.selectionSet.length ? selection : noSelection;
    expectedType[1] = ['CanvasSelection', 'SelectionAccepted'];

    prompt[2] = Strings.Input.BASEPOINT;
    expectedType[2] = ['Point'];

    prompt[3] = Strings.Input.START;
    expectedType[3] = ['Point'];

    prompt[4] = Strings.Input.END;
    expectedType[4] = ['Point'];

    return {expectedType: expectedType, prompt: prompt, reset: (num === prompt.length - 1), action: (num === prompt.length - 1)};
  }

  preview(core) {
    if (core.scene.tempPoints.length > 2) {
      const A = core.scene.tempPoints[0].x - core.scene.tempPoints[1].x;
      const O = core.scene.tempPoints[0].y - core.scene.tempPoints[1].y;

      const A1 = core.scene.tempPoints[0].x - core.scene.tempPoints[2].x;
      const O1 = core.scene.tempPoints[0].y - core.scene.tempPoints[2].y;

      const ang1 = Math.atan2(O, A);
      const ang2 = Math.atan2(O1, A1);

      const theta = ang2 - ang1;

      for (let i = 0; i < core.scene.selection.selectionSet.length; i++) {
        for (let j = 0; j < core.scene.selection.selectedItems[i].points.length; j++) {
          const x = core.scene.tempPoints[0].x + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].x - core.scene.tempPoints[0].x) * Math.cos(theta) - (core.scene.items[core.scene.selection.selectionSet[i]].points[j].y - core.scene.tempPoints[0].y) * Math.sin(theta);
          const y = core.scene.tempPoints[0].y + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].x - core.scene.tempPoints[0].x) * Math.sin(theta) + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].y - core.scene.tempPoints[0].y) * Math.cos(theta);

          core.scene.selection.selectedItems[i].points[j].x = x;
          core.scene.selection.selectedItems[i].points[j].y = y;
        }
      }
    }
  };


  action(core) {
    const A = core.scene.points[0].x - core.scene.points[1].x;
    const O = core.scene.points[0].y - core.scene.points[1].y;

    const A1 = core.scene.points[0].x - core.scene.points[2].x;
    const O1 = core.scene.points[0].y - core.scene.points[2].y;

    const ang1 = Math.atan2(O, A);
    const ang2 = Math.atan2(O1, A1);

    const theta = ang2 - ang1;

    for (let i = 0; i < core.scene.selection.selectionSet.length; i++) {
      for (let j = 0; j < core.scene.selection.selectedItems[i].points.length; j++) {
        const x = core.scene.points[0].x + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].x - core.scene.points[0].x) * Math.cos(theta) - (core.scene.items[core.scene.selection.selectionSet[i]].points[j].y - core.scene.points[0].y) * Math.sin(theta);
        const y = core.scene.points[0].y + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].x - core.scene.points[0].x) * Math.sin(theta) + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].y - core.scene.points[0].y) * Math.cos(theta);

        core.scene.items[core.scene.selection.selectionSet[i]].points[j].x = x;
        core.scene.items[core.scene.selection.selectionSet[i]].points[j].y = y;
      }
    }
  };
}
