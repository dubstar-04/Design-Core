import {Core} from '../../core/core/core.js';

const core = new Core();
const settings = core.settings;

test('Test Settings.setSetting', () => {
  expect(settings.endsnap).toBe(true);
  settings.setSetting('endsnap', false);
  expect(settings.endsnap).toBe(false);

  expect(settings.canvasbackgroundcolour).toBe('#1e1e1e');
  settings.setSetting('canvasbackgroundcolour', '#000000');
  expect(settings.canvasbackgroundcolour).toBe('#000000');
});

test('Test Settings.getSetting', () => {
  expect(settings.getSetting('endsnap')).toBe(false);
  expect(settings.getSetting('canvasbackgroundcolour')).toBe('#000000');
});
