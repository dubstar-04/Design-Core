import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Tool } from '../../core/tools/tool.js';
import { jest } from '@jest/globals';

new Core();

afterEach(() => {
  jest.restoreAllMocks();
});

test('Tool.cancel default delegates to inputManager.reset()', () => {
  const tool = new Tool();
  const resetSpy = jest.spyOn(DesignCore.Scene.inputManager, 'reset').mockImplementation(() => {});

  tool.cancel();

  expect(resetSpy).toHaveBeenCalledTimes(1);
});

test('Tool.preview and Tool.action are no-ops by default', () => {
  const tool = new Tool();
  expect(() => tool.preview()).not.toThrow();
  expect(() => tool.action()).not.toThrow();
});
