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

// ─── constructor defaults ─────────────────────────────────────────────────────

test('Settings constructor - colour defaults', () => {
  const fresh = new (settings.constructor)();
  expect(fresh.canvasbackgroundcolour).toEqual({ r: 30, g: 30, b: 30 });
  expect(fresh.selecteditemscolour).toEqual({ r: 0, g: 255, b: 0 });
  expect(fresh.snapcolour).toEqual({ r: 55, g: 180, b: 75 });
  expect(fresh.gridcolour).toEqual({ r: 119, g: 118, b: 123 });
  expect(fresh.helpergeometrycolour).toEqual({ r: 0, g: 195, b: 255 });
  expect(fresh.polarsnapcolour).toEqual({ r: 55, g: 180, b: 75 });
  expect(fresh.selectionWindow).toEqual({ r: 0, g: 255, b: 0 });
  expect(fresh.crossingWindow).toEqual({ r: 0, g: 0, b: 255 });
});

test('Settings constructor - font defaults', () => {
  expect(settings.font).toBe('Arial');
  expect(settings.fontupsidedown).toBe(false);
  expect(settings.fontbackwards).toBe(false);
});

test('Settings constructor - snap defaults', () => {
  expect(settings.endsnap).toBeDefined();
  expect(settings.midsnap).toBe(true);
  expect(settings.centresnap).toBe(true);
  expect(settings.nearestsnap).toBe(false);
  expect(settings.quadrantsnap).toBe(false);
});

test('Settings constructor - polar/ortho/grid defaults', () => {
  // restore to known state after previous tests may have modified them
  const fresh = new (settings.constructor)();
  expect(fresh.polar).toBe(true);
  expect(fresh.ortho).toBe(false);
  expect(fresh.polarangle).toBe(45);
  expect(fresh.drawgrid).toBe(true);
});

// ─── setSetting ───────────────────────────────────────────────────────────────

test('setSetting with false value does not trigger polar/ortho exclusion', () => {
  settings.setSetting('polar', true);
  settings.setSetting('ortho', false);
  // setting polar to false should not flip ortho
  settings.setSetting('polar', false);
  expect(settings.polar).toBe(false);
  expect(settings.ortho).toBe(false);
});

test('setSetting updates arbitrary colour settings', () => {
  settings.setSetting('polarsnapcolour', { r: 1, g: 2, b: 3 });
  expect(settings.polarsnapcolour).toEqual({ r: 1, g: 2, b: 3 });
  settings.setSetting('polarsnapcolour', { r: 55, g: 180, b: 75 });
});

test('setSetting updates polarangle', () => {
  settings.setSetting('polarangle', 90);
  expect(settings.polarangle).toBe(90);
  settings.setSetting('polarangle', 45);
});

test('setSetting updates font settings', () => {
  settings.setSetting('font', 'Courier');
  expect(settings.font).toBe('Courier');
  settings.setSetting('fontupsidedown', true);
  expect(settings.fontupsidedown).toBe(true);
  settings.setSetting('fontbackwards', true);
  expect(settings.fontbackwards).toBe(true);
  // restore
  settings.setSetting('font', 'Arial');
  settings.setSetting('fontupsidedown', false);
  settings.setSetting('fontbackwards', false);
});

// ─── getSetting ───────────────────────────────────────────────────────────────

test('getSetting returns current value after setSetting', () => {
  settings.setSetting('drawgrid', false);
  expect(settings.getSetting('drawgrid')).toBe(false);
  settings.setSetting('drawgrid', true);
  expect(settings.getSetting('drawgrid')).toBe(true);
});

test('getSetting returns correct type for colour objects', () => {
  const colour = settings.getSetting('snapcolour');
  expect(colour).toHaveProperty('r');
  expect(colour).toHaveProperty('g');
  expect(colour).toHaveProperty('b');
});
