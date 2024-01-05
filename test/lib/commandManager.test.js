
import {Core} from '../../core/core/core.js';
import {CommandManager} from '../../core/lib/commandManager.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();
const commandManager = new CommandManager();

test('Test CommandManager.createNew', () => {
  const startPoint = new Point();
  const endPoint = new Point(10, 10);
  const points = [startPoint, endPoint];

  const line = commandManager.createNew('Line', {points: points});
  expect(typeof line).toBe('object');

  const test = commandManager.createNew('test', {points: points});
  expect(typeof test).toBe('undefined');
});

test('Test CommandManager.isCommandOrShortcut', () => {
  expect(commandManager.isCommandOrShortcut('Line')).toBe(true);
  expect(commandManager.isCommandOrShortcut('L')).toBe(true);
  expect(commandManager.isCommandOrShortcut('l')).toBe(true);
  expect(commandManager.isCommandOrShortcut('li')).toBe(false);
  expect(commandManager.isCommandOrShortcut('Test')).toBe(false);
});

test('Test CommandManager.isCommand', () => {
  expect(commandManager.isCommand('Line')).toBe(true);
  expect(commandManager.isCommand('Test')).toBe(false);
});

test('Test CommandManager.isShortcut', () => {
  expect(commandManager.isShortcut('L')).toBe(true);
  expect(commandManager.isShortcut('li')).toBe(false);
});

test('Test CommandManager.getCommand', () => {
  expect(commandManager.getCommand('L')).toBe('Line');
  expect(commandManager.getCommand('line')).toBe('Line');
  expect(commandManager.getCommand('C')).toBe('Circle');
  expect(commandManager.getCommand('Test')).toBeUndefined();
});

test('Test CommandManager.getShortcut', () => {
  expect(commandManager.getShortcut('Line')).toBe('L');
  expect(commandManager.getShortcut('line')).toBe('L');
  expect(commandManager.getShortcut('Circle')).toBe('C');
  expect(commandManager.getShortcut('Test')).toBeUndefined();
});

test('Test CommandManager.getFuzzyMatch', () => {
  expect(commandManager.getFuzzyMatch('li')).toBe('Line');
  expect(commandManager.getFuzzyMatch('ci')).toBe('Circle');
});

