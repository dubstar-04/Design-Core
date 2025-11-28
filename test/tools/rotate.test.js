import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Rotate } from '../../core/tools/rotate.js';

const core = new Core();

const inputScenarios = [
  {
    desc: 'rotate by point',
    inputs: [new Point(10, 0), new Point(30, 20)],
    result: new Point(17.07106, 7.07106),

  },
  {
    desc: 'rotate by angle',
    inputs: [new Point(10, 0), 45],
    result: new Point(17.07106, 7.07106),

  },
  {
    desc: 'rotate by negative angle',
    inputs: [new Point(10, 0), -45],
    result: new Point(17.07106, -7.07106),

  },
  {
    desc: 'rotate 90 by reference point',
    inputs: [new Point(10, 0), 'r', new Point(), new Point(0, 20), new Point(-10, 0)],
    result: new Point(10, 10),
  },
];

test.each(inputScenarios)('Rotate.execute handles $desc', async (scenario) => {
  const { inputs, result } = scenario;
  const origInputManager = core.scene.inputManager;
  let callCount = 0;
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        const input = inputs[callCount];
        console.log(`Providing input: ${input}`);
        callCount++;
        return input;
      }
    },
  };

  // clear all scene entities
  core.scene.clear();
  // create line
  const pointOne = new Point(10, 0);
  const pointTwo = new Point(20, 0);
  core.scene.addItem('Line', { points: [pointOne, pointTwo] });

  // select line
  core.scene.selectionManager.addToSelectionSet(0);

  const rotate = new Rotate();
  await rotate.execute();

  rotate.action();

  const line = core.scene.entities.get(0);

  expect(line.points[0].x).toBe(pointOne.x);
  expect(line.points[0].y).toBeCloseTo(pointOne.y);

  expect(line.points[1].x).toBeCloseTo(result.x);
  expect(line.points[1].y).toBeCloseTo(result.y);


  // Restore original inputManager
  core.scene.inputManager = origInputManager;
});

test('Test Rotate.action', () => {
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

  /**
   * rotate by 90
   */

  const rotate = new Rotate();

  // set base point
  rotate.points.push(new Point());

  // set rotation destination point
  rotate.points.push(new Point(0, 10));

  // Perform rotate
  rotate.action();

  for (let i = 0; i < core.scene.entities.count(); i++) {
    expect(core.scene.entities.get(i).points[0].x).toBeCloseTo(0);
    expect(core.scene.entities.get(i).points[0].y).toBeCloseTo(10);
  }

  /**
   * rotate by -90
   */

  // reset points
  rotate.points = [];

  // set base point
  rotate.points.push(new Point());

  // set rotation destination point
  rotate.points.push(new Point(0, -10));

  // Perform rotate
  rotate.action();

  for (let i = 0; i < core.scene.entities.count(); i++) {
    expect(core.scene.entities.get(i).points[0].x).toBeCloseTo(10);
    expect(core.scene.entities.get(i).points[0].y).toBeCloseTo(0);
  }
});
