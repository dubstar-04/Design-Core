import {Entity} from '../entities/entity.js';
import {Point} from '../entities/point.js';
import {Tool} from '../tools/tool.js';
import {Strings} from './strings.js';
import {Utils} from './utils.js';

class CanvasSelection {}
class SelectionAccepted {}
// class Initialise {}

export class DesignEngine {
  constructor(core) {
    this.core = core;
  }

  reset() {
    this.core.scene.reset();
  }

  onCommand(input) {
    if (this.core.scene.activeCommand !== undefined) {
      this.actionInput(input);
    } else if (this.core.commandManager.isCommand(input) || this.core.commandManager.isShortcut(input)) {
      this.initialiseItem(this.core.commandManager.getCommand(input));
      this.acceptPreselection();
    }
  }

  acceptPreselection() {
    if (this.core.scene.selection.selectionSet.length && this.core.scene.activeCommand.selectionRequired) {
      this.core.scene.selection.selectionAccepted = true;
      this.core.scene.inputTracker++;
      this.actionInput(new SelectionAccepted());
    } else {
      // initial action - first call to actionInput for this command
      this.actionInput();
    }
  }

  onEnterPressed() {
    if (this.core.scene.activeCommand instanceof Tool && this.core.scene.selection.selectionSet.length) {
      this.core.scene.selection.selectionAccepted = true;
      this.actionInput(new SelectionAccepted());
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
      if (this.core.scene.activeCommand instanceof Tool && this.core.scene.activeCommand.selectionRequired && !this.core.scene.selection.selectionAccepted) {
        this.core.scene.selection.singleSelect();
        this.actionInput(new CanvasSelection());
      } else if (this.core.scene.activeCommand instanceof Entity || this.core.scene.selection.selectionAccepted || !this.core.scene.activeCommand.selectionRequired) {
        const point = this.core.mouse.pointOnScene();
        this.actionInput(point);
      }
    }
  }

  initialiseItem(command) {
    // exit any previous commands
    // this.reset();
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

  setPrompt(prompt) {
    this.core.commandLine.setPrompt(`${this.core.scene.activeCommand.type} - ${prompt}`);
  }

  actionCommand(reset) {
    if (this.core.scene.activeCommand instanceof Tool) {
      this.core.scene.activeCommand.action(this.core);
    } else {
      // TODO: sort this jank
      this.core.scene.addToScene(null, null, reset);
    }
  }

  actionInput(input) {
    const num = this.core.scene.inputTracker;
    let inputType = 'undefined';

    // get the input type
    if (input !== undefined) {
      inputType = (input).constructor.name;
    }

    // call the subclass
    const data = this.core.scene.activeCommand.processInput(num, input, inputType, this.core);

    let validInput = false;
    // TODO: use index 0 for actual data
    // no valid type required for index 0
    validInput = num ? data.expectedType[num].includes(inputType) : true;

    if (validInput) {
      if (inputType !== 'CanvasSelection') {
        this.core.scene.inputTracker++;
        this.core.scene.inputTracker = Math.min(this.core.scene.inputTracker, data.prompt.length - 1);
      }

      if (inputType === 'Number' && data.expectedType[num].includes('Point')) {
        input = this.convertInputToPoint(input);
      }

      if (input instanceof Point) {
        this.core.scene.inputData.points.push(input);
        this.core.scene.points.push(input);
      }
    } else {
      this.core.notify(Strings.Error.INPUT);
    }

    if (data.expectedType[this.core.scene.inputTracker].includes('Point') && this.core.scene.activeCommand.minPoints) {
      this.core.scene.snapping.active = true;
    } else {
      this.core.scene.snapping.active = false;
    }

    // validate the action state
    if (data.action) {
      if (this.core.scene.inputData.points.length < this.core.scene.activeCommand.minPoints) {
        const msg = `Invalid Data for command: ${this.core.scene.activeCommand.constructor.name}`;
        this.core.notify(msg);
        throw Error(msg);
      }
    }

    this.setPrompt(data.prompt[this.core.scene.inputTracker]);

    if (data.action) {
      this.actionCommand(data.reset);
    }

    if (data.reset) {
      this.reset();
    }
  }
}
