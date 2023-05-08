import {Core} from '../../core/core.js';
import {Point} from '../../core/entities/point.js';
import {Identify} from '../../core/tools/identify.js';

const core = new Core();
let output;

core.notify = (notification) => {
  output = notification;
};

test('Test distance.action', () => {
  // Add items to scene
  core.scene.addToScene('Line', {points: [new Point(), new Point(0, 10)]});

  const identify = new Identify();

  // set base point
  identify.points.push(new Point(0, 10));

  // Perform identify
  identify.action(core);

  expect(output).not.toBeUndefined();
  expect(output).toBe('X:0.0 Y:10.0');
});
