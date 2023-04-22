import {Tool} from '../tools/tool.js';

// class Quit {}
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

    this.selection = undefined;
    this.promptOption = undefined;
  }


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
    this.core.commandLine.resetPrompt();
    this.activeCommand = undefined;
    // this.promptOption.reject('reject');
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

  onEnterPressed() {
    // log('Enter pressed - Option Types:', this.promptOption.types);
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

  onEscapePressed() {
    this.reset();
  }

  onLeftClick(point) {
    if (this.promptOption !== undefined && this.promptOption.types.includes(Input.Type.POINT)) {
      this.core.scene.snapping.active = false;
      this.promptOption.respond(point);
    } else {
      const selection = this.core.scene.selectionManager.singleSelect(this.core.mouse.pointOnScene());
      this.onSelection(selection);
    }
  }

  mouseUp(button) {
    switch (button) {
      case 0: // left button
        const point = this.core.mouse.pointOnScene();
        this.onLeftClick(point);

        // Clear tempItems - This is here to remove the crossing window
        this.core.scene.tempItems = [];

        // check if the mouse position has changed since mousedown
        if (!this.core.mouse.mouseDownCanvasPoint.isSame(this.core.mouse.pointOnCanvas())) {
          // const selection =
          this.core.scene.selectionManager.windowSelect();
          // this.onSelection(selection);
        }
        break;
      case 1: // middle button
        break;
      case 2: // right button
        this.onEnterPressed();
        break;
    }
  };

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


  initialiseItem(command) {
    this.core.scene.saveRequired();
    this.core.commandLine.addToCommandHistory(command);
    this.activeCommand = this.core.commandManager.createNew(command);
  };

  // TODO: single line method required?
  setPrompt(prompt) {
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
