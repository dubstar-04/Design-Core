import {Tool} from '../tools/tool.js';
import {Snapping} from './snapping.js';
import {Utils} from './utils.js';
import {Strings} from './strings.js';

import {DesignCore} from '../designCore.js';
import {Point} from '../entities/point.js';

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
      if (Input.getType(input) === Input.Type.DYNAMIC) {
        // NUMBER input received
        // If the prompt allows for DYNAMIC input - convert NUMBER to a POINT
        if (!isNaN(input)) {
          const basePoint = DesignCore.Scene.inputManager.inputPoint;
          const angle = DesignCore.Scene.inputManager.inputPoint.angle(DesignCore.Mouse.pointOnScene());
          const point = basePoint.project(angle, input);
          input = point;
        }
      }

      // Update the last input point on inputManager
      if (Input.getType(input) === Input.Type.POINT) {
        DesignCore.Scene.inputManager.inputPoint = input;
      }

      // expected type input, pass to active command
      this.resolve(input);
    } else if (this.parseInputToOption(input) !== undefined) {
      // input matches command option, pass to active command
      this.resolve(this.parseInputToOption(input));
    } else {
      // Invalid input receieved. notify the user.
      DesignCore.Core.notify(`${Strings.Error.INPUT}: ${this.promptMessage}`);
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
      // Add \u0332 after the first letter of each option to include underscore
      const optionsWithShortcut = this.options.map((option) => this.getOptionWithShortcut(option));
      msg = `${this.promptMessage} ${Strings.Strings.OR} [${optionsWithShortcut}]`;
    }
    return msg;
  }

  /**
   * Underline the shortcut key for the prompt option
   * @param {string} option
   * @returns - option with shortcut underlined
   */
  getOptionWithShortcut(option) {
    const optionWithShortcut = `${option.substring(0, 1)}\u0332${option.substring(1, option.length)}`;
    return optionWithShortcut;
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
    DYNAMIC: 'Dynamic', // convert numerical input to point data
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

    const po = DesignCore.Scene.inputManager.promptOption;
    if (po && po.types.includes(Input.Type.DYNAMIC)) {
      // if dynamic input is accepted and value is a number
      if (!isNaN(value)) {
        return Input.Type.DYNAMIC;
      }
    }

    return value.constructor.name;
  }
}

export class InputManager {
  constructor() {
    this.activeCommand = undefined;

    this.selection = undefined;
    this.promptOption = undefined;

    // save the last point input
    // this is needed for snapping, polar, ortho etc.
    this.inputPoint = new Point();

    this.snapping = new Snapping();
  }

  /**
   * Reset the inputManager
   */
  reset() {
    this.snapping.active = false;
    DesignCore.CommandLine.resetPrompt();
    this.activeCommand = undefined;
    // this.promptOption.reject('reject');
    this.promptOption = undefined;
    DesignCore.Scene.reset();
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
    } else if (DesignCore.CommandManager.isCommand(input) || DesignCore.CommandManager.isShortcut(input)) {
      this.initialiseItem(DesignCore.CommandManager.getCommand(input));
      this.activeCommand.execute();
    }
  }

  /**
   * Handle enter / return presses
   */
  onEnterPressed() {
    if (this.activeCommand !== undefined) {
      if (this.promptOption.types.includes(Input.Type.SELECTIONSET) && DesignCore.Scene.selectionManager.selectionSet.accepted !== true) {
        DesignCore.Scene.selectionManager.selectionSet.accepted = true;
        this.promptOption.respond(DesignCore.Scene.selectionManager.selectionSet);
      } else {
        this.reset();
      }
    } else {
      const lastCommand = DesignCore.CommandLine.lastCommand[0];
      // if there was a previous command - repeat it...
      if (lastCommand) {
        this.initialiseItem(lastCommand);
        this.activeCommand.execute();
      }
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
    // left clicks are used for selection of entities and points
    // Selection of entities can only occur if there is no active snap available
    // Selection of entities can only occur if the mouse is over an entity
    // Final selection is a non-snapped point on the scene

    // Selection Priority:
    // Point snapping
    // Entity Selection
    // Point of scene

    // TODO: snap and index is already performed during mouse moves
    const snap = this.snapping.snap();
    const index = DesignCore.Scene.selectionManager.findClosestItem(DesignCore.Mouse.pointOnScene());

    // Select entity only mouse is close to an entity and no snap point is available
    // Do allow selection when there is no command active
    // Don't allow selection of there is an active command that does't require a selection i.e. prompt option includes SINGLESELECTION
    if (index !== undefined && !snap && (this.activeCommand === undefined || this.promptOption !== undefined && (this.promptOption.types.includes(Input.Type.SINGLESELECTION)|| this.promptOption.types.includes(Input.Type.SELECTIONSET)))) {
      const selection = DesignCore.Scene.selectionManager.singleSelect(DesignCore.Mouse.pointOnScene());
      this.onSelection(selection);
    } else if (this.promptOption !== undefined && this.promptOption.types.includes(Input.Type.POINT)) {
      this.snapping.active = false;
      this.promptOption.respond(point);
    }
  }

  /**
   * Handle mouse position changes
   */
  mouseMoved() {
    DesignCore.Scene.tempItems = [];
    DesignCore.Scene.auxiliaryItems = [];

    // selection window active
    if (DesignCore.Mouse.buttonOneDown) {
      if (this.promptOption !== undefined) {
        // check if the active command requires a selection set
        if (!this.promptOption.types.includes(Input.Type.SELECTIONSET)) {
          return;
        }
      }

      DesignCore.Scene.selectionManager.drawSelectionWindow();
    }

    // store the snapped point
    let snapped;
    let selecting = false;
    if (this.snapping.active) {
      snapped = this.snapping.snap();
    }

    // Determine if the mouse is over a scene item only if no snap point is available
    if (snapped === undefined) {
      if (this.activeCommand === undefined || this.activeCommand !== undefined && (this.promptOption.types.includes(Input.Type.SINGLESELECTION) || this.promptOption.types.includes(Input.Type.SELECTIONSET))) {
        const index = DesignCore.Scene.selectionManager.findClosestItem(DesignCore.Mouse.pointOnScene());
        if (index !== undefined) {
          const copyofitem = Utils.cloneObject(DesignCore.Scene.items[index]);
          // copyofitem.colour = DesignCore.Core.settings.selecteditemscolour.toString();
          copyofitem.lineWidth = copyofitem.lineWidth * 2;
          DesignCore.Scene.addToTempItems(copyofitem);
          selecting = true;
        }
      }
    }

    // preview active commands when items are not being selected
    if (this.activeCommand !== undefined && !selecting) {
      this.activeCommand.preview();
    }

    DesignCore.Canvas.requestPaint();
  }

  /**
   * Handle single selection
   */
  singleSelect() {
    // console.log('single select');
    // const point = DesignCore.Mouse.pointOnScene();
    this.inputPoint = DesignCore.Mouse.pointOnScene();
    this.onLeftClick(this.inputPoint);
  }

  /**
   * Handle window selection
   */
  windowSelect() {
    // console.log('window select');
    DesignCore.Scene.selectionManager.windowSelect();
  }


  /**
 * Handle mouse down
 * @param {integer} button
 */
  mouseDown(button) {
    switch (button) {
      case 0: // left button
        // TODO: can't select and window select at the same time
        // This needs combining with canvas.mouseMove to define selection, snapping and window selection
        this.singleSelect();
        break;
      case 1: // middle button
        break;
      case 2: // right button
        break;
    }
  };

  /**
 * Handle mouse up
 * @param {integer} button
 */
  mouseUp(button) {
    switch (button) {
      case 0: // left button
        // Clear tempItems - This is here to remove the crossing window
        DesignCore.Scene.auxiliaryItems = [];

        if (this.promptOption !== undefined) {
          // check if the active command requires a selection set
          if (!this.promptOption.types.includes(Input.Type.SELECTIONSET)) {
            return;
          }
        }

        // check if the mouse position has changed since mousedown
        if (!DesignCore.Mouse.mouseDownCanvasPoint.isSame(DesignCore.Mouse.pointOnCanvas())) {
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
        DesignCore.Scene.selectionManager.addToSelectionSet(selection.selectedItemIndex);
      }

      // update selection set
    }
  }

  /**
 * Initialise commands
 * @param {string} command
 */
  initialiseItem(command) {
    DesignCore.Scene.saveRequired();
    DesignCore.CommandLine.addToCommandHistory(command);
    this.activeCommand = DesignCore.CommandManager.createNew(command);
  };

  /**
   * Set the command prompt
   * @param {string} prompt
   */
  setPrompt(prompt) {
    // TODO: single line method required?
    DesignCore.CommandLine.setPrompt(`${this.activeCommand.type} - ${prompt}`);
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
      this.activeCommand.action();
    } else {
      // set the items layer to the current layer
      item.layer = DesignCore.LayerManager.getCstyle();
      // return the item index
      return DesignCore.Scene.addItem(item.type, item, index);
    }
  }
}
