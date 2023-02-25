import {Utils} from '../lib/utils.js';
import {Strings} from '../lib/strings.js';

export class Copy {
  constructor() {
    // Define Properties
    this.type = 'Copy';
    this.family = 'Tools';
    this.movement = 'Linear';
    this.minPoints = 2;
    this.selectionRequired = true;
    this.limitPoints = true;
    this.showPreview = true;
  }

  static register() {
    const command = {command: 'Copy', shortcut: 'CO', type: 'Tool'};
    return command;
  }

  prompt(core) {
    const num = core.scene.inputArray.length;
    const expectedType = [];
    let reset = false;
    let action = false;
    const prompt = [];

    expectedType[0] = ['undefined'];
    prompt[0] = Strings.Input.SELECTENTITIES + this.type;

    expectedType[1] = ['object'];
    prompt[1] = core.scene.selectionSet.length + Strings.Input.SELECTED;

    expectedType[2] = ['boolean'];
    prompt[2] = Strings.Input.BASEPOINT;

    expectedType[3] = ['object'];
    prompt[3] = Strings.Input.DESTINATIONORDISTANCE;

    expectedType[4] = ['object'];
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

  action = function(core) {
    // console.log("Copy Stuff")

    const xDelta = core.scene.points[1].x - core.scene.points[0].x;
    const yDelta = core.scene.points[1].y - core.scene.points[0].y;

    for (let i = 0; i < core.scene.selectionSet.length; i++) {
      // console.log("selectionset.type: " + selectionSet[i].type);

      const copyofitem = Utils.cloneObject(core, core.scene.items[core.scene.selectionSet[i]]);

      for (let j = 0; j < copyofitem.points.length; j++) {
        copyofitem.points[j].x = core.scene.items[core.scene.selectionSet[i]].points[j].x + xDelta;
        copyofitem.points[j].y = core.scene.items[core.scene.selectionSet[i]].points[j].y + yDelta;
      }

      core.scene.items.push(copyofitem);
    }
  };

  preview = function(core) {
    // console.log("Copy Stuff")

    const xDelta = core.scene.tempPoints[1].x - core.scene.tempPoints[0].x;
    const yDelta = core.scene.tempPoints[1].y - core.scene.tempPoints[0].y;

    for (let i = 0; i < core.scene.selectionSet.length; i++) {
      // console.log("selectionset.type: " + selectionSet[i].type);
      for (let j = 0; j < core.scene.selectedItems[i].points.length; j++) {
        core.scene.selectedItems[i].points[j].x = core.scene.items[core.scene.selectionSet[i]].points[j].x + xDelta;
        core.scene.selectedItems[i].points[j].y = core.scene.items[core.scene.selectionSet[i]].points[j].y + yDelta;
      }
    }
  };
}

