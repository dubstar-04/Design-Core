

import {Core} from '../../core/core.js';
import {Entity} from '../../core/entities/entity.js';
import {Line} from '../../core/entities/line.js';
import {Point} from '../../core/entities/point.js';

const core = new Core();

test('Test Entity.getColour', () => {
  const entity = new Entity();
  expect(entity.getColour(core)).toBe('#00BFFF');
});
