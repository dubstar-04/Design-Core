import {Line} from '../../core/entities/line';
import {Point} from '../../core/entities/point';
import {Scene} from '../../core/lib/scene.js';

const scene = new Scene();


test('Test Scene.boundingBox', () => {
  // empty scene
  expect(scene.boundingBox()).toBeUndefined();

  const line1 = new Line({points: [new Point(-102, -102), new Point(201, 202)]});
  // add to scene (bypass scene.addItem())
  scene.items.push(line1);
  expect(scene.boundingBox().xMin).toBeCloseTo(-102);
  expect(scene.boundingBox().xMax).toBeCloseTo(201);
  expect(scene.boundingBox().yMin).toBeCloseTo(-102);
  expect(scene.boundingBox().yMax).toBeCloseTo(202);

  const line2 = new Line({points: [new Point(1001, -2002), new Point(-2001, 2002)]});
  // add to scene (bypass scene.addItem())
  scene.items.push(line2);
  expect(scene.boundingBox().xMin).toBeCloseTo(-2001);
  expect(scene.boundingBox().xMax).toBeCloseTo(1001);
  expect(scene.boundingBox().yMin).toBeCloseTo(-2002);
  expect(scene.boundingBox().yMax).toBeCloseTo(2002);
});
