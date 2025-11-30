import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Extend } from '../../core/tools/extend.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { expect, jest } from '@jest/globals';

const core = new Core();

// Test cases for user input
const inputScenarios = [

  { desc: 'Trim selection',
    inputs: [new SingleSelection(1, new Point())],
  },
];

test.each(inputScenarios)('Trim.execute handles $desc', async (scenario) => {
  const { inputs } = scenario;
  const origInputManager = core.scene.inputManager;

  // mock action function
  const actionSpy = jest.fn();

  let callCount = 0;
  core.scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        const input = inputs[callCount];
        console.log('input:', input);
        callCount++;
        return input;
      }
    },
    // mock the ation command
    actionCommand: () => actionSpy(),
  };

  // clear all scene entities
  core.scene.clear();
  // create line
  core.scene.addItem('Line', { points: [new Point(), new Point(10, 0)] });
  // create circle
  core.scene.addItem('Circle', { points: [new Point(), new Point(10, 0)] });
  // select line
  core.scene.selectionManager.selectionSet.selectionSet.push(0);

  const extend = new Extend();
  await extend.execute();

  expect(extend.selectedBoundaryItems[0]).toEqual(core.scene.entities.get(0));
  expect(extend.selectedItem).toBe(core.scene.entities.get(1));
  expect(actionSpy).toHaveBeenCalled();

  // Restore original inputManager
  core.scene.inputManager = origInputManager;
});

test('Test Extend.action', () => {
  const lineOneStart = new Point(100, 0);
  const lineOneEnd = new Point(100, 100);

  const lineTwoStart = new Point(-50, 50);
  const lineTwoEnd = new Point(50, 50);

  const lineThreeStart = new Point(0, 0);
  const lineThreeEnd = new Point(0, 25);

  const crossingLineStart = new Point(0, 0);
  const crossingLineEnd = new Point(50, 50);

  const extend = new Extend();

  /**
   * Extend test one
   * perpendicular lines
   * Extend end from horizontal line
   */
  // clear all scene entities
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [lineTwoStart, lineTwoEnd] });
  // Select boundary item
  extend.selectedBoundaryItems = [core.scene.entities.get(0)];
  // select item to trim
  extend.selectedItem = core.scene.entities.get(1);
  // set mouse location - required for Extend
  core.mouse.setPosFromScenePoint(new Point(40, 50));
  // Perform Extend
  extend.action();

  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineOneStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(core.scene.entities.get(1).points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.entities.get(1).points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.entities.get(1).points[1].x).toBe(100);
  expect(core.scene.entities.get(1).points[1].y).toBe(lineTwoEnd.y);

  /**
   * Extend test two
   * perpendicular lines
   * Extend end from vertical line
   */

  // clear scene items
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineTwoStart, lineTwoEnd] });
  core.scene.addItem('Line', { points: [lineThreeStart, lineThreeEnd] });
  // Select boundary item
  extend.selectedBoundaryItems = [core.scene.entities.get(0)];
  // select item to extend
  extend.selectedItem = core.scene.entities.get(1);
  // set mouse location - required for Extend
  core.mouse.setPosFromScenePoint(new Point(0, 20));
  // Perform Extend
  extend.action();

  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineTwoEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineTwoEnd.y);

  // line two
  expect(core.scene.entities.get(1).points[0].x).toBe(lineThreeStart.x);
  expect(core.scene.entities.get(1).points[0].y).toBe(lineThreeStart.y);
  expect(core.scene.entities.get(1).points[1].x).toBe(lineThreeEnd.x);
  expect(core.scene.entities.get(1).points[1].y).toBe(50);

  /**
   * Extend test three
   * crossing lines
   * trim end from crossing line
   */
  // clear scene items
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [crossingLineStart, crossingLineEnd] });
  // Select boundary item
  extend.selectedBoundaryItems = [core.scene.entities.get(0)];
  // select item to trim
  extend.selectedItem = core.scene.entities.get(1);
  // set mouse location - required for Extend
  core.mouse.setPosFromScenePoint(new Point(35, 35));
  // Perform Extend
  extend.action();

  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineOneStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(core.scene.entities.get(1).points[0].x).toBe(crossingLineStart.x);
  expect(core.scene.entities.get(1).points[0].y).toBe(crossingLineStart.y);
  expect(core.scene.entities.get(1).points[1].x).toBe(100);
  expect(core.scene.entities.get(1).points[1].y).toBe(100);
});
