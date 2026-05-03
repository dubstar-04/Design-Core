import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Erase } from '../../core/tools/erase.js';

const core = new Core();

test('Test Erase.action', () => {
  // Add items to scene
  core.scene.addEntity('Line', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.addEntity('Circle', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.addEntity('Polyline', { points: [new Point(10, 0), new Point(20, 0)] });
  core.scene.addEntity('Arc', { points: [new Point(10, 0), new Point(10, 10), new Point(0, 10)] });
  core.scene.addEntity('Rectangle', { points: [new Point(10, 0), new Point(0, 10)] });
  core.scene.addEntity('Text', { points: [new Point(10, 0), new Point(0, 10)], height: 10, rotation: 0, string: 'text test' });

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
