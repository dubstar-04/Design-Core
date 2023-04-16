import {Point} from '../entities/point.js';

export class CommandLine {
  /**
   * Commandline Constructor
   * @param {object} core - Design Core Object
   */
  constructor(core) {
    this.cmdLine = ''; // display string
    this.prompt = 'Command:';
    this.command = '';
    this.core = core;
    this.lastCommand = []; // Store the last command
    this.lastCommandPosition = -1; // Store the current position on the command history
    this.updateCallbackFunction; // set to external callback function
  }

  /**
   * Sets the commandline callback to an external function
   * @param {function} callback
   */
  setUpdateFunction(callback) {
    // set the call
    this.updateCallbackFunction = callback;
    this.update();
  }

  /**
   * Resets the commandline prompt
   */
  resetPrompt() {
    this.prompt = '';
    this.prompt = 'Command:';
    this.command = '';
    this.lastCommandPosition = -1;
    this.update();
  }

  /**
   * Sets the commandline prompt
   * @param {string} prompt
   */
  setPrompt(prompt) {
    this.prompt = prompt;
    this.command = '';
    this.update();
  }

  /**
   * Update the commandline prompt and trigger the callback
   */
  update() {
    this.cmdLine = this.prompt + this.command;
    // run the callback to update external functions
    if (this.updateCallbackFunction) {
      this.updateCallbackFunction(this.cmdLine);
    }
  }

  /**
   * Handles keypresses at the commandline
   * @param {string} key
   */
  handleKeys(key) {
    switch (key) {
      case 'Backspace': // Backspace
        this.backPressed();
        break;
      case 9: // Tab
        break;
      case 'Enter': // Enter
        this.enterPressed();
        break;
      case 'Escape':
        this.core.scene.inputManager.reset();
        break;
      case 'Space': // space
        this.spacePressed();
        break;
      case 'Left-Arrow': // Left-Arrow
        break;
      case 'Up-Arrow': // Up-Arrow
        this.previousCommand('up');
        break;
      case 'Right-Arrow': // Right-Arrow
        break;
      case 'Down-Arrow': // Down-Arrow
        this.previousCommand('down');
        break;
      case 'Delete': // Delete
        this.deletePressed();
        break;
      case 'F1': // F1
        // showSettings()
        // changeTab(event, 'Help')
        break;
      case 'F2': // F2
        break;
      case 'F3': // F3
        this.disableSnaps();
        break;
      case 'F4': // F4
        break;
      case 'F5': // F5
        break;
      case 'F6': // F6
        break;
      case 'F7': // F7
        toggleSnap('drawgrid');
        canvas.requestPaint();
        break;
      case 'F8': // F8
        toggleSnap('ortho');
        break;
      case 'F9': // F9
        break;
      case 'F10': // F10
        toggleSnap('polar');
        break;
      case 'F11': // F11
        break;
      case 'F12': // F12
        break;
      case undefined:
        break;

      default:
        if (key) {
          this.command = this.command + key;
          this.update();
        }
    }
  }

  /**
   * Handles presses of the delete key
   */
  deletePressed() {
    // TODO: Janky way to initiate commands - fit it
    this.core.scene.inputManager.onCommand('Erase');
  }

  /**
   * Handles presses of the space key
   */
  spacePressed() {
    const activeCommand = this.core.scene.activeCommand;
    if (activeCommand && activeCommand.type === 'Text') {
      this.command = this.command + ' ';
    } else {
      this.enterPressed();
    }
  }

  /**
   * Handles presses of the backspace key
   */
  backPressed() {
    if (this.cmdLine.length === this.prompt.length) {
      this.command = '';
    } else {
      this.command = this.command.substring(0, this.command.length - 1);
      this.update();
    }
  }

  /**
   * Handles presses of the enter key
   */
  enterPressed() {
    if (this.cmdLine.length > this.prompt.length) {
      // get the inputprompt and remove the prompt text
      const inputCommand = this.cmdLine.slice(this.prompt.length);
      this.core.scene.inputManager.onCommand(this.parseInput(inputCommand));
    } else {
      this.core.scene.inputManager.onEnterPressed();
    }
  }

  /**
   * Converts input to a type
   * @param {string} input
   */
  parseInput(input) {
    let inputData;
    const isNumber = /^\-?\d+\.?\d+?$/.test(input);
    const isPoint = /^\-?\d+\.?\d+?,\-?\d+\.?\d+?$/.test(input.replace(/@|#/gi, ''));


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
      inputData = Number(input);
    }

    if (isLetters && !isUndefined) {
      inputData = String(input);
    }

    return inputData;
  }

  /**
   * Adds commands to the command history
   * @param {string} item
   */
  addToCommandHistory(item) {
    // add the command to the commandline history stored in last command
    if (this.lastCommand.indexOf(item) !== -1) { // only store command once
      this.lastCommand.splice(this.lastCommand.indexOf(item), 1); // if the command is already in the array, Erase it
    }
    this.lastCommand.unshift(item); // add the command to the Array
    while (this.lastCommand.length > 10) { // check if we have more than 10 command in history
      this.lastCommand.pop();
    }
  }

  /**
   * Handles cycling the command history
   * @param {string} direction - up/down
   */
  previousCommand(direction) {
    if (direction === 'up') {
      if (this.lastCommand.length > 0 && this.lastCommandPosition < (this.lastCommand.length - 1)) {
        this.lastCommandPosition++;
        this.command = this.lastCommand[this.lastCommandPosition];
        this.update();
      }
    } else if (direction === 'down') {
      if (this.lastCommandPosition > 0) {
        this.lastCommandPosition--;
        this.command = this.lastCommand[this.lastCommandPosition];
        this.update();
      } else if (this.lastCommandPosition === 0) {
        this.resetPrompt();
      }
    }
  }
}
