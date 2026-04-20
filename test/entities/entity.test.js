

import { Core } from '../../core/core/core.js';
import { Entity } from '../../core/entities/entity.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';

// initialise core
new Core();

test('Test Entity.colour', () => {
  const entity = new Entity();
  expect(entity.colour).toEqual({ 'r': 1, 'g': 1, 'b': 1 });
});

test('Test Entity.getLineType', () => {
  const entity = new Entity();
  expect(entity.getLineType().name).toBe('CONTINUOUS');
});

test('Test Entity.Within', () => {
  const entity = new Line({ points: [new Point(100, 100), new Point(200, 200)] });
  const selectionExtremesFalse = { min: new Point(101, 101), max: new Point(199, 199) };
  const selectionExtremesTrue = { min: new Point(99, 99), max: new Point(201, 201) };

  expect(entity.within(selectionExtremesFalse)).toBe(false);
  expect(entity.within(selectionExtremesTrue)).toBe(true);
});

test('Test Entity.touched', () => {
  const entity = new Line({ points: [new Point(100, 100), new Point(200, 200)] });
  const selectionExtremesTrue = { min: new Point(101, 101), max: new Point(199, 199) };
  const selectionExtremesFalse = { min: new Point(99, 99), max: new Point(201, 201) };

  expect(entity.touched(selectionExtremesFalse)).toBe(false);
  expect(entity.touched(selectionExtremesTrue)).toBe(true);
});

describe('Entity.fromDxf', () => {
  test('maps group code 62 to colourACI (absolute value)', () => {
    const data = Entity.fromDxf({ 62: 3 });
    expect(data.colourACI).toBe(3);

    // negative ACI indicates layer is off; should be made positive
    const negData = Entity.fromDxf({ 62: -3 });
    expect(negData.colourACI).toBe(3);
  });

  test('maps group code 420 to trueColour', () => {
    // Red=200, Green=100, Blue=50 → 0x00C86432 = 13132850
    const data = Entity.fromDxf({ 420: 13132850 });
    expect(data.trueColour).toBe(13132850);
  });

  test('preserves all other properties unchanged', () => {
    const data = Entity.fromDxf({ layer: 'TEST', 8: 'TEST', 5: 'ABC' });
    expect(data.layer).toBe('TEST');
    expect(data[8]).toBe('TEST');
    expect(data[5]).toBe('ABC');
  });

  test('ACI colour is applied to entity via colourACI', () => {
    const e = new Entity(Entity.fromDxf({ 62: 1 })); // ACI 1 = red
    expect(e.colour).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('true colour overrides ACI when both are present', () => {
    // ACI 1 = red; trueColour = green (0x0000FF00 >> 8 = 255... actually 0x00 00 FF 00)
    // pure green = r:0, g:255, b:0 → 0x0000FF00 = 65280
    const e = new Entity(Entity.fromDxf({ 62: 1, 420: 65280 }));
    expect(e.colour.g).toBe(255);
    expect(e.colour.r).toBe(0);
    expect(e.colour.b).toBe(0);
  });

  test('no colour codes leaves entity at default byLayer colour', () => {
    const data = Entity.fromDxf({ layer: '0' });
    expect(data.colourACI).toBeUndefined();
    expect(data.trueColour).toBeUndefined();
  });
});
