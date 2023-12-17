import {Core} from '../../core/core.js';
import {Point} from '../../core/entities/point.js';
import {Distance} from '../../core/tools/distance.js';

const core = new Core();
let output;

core.notify = (notification) => {
  output = notification;
};

test('Test distance.action', () => {
  // Add items to scene
  core.scene.addItem('Line', {points: [new Point(), new Point(0, 10)]});

  const distance = new Distance();

  // set base point
  distance.points.push(new Point());

  // set destination point
  distance.points.push(new Point(0, 10));

  // Perform distance
  distance.action(core);

  expect(output).not.toBeUndefined();
  expect(output).toBe('Length: 10.0 &#916;X: 0.0 &#916;Y: 10.0');
});
