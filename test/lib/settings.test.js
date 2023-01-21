import {Settings} from '../../core/lib/settings';

const settings = new Settings();


test('Test Settings.setSetting', () => {
  expect(settings.endSnap).toBe(true);
  settings.setSetting('endSnap', false);
  expect(settings.endSnap).toBe(false);

  expect(settings.canvasBackgroundColour).toBe('#1e1e1e');
  settings.setSetting('canvasBackgroundColour', '#000000');
  expect(settings.canvasBackgroundColour).toBe('#000000');
});

test('Test Settings.getSetting', () => {
  expect(settings.getSetting('endSnap')).toBe(false);
  expect(settings.getSetting('canvasBackgroundColour')).toBe('#000000');
});
