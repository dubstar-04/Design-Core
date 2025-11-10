
import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { PromptOptions } from '../../core/lib/inputManager.js';
import { Input } from '../../core/lib/inputManager.js';
import { MouseStateChange } from '../../core/lib/inputManager.js';

const core = new Core();
const inputManager = core.scene.inputManager;

test('Test MouseStateChange class is available and integrable with PromptOptions', () => {
  // create mouse state change instance
  const point = new Point(10, 20);
  const mouseStateChange = new MouseStateChange(point);
  expect(mouseStateChange.point.x).toBe(10);
  expect(mouseStateChange.point.y).toBe(20);

  // Class should be exported
  expect(MouseStateChange).toBeDefined();

  // Input type constant should exist
  expect(Input.Type.MOUSESTATECHANGE).toBeDefined();

  // PromptOptions should accept the MouseStateChange input type
  const po = new PromptOptions('', [Input.Type.MOUSESTATECHANGE]);
  expect(po.types).toContain(Input.Type.MOUSESTATECHANGE);
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
  // Reset input manager
  inputManager.reset();

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

  // Reset for cleanup
  inputManager.reset();
});

test('Test tool switching - click rectangle then circle', () => {
  // Reset input manager
  inputManager.reset();

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

  // Reset for cleanup
  inputManager.reset();
});

test('Test tool switching with invalid command', () => {
  // Reset input manager
  inputManager.reset();

  // Start with circle tool
  inputManager.onCommand('C');
  expect(inputManager.activeCommand.constructor.name).toBe('Circle');

  // Try to switch to invalid command - should not change active command
  const originalCommand = inputManager.activeCommand;
  inputManager.onCommand('INVALID');
  expect(inputManager.activeCommand).toBe(originalCommand);

  // Reset for cleanup
  inputManager.reset();
});
