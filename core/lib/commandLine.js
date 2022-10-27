export class CommandLine {
  constructor(core) {
    this.cmdLine = ''; // display string
    this.prompt = 'Command:';
    this.command = '';
    this.core = core;
    this.lastCommand = []; // Store the last command
    this.lastCommandPosition = -1; // Store the current position on the command history
    this.updateCallbackFunction; // set to external callback function
  }

  setUpdateFunction(callback) {
    // set the call
    this.updateCallbackFunction = callback;
    this.update();
  }

  clearPrompt() {
    const currentPrompt = this.prompt;
    this.prompt = '';
    this.prompt = currentPrompt;
    this.command = '';
    this.update();
  }

  resetPrompt() {
    this.prompt = '';
    this.prompt = 'Command:';
    this.command = '';
    this.lastCommandPosition = -1;
    this.update();
  }

  setPrompt(prompt) {
    this.prompt = this.core.scene.activeCommand.type + ': ' + prompt;
    this.command = '';
    this.update();
  }

  setPromptText(promptString) {
    this.prompt = this.core.scene.activeCommand.type + ': ' + promptString;
    this.command = '';
    this.update();
  }

  update() {
    // console.log("Command: ", this.command)
    // console.log("Prompt: ", this.prompt)
    this.cmdLine = this.prompt + this.command;

    // run the callback to update external functions
    if (this.updateCallbackFunction) {
      this.updateCallbackFunction(this.cmdLine);
    }
  }

  handleKeys(key) {
    console.log('commandLine.js - handle keys - key:', key);

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
        this.core.designEngine.sceneControl('RightClick', []);
        break;
      case 'Space': // space
        this.enterPressed();
        break;
      case 'Left-Arrow': // Left-Arrow
        this.leftPressed();
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
        toggleSnap('drawGrid');
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

  deletePressed() {
    if (this.cmdLine.length === this.prompt.length) {

    }
    this.core.designEngine.sceneControl('Enter', ['E']);
    console.log('[CommandLine.deletePressed]');
  }

  backPressed() {
    if (this.cmdLine.length === this.prompt.length) {
      this.command = '';
    } else {
      // console.log("[CommandLine.backPressed]")

      this.command = this.command.substring(0, this.command.length - 1);
      this.update();
    }
  }

  leftPressed() {
    if (this.cmdLine.slice(0, this.cmdLine.selectionStart).length === this.prompt.length) {

    }
  }

  previousCommand(direction) {
    if (direction === 'up') {
      if (this.lastCommand.length > 0 && this.lastCommandPosition < (this.lastCommand.length - 1)) {
        this.lastCommandPosition++;
        this.command = this.lastCommand[this.lastCommandPosition];
        this.update();
      }
      console.log('[CommandLine.previousCommand] LastCommandPosition: ' + this.lastCommandPosition);
    } else if (direction === 'down') {
      if (this.lastCommandPosition > 0) {
        this.lastCommandPosition--;
        this.command = this.lastCommand[this.lastCommandPosition];
        this.update();
      } else if (this.lastCommandPosition === 0) {
        this.resetPrompt();
        console.log('[CommandLine.previousCommand] this.lastCommandPosition: ' + this.lastCommandPosition);
      }
    }
  }

  addToCommandHistory(item) {
    // add the command to the commandline history stored in last command
    if (this.core.commandLine.lastCommand.indexOf(item) !== -1) { // only store command once
      this.core.commandLine.lastCommand.splice(this.core.commandLine.lastCommand.indexOf(item), 1); // if the command is already in the array, Erase it
    }
    this.core.commandLine.lastCommand.unshift(item); // add the command to the Array
    while (this.core.commandLine.lastCommand.length > 10) { // check if we have more than 10 command in history
      this.core.commandLine.lastCommand.pop();
    }
  }

  enterPressed() {
    // console.log(" UI_Scene.js - Return Pressed")

    if (this.cmdLine.length > this.prompt.length) {
      // get the inputprompt and remove the prompt text
      const inputCommand = this.cmdLine.slice(this.prompt.length);
      console.log('[CommandLine.enterPressed] - Command:', inputCommand);
      const data = [inputCommand];
      // console.log(data[0])
      this.core.designEngine.sceneControl('Enter', data);
    } else {
      const data = [];
      this.core.designEngine.sceneControl('Enter', data);
    }
  }

  mouseup() {
    console.log('[CommandLine.mousedown]');
    this.cmdLine.selectionStart = this.cmdLine.selectionEnd = this.cmdLine.length;
  }

  disableSnaps() {
    toggleSnap('endSnap');
    toggleSnap('midSnap');
    toggleSnap('centreSnap');
    toggleSnap('nearestSnap');
  }
}
