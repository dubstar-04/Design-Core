import {Core} from '../../core/core/core.js';
import {DesignCore} from '../../core/designCore.js';
import {Point} from '../../core/entities/point.js';
import {Extend} from '../../core/tools/extend.js';

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
  DesignCore.Scene.addItem('Line', {points: [lineOneStart, lineOneEnd]});
  DesignCore.Scene.addItem('Line', {points: [lineTwoStart, lineTwoEnd]});
  // Select boundary item
  DesignCore.Scene.selectionManager.addToSelectionSet(0);
  // select item to Extend
  extend.selectedIndex = 1;
  // set mouse location - required for Extend
  DesignCore.Mouse.setPosFromScenePoint(new Point(40, 50));
  // Perform Extend
  extend.action();

  // line one
  expect(DesignCore.Scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(DesignCore.Scene.items[0].points[0].y).toBe(lineOneStart.y);
  expect(DesignCore.Scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(DesignCore.Scene.items[0].points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(DesignCore.Scene.items[1].points[0].x).toBe(lineTwoStart.x);
  expect(DesignCore.Scene.items[1].points[0].y).toBe(lineTwoStart.y);
  expect(DesignCore.Scene.items[1].points[1].x).toBe(100);
  expect(DesignCore.Scene.items[1].points[1].y).toBe(lineTwoEnd.y);

  /**
   * Extend test two
   * perpendicular lines
   * Extend end from vertical line
   */

  // clear scene items
  DesignCore.Scene.items = [];
  // Add items to scene
  DesignCore.Scene.addItem('Line', {points: [lineTwoStart, lineTwoEnd]});
  DesignCore.Scene.addItem('Line', {points: [lineThreeStart, lineThreeEnd]});
  // Select boundary item
  DesignCore.Scene.selectionManager.addToSelectionSet(0);
  // select item to Extend
  extend.selectedIndex = 1;
  // set mouse location - required for Extend
  DesignCore.Mouse.setPosFromScenePoint(new Point(0, 20));
  // Perform Extend
  extend.action();

  // line one
  expect(DesignCore.Scene.items[0].points[0].x).toBe(lineTwoStart.x);
  expect(DesignCore.Scene.items[0].points[0].y).toBe(lineTwoStart.y);
  expect(DesignCore.Scene.items[0].points[1].x).toBe(lineTwoEnd.x);
  expect(DesignCore.Scene.items[0].points[1].y).toBe(lineTwoEnd.y);

  // line two
  expect(DesignCore.Scene.items[1].points[0].x).toBe(lineThreeStart.x);
  expect(DesignCore.Scene.items[1].points[0].y).toBe(lineThreeStart.y);
  expect(DesignCore.Scene.items[1].points[1].x).toBe(lineThreeEnd.x);
  expect(DesignCore.Scene.items[1].points[1].y).toBe(50);

  /**
   * Extend test three
   * crossing lines
   * trim end from crossing line
   */
  // clear scene items
  DesignCore.Scene.items = [];
  // Add items to scene
  DesignCore.Scene.addItem('Line', {points: [lineOneStart, lineOneEnd]});
  DesignCore.Scene.addItem('Line', {points: [crossingLineStart, crossingLineEnd]});
  // Select boundary item
  DesignCore.Scene.selectionManager.addToSelectionSet(0);
  // select item to Extend
  extend.selectedIndex = 1;
  // set mouse location - required for Extend
  DesignCore.Mouse.setPosFromScenePoint(new Point(35, 35));
  // Perform Extend
  extend.action();

  // line one
  expect(DesignCore.Scene.items[0].points[0].x).toBe(lineOneStart.x);
  expect(DesignCore.Scene.items[0].points[0].y).toBe(lineOneStart.y);
  expect(DesignCore.Scene.items[0].points[1].x).toBe(lineOneEnd.x);
  expect(DesignCore.Scene.items[0].points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(DesignCore.Scene.items[1].points[0].x).toBe(crossingLineStart.x);
  expect(DesignCore.Scene.items[1].points[0].y).toBe(crossingLineStart.y);
  expect(DesignCore.Scene.items[1].points[1].x).toBe(100);
  expect(DesignCore.Scene.items[1].points[1].y).toBe(100);
});
