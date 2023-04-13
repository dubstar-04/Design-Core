import {Entity} from '../entities/entity.js';
import {Point} from '../entities/point.js';
import {Tool} from '../tools/tool.js';
import {Utils} from './utils.js';

export class DesignEngine {
  constructor(core) {
    this.core = core;
  }

  reset() {
    this.core.scene.reset();
  }

  sceneControl(action, data) {
    let input = data[0];
    let inputData = undefined;


  acceptPreselection() {
    if (this.core.scene.activeCommand instanceof Tool && this.core.scene.selection.selectionSet.length || this.core.scene.activeCommand.selectionRequired === false) {
      if (this.core.scene.activeCommand.selectionRequired) {
        this.core.scene.inputArray.push(this.core.scene.selection.selectionSet);
        this.core.scene.inputArray.push(true);
      }
      this.core.scene.selection.selectionAccepted = true;
    }
  }

    if (action === 'Reset') {
      this.core.scene.reset();
      return;
    }

    if (action === 'Enter' && isUndefined) {
      if (this.core.scene.activeCommand !== undefined && this.core.scene.activeCommand instanceof Tool && this.core.scene.selection.selectionSet.length) {
        this.core.scene.selection.selectionAccepted = true;
        inputData = true;
      } else if (this.core.scene.activeCommand !== undefined) {
        this.core.scene.reset();
        return;
      } else if (this.core.scene.activeCommand == undefined) {
        this.initialiseItem(this.core.commandLine.lastCommand[0]);
      }
    }
  }

  parseInput(input) {
    // if we have a valid point return
    if (input instanceof Point) {
      return input;
    }

    let inputData;

    const isNumber = /^-?\d+\.\d+$/.test(input) || /^-?\d+$/.test(input);
    const isLetters = /^[A-Za-z ]+$/.test(input);
    const isPoint = /^\d+,\d+$/.test(input) || /^@-?\d+,-?\d+$/.test(input) || /^#-?\d+,-?\d+$/.test(input);
    const isUndefined = (input === undefined);

    if (isPoint) {
      const isRelative = input.includes('@');
      const isAbsolute = input.includes('#');

      if (isAbsolute || isRelative) {
        input = input.replace('@', '').replace('#', '');
      }

      const xyData = input.split(',');
      const point = new Point();
      point.x = parseFloat(xyData[0]);
      point.y = parseFloat(xyData[1]);

      if (isRelative && this.core.scene.points.length) {
        point.x = parseFloat(this.core.scene.points.at(-1).x + point.x);
        point.y = parseFloat(this.core.scene.points.at(-1).y + point.y);
      }

      inputData = point;

    if (action === 'LeftClick') {
      if (this.core.scene.activeCommand === undefined) {
        this.core.scene.selection.singleSelect();
      } else {
        const point = this.core.mouse.pointOnScene();
        inputData = point;

        if (this.core.scene.activeCommand instanceof Entity || this.core.scene.selection.selectionAccepted) {
          this.core.scene.points.push(inputData);
        }

        if (this.core.scene.activeCommand instanceof Tool && !this.core.scene.selection.selectionAccepted) {
          this.core.scene.selection.singleSelect();
        }
      }
    }

    if (isNumber) {
      const point = this.convertInputToPoint(Number(input));
      inputData = Number(input);
      // TODO: parseInput should return the parsed value only
      // don't add points to the scene here
      this.core.scene.points.push(point);
    }

    if (isLetters && !isUndefined) {
      inputData = String(input);
    }

    return inputData;
  }


    if (typeof this.core.scene.activeCommand !== 'undefined') {
      this.core.scene.inputArray.push(inputData);
      this.actionInput();
      }
      this.actionInput();
    }
  }

  actionInput() {
    // promptData: {promptInput, resetBool, actionBool, validInput}
    const promptData = this.core.scene.activeCommand.prompt(this.core);
    // TODO: Add the active command to the prompt value e.g. Line: promptInput
    // i.e. this.core.scene.activeCommand.type + ': ' + promptData.promptInput;
    this.core.commandLine.setPrompt(promptData.promptInput);


    if (!promptData.validInput) {
      this.core.notify(Strings.Error.INPUT);
    }

    if (promptData.actionBool) {
      if (this.core.scene.activeCommand instanceof Tool) {
        this.core.scene.activeCommand.action(this.core);
      } else {
        this.core.scene.addToScene(null, null, promptData.resetBool);
      }
    }

    if (promptData.resetBool) {
      this.reset();
    }
  }

  initialiseItem(command) {
    this.core.scene.saveRequired();
    // add the command to the commandline history
    this.core.commandLine.addToCommandHistory(command);
    // activate a new command
    this.core.scene.activeCommand = this.core.commandManager.createNew(command);
  };

  convertInputToPoint(input) {
    const basePoint = this.core.scene.points.at(-1);
    const angle = Utils.degrees2radians(this.core.mouse.inputAngle());
    const point = basePoint.project( angle, input);

    return point;
  }
}
