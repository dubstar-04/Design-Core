import {Intersection} from '../lib/intersect.js';
import {Strings} from '../lib/strings.js';
import {Tool} from './tool.js';

export class Trim extends Tool {
  constructor() {
    super();
    // remove this.movement
    this.movement = 'Modify';
    this.minPoints = 0;
  }

  static register() {
    const command = {command: 'Trim', shortcut: 'TR', type: 'Tool'};
    return command;
  }

  processInput(num, input, inputType, core) {
    const expectedType = [];
    const prompt = [];

    const selection = `${core.scene.selection.selectionSet.length}  ${Strings.Input.SELECTED}`;
    const noSelection = Strings.Input.BOUNDARY;

    prompt[1] = core.scene.selection.selectionSet.length ? selection : noSelection;
    expectedType[1] = ['CanvasSelection', 'SelectionAccepted'];

    expectedType[2] = ['Point'];
    prompt[2] = Strings.Input.SELECTORQUIT; // Strings.Input.SELECTENTITIES;

    return {expectedType: expectedType, prompt: prompt, reset: false, action: (num === prompt.length - 1)};
  }

  action(core) {
    const item = core.scene.selection.findClosestItem();

    if (item !== undefined) {
      const intersectPoints = [];
      let TrimItem;

      for (let i = 0; i < core.scene.selection.selectionSet.length; i++) {
        if (core.scene.selection.selectionSet[i] !== item) {
          const boundaryItem = core.scene.items[core.scene.selection.selectionSet[i]];
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
    }
  }
}

