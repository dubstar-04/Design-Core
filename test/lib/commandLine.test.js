import {Core} from '../../core/core.js';

const core = new Core();
const commandline = core.commandLine; // new CommandLine(core);

test('Test Commandline.resetPrompt', () => {
  commandline.handleKeys('L');
  expect(commandline.command).not.toBe('');
  commandline.resetPrompt();
  expect(commandline.command).toBe('');
});

test('Test Commandline.setPrompt', () => {
  const testText = 'TestTest';
  commandline.setPrompt(testText);
  expect(commandline.prompt).toBe(testText);
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

test('Test CommandLine.backPressed', () => {
  commandline.handleKeys('1234');
  expect(commandline.command).toBe('1234');
  commandline.backPressed();
  expect(commandline.command).toBe('123');
  commandline.resetPrompt();
});

test('Test CommandLine.enterPressed', () => {
  commandline.handleKeys('L');
  commandline.enterPressed();
  expect(commandline.lastCommand.length).toBe(1);
  commandline.resetPrompt();
  commandline.lastCommand = [];
});

test('Test CommandLine.addToCommandHistory', () => {
  commandline.addToCommandHistory('Test');
  /* commandline should only store unique values */
  commandline.addToCommandHistory('Test');
  expect(commandline.lastCommand.length).toBe(1);

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


