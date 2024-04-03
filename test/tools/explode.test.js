import {Core} from '../../core/core/core.js';
import {Point} from '../../core/entities/point.js';
import {Explode} from '../../core/tools/explode.js';
import {Line} from '../../core/entities/line.js';

const core = new Core();

test('Test Explode.action', () => {
  const insertPoint = new Point(100, 100);
  const insertIndex = core.scene.addItem('Insert', {points: [insertPoint]});
  const insert = core.scene.getItem(insertIndex);

  for (let i = 0; i < 5; i++) {
    const line = new Line({points: [new Point(0, i * 10), new Point(100, i * 10)]});
    insert.block.addItem(line);
  }

  expect(core.scene.items.length).toBe(1);

  // Add items to selection set
  for (let i = 0; i < core.scene.items.length; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  // Perform Explode
  const explode = new Explode();
  explode.action();

  expect(core.scene.items.length).toBe(5);

  // loop through all exploded items, check the type and
  // check the points have be modified when exploded
  for (let i = 0; i < core.scene.items.length; i++) {
    const item = core.scene.getItem(i);
    expect(item instanceof Line).toBe(true);
    expect(item.points[0].x).toBe(0 + insertPoint.x);
    expect(item.points[0].y).toBe(i*10 + insertPoint.y);
  }
});
