
import { Core } from '../../core/core/core.js';
// import { DesignCore } from '../../core/designCore.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';
import { PromptOptions } from '../../core/lib/inputManager.js';
import { Input } from '../../core/lib/inputManager.js';
import { MouseStateChange } from '../../core/lib/inputManager.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
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

test('Test PromptOptions creation with various parameters', () => {
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

// ─── Input ────────────────────────────────────────────────────────────────────

test('Input.getType(undefined) returns undefined', () => {
  expect(Input.getType(undefined)).toBeUndefined();
});

test('Input.getType returns DYNAMIC when promptOption includes DYNAMIC and value is a number', () => {
  const po = new PromptOptions('Enter distance', [Input.Type.DYNAMIC]);
  inputManager.requestInput(po);
  expect(Input.getType(42)).toBe(Input.Type.DYNAMIC);
  po.cancel();
  inputManager.reset();
});

// ─── PromptOptions ────────────────────────────────────────────────────────────

test('PromptOptions.cancel resolves the pending promise with undefined', async () => {
  const po = new PromptOptions('Enter a point', [Input.Type.POINT]);
  const p = inputManager.requestInput(po);
  po.cancel();
  await expect(p).resolves.toBeUndefined();
  inputManager.reset();
});

test('PromptOptions.getPrompt without options returns the bare prompt message', () => {
  const po = new PromptOptions('Enter value', [Input.Type.NUMBER]);
  expect(po.getPrompt()).toBe('Enter value');
});

test('PromptOptions.getPrompt with options includes OR keyword and underscored shortcuts', () => {
  const po = new PromptOptions('Select', [Input.Type.STRING], ['Apple', 'Banana']);
  const prompt = po.getPrompt();
  expect(prompt).toContain('Select');
  expect(prompt).toContain('or');
  expect(prompt).toContain('A\u0332pple');
  expect(prompt).toContain('B\u0332anana');
});

// ─── onEnterPressed ───────────────────────────────────────────────────────────

test('onEnterPressed with no activeCommand and empty lastCommand - does nothing', () => {
  inputManager.reset();
  core.commandLine.lastCommand = [];
  expect(() => inputManager.onEnterPressed()).not.toThrow();
  expect(inputManager.activeCommand).toBeUndefined();
});

test('onEnterPressed with no activeCommand and lastCommand history - repeats last command', () => {
  inputManager.reset();
  core.commandLine.lastCommand = ['Line'];
  inputManager.onEnterPressed();
  expect(inputManager.activeCommand).toBeDefined();
  expect(inputManager.activeCommand.constructor.name).toBe('Line');
  inputManager.reset();
});

test('onEnterPressed with activeCommand but no promptOption - resets', () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  inputManager.promptOption = undefined;
  inputManager.onEnterPressed();
  expect(inputManager.activeCommand).toBeUndefined();
});

test('onEnterPressed with SELECTIONSET prompt and unaccepted selectionSet - accepts and responds', async () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('Select entities', [Input.Type.SELECTIONSET]);
  const p = inputManager.requestInput(po);
  core.scene.selectionManager.selectionSet.accepted = false;
  inputManager.onEnterPressed();
  const result = await p;
  expect(result).toBeDefined();
  inputManager.reset();
});

// ─── onEscapePressed ──────────────────────────────────────────────────────────

test('onEscapePressed resets the input manager', () => {
  inputManager.onCommand('Line');
  expect(inputManager.activeCommand).toBeDefined();
  inputManager.onEscapePressed();
  expect(inputManager.activeCommand).toBeUndefined();
  expect(inputManager.promptOption).toBeUndefined();
});

// ─── onLeftClick ──────────────────────────────────────────────────────────────

test('onLeftClick with POINT prompt and no nearby entity - responds with the given point', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  expect(inputManager.promptOption.types).toContain(Input.Type.POINT);
  const respondSpy = jest.spyOn(inputManager.promptOption, 'respond');
  const point = new Point(5, 5);
  inputManager.onLeftClick(point);
  expect(respondSpy).toHaveBeenCalledWith(point);
  respondSpy.mockRestore();
  inputManager.reset();
});

test('onLeftClick with entity found and no active command - delegates to onSelection', () => {
  inputManager.reset();
  const mockSelection = { selectedItemIndex: 0 };
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  jest.spyOn(core.scene.selectionManager, 'singleSelect').mockReturnValue(mockSelection);
  const onSelectionSpy = jest.spyOn(inputManager, 'onSelection').mockImplementation(() => {});
  inputManager.onLeftClick(new Point(0, 0));
  expect(onSelectionSpy).toHaveBeenCalledWith(mockSelection);
  jest.restoreAllMocks();
});

// ─── onSelection ──────────────────────────────────────────────────────────────

test('onSelection with SINGLESELECTION prompt - resolves promptOption with the selection', async () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('Select entity', [Input.Type.SINGLESELECTION]);
  const p = inputManager.requestInput(po);
  const selection = new SingleSelection(0, new Point(0, 0));
  inputManager.onSelection(selection);
  await expect(p).resolves.toBe(selection);
  inputManager.reset();
});

test('onSelection without active command - adds item index to selection set', () => {
  inputManager.reset();
  const addToSelectionSetSpy = jest.spyOn(core.scene.selectionManager, 'addToSelectionSet').mockImplementation(() => {});
  const selection = new SingleSelection(7, new Point(0, 0));
  inputManager.onSelection(selection);
  expect(addToSelectionSetSpy).toHaveBeenCalledWith(7);
  addToSelectionSetSpy.mockRestore();
});

// ─── mouseDown ────────────────────────────────────────────────────────────────

test('mouseDown case 0 calls singleSelect', () => {
  const singleSelectSpy = jest.spyOn(inputManager, 'singleSelect').mockImplementation(() => {});
  inputManager.mouseDown(0);
  expect(singleSelectSpy).toHaveBeenCalled();
  singleSelectSpy.mockRestore();
});

test('mouseDown case 0 with MOUSESTATECHANGE prompt - responds with a MouseStateChange', async () => {
  const po = new PromptOptions('', [Input.Type.MOUSESTATECHANGE]);
  const p = inputManager.requestInput(po);
  inputManager.mouseDown(0);
  const result = await p;
  expect(result).toBeInstanceOf(MouseStateChange);
  inputManager.reset();
});

// ─── mouseUp ──────────────────────────────────────────────────────────────────

test('mouseUp case 2 triggers onEnterPressed and resets active command', () => {
  inputManager.onCommand('Line');
  expect(inputManager.activeCommand).toBeDefined();
  inputManager.mouseUp(2);
  expect(inputManager.activeCommand).toBeUndefined();
});

test('mouseUp case 0 with MOUSESTATECHANGE prompt - responds with a MouseStateChange', async () => {
  const po = new PromptOptions('', [Input.Type.MOUSESTATECHANGE]);
  const p = inputManager.requestInput(po);
  inputManager.mouseUp(0);
  const result = await p;
  expect(result).toBeInstanceOf(MouseStateChange);
  inputManager.reset();
});

test('mouseUp case 0 without SELECTIONSET - returns early without calling windowSelect', () => {
  inputManager.reset();
  const windowSelectSpy = jest.spyOn(inputManager, 'windowSelect').mockImplementation(() => {});
  const po = new PromptOptions('Enter point', [Input.Type.POINT]);
  inputManager.requestInput(po);
  inputManager.mouseUp(0);
  expect(windowSelectSpy).not.toHaveBeenCalled();
  windowSelectSpy.mockRestore();
  inputManager.reset();
});

test('mouseUp case 0 with SELECTIONSET and mouse moved - calls windowSelect', () => {
  inputManager.reset();
  const windowSelectSpy = jest.spyOn(inputManager, 'windowSelect').mockImplementation(() => {});
  const po = new PromptOptions('', [Input.Type.SELECTIONSET]);
  inputManager.requestInput(po);
  core.mouse.mouseDownCanvasPoint = new Point(0, 0);
  core.mouse.x = 100;
  core.mouse.y = 100;
  inputManager.mouseUp(0);
  expect(windowSelectSpy).toHaveBeenCalled();
  windowSelectSpy.mockRestore();
  core.mouse.x = 0;
  core.mouse.y = 0;
  inputManager.reset();
});

// ─── windowSelect ─────────────────────────────────────────────────────────────

test('windowSelect delegates to selectionManager.windowSelect', () => {
  const spy = jest.spyOn(core.scene.selectionManager, 'windowSelect').mockImplementation(() => {});
  inputManager.windowSelect();
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

// ─── singleSelect ─────────────────────────────────────────────────────────────

test('singleSelect calls onLeftClick with the current mouse scene position', () => {
  const onLeftClickSpy = jest.spyOn(inputManager, 'onLeftClick').mockImplementation(() => {});
  core.mouse.x = 10;
  core.mouse.y = 20;
  inputManager.singleSelect();
  expect(onLeftClickSpy).toHaveBeenCalled();
  expect(onLeftClickSpy.mock.calls[0][0]).toBeInstanceOf(Point);
  onLeftClickSpy.mockRestore();
});

// ─── setPrompt ────────────────────────────────────────────────────────────────

test('setPrompt with no active command - returns without error', () => {
  inputManager.reset();
  expect(() => inputManager.setPrompt('anything')).not.toThrow();
});

test('setPrompt with an active command - sends formatted prompt to commandLine', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const setPromptSpy = jest.spyOn(core.commandLine, 'setPrompt');
  inputManager.setPrompt('Pick start point');
  expect(setPromptSpy).toHaveBeenCalledWith('Line- Pick start point');
  setPromptSpy.mockRestore();
  inputManager.reset();
});

// ─── actionCommand / executeCommand ───────────────────────────────────────────

test('actionCommand with a Tool as activeCommand - calls its action method', () => {
  inputManager.reset();
  inputManager.onCommand('Rotate');
  expect(inputManager.activeCommand).toBeDefined();
  const actionSpy = jest.spyOn(inputManager.activeCommand, 'action').mockImplementation(() => {});
  inputManager.actionCommand();
  expect(actionSpy).toHaveBeenCalled();
  actionSpy.mockRestore();
  inputManager.reset();
});

test('executeCommand with an entity item - adds item to scene then resets', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const addItemSpy = jest.spyOn(core.scene, 'addItem').mockReturnValue(1);
  const line = new Line();
  inputManager.executeCommand(line);
  expect(addItemSpy).toHaveBeenCalled();
  expect(inputManager.activeCommand).toBeUndefined();
  addItemSpy.mockRestore();
});
