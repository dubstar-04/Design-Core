import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Erase } from '../../core/tools/erase.js';

const core = new Core();

test('Test Erase.action', () => {
  // Add items to scene
  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.addItem('Circle', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.addItem('Polyline', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.addItem('Arc', { points: [new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  core.scene.addItem('Rectangle', { points: [new Point(10, 0), new Point(0, 10)] });
  core.scene.addItem('Text', { points: [new Point(10, 0), new Point(0, 10)], height: 10, rotation: 0, string: 'text test' });

  // Add items to selection set
  for (let i = 0; i < core.scene.entities.count(); i++) {
    core.scene.selectionManager.addToSelectionSet(i);
  }

  expect(core.scene.entities.count()).toBe(6);

  // Perform Erase
  const erase = new Erase();
  erase.action();

  expect(core.scene.entities.count()).toBe(0);
});
