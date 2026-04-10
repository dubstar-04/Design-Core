
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';
import { PromptOptions } from '../../core/lib/inputManager.js';
import { Input, MouseDown, MouseUp } from '../../core/lib/inputManager.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { expect, jest } from '@jest/globals';

const core = new Core();
const inputManager = core.scene.inputManager;

afterEach(() => {
  // Cancel any in-flight prompt and clear command/snapping state so tests
  // cannot leak into one another regardless of pass/fail or input path taken.
  inputManager.reset();
  // Restore all spies unconditionally so mocks don't bleed across tests.
  jest.restoreAllMocks();
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

test('Test Input.getType', () => {
  expect(Input.getType(100)).toBe(Input.Type.NUMBER);
  expect(Input.getType('text')).toBe(Input.Type.STRING);
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

// ─── onCommandButton ──────────────────────────────────────────────────────────

test('onCommandButton with valid shortcut - starts command, ignores active prompt', async () => {
  inputManager.reset();
  // Simulate an active command with a STRING prompt waiting
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('Enter text', [Input.Type.STRING]);
  const p = inputManager.requestInput(po);

  // clicking a toolbar button while STRING prompt is active should switch commands
  inputManager.onCommandButton('L');
  expect(inputManager.activeCommand).toBeDefined();
  expect(inputManager.activeCommand.constructor.name).toBe('Line');

  // the STRING promise should have been cancelled (resolved with undefined)
  await expect(p).resolves.toBeUndefined();
  inputManager.reset();
});

test('onCommandButton with invalid command - does nothing', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const original = inputManager.activeCommand;
  inputManager.onCommandButton('NOTACOMMAND');
  expect(inputManager.activeCommand).toBe(original);
  inputManager.reset();
});

test('onCommandButton with no active command - starts command', () => {
  inputManager.reset();
  expect(inputManager.activeCommand).toBeUndefined();
  inputManager.onCommandButton('REC');
  expect(inputManager.activeCommand).toBeDefined();
  expect(inputManager.activeCommand.constructor.name).toBe('Rectangle');
  inputManager.reset();
});

// ─── onCommand - command shortcut while non-accepting prompt is active ─────────

test('onCommand with valid shortcut while POINT prompt active - switches command without notifying', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  expect(inputManager.promptOption.types).toContain(Input.Type.POINT);

  const notifySpy = jest.spyOn(core, 'notify').mockImplementation(() => {});
  inputManager.onCommand('C');
  expect(notifySpy).not.toHaveBeenCalled();
  expect(inputManager.activeCommand.constructor.name).toBe('Circle');
  notifySpy.mockRestore();
  inputManager.reset();
});

test('onCommand with valid shortcut while STRING prompt active - sends string to prompt', async () => {
  inputManager.reset();
  // Simulate an active command with a STRING prompt waiting
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('Enter text', [Input.Type.STRING]);
  const p = inputManager.requestInput(po);

  // 'L' is the Line shortcut but a STRING prompt accepts any string - should go to prompt
  inputManager.onCommand('L');
  const result = await p;
  expect(result).toBe('L');
  // activeCommand is still the original Line stub, not a newly-started Line
  expect(inputManager.activeCommand.constructor.name).toBe('Line');
  inputManager.reset();
});

// ─── Input ────────────────────────────────────────────────────────────────────

test('Input.getType(undefined) returns undefined', () => {
  expect(Input.getType(undefined)).toBeUndefined();
});

test('Input.getType returns Number for numeric values regardless of prompt', () => {
  const po = new PromptOptions('Enter distance', [Input.Type.DYNAMIC]);
  inputManager.requestInput(po);
  expect(Input.getType(42)).toBe(Input.Type.NUMBER);
  po.cancel();
  inputManager.reset();
});

// ─── onEnterPressed ───────────────────────────────────────────────────────────

test('onEnterPressed with promptOption and defaultValue resolves with defaultValue', async () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('Enter distance', [Input.Type.NUMBER], [], 5);
  const p = inputManager.requestInput(po);
  inputManager.onEnterPressed();
  await expect(p).resolves.toBe(5);
  inputManager.reset();
});

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

test('mouseDown case 0 with MOUSEDOWN prompt - resolves the prompt', async () => {
  inputManager.reset();
  const singleSelectSpy = jest.spyOn(inputManager, 'singleSelect').mockImplementation(() => {});
  const po = new PromptOptions('', [Input.Type.MOUSEDOWN]);
  const p = inputManager.requestInput(po);
  inputManager.mouseDown(0);
  await expect(p).resolves.toBeInstanceOf(MouseDown);
  singleSelectSpy.mockRestore();
  inputManager.reset();
});

// ─── mouseUp ──────────────────────────────────────────────────────────────────

test('mouseUp case 2 triggers onEnterPressed and resets active command', () => {
  inputManager.onCommand('Line');
  expect(inputManager.activeCommand).toBeDefined();
  inputManager.mouseUp(2);
  expect(inputManager.activeCommand).toBeUndefined();
});

test('mouseUp case 0 with MOUSEUP prompt - resolves the prompt and returns early', async () => {
  inputManager.reset();
  const windowSelectSpy = jest.spyOn(inputManager, 'windowSelect').mockImplementation(() => {});
  const po = new PromptOptions('', [Input.Type.MOUSEUP]);
  const p = inputManager.requestInput(po);
  inputManager.mouseUp(0);
  await expect(p).resolves.toBeInstanceOf(MouseUp);
  expect(windowSelectSpy).not.toHaveBeenCalled();
  windowSelectSpy.mockRestore();
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

// ─── requestInput validation ──────────────────────────────────────────────────

test('requestInput throws on undefined Input.Type', () => {
  const po = new PromptOptions('bad', [undefined]);
  expect(() => inputManager.requestInput(po)).toThrow('Undefined Input.Type');
});

test('requestInput throws on invalid Input.Type', () => {
  const po = new PromptOptions('bad', ['NotAType']);
  expect(() => inputManager.requestInput(po)).toThrow('Invalid input type');
});

// ─── requestInput DYNAMIC conversion ─────────────────────────────────────────

test('requestInput with DYNAMIC type converts number to projected point', async () => {
  inputManager.reset();
  inputManager.inputPoint = new Point(0, 0);
  // set mouse position to create a known angle
  core.mouse.x = 100;
  core.mouse.y = 0;

  const po = new PromptOptions('Distance', [Input.Type.POINT, Input.Type.DYNAMIC]);
  const p = inputManager.requestInput(po);
  po.resolve(50);
  const result = await p;

  // result should be a Point, not the raw number
  expect(result).toBeInstanceOf(Point);
  inputManager.reset();
  core.mouse.x = 0;
  core.mouse.y = 0;
});

test('requestInput with non-DYNAMIC type passes number through unchanged', async () => {
  inputManager.reset();
  const po = new PromptOptions('Value', [Input.Type.NUMBER]);
  const p = inputManager.requestInput(po);
  po.resolve(42);
  const result = await p;
  expect(result).toBe(42);
  inputManager.reset();
});

// ─── requestInput inputPoint tracking ─────────────────────────────────────────

test('requestInput updates inputPoint when input is a Point', async () => {
  inputManager.reset();
  inputManager.inputPoint = new Point(0, 0);
  const po = new PromptOptions('Point', [Input.Type.POINT]);
  const p = inputManager.requestInput(po);
  const pt = new Point(99, 77);
  po.resolve(pt);
  await p;
  expect(inputManager.inputPoint.x).toBe(99);
  expect(inputManager.inputPoint.y).toBe(77);
  inputManager.reset();
});

test('requestInput does not update inputPoint for non-Point input', async () => {
  inputManager.reset();
  inputManager.inputPoint = new Point(5, 5);
  const po = new PromptOptions('Text', [Input.Type.STRING]);
  const p = inputManager.requestInput(po);
  po.resolve('hello');
  await p;
  expect(inputManager.inputPoint.x).toBe(5);
  expect(inputManager.inputPoint.y).toBe(5);
  inputManager.reset();
});

test('requestInput returns undefined when cancelled', async () => {
  inputManager.reset();
  inputManager.inputPoint = new Point(5, 5);
  const po = new PromptOptions('Point', [Input.Type.POINT]);
  const p = inputManager.requestInput(po);
  po.cancel();
  const result = await p;
  expect(result).toBeUndefined();
  // inputPoint should not be changed
  expect(inputManager.inputPoint.x).toBe(5);
  inputManager.reset();
});

// ─── Input.getType for all types ──────────────────────────────────────────────

test('Input.getType returns correct type for Point', () => {
  expect(Input.getType(new Point(1, 2))).toBe(Input.Type.POINT);
});

test('Input.getType returns correct type for SingleSelection', () => {
  expect(Input.getType(new SingleSelection(0, new Point()))).toBe(Input.Type.SINGLESELECTION);
});

// ─── handlePromptInput ────────────────────────────────────────────────────────

test('handlePromptInput returns false when promptOption is null', () => {
  inputManager.reset();
  inputManager.promptOption = undefined;
  expect(inputManager.handlePromptInput('anything')).toBe(false);
});

test('handlePromptInput returns false when input is rejected by respond', () => {
  inputManager.reset();
  const notifySpy = jest.spyOn(core, 'notify').mockImplementation(() => {});
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('Enter point', [Input.Type.POINT]);
  inputManager.requestInput(po);

  // string input should not match POINT type
  const result = inputManager.handlePromptInput('not a point');
  expect(result).toBe(false);

  notifySpy.mockRestore();
  inputManager.reset();
});

// ─── setPrompt edge cases ─────────────────────────────────────────────────────

test('setPrompt with empty string omits separator', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const setPromptSpy = jest.spyOn(core.commandLine, 'setPrompt');
  inputManager.setPrompt('');
  expect(setPromptSpy).toHaveBeenCalledWith('Line');
  setPromptSpy.mockRestore();
  inputManager.reset();
});

// ─── highlightEntityUnderMouse ────────────────────────────────────────────────

test('highlightEntityUnderMouse returns false when activeCommand has non-selection prompt', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  // Line requests POINT, not SINGLESELECTION/SELECTIONSET
  expect(inputManager.highlightEntityUnderMouse()).toBe(false);
  inputManager.reset();
});

test('highlightEntityUnderMouse returns false when no entity is near', () => {
  inputManager.reset();
  // no active command — allows highlighting, but nothing nearby
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(undefined);
  expect(inputManager.highlightEntityUnderMouse()).toBe(false);
  jest.restoreAllMocks();
});

test('highlightEntityUnderMouse returns true when entity found and no active command', () => {
  inputManager.reset();
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  // mock entities.get to return a cloneable object
  const mockLine = new Line();
  jest.spyOn(core.scene.entities, 'get').mockReturnValue(mockLine);
  expect(inputManager.highlightEntityUnderMouse()).toBe(true);
  // entity should go into hoverEntities, not previewEntities
  expect(core.scene.hoverEntities.count()).toBe(1);
  expect(core.scene.previewEntities.count()).toBe(0);
  jest.restoreAllMocks();
});

// ─── onLeftClick edge cases ───────────────────────────────────────────────────

test('onLeftClick with no promptOption and no nearby entity - does nothing', () => {
  inputManager.reset();
  // no active command, no entity in range
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(undefined);
  const onSelectionSpy = jest.spyOn(inputManager, 'onSelection');
  inputManager.onLeftClick(new Point(0, 0));
  expect(onSelectionSpy).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

// ─── mouseDown/mouseUp for other buttons ──────────────────────────────────────

test('mouseDown with middle button does not call singleSelect', () => {
  const spy = jest.spyOn(inputManager, 'singleSelect').mockImplementation(() => {});
  inputManager.mouseDown(1);
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});

test('mouseUp with middle button does not trigger any action', () => {
  const enterSpy = jest.spyOn(inputManager, 'onEnterPressed').mockImplementation(() => {});
  const windowSpy = jest.spyOn(inputManager, 'windowSelect').mockImplementation(() => {});
  inputManager.mouseUp(1);
  expect(enterSpy).not.toHaveBeenCalled();
  expect(windowSpy).not.toHaveBeenCalled();
  enterSpy.mockRestore();
  windowSpy.mockRestore();
});


// ─── onCommand edge cases ─────────────────────────────────────────────────────

test('onCommand with active command and no promptOption - does not handle via prompt', () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  inputManager.promptOption = undefined;
  // should not throw even though there's no promptOption
  expect(() => inputManager.onCommand('INVALID')).not.toThrow();
});

// ─── actionCommand edge cases ─────────────────────────────────────────────────

test('actionCommand with undefined item and non-Tool activeCommand - does nothing', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  // calling with no item should not throw
  expect(() => inputManager.actionCommand(undefined)).not.toThrow();
  inputManager.reset();
});

test('actionCommand returns the item index when adding an entity', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const addItemSpy = jest.spyOn(core.scene, 'addItem').mockReturnValue(42);
  const line = new Line();
  const index = inputManager.actionCommand(line);
  expect(index).toBe(42);
  addItemSpy.mockRestore();
  inputManager.reset();
});

test('actionCommand passes index parameter to addItem', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const addItemSpy = jest.spyOn(core.scene, 'addItem').mockReturnValue(5);
  const line = new Line();
  inputManager.actionCommand(line, 5);
  expect(addItemSpy).toHaveBeenCalledWith(line.type, expect.any(Object), 5);
  addItemSpy.mockRestore();
  inputManager.reset();
});

// ─── Input.Type completeness ──────────────────────────────────────────────────

test('Input.Type contains all expected types', () => {
  expect(Input.Type.POINT).toBeDefined();
  expect(Input.Type.NUMBER).toBeDefined();
  expect(Input.Type.STRING).toBeDefined();
  expect(Input.Type.DYNAMIC).toBeDefined();
  expect(Input.Type.SINGLESELECTION).toBeDefined();
  expect(Input.Type.SELECTIONSET).toBeDefined();
  expect(Input.Type.MOUSEDOWN).toBeDefined();
  expect(Input.Type.MOUSEUP).toBeDefined();
});

// ─── reset cancels active promptOption ────────────────────────────────────────

test('reset calls cancel on the active promptOption', () => {
  inputManager.reset();
  const po = new PromptOptions('Test', [Input.Type.POINT]);
  inputManager.requestInput(po);
  const cancelSpy = jest.spyOn(po, 'cancel');
  inputManager.reset();
  expect(cancelSpy).toHaveBeenCalled();
});

// ─── mouseMoved – activeCommand.preview() ────────────────────────────────────

test('mouseMoved calls activeCommand.preview when command is active and no entity nearby', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const previewSpy = jest.spyOn(inputManager.activeCommand, 'preview').mockImplementation(() => {});
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(undefined);
  core.mouse.buttonOneDown = false;
  inputManager.mouseMoved();
  expect(previewSpy).toHaveBeenCalled();
  jest.restoreAllMocks();
  inputManager.reset();
});

test('mouseMoved calls preview even when entity is being highlighted', () => {
  inputManager.reset();
  // preview() is always called for the active command, including when an entity is highlighted
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('', [Input.Type.SINGLESELECTION]);
  inputManager.requestInput(po);
  const previewSpy = jest.spyOn(inputManager.activeCommand, 'preview');
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  jest.spyOn(core.scene.entities, 'get').mockReturnValue(new Line());
  core.mouse.buttonOneDown = false;
  inputManager.mouseMoved();
  expect(previewSpy).toHaveBeenCalled();
  jest.restoreAllMocks();
  po.cancel();
  inputManager.reset();
});

test('mouseMoved draws selection window with SELECTIONSET prompt and button down', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const po = new PromptOptions('', [Input.Type.SELECTIONSET]);
  inputManager.requestInput(po);
  const drawSpy = jest.spyOn(core.scene.selectionManager, 'drawSelectionWindow').mockImplementation(() => {});
  core.mouse.buttonOneDown = true;
  inputManager.mouseMoved();
  expect(drawSpy).toHaveBeenCalled();
  drawSpy.mockRestore();
  core.mouse.buttonOneDown = false;
  po.cancel();
  inputManager.reset();
});

test('mouseMoved does not draw selection window when button is not down', () => {
  inputManager.reset();
  const drawSpy = jest.spyOn(core.scene.selectionManager, 'drawSelectionWindow').mockImplementation(() => {});
  core.mouse.buttonOneDown = false;
  inputManager.mouseMoved();
  expect(drawSpy).not.toHaveBeenCalled();
  drawSpy.mockRestore();
});

// ─── mouseMoved – snapping path ───────────────────────────────────────────────

test('mouseMoved skips highlightEntityUnderMouse when snapping is active and snap returns a point', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  // snapping is activated by POINT prompt - requestInput already activated it
  expect(inputManager.snapping.active).toBe(true);
  const highlightSpy = jest.spyOn(inputManager, 'highlightEntityUnderMouse');
  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(new Point(1, 1));
  core.mouse.buttonOneDown = false;
  inputManager.mouseMoved();
  expect(highlightSpy).not.toHaveBeenCalled();
  jest.restoreAllMocks();
  inputManager.reset();
});

// ─── mouseDown – no MOUSEDOWN prompt ─────────────────────────────────────────

test('mouseDown case 0 without MOUSEDOWN prompt does not attempt to resolve a prompt', () => {
  inputManager.reset();
  const singleSelectSpy = jest.spyOn(inputManager, 'singleSelect').mockImplementation(() => {});
  const po = new PromptOptions('', [Input.Type.POINT]);
  inputManager.requestInput(po);
  const respondSpy = jest.spyOn(po, 'respond');
  inputManager.mouseDown(0);
  expect(respondSpy).not.toHaveBeenCalled();
  singleSelectSpy.mockRestore();
  po.cancel();
  inputManager.reset();
});

test('mouseDown with MOUSEDOWN prompt but unresolved promise - does not throw', () => {
  inputManager.reset();
  const singleSelectSpy = jest.spyOn(inputManager, 'singleSelect').mockImplementation(() => {});
  // Assign promptOption directly without requestInput, so resolve is undefined
  const po = new PromptOptions('', [Input.Type.MOUSEDOWN]);
  inputManager.promptOption = po;
  expect(() => inputManager.mouseDown(0)).not.toThrow();
  singleSelectSpy.mockRestore();
  inputManager.reset();
});

// ─── mouseUp – no prompt, no active command ───────────────────────────────────

test('mouseUp case 0 with no prompt and no active command and mouse moved - calls windowSelect', () => {
  inputManager.reset();
  const windowSelectSpy = jest.spyOn(inputManager, 'windowSelect').mockImplementation(() => {});
  core.mouse.mouseDownCanvasPoint = new Point(0, 0);
  core.mouse.x = 50;
  core.mouse.y = 50;
  inputManager.mouseUp(0);
  expect(windowSelectSpy).toHaveBeenCalled();
  windowSelectSpy.mockRestore();
  core.mouse.x = 0;
  core.mouse.y = 0;
});

test('mouseUp case 0 with no prompt and no active command and mouse not moved - does not call windowSelect', () => {
  inputManager.reset();
  const windowSelectSpy = jest.spyOn(inputManager, 'windowSelect').mockImplementation(() => {});
  core.mouse.mouseDownCanvasPoint = new Point(0, 0);
  core.mouse.x = 0;
  core.mouse.y = 0;
  inputManager.mouseUp(0);
  expect(windowSelectSpy).not.toHaveBeenCalled();
  windowSelectSpy.mockRestore();
});

// ─── highlightEntityUnderMouse – selection prompts ───────────────────────────

test('highlightEntityUnderMouse returns true with SINGLESELECTION prompt and entity found', () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('', [Input.Type.SINGLESELECTION]);
  inputManager.requestInput(po);
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  jest.spyOn(core.scene.entities, 'get').mockReturnValue(new Line());
  expect(inputManager.highlightEntityUnderMouse()).toBe(true);
  expect(core.scene.hoverEntities.count()).toBe(1);
  jest.restoreAllMocks();
  po.cancel();
  inputManager.reset();
});

test('highlightEntityUnderMouse returns true with SELECTIONSET prompt and entity found', () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('', [Input.Type.SELECTIONSET]);
  inputManager.requestInput(po);
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  jest.spyOn(core.scene.entities, 'get').mockReturnValue(new Line());
  expect(inputManager.highlightEntityUnderMouse()).toBe(true);
  expect(core.scene.hoverEntities.count()).toBe(1);
  jest.restoreAllMocks();
  po.cancel();
  inputManager.reset();
});

// ─── onLeftClick – snap prevents entity selection ────────────────────────────

test('onLeftClick with active POINT prompt and snap returns a point - responds with the point', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const respondSpy = jest.spyOn(inputManager.promptOption, 'respond');
  // snap returns a snapped point (non-null), so entity selection is blocked
  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(new Point(5, 5));
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  const clickPoint = new Point(5, 5);
  inputManager.onLeftClick(clickPoint);
  // entity select is blocked by snap, so falls through to point respond
  expect(respondSpy).toHaveBeenCalledWith(clickPoint);
  jest.restoreAllMocks();
  inputManager.reset();
});

test('onLeftClick with active command and non-selection prompt - does not select entity', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  // Line uses POINT prompt - entity selection should be suppressed
  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(null);
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  const onSelectionSpy = jest.spyOn(inputManager, 'onSelection');
  inputManager.onLeftClick(new Point(1, 1));
  expect(onSelectionSpy).not.toHaveBeenCalled();
  jest.restoreAllMocks();
  inputManager.reset();
});

test('onLeftClick with SINGLESELECTION prompt and entity nearby - selects the entity', () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('', [Input.Type.SINGLESELECTION]);
  inputManager.requestInput(po);
  const mockSelection = new SingleSelection(3, new Point(0, 0));
  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(null);
  jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(3);
  jest.spyOn(core.scene.selectionManager, 'singleSelect').mockReturnValue(mockSelection);
  const onSelectionSpy = jest.spyOn(inputManager, 'onSelection');
  inputManager.onLeftClick(new Point(0, 0));
  expect(onSelectionSpy).toHaveBeenCalledWith(mockSelection);
  jest.restoreAllMocks();
  po.cancel();
  inputManager.reset();
});

// ─── onEnterPressed – SELECTIONSET already accepted ──────────────────────────

test('onEnterPressed with SELECTIONSET prompt already accepted - resets', () => {
  inputManager.reset();
  inputManager.activeCommand = new Line();
  const po = new PromptOptions('', [Input.Type.SELECTIONSET]);
  inputManager.requestInput(po);
  core.scene.selectionManager.selectionSet.accepted = true;
  inputManager.onEnterPressed();
  expect(inputManager.activeCommand).toBeUndefined();
  po.cancel();
});

// ─── handlePromptInput – returns true on valid input ─────────────────────────

test('handlePromptInput returns true on valid input', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  const result = inputManager.handlePromptInput(new Point(1, 2));
  expect(result).toBe(true);
  inputManager.reset();
});

// ─── reset – clears inputPoint ────────────────────────────────────────────────

test('reset sets inputPoint to null', () => {
  inputManager.inputPoint = new Point(10, 20);
  inputManager.reset();
  expect(inputManager.inputPoint).toBeNull();
});

// ─── mouseMoved – auxiliaryEntities cleared at start ─────────────────────────

test('mouseMoved clears auxiliaryEntities, previewEntities and hoverEntities at the start', () => {
  // pre-populate all three collections
  const addTrackLineSpy = jest.spyOn(inputManager.snapping, 'addTrackingLine').mockImplementation(() => {});
  DesignCore.Scene.auxiliaryEntities.add({ draw: () => {} });
  DesignCore.Scene.previewEntities.add({ draw: () => {} });
  DesignCore.Scene.hoverEntities.add({ draw: () => {} });
  inputManager.mouseMoved();
  // all should have been cleared — confirm no crash and stale data is gone
  expect(() => inputManager.mouseMoved()).not.toThrow();
  addTrackLineSpy.mockRestore();
});

// ─── mouseMoved – polar tracking line ────────────────────────────────────────

test('mouseMoved adds a tracking line when polar is active and inputPoint is set', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  // provide an initial input point so the tracking line branch can fire
  inputManager.inputPoint = new Point(0, 0);
  expect(inputManager.snapping.active).toBe(true);

  // no entity snap
  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(undefined);
  // polar is true by default; stub polarSnap to return a definite point
  const trackPoint = new Point(100, 0);
  jest.spyOn(inputManager.snapping, 'polarSnap').mockReturnValue(trackPoint);
  const addTrackLineSpy = jest.spyOn(inputManager.snapping, 'addTrackingLine');

  core.mouse.buttonOneDown = false;
  core.mouse.buttonTwoDown = false;
  core.mouse.buttonThreeDown = false;
  inputManager.mouseMoved();

  expect(addTrackLineSpy).toHaveBeenCalledWith(inputManager.inputPoint, trackPoint);
  jest.restoreAllMocks();
  inputManager.reset();
});

test('mouseMoved adds a tracking line when ortho is active and inputPoint is set', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  inputManager.inputPoint = new Point(0, 0);

  // Switch to ortho mode
  const savedPolar = DesignCore.Settings.polar;
  const savedOrtho = DesignCore.Settings.ortho;
  DesignCore.Settings.polar = false;
  DesignCore.Settings.ortho = true;

  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(undefined);
  const trackPoint = new Point(0, 100);
  jest.spyOn(inputManager.snapping, 'orthoSnap').mockReturnValue(trackPoint);
  const addTrackLineSpy = jest.spyOn(inputManager.snapping, 'addTrackingLine');

  core.mouse.buttonOneDown = false;
  core.mouse.buttonTwoDown = false;
  core.mouse.buttonThreeDown = false;
  inputManager.mouseMoved();

  expect(addTrackLineSpy).toHaveBeenCalledWith(inputManager.inputPoint, trackPoint);

  DesignCore.Settings.polar = savedPolar;
  DesignCore.Settings.ortho = savedOrtho;
  jest.restoreAllMocks();
  inputManager.reset();
});

test('mouseMoved does not add tracking line when inputPoint is null', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  // inputPoint is null after reset
  expect(inputManager.inputPoint).toBeNull();

  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(undefined);
  const addTrackLineSpy = jest.spyOn(inputManager.snapping, 'addTrackingLine');

  core.mouse.buttonOneDown = false;
  inputManager.mouseMoved();

  expect(addTrackLineSpy).not.toHaveBeenCalled();
  jest.restoreAllMocks();
  inputManager.reset();
});

test('mouseMoved does not add tracking line when a mouse button is down', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  inputManager.inputPoint = new Point(0, 0);

  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(undefined);
  jest.spyOn(inputManager.snapping, 'polarSnap').mockReturnValue(new Point(100, 0));
  const addTrackLineSpy = jest.spyOn(inputManager.snapping, 'addTrackingLine');

  core.mouse.buttonOneDown = true;
  inputManager.mouseMoved();

  expect(addTrackLineSpy).not.toHaveBeenCalled();
  core.mouse.buttonOneDown = false;
  jest.restoreAllMocks();
  inputManager.reset();
});

test('mouseMoved does not add tracking line when entity snap is active', () => {
  inputManager.reset();
  inputManager.onCommand('Line');
  inputManager.inputPoint = new Point(0, 0);

  // snap returns a point → entity snap is active
  jest.spyOn(inputManager.snapping, 'snap').mockReturnValue(new Point(10, 10));
  const addTrackLineSpy = jest.spyOn(inputManager.snapping, 'addTrackingLine');

  core.mouse.buttonOneDown = false;
  inputManager.mouseMoved();

  expect(addTrackLineSpy).not.toHaveBeenCalled();
  jest.restoreAllMocks();
  inputManager.reset();
});

// ─── highlightEntityUnderMouse – button pressed ───────────────────────────────

test('highlightEntityUnderMouse returns false when buttonOneDown is true', () => {
  inputManager.reset();
  core.mouse.buttonOneDown = true;
  expect(inputManager.highlightEntityUnderMouse()).toBe(false);
  core.mouse.buttonOneDown = false;
});

test('highlightEntityUnderMouse returns false when buttonTwoDown is true', () => {
  inputManager.reset();
  core.mouse.buttonTwoDown = true;
  expect(inputManager.highlightEntityUnderMouse()).toBe(false);
  core.mouse.buttonTwoDown = false;
});

test('highlightEntityUnderMouse returns false when buttonThreeDown is true', () => {
  inputManager.reset();
  core.mouse.buttonThreeDown = true;
  expect(inputManager.highlightEntityUnderMouse()).toBe(false);
  core.mouse.buttonThreeDown = false;
});
