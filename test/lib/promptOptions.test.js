import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Input, PromptOptions } from '../../core/lib/inputManager.js';
import { expect, jest } from '@jest/globals';

// Core must be initialised so that DesignCore.Core is available for
// PromptOptions.respond() to call Core.notify() on bad input.
const core = new Core();

// ─── Constructor ─────────────────────────────────────────────────────────────

test('constructor uses default values when no arguments are supplied', () => {
  const po = new PromptOptions();
  expect(po.promptMessage).toBe('error');
  expect(po.types).toEqual([]);
  expect(po.options).toEqual([]);
  expect(po.defaultValue).toBeUndefined();
  expect(po.resolve).toBeUndefined();
  expect(po.reject).toBeUndefined();
});

test('constructor stores all supplied arguments', () => {
  const types = [Input.Type.POINT, Input.Type.NUMBER];
  const options = ['One', 'Two', 'Three'];
  const po = new PromptOptions('Select a point', types, options, 42);
  expect(po.promptMessage).toBe('Select a point');
  expect(po.types).toBe(types);
  expect(po.options).toBe(options);
  expect(po.defaultValue).toBe(42);
});

test('constructor defaultValue is undefined when not provided', () => {
  const po = new PromptOptions('Enter value', [Input.Type.NUMBER]);
  expect(po.defaultValue).toBeUndefined();
});

// ─── acceptsInput ─────────────────────────────────────────────────────────────

test('acceptsInput returns true for exact matching type', () => {
  const po = new PromptOptions('', [Input.Type.POINT]);
  expect(po.acceptsInput(new Point(1, 2))).toBe(true);
  expect(po.acceptsInput('text')).toBe(false);
  expect(po.acceptsInput(42)).toBe(false);
});

test('acceptsInput returns true for DYNAMIC type with numeric input', () => {
  const po = new PromptOptions('', [Input.Type.DYNAMIC]);
  expect(po.acceptsInput(42)).toBe(true);
  expect(po.acceptsInput(3.14)).toBe(true);
  expect(po.acceptsInput('text')).toBe(false);
  expect(po.acceptsInput(new Point())).toBe(false);
});

test('acceptsInput returns true when any of multiple types matches', () => {
  const po = new PromptOptions('', [Input.Type.POINT, Input.Type.NUMBER]);
  expect(po.acceptsInput(new Point(1, 2))).toBe(true);
  expect(po.acceptsInput(42)).toBe(true);
  expect(po.acceptsInput('text')).toBe(false);
});

// ─── createPromise ────────────────────────────────────────────────────────────

test('createPromise returns a Promise and sets resolve and reject', async () => {
  const po = new PromptOptions('', [Input.Type.STRING]);
  const p = po.createPromise();
  expect(p).toBeInstanceOf(Promise);
  expect(typeof po.resolve).toBe('function');
  expect(typeof po.reject).toBe('function');
  po.resolve('done');
  await expect(p).resolves.toBe('done');
});

// ─── respond ─────────────────────────────────────────────────────────────────

test('respond returns true and resolves the promise when input matches accepted type', async () => {
  const po = new PromptOptions('Enter text', [Input.Type.STRING]);
  const p = po.createPromise();
  const result = po.respond('hello');
  expect(result).toBe(true);
  await expect(p).resolves.toBe('hello');
});

test('respond returns true and resolves the promise when input matches an option', async () => {
  const po = new PromptOptions('Choose', [Input.Type.POINT], ['Yes', 'No']);
  const p = po.createPromise();
  const result = po.respond('Y');
  expect(result).toBe(true);
  await expect(p).resolves.toBe('Yes');
});

test('respond returns false and calls Core.notify when input is invalid', () => {
  const notifySpy = jest.spyOn(core, 'notify').mockImplementation(() => {});
  const po = new PromptOptions('Enter point', [Input.Type.POINT]);
  po.createPromise();
  const result = po.respond('invalid string');
  expect(result).toBe(false);
  expect(notifySpy).toHaveBeenCalled();
  notifySpy.mockRestore();
  po.cancel();
});

// ─── parseInputToOption ───────────────────────────────────────────────────────

test('parseInputToOption returns undefined when no options are defined', () => {
  const po = new PromptOptions('Enter value', [Input.Type.STRING]);
  expect(po.parseInputToOption('A')).toBeUndefined();
  expect(po.parseInputToOption('X')).toBeUndefined();
});

test('parseInputToOption returns undefined for non-string input', () => {
  const po = new PromptOptions('Choose', [], ['Apple']);
  expect(po.parseInputToOption(42)).toBeUndefined();
  expect(po.parseInputToOption(new Point())).toBeUndefined();
});

test('parseInputToOption matches options by case-insensitive prefix', () => {
  const po = new PromptOptions('Select option', [Input.Type.STRING], ['Apple', 'Banana', 'Cherry']);
  expect(po.parseInputToOption('A')).toBe('Apple');
  expect(po.parseInputToOption('B')).toBe('Banana');
  expect(po.parseInputToOption('C')).toBe('Cherry');
  expect(po.parseInputToOption('a')).toBe('Apple');
  expect(po.parseInputToOption('Apple')).toBe('Apple');
});

test('parseInputToOption returns undefined when no option matches', () => {
  const po = new PromptOptions('Choose', [], ['Apple', 'Banana']);
  expect(po.parseInputToOption('X')).toBeUndefined();
});

// ─── cancel ──────────────────────────────────────────────────────────────────

test('cancel resolves the pending promise with undefined', async () => {
  const po = new PromptOptions('Enter point', [Input.Type.POINT]);
  const p = po.createPromise();
  po.cancel();
  await expect(p).resolves.toBeUndefined();
});

test('cancel is a no-op when no promise has been created', () => {
  const po = new PromptOptions('', [Input.Type.STRING]);
  expect(() => po.cancel()).not.toThrow();
});

// ─── getPrompt ────────────────────────────────────────────────────────────────

test('getPrompt returns bare message when no options or defaultValue are set', () => {
  const po = new PromptOptions('Enter value', [Input.Type.NUMBER]);
  expect(po.getPrompt()).toBe('Enter value');
});

test('getPrompt includes OR keyword and underscored shortcuts when options are set', () => {
  const po = new PromptOptions('Select', [Input.Type.STRING], ['Apple', 'Banana']);
  const prompt = po.getPrompt();
  expect(prompt).toContain('Select');
  expect(prompt).toContain('or');
  expect(prompt).toContain('A\u0332pple');
  expect(prompt).toContain('B\u0332anana');
});

test('getPrompt appends <defaultValue> when defaultValue is set', () => {
  const po = new PromptOptions('Enter distance', [Input.Type.NUMBER], [], 10);
  expect(po.getPrompt()).toBe('Enter distance <10>');
});

test('getPrompt appends <defaultValue> after the options bracket when both are set', () => {
  const po = new PromptOptions('Select', [Input.Type.STRING], ['Apple', 'Banana'], 'Apple');
  const prompt = po.getPrompt();
  expect(prompt).toContain('A\u0332pple');
  expect(prompt).toMatch(/<Apple>$/);
});

// ─── getOptionWithShortcut ────────────────────────────────────────────────────

test('getOptionWithShortcut underlines the first character of the option', () => {
  const po = new PromptOptions();
  expect(po.getOptionWithShortcut('input')).toBe('i\u0332nput');
  expect(po.getOptionWithShortcut('Through')).toBe('T\u0332hrough');
  expect(po.getOptionWithShortcut('A')).toBe('A\u0332');
});
