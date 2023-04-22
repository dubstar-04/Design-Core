import {Entity} from '../entities/entity.js';
import {Point} from '../entities/point.js';
import {Tool} from '../tools/tool.js';
import {Strings} from './strings.js';
import {Utils} from './utils.js';

class CanvasSelection {}
class SelectionAccepted {}
// class Initialise {}
export class PromptOptions {
  constructor(promptMessage = 'error', types = [], options = []) {
    this.promptMessage = promptMessage;
    this.types = types;
    this.options = options;
    this.resolve = undefined;
    this.reject = undefined;
  }

  respond(input) {
    if (this.types.includes(Input.getType(input))) {
      this.resolve(input);
    } else {
      throw Error('Invalid response type');
    }
  }

  reject() {
    this.reject();
  }

  getPrompt() {
    let msg = `${this.promptMessage}`;
    if (this.options.length) {
      msg = `${this.promptMessage} [${this.options}]`;
    }
    return msg;
  }

  setResolve(resolve) {
    this.resolve = resolve;
  }

  setReject(reject) {
    this.reject = reject;
  }
}

export class Input {
  static Type = {
    POINT: 'Point',
    SELECTIONSET: 'SelectionSet',
    SINGLESELECTION: 'SingleSelection',
    NUMBER: 'Number',
    STRING: 'String',
    QUIT: 'Quit',
  };

  static getType(value) {
    if (value === undefined) {
      throw Error('Input.Type: Undefined input type');
    }

    return value.constructor.name;
  }
}

export class InputManager {
  constructor(core) {
    this.core = core;
    this.activeCommand = undefined;
    this.promptOption = undefined;
  requestInput(promptOption) {
    this.promptOption = promptOption;
    this.setPrompt(this.promptOption.getPrompt());

    // Check the requested input types are valid
    promptOption.types.forEach((type) => {
      if (type === undefined) {
        throw Error('Undefined Input.Type');
      }

      if (!Object.values(Input.Type).includes(type)) {
        throw Error('Invalid input type');
      }
    });

    if (promptOption.types.includes(Input.Type.POINT)) {
      // turn on snapping
      this.core.scene.snapping.active = true;
    }

    return new Promise((resolve, reject) => {
      this.promptOption.setResolve(resolve);
      this.promptOption.setReject(reject);
    });
  }

  reset() {
    this.activeCommand = undefined;
    this.promptOption = undefined;
    this.core.scene.reset();
  }

  onCommand(input) {
    if (this.activeCommand !== undefined) {
      this.promptOption.respond(input);
    } else if (this.core.commandManager.isCommand(input) || this.core.commandManager.isShortcut(input)) {
      this.initialiseItem(this.core.commandManager.getCommand(input));
      this.activeCommand.execute(this.core);
    }
  }

  acceptPreselection() {
    if (this.core.scene.selection.selectionSet.length && this.activeCommand.selectionRequired) {
      this.core.scene.selection.selectionAccepted = true;
      this.actionInput(new SelectionAccepted());
    } else {
      // initial action - first call to actionInput for this command
      this.actionInput();
    }
  }

  onEnterPressed() {
    if (this.activeCommand instanceof Tool && this.core.scene.selection.selectionSet.length) {
      this.core.scene.selection.selectionAccepted = true;
      this.actionInput(new SelectionAccepted());
    } else if (this.activeCommand === undefined) {
      this.initialiseItem(this.core.commandLine.lastCommand[0]);
      this.actionInput();
    } else {
      this.core.scene.reset();
    }
  }

  onLeftClick() {
    if (this.activeCommand === undefined) {
      this.core.scene.selection.singleSelect();
    } else {
      if (this.activeCommand instanceof Tool && this.activeCommand.selectionRequired && !this.core.scene.selection.selectionAccepted) {
        this.core.scene.selection.singleSelect();
        this.actionInput(new CanvasSelection());
      } else if (this.activeCommand instanceof Entity || this.core.scene.selection.selectionAccepted || !this.activeCommand.selectionRequired) {
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
    this.activeCommand = this.core.commandManager.createNew(command);
  };

  convertInputToPoint(input) {
    const basePoint = this.core.scene.points.at(-1);
    const angle = Utils.degrees2radians(this.core.mouse.inputAngle());
    const point = basePoint.project( angle, input);

    return point;
  }

  setPrompt(prompt) {
    this.core.commandLine.setPrompt(`${this.activeCommand.type} - ${prompt}`);
  }

  actionCommand() {
    if (this.activeCommand instanceof Tool) {
      this.activeCommand.action(this.core);
    } else {
      const colour = 'BYLAYER';

      const data = {
        colour: colour,
        layer: this.core.layerManager.getCLayer(),
      };

      if (this.inputData.points.length) {
      // merge the input data into the data
        Object.assign(data, this.inputData);
      }

      this.core.scene.addToScene(this.activeCommand.type, data);
    }
  }

  actionInput(input) {
    const num = this.inputTracker;
    let inputType = 'undefined';

    // get the input type
    if (input !== undefined) {
      inputType = (input).constructor.name;
    }

    // call the subclass
    const data = this.activeCommand.processInput(num, input, inputType, this.core);

    let validInput = false;
    // TODO: use index 0 for actual data
    // no valid type required for index 0
    validInput = num ? data.expectedType[num].includes(inputType) : true;

    if (validInput) {
      if (inputType !== 'CanvasSelection') {
        this.inputTracker++;
        this.inputTracker = Math.min(this.inputTracker, data.prompt.length - 1);
      }

      if (inputType === 'Number' && data.expectedType[num].includes('Point')) {
        input = this.convertInputToPoint(input);
      }

      if (input instanceof Point) {
        this.inputData.points.push(input);
        this.core.scene.points.push(input);
      }
    } else {
      this.core.notify(Strings.Error.INPUT);
    }

    if (data.expectedType[this.inputTracker].includes('Point') && this.activeCommand.minPoints) {
      this.core.scene.snapping.active = true;
    } else {
      this.core.scene.snapping.active = false;
    }

    // validate the action state
    if (data.action) {
      if (this.inputData.points.length < this.activeCommand.minPoints) {
        const msg = `Invalid Data for command: ${this.activeCommand.constructor.name}`;
        this.core.notify(msg);
        throw Error(msg);
      }
    }

    this.setPrompt(data.prompt[this.inputTracker]);

    if (data.action) {
      this.actionCommand();
    }

    if (data.reset) {
      this.reset();
    }
  }
}
