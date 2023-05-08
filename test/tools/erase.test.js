import {Core} from '../../core/core.js';
import {Point} from '../../core/entities/point.js';
import {Erase} from '../../core/tools/erase.js';

const core = new Core();

test('Test Erase.action', () => {
  // Add items to scene
  core.scene.addToScene('Line', {points: [new Point(10, 0), new Point(20, 0)]});
  core.scene.addToScene('Circle', {points: [new Point(10, 0), new Point(20, 0)]});
  core.scene.addToScene('Polyline', {points: [new Point(10, 0), new Point(20, 0)]});
  core.scene.addToScene('Arc', {points: [new Point(10, 0), new Point(10, 10), new Point(0, 10)]});
  core.scene.addToScene('Rectangle', {points: [new Point(10, 0), new Point(0, 10)]});
  core.scene.addToScene('Text', {points: [new Point(10, 0), new Point(0, 10)], height: 10, rotation: 0, string: 'text test'});

  // Add items to selection set
  for (let i = 0; i < core.scene.items.length; i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  expect(core.scene.items.length).toBe(6);

  // Perform Erase
  const erase = new Erase();
  erase.action(core);

  expect(core.scene.items.length).toBe(0);
});
