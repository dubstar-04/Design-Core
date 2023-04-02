import {Strings} from '../lib/strings.js';

export class Move {
  constructor() {
    // Define Properties
    this.type = 'Move';
    this.family = 'Tools';
    this.movement = 'Linear';
    this.minPoints = 2;
    this.selectionRequired = true;
    this.helper_geometry = true;
    this.showPreview = true;
  }

  static register() {
    const command = {command: 'Move', shortcut: 'M', type: 'Tool'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    // console.log('inputArray: ', core.scene.inputArray);

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.SELECTENTITIES;

    expectedType[1] = ['object'];
    prompt[1] = `${core.scene.selecting.selectionSet.length}  ${Strings.Input.SELECTED}`;

    expectedType[2] = ['boolean'];
    prompt[2] = Strings.Input.BASEPOINT;

    expectedType[3] = ['object'];
    prompt[3] = Strings.Input.DESTINATIONORDISTANCE;

    expectedType[4] = ['object', 'number'];
    prompt[4] = '';

    const validInput = expectedType[num].includes(typeof core.scene.inputArray[num - 1]);

    if (!validInput) {
      core.scene.inputArray.pop();
    } else if (core.scene.inputArray.length === 4) {
      action = true;
      reset = true;
    }

    return {promptInput: prompt[core.scene.inputArray.length], resetBool: reset, actionBool: action, validInput: validInput};
  }

  action(core) {
    // console.log('move.js: action');
    // console.log('move.js: points length: ' + core.scene.points.length);
    // console.log('move.js: items length: ' + core.scene.items.length);

    const xDelta = core.scene.points[1].x - core.scene.points[0].x;
    const yDelta = core.scene.points[1].y - core.scene.points[0].y;

    // console.log('move.js: X: ' + xDelta + ' Y: ' + yDelta);

    for (let i = 0; i < core.scene.selecting.selectionSet.length; i++) {
      // console.log("core.scene.selecting.selectionSet.type: " + core.scene.selecting.selectionSet[i].type);
      for (let j = 0; j < core.scene.selecting.selectedItems[i].points.length; j++) {
        core.scene.items[core.scene.selecting.selectionSet[i]].points[j].x = core.scene.items[core.scene.selecting.selectionSet[i]].points[j].x + xDelta;
        core.scene.items[core.scene.selecting.selectionSet[i]].points[j].y = core.scene.items[core.scene.selecting.selectionSet[i]].points[j].y + yDelta;
      }
    }
  }

  preview(core) {
    // console.log("move.js: preview")
    // console.log("move.js: points length: " + points.length)
    // console.log("move.js: selectedItems length: " + selectedItems.length)
    // console.log("move.js: items length: " + items.length)

    const xDelta = core.scene.tempPoints[1].x - core.scene.tempPoints[0].x;
    const yDelta = core.scene.tempPoints[1].y - core.scene.tempPoints[0].y;

    // console.log('delta', xDelta, yDelta);
    // console.log(core.scene.tempPoints[0].x, core.scene.tempPoints[0].y);
    // console.log(core.scene.tempPoints[1].x, core.scene.tempPoints[1].y);
    // console.log(core.scene.items[core.scene.selecting.selectionSet[0]].points[0].x, core.scene.items[core.scene.selecting.selectionSet[0]].points[0].y);

    for (let i = 0; i < core.scene.selecting.selectionSet.length; i++) {
      // console.log("core.scene.selecting.selectionSet.type: " + selectedItems[i].type);
      for (let j = 0; j < core.scene.selecting.selectedItems[i].points.length; j++) {
        core.scene.selecting.selectedItems[i].points[j].x = core.scene.items[core.scene.selecting.selectionSet[i]].points[j].x + xDelta;
        core.scene.selecting.selectedItems[i].points[j].y = core.scene.items[core.scene.selecting.selectionSet[i]].points[j].y + yDelta;
      }
    }
  }
}
