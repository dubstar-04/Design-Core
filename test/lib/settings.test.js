import { Core } from '../../core/core/core.js';

const core = new Core();
const settings = core.settings;

test('Test Settings.setSetting', () => {
  expect(settings.endsnap).toBe(true);
  settings.setSetting('endsnap', false);
  expect(settings.endsnap).toBe(false);

  expect(settings.canvasbackgroundcolour).toEqual({ 'r': 30, 'g': 30, 'b': 30 });
  settings.setSetting('canvasbackgroundcolour', { 'r': 130, 'g': 130, 'b': 130 });
  expect(settings.canvasbackgroundcolour).toEqual({ 'r': 130, 'g': 130, 'b': 130 });
});

test('Test Settings.getSetting', () => {
  expect(settings.getSetting('endsnap')).toBe(false);
  expect(settings.getSetting('canvasbackgroundcolour')).toEqual({ 'r': 130, 'g': 130, 'b': 130 });
});

test('polar and ortho are mutually exclusive', () => {
  settings.setSetting('polar', false);
  settings.setSetting('ortho', false);

  settings.setSetting('polar', true);
  expect(settings.polar).toBe(true);
  expect(settings.ortho).toBe(false);

  settings.setSetting('ortho', true);
  expect(settings.ortho).toBe(true);
  expect(settings.polar).toBe(false);

  settings.setSetting('ortho', false);
  expect(settings.ortho).toBe(false);
  expect(settings.polar).toBe(false);
});
