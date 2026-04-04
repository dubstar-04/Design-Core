import { Core } from '../../core/core/core.js';
import { Input, PromptOptions } from '../../core/lib/inputManager.js';
import { Strings } from '../../core/lib/strings.js';
import { expect, jest } from '@jest/globals';

const core = new Core();
const commandline = core.commandLine; // new CommandLine();

test('Test Commandline.resetPrompt', () => {
  commandline.handleKeys('L');
  expect(commandline.command).not.toBe('');
  commandline.resetPrompt();
  expect(commandline.command).toBe('');
});

test('Test Commandline.setPrompt', () => {
  const testText = 'TestTest';
  commandline.setPrompt(testText);
  expect(commandline.prompt).toBe(`${testText}:`);
  expect(commandline.command).toBe('');
});

test('Test Commandline.update', () => {
  const commandTestText = 'commandTestTest';
  const promptTestText = 'promptTestTest';

  commandline.command = commandTestText;
  commandline.prompt = promptTestText;
  commandline.update();
  expect(commandline.cmdLine).toBe(promptTestText + commandTestText);
  commandline.resetPrompt();
});

test('Test CommandLine.handleKeys', () => {
  commandline.handleKeys('L');
  expect(commandline.command).toBe('L');
  commandline.resetPrompt();
});

test('Test CommandLine.spacePressed', () => {
  const inputManager = core.scene.inputManager;
  const promptOption = new PromptOptions(Strings.Input.START, [Input.Type.STRING]);

  inputManager.reset();
  // With no active command
  // Pressing space should active a command if this.command contains a valid command
  commandline.handleKeys('L');
  commandline.spacePressed();
  expect(inputManager.activeCommand).not.toBeUndefined();

  // with an active command
  // pressing space should end the active command if this.command is empty
  commandline.spacePressed();
  expect(inputManager.activeCommand).toBeUndefined();

  // pressing space should add a space to this.command if the input type is Input.Type.STRING
  commandline.handleKeys('L');
  commandline.spacePressed();
  expect(inputManager.activeCommand).not.toBeUndefined();

  inputManager.requestInput(promptOption);
  commandline.handleKeys('test');
  commandline.spacePressed();
  // activeCommand should be defined still
  expect(inputManager.activeCommand).not.toBeUndefined();
  // command should have a space
  expect(commandline.command).toBe('test ');

  inputManager.reset();
});

test('Test CommandLine.backPressed', () => {
  commandline.resetPrompt();

  commandline.handleKeys('123');
  expect(commandline.command).toBe('123');

  commandline.backPressed();
  expect(commandline.command).toBe('12');

  commandline.backPressed();
  expect(commandline.command).toBe('1');

  // deleting all chars resets the command
  commandline.backPressed();
  expect(commandline.command).toBe('');

  // deleting with no command shouldn't affect the prompt value
  commandline.backPressed();
  expect(commandline.prompt.at(-1)).toBe(':');
});

test('Test CommandLine.enterPressed', () => {
  commandline.resetPrompt();
  commandline.handleKeys('L');
  commandline.enterPressed();
  expect(commandline.lastCommand.length).toBe(1);
  commandline.resetPrompt();
  commandline.lastCommand = [];
});

test('Test CommandLine.parseInput', () => {
  // regular point
  const regPoint1 = commandline.parseInput('101,102');
  expect(regPoint1.constructor.name).toBe('Point');
  expect(regPoint1.x).toBe(101);
  expect(regPoint1.y).toBe(102);


  const regPoint2 = commandline.parseInput('-101,-102');
  expect(regPoint2.constructor.name).toBe('Point');
  expect(regPoint2.x).toBe(-101);
  expect(regPoint2.y).toBe(-102);

  const regPoint3 = commandline.parseInput('10.1,10.2');
  expect(regPoint3.constructor.name).toBe('Point');
  expect(regPoint3.x).toBe(10.1);
  expect(regPoint3.y).toBe(10.2);

  // relative point
  const relPoint1 = commandline.parseInput('@101,102');
  expect(relPoint1.constructor.name).toBe('Point');
  expect(relPoint1.x).toBe(101);
  expect(relPoint1.y).toBe(102);

  core.scene.inputManager.startCommand('Line');
  core.scene.inputManager.activeCommand.points.push(relPoint1);
  const relPoint2 = commandline.parseInput('@101,102');
  expect(relPoint2.constructor.name).toBe('Point');
  expect(relPoint2.x).toBe(202);
  expect(relPoint2.y).toBe(204);

  const relPoint3 = commandline.parseInput('@-101,-102');
  expect(relPoint3.constructor.name).toBe('Point');
  expect(relPoint3.x).toBe(0);
  expect(relPoint3.y).toBe(0);

  // absolute point
  const absPoint1 = commandline.parseInput('#101,102');
  expect(absPoint1.constructor.name).toBe('Point');
  expect(absPoint1.x).toBe(101);
  expect(absPoint1.y).toBe(102);

  // integer
  const int1 = commandline.parseInput('101');
  expect(int1.constructor.name).toBe('Number');
  expect(int1).toBe(101);

  // negative integer
  const int2 = commandline.parseInput('-101');
  expect(int2.constructor.name).toBe('Number');
  expect(int2).toBe(-101);

  // float
  const float1 = commandline.parseInput('101.1');
  expect(float1.constructor.name).toBe('Number');
  expect(float1).toBe(101.1);

  // negative float
  const float2 = commandline.parseInput('-101.1');
  expect(float2.constructor.name).toBe('Number');
  expect(float2).toBe(-101.1);

  // string
  const str1 = 'str';
  const string1 = commandline.parseInput(str1);
  expect(string1.constructor.name).toBe('String');
  expect(string1).toBe(str1);

  const str2 = '@str';
  const string2 = commandline.parseInput(str2);
  expect(string2.constructor.name).toBe('String');
  expect(string2).toBe(str2);

  const str3 = 'str3';
  const string3 = commandline.parseInput(str3);
  expect(string3.constructor.name).toBe('String');
  expect(string3).toBe(str3);

  const str4 = 'str-4';
  const string4 = commandline.parseInput(str4);
  expect(string4.constructor.name).toBe('String');
  expect(string4).toBe(str4);
});

test('Test CommandLine.addToCommandHistory', () => {
  const commandLineLength = commandline.lastCommand.length;
  commandline.addToCommandHistory('Test');
  /* commandline should only store unique values */
  commandline.addToCommandHistory('Test');
  expect(commandline.lastCommand.length).toBe(commandLineLength + 1);

  /* commandline should only store last 10 commands */
  for (let index = 0; index < 20; index++) {
    commandline.addToCommandHistory(index);
  }

  expect(commandline.lastCommand.length).toBe(10);
  commandline.lastCommand = [];
});

test('Test CommandLine.setUpdateFunction registers callback and triggers it', () => {
  const callback = jest.fn();
  commandline.setUpdateFunction(callback);
  expect(callback).toHaveBeenCalled();
  commandline.setUpdateFunction(undefined);
});

test('Test CommandLine.escapePressed delegates to inputManager.onEscapePressed', () => {
  const inputManager = core.scene.inputManager;
  const spy = jest.spyOn(inputManager, 'onEscapePressed').mockImplementation(() => {});
  commandline.escapePressed();
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('Test CommandLine.deletePressed delegates to inputManager.onCommand with Erase', () => {
  const inputManager = core.scene.inputManager;
  const spy = jest.spyOn(inputManager, 'onCommand').mockImplementation(() => {});
  commandline.deletePressed();
  expect(spy).toHaveBeenCalledWith('Erase');
  spy.mockRestore();
});

test('Test CommandLine.enterPressed with empty command calls onEnterPressed', () => {
  const inputManager = core.scene.inputManager;
  commandline.resetPrompt();
  const spy = jest.spyOn(inputManager, 'onEnterPressed').mockImplementation(() => {});
  commandline.enterPressed();
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('Test CommandLine.enterPressed with command calls onCommand with parsed value', () => {
  const inputManager = core.scene.inputManager;
  commandline.resetPrompt();
  commandline.handleKeys('42');
  const spy = jest.spyOn(inputManager, 'onCommand').mockImplementation(() => {});
  commandline.enterPressed();
  expect(spy).toHaveBeenCalledWith(42);
  spy.mockRestore();
  commandline.resetPrompt();
});

test('Test CommandLine.handleKeys routes Backspace to backPressed', () => {
  commandline.handleKeys('123');
  commandline.handleKeys('Backspace');
  expect(commandline.command).toBe('12');
  commandline.resetPrompt();
});

test('Test CommandLine.handleKeys routes Enter to enterPressed', () => {
  const spy = jest.spyOn(commandline, 'enterPressed').mockImplementation(() => {});
  commandline.handleKeys('Enter');
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('Test CommandLine.handleKeys routes Escape to escapePressed', () => {
  const spy = jest.spyOn(commandline, 'escapePressed').mockImplementation(() => {});
  commandline.handleKeys('Escape');
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('Test CommandLine.handleKeys routes Space to spacePressed', () => {
  const spy = jest.spyOn(commandline, 'spacePressed').mockImplementation(() => {});
  commandline.handleKeys('Space');
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('Test CommandLine.handleKeys routes Delete to deletePressed', () => {
  const spy = jest.spyOn(commandline, 'deletePressed').mockImplementation(() => {});
  commandline.handleKeys('Delete');
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('Test CommandLine.handleKeys routes Up-Arrow to previousCommand up', () => {
  const spy = jest.spyOn(commandline, 'previousCommand').mockImplementation(() => {});
  commandline.handleKeys('Up-Arrow');
  expect(spy).toHaveBeenCalledWith('up');
  spy.mockRestore();
});

test('Test CommandLine.handleKeys routes Down-Arrow to previousCommand down', () => {
  const spy = jest.spyOn(commandline, 'previousCommand').mockImplementation(() => {});
  commandline.handleKeys('Down-Arrow');
  expect(spy).toHaveBeenCalledWith('down');
  spy.mockRestore();
});

test('Test CommandLine.handleKeys with undefined key does not change command', () => {
  commandline.resetPrompt();
  commandline.handleKeys(undefined);
  expect(commandline.command).toBe('');
});

test('Test CommandLine.previousCommand cycles up through history', () => {
  commandline.lastCommand = ['Circle', 'Line', 'Rect'];
  commandline.lastCommandPosition = -1;

  commandline.previousCommand('up');
  expect(commandline.command).toBe('Circle');
  expect(commandline.lastCommandPosition).toBe(0);

  commandline.previousCommand('up');
  expect(commandline.command).toBe('Line');
  expect(commandline.lastCommandPosition).toBe(1);

  commandline.previousCommand('up');
  expect(commandline.command).toBe('Rect');
  expect(commandline.lastCommandPosition).toBe(2);

  // At end of history - stays at last entry
  commandline.previousCommand('up');
  expect(commandline.command).toBe('Rect');
  expect(commandline.lastCommandPosition).toBe(2);

  commandline.lastCommand = [];
  commandline.resetPrompt();
});

test('Test CommandLine.previousCommand cycles down through history', () => {
  commandline.lastCommand = ['Circle', 'Line', 'Rect'];
  commandline.lastCommandPosition = 2;
  commandline.command = 'Rect';

  commandline.previousCommand('down');
  expect(commandline.command).toBe('Line');
  expect(commandline.lastCommandPosition).toBe(1);

  commandline.previousCommand('down');
  expect(commandline.command).toBe('Circle');
  expect(commandline.lastCommandPosition).toBe(0);

  // At position 0 going down resets the prompt
  commandline.previousCommand('down');
  expect(commandline.command).toBe('');
  expect(commandline.lastCommandPosition).toBe(-1);

  commandline.lastCommand = [];
});

test('Test CommandLine.previousCommand up with empty history is a no-op', () => {
  commandline.lastCommand = [];
  commandline.lastCommandPosition = -1;
  commandline.command = '';
  commandline.previousCommand('up');
  expect(commandline.command).toBe('');
  expect(commandline.lastCommandPosition).toBe(-1);
});

test('Test CommandLine.addToCommandHistory', () => {
  commandline.addToCommandHistory('3');
  commandline.addToCommandHistory('2');
  commandline.addToCommandHistory('1');

  commandline.previousCommand('up');
  expect(commandline.command).toBe('1');
  commandline.previousCommand('up');
  expect(commandline.command).toBe('2');
  commandline.previousCommand('up');
  expect(commandline.command).toBe('3');
  commandline.previousCommand('down');
  expect(commandline.command).toBe('2');
  commandline.previousCommand('down');
  expect(commandline.command).toBe('1');
  commandline.previousCommand('down');
  expect(commandline.command).toBe('');
  commandline.lastCommand = [];
});


