import {Point} from '../entities/point.js';
import {Utils} from './utils.js';

export class DesignEngine {
  constructor(core) {
    // this.core. is the main class for interaction with Design

    this.core = core;
  }

  sceneControl(action, data) {
    let input = data[0];
    let inputData = undefined;
    // const expectedInputType = undefined;
    // Create Point to hold any new position
    // var point = new Point()

    // console.log("sceneControl - InputAction:" + action);
    // console.log("sceneControl - InputData:" + data);
    // console.log("sceneControl - Var Input:" + input);

    const isNumber = /^-?\d+\.\d+$/.test(input) || /^-?\d+$/.test(input);
    const isLetters = /^[A-Za-z]+$/.test(input);
    const isPoint = /^\d+,\d+$/.test(input) || /^@-?\d+,-?\d+$/.test(input) || /^#-?\d+,-?\d+$/.test(input);
    const isUndefined = (input === undefined);

    // console.log("sceneControl - only Numbers " + isNumber)
    // console.log("sceneControl - only Letters " + isLetters)
    // console.log("sceneControl - is Point " + isPoint)
    // console.log("sceneControl - is Undefined " + isUndefined)

    if (action === 'Reset') {
      this.core.scene.reset();
      return;
    }

    if (action === 'Enter' && isUndefined) {
      if (this.core.scene.activeCommand !== undefined && this.core.scene.activeCommand.family === 'Tools' && this.core.scene.selectionSet.length) {
        this.core.scene.selectionAccepted = true;
        inputData = true;
      } else if (this.core.scene.activeCommand !== undefined) {
        this.core.scene.reset();
        return;
      } else if (this.core.scene.activeCommand == undefined) {
        this.initialiseItem(this.core.commandLine.lastCommand[0]);
      }
    }

    if (isPoint) {
      console.log('design engine - comma seperated point - create new point ');

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
      this.core.scene.points.push(point);
    }

    if (action === 'LeftClick') {
      console.log('design engine - left click- create new point ');

      if (this.core.scene.activeCommand === undefined) {
        this.core.scene.selectClosestItem(data);
      } else {
        const point = this.core.mouse.pointOnScene();
        inputData = point;

        if (this.core.scene.activeCommand.family === 'Geometry' || this.core.scene.selectionAccepted) {
          this.core.scene.points.push(inputData);
        }

        if (this.core.scene.activeCommand.family === 'Tools' && !this.core.scene.selectionAccepted) {
          this.core.scene.selectClosestItem(data);
        }
      }
    }

    if (isNumber) {
      console.log('design engine - Numbers Recieved');
      // inputData = Number(input);
      point = this.convertInputToPoint(Number(input));
      inputData = Number(input);
      this.core.scene.points.push(point);
      console.log('Number Input Data: ', inputData);
    }

    if (isLetters && !isUndefined) {
      console.log('core - Letters Recieved');
      inputData = String(input);
    }

    // /////////////////////////////////////////////////////////////////////
    // //////////////////// handle the new inputData //////////////////////
    // ///////////////////////////////////////////////////////////////////

    if (typeof this.core.scene.activeCommand !== 'undefined') {
      this.core.scene.inputArray.push(inputData);
      this.actionInput();
    } else if (this.core.commandManager.isCommand(this.core.commandManager.getCommandFromShortcut(input))) {
      this.initialiseItem(this.core.commandManager.getCommandFromShortcut(input));
      if (this.core.scene.activeCommand.family === 'Tools' && this.core.scene.selectionSet.length || this.core.scene.activeCommand.selectionRequired === false) {
        if (this.core.scene.activeCommand.selectionRequired) {
          this.core.scene.inputArray.push(this.core.scene.selectionSet);
          this.core.scene.inputArray.push(true);
        }
        this.core.scene.selectionAccepted = true;
      }
      this.actionInput();
    } else {
      console.log('End of core');
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
      // TODO: Enable GTK toast
      console.log(' ######## Invalid Input ######## ');
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

  initialiseItem(item) {
    console.log(' core - Item To Process: ' + item);
    this.core.scene.saveRequired();

    if (!this.core.commandManager.isCommand(item)) {
      notify('Unknown Command');
      this.core.commandLine.resetPrompt();
    }

    // add the command to the commandline history
    this.core.commandLine.addToCommandHistory(item);
    this.core.scene.activeCommand = this.core.commandManager.createNew(item);
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
