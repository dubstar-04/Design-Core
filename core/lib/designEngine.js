import {Entity} from '../entities/entity.js';
import {Point} from '../entities/point.js';
import {Tool} from '../tools/tool.js';
import {Strings} from './strings.js';
import {Utils} from './utils.js';

export class DesignEngine {
  constructor(core) {
    this.core = core;
  }

  reset() {
    this.core.scene.reset();
  }

  onCommand(input) {
    if (this.core.scene.activeCommand === undefined) {
      if (this.core.commandManager.isCommand(input) || this.core.commandManager.isShortcut(input)) {
        this.initialiseItem(this.core.commandManager.getCommand(input));
        this.acceptPreselection();
        this.actionInput();
      }
    } else {
      const inputData = this.parseInput(input);
      this.sceneControl(inputData);
    }
  }

  acceptPreselection() {
    if (this.core.scene.activeCommand instanceof Tool && this.core.scene.selection.selectionSet.length || this.core.scene.activeCommand.selectionRequired === false) {
      if (this.core.scene.activeCommand.selectionRequired) {
        this.core.scene.inputArray.push(this.core.scene.selection.selectionSet);
        this.core.scene.inputArray.push(true);
      }
      this.core.scene.selection.selectionAccepted = true;
    }
  }

  onEnterPressed() {
    if (this.core.scene.activeCommand instanceof Tool && this.core.scene.selection.selectionSet.length) {
      this.core.scene.selection.selectionAccepted = true;
      this.core.scene.inputArray.push(true);
      this.actionInput();
    } else if (this.core.scene.activeCommand === undefined) {
      this.initialiseItem(this.core.commandLine.lastCommand[0]);
      this.actionInput();
    } else {
      this.core.scene.reset();
    }
  }

  onLeftClick() {
    if (this.core.scene.activeCommand === undefined) {
      this.core.scene.selection.singleSelect();
    } else {
      if (this.core.scene.activeCommand instanceof Entity || this.core.scene.selection.selectionAccepted) {
        const point = this.core.mouse.pointOnScene();
        this.sceneControl(point);
      }

      if (this.core.scene.activeCommand instanceof Tool && !this.core.scene.selection.selectionAccepted) {
        this.core.scene.selection.singleSelect();
        // if there is a selection, pass it to the activeCommand
        if (this.core.scene.selection.selectionSet.length) {
          // remove any previous selectionSets from inputArray
          // TODO: this is horrible. Do better.
          if (!this.core.scene.inputArray.some((element) => Array.isArray(element))) {
            // TODO: Why add the selectionSet to the inputArray?
            this.core.scene.inputArray.push(this.core.scene.selection.selectionSet);
          }
          this.actionInput();
        }
      }
    }
  }

  parseInput(input) {
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

  sceneControl(input) {
    // if the input is a point add it to the scene points
    if (input instanceof Point) {
      this.core.scene.points.push(input);
      this.core.canvas.requestPaint();
    }

    // if there is an active command, pass the input to the command
    if (typeof this.core.scene.activeCommand !== 'undefined') {
      this.core.scene.inputArray.push(input);
      this.actionInput();
    }
  }

  actionInput() {
    const promptData = this.core.scene.activeCommand.prompt(this.core);
    this.core.commandLine.setPrompt(`${this.core.scene.activeCommand.type} - ${promptData.promptInput}`);

    if (!promptData.validInput) {
      this.core.notify(Strings.Error.INPUT);
    }

    if (promptData.actionBool) {
      if (this.core.scene.activeCommand instanceof Tool) {
        this.core.scene.activeCommand.action(this.core);
      } else {
        // TODO: sort this jank
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
