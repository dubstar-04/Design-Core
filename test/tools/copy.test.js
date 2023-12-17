import {Core} from '../../core/core.js';
import {Point} from '../../core/entities/point.js';
import {Copy} from '../../core/tools/copy.js';

const core = new Core();

test('Test Copy.action', () => {
  // Add items to scene
  core.scene.addItem('Line', {points: [new Point(), new Point(0, 10)]});
  core.scene.addItem('Circle', {points: [new Point(), new Point(0, 10)]});
  core.scene.addItem('Polyline', {points: [new Point(), new Point(0, 10)]});
  core.scene.addItem('Arc', {points: [new Point(), new Point(0, 10), new Point(10, 0)]});
  core.scene.addItem('Rectangle', {points: [new Point(), new Point(0, 10)]});
  core.scene.addItem('Text', {points: [new Point(), new Point(0, 10)], height: 10, rotation: 0, string: 'text test'});

  // Add items to selection set
  for (let i = 0; i < core.scene.items.length; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  /**
   * Copy by x = 10 y = 0
   */

  const copy = new Copy();

  // set base point
  copy.points.push(new Point());

  // set destination point
  copy.points.push(new Point(10, 0));

  // Perform Copy
  copy.action(core);

  expect(core.scene.items.length).toBe(12);

  for (let i = 6; i < core.scene.items.length; i++) {
    expect(core.scene.items[i].points[0].x).toBe(10);
    expect(core.scene.items[i].points[0].y).toBe(0);
  }
});
