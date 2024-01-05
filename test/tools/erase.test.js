import {Core} from '../../core/core/core.js';
import {DesignCore} from '../../core/designCore.js';
import {Point} from '../../core/entities/point.js';
import {Erase} from '../../core/tools/erase.js';

const core = new Core();

test('Test Erase.action', () => {
  // Add items to scene
  DesignCore.Scene.addItem('Line', {points: [new Point(10, 0), new Point(20, 0)]});
  DesignCore.Scene.addItem('Circle', {points: [new Point(10, 0), new Point(20, 0)]});
  DesignCore.Scene.addItem('Polyline', {points: [new Point(10, 0), new Point(20, 0)]});
  DesignCore.Scene.addItem('Arc', {points: [new Point(10, 0), new Point(10, 10), new Point(0, 10)]});
  DesignCore.Scene.addItem('Rectangle', {points: [new Point(10, 0), new Point(0, 10)]});
  DesignCore.Scene.addItem('Text', {points: [new Point(10, 0), new Point(0, 10)], height: 10, rotation: 0, string: 'text test'});

  // Add items to selection set
  for (let i = 0; i < DesignCore.Scene.items.length; i++) {
    DesignCore.Scene.selectionManager.addToSelectionSet(i);
  }

  expect(DesignCore.Scene.items.length).toBe(6);

  // Perform Erase
  const erase = new Erase();
  erase.action();

  expect(DesignCore.Scene.items.length).toBe(0);
});
