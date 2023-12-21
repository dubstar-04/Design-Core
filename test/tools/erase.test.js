import {Core} from '../../core/core.js';
import {Point} from '../../core/entities/point.js';
import {Erase} from '../../core/tools/erase.js';

const core = new Core();

test('Test Erase.action', () => {
  // Add items to scene
  Core.Scene.addItem('Line', {points: [new Point(10, 0), new Point(20, 0)]});
  Core.Scene.addItem('Circle', {points: [new Point(10, 0), new Point(20, 0)]});
  Core.Scene.addItem('Polyline', {points: [new Point(10, 0), new Point(20, 0)]});
  Core.Scene.addItem('Arc', {points: [new Point(10, 0), new Point(10, 10), new Point(0, 10)]});
  Core.Scene.addItem('Rectangle', {points: [new Point(10, 0), new Point(0, 10)]});
  Core.Scene.addItem('Text', {points: [new Point(10, 0), new Point(0, 10)], height: 10, rotation: 0, string: 'text test'});

  // Add items to selection set
  for (let i = 0; i < Core.Scene.items.length; i++) {
    Core.Scene.selectionManager.addToSelectionSet(i);
  }

  expect(Core.Scene.items.length).toBe(6);

  // Perform Erase
  const erase = new Erase();
  erase.action();

  expect(Core.Scene.items.length).toBe(0);
});
