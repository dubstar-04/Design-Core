import {Point} from '../entities/point.js';
import {Utils} from './utils.js';

export class DesignEngine {
  constructor(core) {
    // this.core. is the main class for interaction with Design

    this.core = core;
  }

  reset() {
    this.core.scene.reset();
  }

  sceneControl(action, data) {
    let input = data[0];
    let inputData = undefined;


    const isNumber = /^-?\d+\.\d+$/.test(input) || /^-?\d+$/.test(input);
    const isLetters = /^[A-Za-z ]+$/.test(input);
    const isPoint = /^\d+,\d+$/.test(input) || /^@-?\d+,-?\d+$/.test(input) || /^#-?\d+,-?\d+$/.test(input);
    const isUndefined = (input === undefined);

    if (action === 'Reset') {
      this.core.scene.reset();
      return;
    }

    if (action === 'Enter' && isUndefined) {
      if (this.core.scene.activeCommand !== undefined && this.core.scene.activeCommand.family === 'Tools' && this.core.scene.selection.selectionSet.length) {
        this.core.scene.selection.selectionAccepted = true;
        inputData = true;
      } else if (this.core.scene.activeCommand !== undefined) {
        this.core.scene.reset();
        return;
      } else if (this.core.scene.activeCommand == undefined) {
        this.initialiseItem(this.core.commandLine.lastCommand[0]);
      }
    }

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

      if (isRelative && points.length) {
        point.x = parseFloat(points[points.length - 1].x + point.x);
        point.y = parseFloat(points[points.length - 1].y + point.y);
      }

      inputData = point;
      // TODO: scene.points should be private
      this.core.scene.points.push(point);
      this.core.canvas.requestPaint();
    }

    if (action === 'LeftClick') {
      if (this.core.scene.activeCommand === undefined) {
        this.core.scene.selection.singleSelect();
      } else {
        const point = this.core.mouse.pointOnScene();
        inputData = point;

        if (this.core.scene.activeCommand.family === 'Geometry' || this.core.scene.selection.selectionAccepted) {
          this.core.scene.points.push(inputData);
        }

        if (this.core.scene.activeCommand.family === 'Tools' && !this.core.scene.selection.selectionAccepted) {
          this.core.scene.selection.singleSelect();
        }
      }
    }

    if (isNumber) {
      const point = this.convertInputToPoint(Number(input));
      inputData = Number(input);
      this.core.scene.points.push(point);
    }

    if (isLetters && !isUndefined) {
      inputData = String(input);
    }

    // /////////////////////////////////////////////////////////////////////
    // //////////////////// handle the new inputData //////////////////////
    // ///////////////////////////////////////////////////////////////////

    if (typeof this.core.scene.activeCommand !== 'undefined') {
      this.core.scene.inputArray.push(inputData);
      this.actionInput();
    } else if (this.core.commandManager.isCommandOrShortcut(input)) {
      this.initialiseItem(this.core.commandManager.getCommand(input));

      if (this.core.scene.activeCommand.family === 'Tools' && this.core.scene.selection.selectionSet.length || this.core.scene.activeCommand.selectionRequired === false) {
        if (this.core.scene.activeCommand.selectionRequired) {
          this.core.scene.inputArray.push(this.core.scene.selection.selectionSet);
          this.core.scene.inputArray.push(true);
        }
        this.core.scene.selection.selectionAccepted = true;
      }
      this.actionInput();
    }

    // /////////////////////////////////////////////////////////////////////
    // //////////////////// handle the new inputData //////////////////////
    // ///////////////////////////////////////////////////////////////////
  }

  actionInput() {
    // promptData: {promptInput, resetBool, actionBool, validInput}
    const promptData = this.core.scene.activeCommand.prompt(this.core);
    // TODO: Add the active command to the prompt value e.g. Line: promptInput
    // i.e. this.core.scene.activeCommand.type + ': ' + promptData.promptInput;
    this.core.commandLine.setPrompt(promptData.promptInput);

    if (!promptData.validInput) {
      // notify('Invalid Input');
    }

    if (promptData.actionBool) {
      if (this.core.scene.activeCommand.family === 'Tools') {
        this.core.scene.activeCommand.action(this.core);
      } else {
        this.core.scene.addToScene(null, null, promptData.resetBool);
      }
    }

    if (promptData.resetBool) {
      this.core.scene.reset();
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
    const point = new Point();
    const x = input * Math.cos(Utils.degrees2radians(this.core.mouse.inputAngle()));
    const y = input * Math.sin(Utils.degrees2radians(this.core.mouse.inputAngle()));
    // generate data from the prevous point and the radius
    point.x = this.core.scene.points[this.core.scene.points.length - 1].x + x;
    point.y = this.core.scene.points[this.core.scene.points.length - 1].y + y;

    return point;
  }
}
