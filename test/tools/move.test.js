import {Core} from '../../core/core/core.js';
import {Point} from '../../core/entities/point.js';
import {Move} from '../../core/tools/move.js';

const core = new Core();

test('Test Move.action', () => {
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
   * move by x = 10 y = 0
   */

  const move = new Move();

  // set base point
  move.points.push(new Point());

  // set destination point
  move.points.push(new Point(10, 0));

  // Perform move
  move.action();

  for (let i = 0; i < core.scene.items.length; i++) {
    expect(core.scene.items[i].points[0].x).toBe(10);
    expect(core.scene.items[i].points[0].y).toBe(0);
  }


  /**
   * move by x = 0 y = 10
   */
  // reset move points
  move.points = [];

  // set base point
  move.points.push(new Point());

  // set destination point
  move.points.push(new Point(0, 10));

  // Perform move
  move.action();

  for (let i = 0; i < core.scene.items.length; i++) {
    expect(core.scene.items[i].points[0].x).toBe(10);
    expect(core.scene.items[i].points[0].y).toBe(10);
  }

  /**
   * move by x = -10 y = -10
   */
  // reset move points
  move.points = [];

  // set base point
  move.points.push(new Point());

  // set destination point
  move.points.push(new Point(-10, -10));

  // Perform move
  move.action();

  for (let i = 0; i < core.scene.items.length; i++) {
    expect(core.scene.items[i].points[0].x).toBe(0);
    expect(core.scene.items[i].points[0].y).toBe(0);
  }
});
