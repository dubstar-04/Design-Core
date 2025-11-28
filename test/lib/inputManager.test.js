
import { Core } from '../../core/core/core.js';
// import { DesignCore } from '../../core/designCore.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';
import { PromptOptions } from '../../core/lib/inputManager.js';
import { Input } from '../../core/lib/inputManager.js';
import { MouseStateChange } from '../../core/lib/inputManager.js';
import { expect, jest } from '@jest/globals';

const core = new Core();
const inputManager = core.scene.inputManager;

test('Test MouseStateChange class is available and integrable with PromptOptions', async () => {
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

  const p = inputManager.requestInput(po);

  // simulate a mouse state change
  const ms = new MouseStateChange(new Point(10, 20));
  po.respond(ms);

  await expect(p).resolves.toBeInstanceOf(MouseStateChange);
  await expect(p).resolves.toHaveProperty('point');
});


test('requestInput resolves when PromptOptions.respond is called', async () => {
  const po = new PromptOptions('Enter text', [Input.Type.STRING]);
  const p = inputManager.requestInput(po);

  // resolve via PromptOptions.respond
  po.respond('hello');

  await expect(p).resolves.toBe('hello');
});

test('snapping is activated for POINT prompt and deactivated after respond', async () => {
  const po = new PromptOptions('Pick a point', [Input.Type.POINT]);
  const p = inputManager.requestInput(po);

  // snapping should be active while awaiting a POINT
  expect(inputManager.snapping.active).toBeTruthy();

  // respond with a point to resolve the promise
  po.respond(new Point(1, 2));

  await p;

  // reset input manager for cleanup
  inputManager.reset();

  // snapping should be turned off after input is processed
  expect(inputManager.snapping.active).toBeFalsy();
});

test('reset clears activeCommand, promptOption and deactivates snapping', () => {
  inputManager.activeCommand = new Line();
  inputManager.promptOption = new PromptOptions('Test Prompt', [Input.Type.POINT]);
  inputManager.snapping.active = true;

  expect(inputManager.activeCommand).toBeDefined();
  expect(inputManager.promptOption).toBeDefined();
  expect(inputManager.snapping.active).toBeTruthy();

  inputManager.reset();

  expect(inputManager.activeCommand).toBeUndefined();
  expect(inputManager.promptOption).toBeUndefined();
  expect(inputManager.snapping.active).toBeFalsy();
});

test('mouseMoved draws selection window when mouse button one is down and no promptOption', () => {
  // ensure no active promptOption
  inputManager.promptOption = undefined;

  // spy on selectionManager.drawSelectionWindow
  const spy = jest.spyOn(core.scene.selectionManager, 'drawSelectionWindow').mockImplementation(() => {});

  // simulate mouse down state
  core.scene.inputManager.mouseDownCanvasPoint = new Point(0, 0);
  core.mouse.buttonOneDown = true;

  inputManager.mouseMoved();

  expect(spy).toHaveBeenCalled();

  spy.mockRestore();
  core.mouse.buttonOneDown = false;
});

test( 'Test PromptOptions creation with various parameters', () => {
  const promptMessage = 'Select a point';
  const types = [Input.Type.POINT, Input.Type.NUMBER];
  const options = ['One', 'Two', 'Three'];

  const po = new PromptOptions(promptMessage, types, options);

  expect(po.promptMessage).toBe(promptMessage);
  expect(po.types).toBe(types);
  expect(po.options).toBe(options);
});

test('test onCommand with no activeCommand or promptOption', async () => {
  // Test Unknown Command
  inputManager.reset();
  inputManager.onCommand('TEST_COMMAND');
  // No activeCommand or promptOption should remain undefined
  expect(inputManager.activeCommand).toBeUndefined();
  expect(inputManager.promptOption).toBeUndefined();

  // Test Known Entity Command
  inputManager.reset();
  inputManager.onCommand('Line');
  // No activeCommand or promptOption should remain undefined
  expect(inputManager.activeCommand).toBeDefined();
  expect(inputManager.promptOption).toBeDefined();

  // Test Known Tool Command
  inputManager.reset();
  inputManager.onCommand('Rotate');
  // No activeCommand or promptOption should remain undefined
  expect(inputManager.activeCommand).toBeDefined();
  expect(inputManager.promptOption).toBeDefined();

  const po = new PromptOptions('Point or Number', [Input.Type.POINT, Input.Type.NUMBER], ['One', 'Two', 'Three']);

  const numericalInput = core.scene.inputManager.requestInput(po);
  expect(inputManager.promptOption).toBe(po);
  inputManager.onCommand(42); // numerical input
  await expect(numericalInput).resolves.toBe(42);

  const pointInput = core.scene.inputManager.requestInput(po);
  const point = new Point(5, 10);
  inputManager.onCommand(point); // point input
  await expect(pointInput).resolves.toBe(point);

  const optionInputOne = core.scene.inputManager.requestInput(po);
  inputManager.onCommand('O'); // option input
  await expect(optionInputOne).resolves.toBe('One');

  const optionInputTwo = core.scene.inputManager.requestInput(po);
  inputManager.onCommand('T'); // option input
  await expect(optionInputTwo).resolves.toBe('Two');

  const optionInputThree = core.scene.inputManager.requestInput(po);
  inputManager.onCommand('Th'); // option input
  await expect(optionInputThree).resolves.toBe('Three');

  const stringInput = core.scene.inputManager.requestInput(po);
  inputManager.onCommand('Some String'); // string input
  inputManager.onCommand('Another String'); // string input
  inputManager.onCommand(123); // numerical input to finally resolve
  await expect(stringInput).resolves.toBe(123);
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

test('parse input to option with shortcut', () => {
  let po = new PromptOptions('Select option', [Input.Type.STRING], ['Apple', 'Banana', 'Cherry']);
  expect(po.parseInputToOption('A')).toBe('Apple');
  expect(po.parseInputToOption('B')).toBe('Banana');
  expect(po.parseInputToOption('C')).toBe('Cherry');
  expect(po.parseInputToOption('X')).toBeUndefined();
  expect(po.parseInputToOption(42)).toBeUndefined();
  expect(po.parseInputToOption(new Point())).toBeUndefined();

  po = new PromptOptions('Select without options', [Input.Type.STRING]);
  expect(po.parseInputToOption('A')).toBeUndefined();
  expect(po.parseInputToOption('X')).toBeUndefined();
  expect(po.parseInputToOption(42)).toBeUndefined();
  expect(po.parseInputToOption(new Point())).toBeUndefined();
});
