import {Tool} from '../tools/tool.js';
import {Snapping} from './snapping.js';

export class PromptOptions {
  constructor(promptMessage = 'error', types = [], options = []) {
    this.promptMessage = promptMessage;
    this.types = types;
    this.options = options;
    this.resolve = undefined;
    this.reject = undefined;
  }

  /**
   * Return data to the input request
   * @param {any} input
   */
  respond(input) {
    if (this.types.includes(Input.getType(input))) {
      // expected type input, pass to active command
      this.resolve(input);
    } else if (this.parseInputToOption(input) !== undefined) {
      // input matches command option, pass to active command
      this.resolve(this.parseInputToOption(input));
    } else {
      throw Error('Invalid response type');
    }
  }

  /**
   * Match the input to a command option
   * @param {any} input
   * @returns undefined or the matched option
   */
  parseInputToOption(input) {
    if (this.options.length === 0) {
      return;
    }

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i];
      // convert the option to uppercase and substring to the input length for comparison
      const optionSubstring = option.toUpperCase().substring(0, input.length);
      if (optionSubstring === input.toUpperCase()) {
        return option;
      }
    }

    return;
  }

  /**
   * Reject the input request
   */
  reject() {
    this.reject();
  }

  /**
   * Return the prompt for the input request
   * @returns
   */
  getPrompt() {
    let msg = `${this.promptMessage}`;
    if (this.options.length) {
      msg = `${this.promptMessage} [${this.options}]`;
    }
    return msg;
  }

  /**
   * Set the resolve callback
   * @param {any} resolve - callback function
   */
  setResolve(resolve) {
    this.resolve = resolve;
  }

  /**
   * Set the reject callback
   * @param {any} reject - callback function
   */
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
  };

  /**
   * Return the Input.Type for value
   * @param {any} value
   * @returns
   */
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

    this.selection = undefined;
    this.promptOption = undefined;

    this.snapping = new Snapping();
  }

  /**
   * Reset the inputManager
   */
  reset() {
    this.snapping.active = false;
    this.core.commandLine.resetPrompt();
    this.activeCommand = undefined;
    // this.promptOption.reject('reject');
    this.promptOption = undefined;
    this.core.scene.reset();
  }

  /**
 * Create input request
 * @param {PromptOption} promptOption
 * @returns promise
 */
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
      this.snapping.active = true;
    }

    return new Promise((resolve, reject) => {
      this.promptOption.setResolve(resolve);
      this.promptOption.setReject(reject);
    });
  }

  /**
   * Handle command input
   * @param {any} input
   */
  onCommand(input) {
    if (this.activeCommand !== undefined) {
      this.promptOption.respond(input);
    } else if (this.core.commandManager.isCommand(input) || this.core.commandManager.isShortcut(input)) {
      this.initialiseItem(this.core.commandManager.getCommand(input));
      this.activeCommand.execute(this.core);
    }
  }

  /**
   * Handle enter / return presses
   */
  onEnterPressed() {
    if (this.activeCommand !== undefined) {
      if (this.promptOption.types.includes(Input.Type.SELECTIONSET) && this.core.scene.selectionManager.selectionSet.accepted !== true) {
        this.core.scene.selectionManager.selectionSet.accepted = true;
        this.promptOption.respond(this.core.scene.selectionManager.selectionSet);
      } else {
        this.reset();
      }
    } else {
      this.initialiseItem(this.core.commandLine.lastCommand[0]);
      this.activeCommand.execute(this.core);
    }
  }

  /**
   * Handle escape presses to reset
   */
  onEscapePressed() {
    this.reset();
  }

  /**
   * Handle left click input
   * @param {Point} point
   */
  onLeftClick(point) {
    if (this.promptOption !== undefined && this.promptOption.types.includes(Input.Type.POINT)) {
      this.snapping.active = false;
      this.promptOption.respond(point);
    } else {
      const selection = this.core.scene.selectionManager.singleSelect(this.core.mouse.pointOnScene());
      this.onSelection(selection);
    }
  }

  /**
   * Handle mouse position changes
   */
  mouseMoved() {
    this.core.scene.tempItems = [];

    // TODO: Can't select, snap and create an item at the same time
    // add conditionals or return to reduce the number of paint requests

    if (this.core.mouse.buttonOneDown) {
      this.core.scene.selectionManager.drawSelectionWindow();
      this.core.canvas.requestPaint();
    }

    if (this.snapping.active) {
      this.snapping.snap(this.core.scene);
      this.core.canvas.requestPaint();
    }

    if (this.activeCommand !== undefined) {
      this.activeCommand.preview(this.core);
      this.core.canvas.requestPaint();
    }
  }

  /**
   * Handle single selection
   */
  singleSelect() {
    log('single select');
    const point = this.core.mouse.pointOnScene();
    this.onLeftClick(point);
  }

  /**
   * Handle window selection
   */
  windowSelect() {
    log('single select');
    this.core.scene.selectionManager.windowSelect();
  }

  /**
 * Handle mouse up
 * @param {integer} button
 */
  mouseUp(button) {
    switch (button) {
      case 0: // left button
        // Clear tempItems - This is here to remove the crossing window
        this.core.scene.tempItems = [];

        // TODO: can't select and window select at the same time
        // This needs combining with canvas.mouseMove to define selection, snapping and window selection
        this.singleSelect();

        // check if the mouse position has changed since mousedown
        if (!this.core.mouse.mouseDownCanvasPoint.isSame(this.core.mouse.pointOnCanvas())) {
          this.windowSelect();
        }

        break;
      case 1: // middle button
        break;
      case 2: // right button
        this.onEnterPressed();
        break;
    }
  };

  /**
   * Handle canvas selection
   * @param {*} selection
   */
  onSelection(selection) {
    if (this.activeCommand !== undefined && this.promptOption.types.includes(Input.Type.SINGLESELECTION)) {
      this.promptOption.respond(selection);
    } else {
      if (Input.getType(selection) === Input.Type.SINGLESELECTION) {
        this.core.scene.selectionManager.addToSelectionSet(selection.selectedItemIndex);
      }

      // update selection set
    }
  }

  /**
 * Initialise commands
 * @param {string} command
 */
  initialiseItem(command) {
    this.core.scene.saveRequired();
    this.core.commandLine.addToCommandHistory(command);
    this.activeCommand = this.core.commandManager.createNew(command);
  };

  /**
   * Set the command prompt
   * @param {string} prompt
   */
  setPrompt(prompt) {
    // TODO: single line method required?
    this.core.commandLine.setPrompt(`${this.activeCommand.type} - ${prompt}`);
  }

  /**
   * Execute the currently active command then reset
   * @param {*} item - item to create
   * @param {*} index - index of item in scene.items
   */
  executeCommand(item, index = undefined) {
    this.actionCommand(item, index);
    this.reset();
  }

  /**
   * Execute the currently active command without reset
   * @param {*} item - item to create
   * @param {*} index - index of item in scene.items
   */
  actionCommand(item, index = undefined) {
    if (this.activeCommand instanceof Tool) {
      this.activeCommand.action(this.core);
    } else {
      // set the items layer to the current layer
      item.layer = this.core.layerManager.getCLayer();
      // return the item index
      return this.core.scene.addToScene(item.type, item, index);
    }
  }
}
