import { Pan } from '../../core/tools/pan.js';
import { DesignCore } from '../../core/designCore.js';
import { Core } from '../../core/core/core.js';
import { jest } from '@jest/globals';

// initialise core
new Core();

/*
test('Pan.execute should set panning true on mouse down and false on mouse up', async () => {
  // Mock inputManager.requestInput to simulate mouse down and up
  const pan = new Pan();

  // Mock requestInput to resolve immediately
  DesignCore.Scene.inputManager.requestInput = jest.fn()
      .mockResolvedValueOnce() // Simulate mouse down
      .mockResolvedValueOnce(); // Simulate mouse up

  // Run execute once (simulate one pan cycle)
  // const executePromise = pan.execute();

  DesignCore.Scene.inputManager.activeCommand = true; // Start the loop
  await pan.execute(2); // Run the method

  // Wait for the first mouse down
  DesignCore.Mouse.buttonOneDown = true;
  await DesignCore.Scene.inputManager.requestInput.mock.results[0].value;
  expect(pan.panning).toBe(true);

  // Simulate mouse up
  DesignCore.Mouse.buttonOneDown = false;
  await DesignCore.Scene.inputManager.requestInput.mock.results[1].value;
  expect(pan.panning).toBe(false);

  DesignCore.Scene.inputManager.activeCommand = false;


  // Stop the infinite loop
  // executePromise.catch(() => {});
});
*/


test('Pan.execute toggles panning on mouse down then off on mouse up (single cycle)', async () => {
  const pan = new Pan();

  // Ensure command is active
  DesignCore.Scene.inputManager.activeCommand = true;

  // Spy on Logging (optional) and Canvas.pan (for preview if invoked)
  const panSpy = jest.spyOn(DesignCore.Canvas, 'pan').mockImplementation(() => {});

  // Create controllable (deferred) promises for the two requestInput calls
  let resolveFirst; let resolveSecond;
  const firstPromise = new Promise((r) => (resolveFirst = r));
  const secondPromise = new Promise((r) => (resolveSecond = r));

  // Mock requestInput: first for mouse down, second for mouse up
  DesignCore.Scene.inputManager.requestInput = jest
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

  // Start execute (one cycle)
  const execPromise = pan.execute();

  // Simulate mouse down before resolving first
  DesignCore.Mouse.buttonOneDown = true;

  resolveFirst(); // triggers first await completion
  // Allow microtask queue to process
  await Promise.resolve();
  expect(pan.panning).toBe(true);

  // Optionally invoke preview to perform pan action
  pan.preview();
  expect(panSpy).toHaveBeenCalledTimes(1);

  // Simulate mouse up
  DesignCore.Mouse.buttonOneDown = false;
  // Ensure command is inactive
  DesignCore.Scene.inputManager.activeCommand = false;
  resolveSecond(); // triggers second await completion
  await execPromise;
  expect(pan.panning).toBe(false);
  expect(DesignCore.Scene.inputManager.requestInput).toHaveBeenCalledTimes(2);

  panSpy.mockRestore();
});


test('Test Pan.register', () => {
  const command = Pan.register();
  expect(command.command).toBe('Pan');
  expect(command.shortcut).toBe('P');
  expect(command.type).toBeUndefined();
});


test('Pan command should call DesignCore.Canvas.pan when panning is true', () => {
  DesignCore.Canvas.pan = jest.fn();
  const pan = new Pan();
  pan.panning = true;
  pan.preview();
  expect(DesignCore.Canvas.pan).toHaveBeenCalled();
});

test('Pan command should not call DesignCore.Canvas.pan when panning is false', () => {
  DesignCore.Canvas.pan = jest.fn();
  const pan = new Pan();
  pan.panning = false;
  pan.preview();
  expect(DesignCore.Canvas.pan).not.toHaveBeenCalled();
});
