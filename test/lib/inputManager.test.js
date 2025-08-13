
import { Core } from '../../core/core/core.js';
import { PromptOptions } from '../../core/lib/inputManager.js';
import { Input } from '../../core/lib/inputManager.js';


// const core =
new Core();
// const inputManager = core.scene.inputManager;


test('Test PromptOptions.getOptionWithShortcut', () => {
  const po = new PromptOptions();
  expect(po.getOptionWithShortcut('input')).toBe('i\u0332nput');
});


test('Test Input.getType', () => {
  expect(Input.getType(100)).toBe('Number');
  expect(Input.getType('text')).toBe('String');
});
