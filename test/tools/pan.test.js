import { Pan } from '../../core/tools/pan.js';
import { DesignCore } from '../../core/designCore.js';
import { Core } from '../../core/core/core.js';

import { jest } from '@jest/globals';

// initialise core
new Core();

test('Pan.execute toggles panning on mouse down then off on mouse up (single cycle)', async () => {
  const pan = new Pan();
  DesignCore.Scene.inputManager.activeCommand = pan;

  const panSpy = jest.spyOn(DesignCore.Canvas, 'pan').mockImplementation(() => {});

  let resolveMouseDown; let resolveMouseUp;
  const mouseDownPromise = new Promise((r) => (resolveMouseDown = r));
  const mouseUpPromise = new Promise((r) => (resolveMouseUp = r));

  DesignCore.Scene.inputManager.requestInput = jest
      .fn()
      .mockImplementationOnce(() => mouseDownPromise)
      .mockImplementationOnce(() => mouseUpPromise);

  const execPromise = pan.execute();

  // Verify first requestInput was called with the pan prompt
  expect(DesignCore.Scene.inputManager.requestInput.mock.calls[0][0].promptMessage)
      .toBe('');

  resolveMouseDown();
  await Promise.resolve();
  expect(pan.panning).toBe(true);

  pan.preview();
  expect(panSpy).toHaveBeenCalledTimes(1);

  DesignCore.Scene.inputManager.activeCommand = false;
  resolveMouseUp();
  await execPromise;
  expect(pan.panning).toBe(false);

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
