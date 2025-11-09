
import { Core } from '../../core/core/core.js';
import { PromptOptions } from '../../core/lib/inputManager.js';
import { Input } from '../../core/lib/inputManager.js';
import { Strings } from '../../core/lib/strings.js';

const core = new Core();
const inputManager = core.scene.inputManager;
const notifications = [];

beforeEach(() => {
  notifications.length = 0;
  core.setExternalNotifyCallbackFunction((message) => notifications.push(message));
  inputManager.reset();
});

afterEach(() => {
  core.setExternalNotifyCallbackFunction(undefined);
  inputManager.reset();
});

test('Test PromptOptions.getOptionWithShortcut', () => {
  const po = new PromptOptions();
  expect(po.getOptionWithShortcut('input')).toBe('i\u0332nput');
});

test('Test Input.getType', () => {
  expect(Input.getType(100)).toBe('Number');
  expect(Input.getType('text')).toBe('String');
});

test('Test tool switching - click circle then rectangle', () => {
  // Initially no active command
  expect(inputManager.activeCommand).toBeUndefined();

  // Click circle tool (shortcut 'C')
  inputManager.onCommand('C');
  expect(inputManager.activeCommand).not.toBeUndefined();
  expect(inputManager.activeCommand.constructor.name).toBe('Circle');

  // Click rectangle tool (shortcut 'REC') - should switch tools
  inputManager.onCommand('REC');
  expect(inputManager.activeCommand).not.toBeUndefined();
  expect(inputManager.activeCommand.constructor.name).toBe('Rectangle');
});

test('Test tool switching - click rectangle then circle', () => {
  // Initially no active command
  expect(inputManager.activeCommand).toBeUndefined();

  // Click rectangle tool (shortcut 'REC')
  inputManager.onCommand('REC');
  expect(inputManager.activeCommand).not.toBeUndefined();
  expect(inputManager.activeCommand.constructor.name).toBe('Rectangle');

  // Click circle tool (shortcut 'C') - should switch tools
  inputManager.onCommand('C');
  expect(inputManager.activeCommand).not.toBeUndefined();
  expect(inputManager.activeCommand.constructor.name).toBe('Circle');
});

test('Test tool switching with invalid command', () => {
  // Start with circle tool
  inputManager.onCommand('C');
  expect(inputManager.activeCommand.constructor.name).toBe('Circle');

  // Try to switch to invalid command - should not change active command
  const originalCommand = inputManager.activeCommand;
  inputManager.onCommand('INVALID');
  expect(inputManager.activeCommand).toBe(originalCommand);
});

test('Notifies when invalid command entered at command line with no active command', () => {
  inputManager.onCommand('INVALID');
  expect(notifications).toContain(`${Strings.Message.UNKNOWNCOMMAND}: INVALID`);
});

test('Notifies when invalid command entered at command line during active command', () => {
  inputManager.onCommand('C');
  expect(inputManager.activeCommand.constructor.name).toBe('Circle');

  inputManager.onCommand('INVALID');
  expect(notifications).toContain(`${Strings.Message.UNKNOWNCOMMAND}: INVALID`);
});
