import {Strings} from '../lib/strings.js';

export class Rotate {
  constructor() {
    // Define Properties
    this.type = 'Rotate';
    this.family = 'Tools';
    this.movement = 'Angular';
    this.minPoints = 3;
    this.selectionRequired = true;
    this.helper_geometry = true;
    this.showPreview = true;
  }

  static register() {
    const command = {command: 'Rotate', shortcut: 'RO', type: 'Tool'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.SELECTENTITIES;

    expectedType[1] = ['object'];
    prompt[1] = `${core.scene.selection.selectionSet.length}  ${Strings.Input.SELECTED}`;

    expectedType[2] = ['boolean'];
    prompt[2] = Strings.Input.BASEPOINT;

    expectedType[3] = ['object'];
    prompt[3] = Strings.Input.START;

    expectedType[4] = ['object'];
    prompt[4] = Strings.Input.END;

    expectedType[5] = ['object'];
    prompt[5] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    }
    if (core.scene.inputArray.length === 5) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
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
        // console.log( "(preview) item: " + selectedItems[i].type + " Points length: " + selectedItems[i].points.length);
        for (let j = 0; j < core.scene.selection.selectedItems[i].points.length; j++) {
          // console.log( "(preview) point: " + j + " length: " + selectedItems[i].points.length)
          const x = core.scene.tempPoints[0].x + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].x - core.scene.tempPoints[0].x) * Math.cos(theta) - (core.scene.items[core.scene.selection.selectionSet[i]].points[j].y - core.scene.tempPoints[0].y) * Math.sin(theta);
          const y = core.scene.tempPoints[0].y + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].x - core.scene.tempPoints[0].x) * Math.sin(theta) + (core.scene.items[core.scene.selection.selectionSet[i]].points[j].y - core.scene.tempPoints[0].y) * Math.cos(theta);

          core.scene.selection.selectedItems[i].points[j].x = x;
          core.scene.selection.selectedItems[i].points[j].y = y;
        }
      }
    }
  };


  action(core) {
    // console.log('Rotate Stuff');

    const A = core.scene.points[0].x - core.scene.points[1].x;
    const O = core.scene.points[0].y - core.scene.points[1].y;

    const A1 = core.scene.points[0].x - core.scene.points[2].x;
    const O1 = core.scene.points[0].y - core.scene.points[2].y;

    const ang1 = Math.atan2(O, A);
    const ang2 = Math.atan2(O1, A1);

    const theta = ang2 - ang1;

    // console.log("Theta: " + theta + " degrees: " + radians2degrees(theta));

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
