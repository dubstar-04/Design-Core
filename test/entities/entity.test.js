

import {Core} from '../../core/core.js';
import {Entity} from '../../core/entities/entity.js';
import {Line} from '../../core/entities/line.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();

test('Test Entity.getColour', () => {
  const entity = new Entity();
  expect(entity.getColour()).toBe('#00BFFF');
});

test('Test Entity.getLineType', () => {
  const entity = new Entity();
  expect(entity.getLineType().name).toBe('CONTINUOUS');
});

test('Test Entity.Within', () => {
  const entity = new Line({points: [new Point(100, 100), new Point(200, 200)]});
  const selectionExtremesFalse = [101, 199, 101, 199];
  const selectionExtremesTrue = [99, 201, 99, 201];

  expect(entity.within(selectionExtremesFalse)).toBe(false);
  expect(entity.within(selectionExtremesTrue)).toBe(true);
});
