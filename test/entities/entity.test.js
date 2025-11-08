

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
  const selectionExtremesFalse = [101, 199, 101, 199];
  const selectionExtremesTrue = [99, 201, 99, 201];

  expect(entity.within(selectionExtremesFalse)).toBe(false);
  expect(entity.within(selectionExtremesTrue)).toBe(true);
});

test('Test Entity.touched', () => {
  const entity = new Line({ points: [new Point(100, 100), new Point(200, 200)] });
  const selectionExtremesTrue = [101, 199, 101, 199];
  const selectionExtremesFalse = [99, 201, 99, 201];

  expect(entity.touched(selectionExtremesFalse)).toBe(false);
  expect(entity.touched(selectionExtremesTrue)).toBe(true);
});
