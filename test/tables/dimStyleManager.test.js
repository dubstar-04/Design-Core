import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';

const core = new Core();
const dimStyleManager = core.dimStyleManager;

const dimensionData = (dimensionStyle) => ({
  points: [new Point(), new Point(10, 0), new Point(5, 5)],
  dimensionStyle: dimensionStyle,
});

beforeEach(() => {
  while (core.scene.entities.count() > 0) {
    core.scene.entities.remove(0);
  }
});

test('Test DimStyleManager.deleteStyle removes only dimensions using the style', () => {
  dimStyleManager.addItem({ name: 'CUSTOM' });

  core.scene.addEntity('Line', { points: [new Point(), new Point(10, 10)] });
  core.scene.addEntity('Circle', { points: [new Point()], radius: 5 });
  core.scene.addEntity('RotatedDimension', dimensionData('CUSTOM'));
  core.scene.addEntity('RotatedDimension', dimensionData('STANDARD'));
  expect(core.scene.entities.count()).toBe(4);

  dimStyleManager.deleteStyle(dimStyleManager.getItemIndex('CUSTOM'));

  expect(dimStyleManager.itemExists('CUSTOM')).toBe(false);
  const types = core.scene.entities.get(0).type + ',' + core.scene.entities.get(1).type + ',' + core.scene.entities.get(2).type;
  expect(core.scene.entities.count()).toBe(3);
  expect(types).toBe('Line,Circle,RotatedDimension');
  expect(core.scene.entities.get(2).getProperty('dimensionStyle')).toBe('STANDARD');
});

test('Test DimStyleManager.deleteStyle matches style names case-insensitively', () => {
  dimStyleManager.addItem({ name: 'MixedCase' });
  core.scene.addEntity('RotatedDimension', dimensionData('MIXEDCASE'));

  dimStyleManager.deleteStyle(dimStyleManager.getItemIndex('MixedCase'));

  expect(core.scene.entities.count()).toBe(0);
});

test('Test DimStyleManager.deleteStyle resets the current style when it is deleted', () => {
  dimStyleManager.addItem({ name: 'CURRENT' });
  dimStyleManager.setCstyle('CURRENT');

  dimStyleManager.deleteStyle(dimStyleManager.getItemIndex('CURRENT'));

  expect(dimStyleManager.getCstyle()).toBe(dimStyleManager.getItems()[0].name);
});

test('Test DimStyleManager.deleteStyle keeps indelible styles and their dimensions', () => {
  core.scene.addEntity('RotatedDimension', dimensionData('STANDARD'));

  dimStyleManager.deleteStyle(dimStyleManager.getItemIndex('STANDARD'), false);

  expect(dimStyleManager.itemExists('STANDARD')).toBe(true);
  expect(core.scene.entities.count()).toBe(1);
});

test('Test DimStyleManager.renameStyle updates dimensions through the property API', () => {
  dimStyleManager.addItem({ name: 'OLDNAME' });
  core.scene.addEntity('Line', { points: [new Point(), new Point(10, 10)] });
  core.scene.addEntity('RotatedDimension', dimensionData('OLDNAME'));
  core.scene.addEntity('RotatedDimension', dimensionData('STANDARD'));

  dimStyleManager.renameStyle(dimStyleManager.getItemIndex('OLDNAME'), 'NEWNAME');

  const dimension = core.scene.entities.get(1);
  expect(dimension.getProperty('dimensionStyle')).toBe('NEWNAME');
  expect(Object.hasOwn(dimension, 'dimensionStyle')).toBe(false);
  expect(core.scene.entities.get(2).getProperty('dimensionStyle')).toBe('STANDARD');
  expect(dimension.getDimensionStyle()?.name).toBe('NEWNAME');
});

test('Test DimStyleManager defaults to the ISO-25 current style', () => {
  expect(new Core().dimStyleManager.getCstyle()).toBe('ISO-25');
});

test('Test DimStyleManager.purge keeps the current style', () => {
  dimStyleManager.setCstyle('ISO-25');

  dimStyleManager.purge();

  expect(dimStyleManager.itemExists('ISO-25')).toBe(true);
  expect(dimStyleManager.getCstyle()).toBe('ISO-25');
  expect(dimStyleManager.itemExists('ANNOTATIVE')).toBe(false);
});

test('Test dimension style property lists the available dim styles', () => {
  core.scene.addEntity('RotatedDimension', dimensionData('STANDARD'));
  const definition = core.scene.entities.get(0).properties.definition('dimensionStyle');

  const options = definition.options();

  expect(options.map((o) => o.value)).toEqual(DesignCore.DimStyleManager.getItems().map((s) => s.name));
  expect(options.find((o) => o.value === 'STANDARD')).toEqual({ display: 'STANDARD', value: 'STANDARD' });
});
