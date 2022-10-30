
import {Core} from '../../core/core.js';
import {CommandManager} from '../../core/lib/commandManager.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();
const commandManager = new CommandManager(core);

test('Test CommandManager.createNew', () => {
  const startPoint = new Point();
  const endPoint = new Point(10, 10);
  const points = [startPoint, endPoint];

  const line = commandManager.createNew('Line', {points: points});
  expect(typeof line).toBe('object');

  const test = commandManager.createNew('test', {points: points});
  expect(typeof test).toBe('undefined');
});

test('Test CommandManager.isCommand', () => {
  expect(commandManager.isCommand('Line')).toBe(true);
  expect(commandManager.isCommand('Test')).toBe(false);
});

test('Test CommandManager.getCommandFromShortcut', () => {
  expect(commandManager.getCommandFromShortcut('L')).toBe('Line');
  expect(commandManager.getCommandFromShortcut('Test')).toBe('Test');
});

