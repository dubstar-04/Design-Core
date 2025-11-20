import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Extend } from '../../core/tools/extend.js';

const core = new Core();

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
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [lineTwoStart, lineTwoEnd] });
  // Select boundary item
  core.scene.selectionManager.addToSelectionSet(0);
  // select item to Extend
  extend.selectedIndex = 1;
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
  core.scene.selectionManager.addToSelectionSet(0);
  // select item to Extend
  extend.selectedIndex = 1;
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
  core.scene.selectionManager.addToSelectionSet(0);
  // select item to Extend
  extend.selectedIndex = 1;
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
