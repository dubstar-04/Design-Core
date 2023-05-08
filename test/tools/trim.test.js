import {Core} from '../../core/core.js';
import {Point} from '../../core/entities/point.js';
import {Trim} from '../../core/tools/trim.js';

const core = new Core();

test('Test Trim.action', () => {
  const lineOneStart = new Point();
  const lineOneEnd = new Point(0, 100);

  const lineTwoStart = new Point(-50, 50);
  const lineTwoEnd = new Point(50, 50);

  const crossingLineStart = new Point(-50, 0);
  const crossingLineEnd = new Point(50, 100);

  const trim = new Trim();

  /**
   * Trim test one
   * perpendicular lines
   * trim end from horizontal line
   */
  // Add items to scene
  core.scene.addToScene('Line', {points: [lineOneStart, lineOneEnd]});
  core.scene.addToScene('Line', {points: [lineTwoStart, lineTwoEnd]});
  // Select boundary item
  core.scene.selectionManager.addToSelectionSet(0);
  // select item to trim
  trim.selectedIndex = 1;
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(10, 50));
  // Perform trim
  trim.action(core);

  // line one
  expect(core.scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(core.scene.items[0].points[0].y).toBe(lineOneStart.y);
  expect(core.scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.items[0].points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(core.scene.items[1].points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.items[1].points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.items[1].points[1].x).toBe(0);
  expect(core.scene.items[1].points[1].y).toBe(lineTwoEnd.y);

  /**
   * Trim test two
   * perpendicular lines
   * trim start from horizontal line
   */
  // clear scene items
  core.scene.items = [];
  // Add items to scene
  core.scene.addToScene('Line', {points: [lineOneStart, lineOneEnd]});
  core.scene.addToScene('Line', {points: [lineTwoStart, lineTwoEnd]});
  // Select boundary item
  core.scene.selectionManager.addToSelectionSet(0);
  // select item to trim
  trim.selectedIndex = 1;
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(-10, 50));
  // Perform trim
  trim.action(core);

  // line one
  expect(core.scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(core.scene.items[0].points[0].y).toBe(lineOneStart.y);
  expect(core.scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.items[0].points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(core.scene.items[1].points[0].x).toBe(0);
  expect(core.scene.items[1].points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.items[1].points[1].x).toBe(lineTwoEnd.x);
  expect(core.scene.items[1].points[1].y).toBe(lineTwoEnd.y);

  /**
   * Trim test three
   * perpendicular lines
   * trim end from vertical line
   */
  // clear scene items
  core.scene.items = [];
  // Add items to scene
  core.scene.addToScene('Line', {points: [lineOneStart, lineOneEnd]});
  core.scene.addToScene('Line', {points: [lineTwoStart, lineTwoEnd]});
  // Select boundary item
  core.scene.selectionManager.addToSelectionSet(1);
  // select item to trim
  trim.selectedIndex = 0;
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(0, 60));
  // Perform trim
  trim.action(core);

  // line one
  expect(core.scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(core.scene.items[0].points[0].y).toBe(lineOneStart.y);
  expect(core.scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.items[0].points[1].y).toBe(50);

  // line two
  expect(core.scene.items[1].points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.items[1].points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.items[1].points[1].x).toBe(lineTwoEnd.x);
  expect(core.scene.items[1].points[1].y).toBe(lineTwoEnd.y);

  /**
   * Trim test four
   * perpendicular lines
   * trim start from vertical line
   */
  // clear scene items
  core.scene.items = [];
  // Add items to scene
  core.scene.addToScene('Line', {points: [lineOneStart, lineOneEnd]});
  core.scene.addToScene('Line', {points: [lineTwoStart, lineTwoEnd]});
  // Select boundary item
  core.scene.selectionManager.addToSelectionSet(1);
  // select item to trim
  trim.selectedIndex = 0;
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(0, 30));
  // Perform trim
  trim.action(core);

  // line one
  expect(core.scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(core.scene.items[0].points[0].y).toBe(50);
  expect(core.scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.items[0].points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(core.scene.items[1].points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.items[1].points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.items[1].points[1].x).toBe(lineTwoEnd.x);
  expect(core.scene.items[1].points[1].y).toBe(lineTwoEnd.y);


  /**
   * Trim test five
   * crossing lines
   * trim end from crossing line
   */
  // clear scene items
  core.scene.items = [];
  // Add items to scene
  core.scene.addToScene('Line', {points: [lineOneStart, lineOneEnd]});
  core.scene.addToScene('Line', {points: [crossingLineStart, crossingLineEnd]});
  // Select boundary item
  core.scene.selectionManager.addToSelectionSet(0);
  // select item to trim
  trim.selectedIndex = 1;
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(25, 75));
  // Perform trim
  trim.action(core);

  // line one
  expect(core.scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(core.scene.items[0].points[0].y).toBe(lineOneStart.y);
  expect(core.scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.items[0].points[1].y).toBe(lineOneEnd.y);

  // crossing line
  expect(core.scene.items[1].points[0].x).toBe(crossingLineStart.x);
  expect(core.scene.items[1].points[0].y).toBe(crossingLineStart.y);
  expect(core.scene.items[1].points[1].x).toBe(0);
  expect(core.scene.items[1].points[1].y).toBe(50);

  /**
   * Trim test six
   * crossing lines
   * trim start from crossing line
   */
  // clear scene items
  core.scene.items = [];
  // Add items to scene
  core.scene.addToScene('Line', {points: [lineOneStart, lineOneEnd]});
  core.scene.addToScene('Line', {points: [crossingLineStart, crossingLineEnd]});
  // Select boundary item
  core.scene.selectionManager.addToSelectionSet(0);
  // select item to trim
  trim.selectedIndex = 1;
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(-25, 25));
  // Perform trim
  trim.action(core);

  // line one
  expect(core.scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(core.scene.items[0].points[0].y).toBe(lineOneStart.y);
  expect(core.scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.items[0].points[1].y).toBe(lineOneEnd.y);

  // crossing line
  expect(core.scene.items[1].points[0].x).toBe(0);
  expect(core.scene.items[1].points[0].y).toBe(50);
  expect(core.scene.items[1].points[1].x).toBe(crossingLineEnd.x);
  expect(core.scene.items[1].points[1].y).toBe(crossingLineEnd.y);
});
