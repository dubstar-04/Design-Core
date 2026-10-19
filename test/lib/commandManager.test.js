
import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Circle } from '../../core/entities/circle.js';
import { Leader } from '../../core/dimensions/leader.js';
import { jest } from '@jest/globals';

const core = new Core();
const commandManager = core.commandManager;

test('Test CommandManager.createNew', () => {
  const startPoint = new Point();
  const endPoint = new Point(10, 10);
  const points = [startPoint, endPoint];

  const line = commandManager.createNew('Line', { points: points });
  expect(typeof line).toBe('object');

  const test = commandManager.createNew('test', { points: points });
  expect(typeof test).toBe('undefined');
});

test('reference linking leaves ordinary normalisation in createNew', () => {
  const fromDxf = jest.spyOn(Circle, 'fromDxf');
  try {
    const data = { 0: 'CIRCLE', 40: 5, points: [new Point(2, 3)] };
    const linked = commandManager.resolveDxfReferences('Circle', data, {});
    expect(linked).toBe(data);
    expect(fromDxf).not.toHaveBeenCalled();

    const circle = commandManager.createNew('Circle', linked);
    expect(circle).toBeInstanceOf(Circle);
    expect(circle.getRadius()).toBe(5);
    expect(fromDxf).toHaveBeenCalledTimes(1);
  } finally {
    fromDxf.mockRestore();
  }
});

test('reference linking dispatches to an optional entity-specific hook', () => {
  const text = { 0: 'TEXT', 5: 'AA', 1: 'Note' };
  const context = { resolve: jest.fn(() => text), consume: jest.fn() };
  const hook = jest.spyOn(Leader, 'resolveDxfReferences');
  try {
    const data = { 0: 'LEADER', 340: 'AA' };
    const linked = commandManager.resolveDxfReferences('Leader', data, context);
    expect(hook).toHaveBeenCalledWith(data, context);
    expect(linked.annotation).toBe('Note');
    expect(context.consume).toHaveBeenCalledWith(text);
  } finally {
    hook.mockRestore();
  }
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
