import {Core} from '../../core/core/core.js';
import {Input, PromptOptions} from '../../core/lib/inputManager.js';
import {Strings} from '../../core/lib/strings.js';

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

  // test setPrompt with default - command should be set to default value
  const testTextWithDefault = 'TestTest <default>';
  commandline.setPrompt(testTextWithDefault);
  expect(commandline.prompt).toBe(`${testTextWithDefault}:`);
  expect(commandline.command).toBe('default');
});

test('Test Commandline.parseCommandDefault', () => {
  const commandDefault = ['<default>'];
  const defaultValue = commandline.parseCommandDefault(commandDefault);
  expect(defaultValue).toBe(`default`);

  // only a single default is valid
  commandDefault.push('<second value>');
  expect(() => {
    commandline.parseCommandDefault(commandDefault);
  }).toThrow();
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

  core.scene.inputManager.initialiseItem('Line');
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


