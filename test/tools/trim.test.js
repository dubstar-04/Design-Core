import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Trim } from '../../core/tools/trim.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { expect, jest } from '@jest/globals';
import { withMockInput } from '../test-helpers/test-helpers.js';

const core = new Core();

// Test cases for user input
const inputScenarios = [

  { desc: 'Trim selection',
    inputs: [new SingleSelection(1, new Point())],
  },
];

test.each(inputScenarios)('Trim.execute handles $desc', async (scenario) => {
  const { inputs } = scenario;
  const actionSpy = jest.fn();

  // clear all scene entities
  core.scene.clear();
  // create line
  core.scene.addItem('Line', { points: [new Point(), new Point(10, 0)] });
  // create circle
  core.scene.addItem('Circle', { points: [new Point(), new Point(10, 0)] });
  // select line
  core.scene.selectionManager.selectionSet.selectionSet.push(0);

  await withMockInput(core.scene, inputs, async () => {
    const trim = new Trim();
    await trim.execute();

    expect(trim.selectedBoundaryItems[0]).toEqual(core.scene.entities.get(0));
    expect(trim.selectedItem).toBe(core.scene.entities.get(1));
    expect(actionSpy).toHaveBeenCalled();
  }, { extraMethods: { actionCommand: () => actionSpy() } });
});

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
  // clear all scene entities
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [lineTwoStart, lineTwoEnd] });
  // Select boundary item
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];
  // select item to trim
  trim.selectedItem = core.scene.entities.get(1);
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(10, 50));
  // Perform trim
  trim.action();

  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineOneStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(core.scene.entities.get(1).points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.entities.get(1).points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.entities.get(1).points[1].x).toBe(0);
  expect(core.scene.entities.get(1).points[1].y).toBe(lineTwoEnd.y);

  /**
   * Trim test two
   * perpendicular lines
   * trim start from horizontal line
   */
  // clear scene items
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [lineTwoStart, lineTwoEnd] });
  // Select boundary item
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];
  // select item to trim
  trim.selectedItem = core.scene.entities.get(1);
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(-10, 50));
  // Perform trim
  trim.action();

  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineOneStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineOneEnd.y);

  // line two
  expect(core.scene.entities.get(1).points[0].x).toBe(0);
  expect(core.scene.entities.get(1).points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.entities.get(1).points[1].x).toBe(lineTwoEnd.x);
  expect(core.scene.entities.get(1).points[1].y).toBe(lineTwoEnd.y);

  /**
   * Trim test three
   * perpendicular lines
   * trim end from vertical line
   */
  // clear scene items
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [lineTwoStart, lineTwoEnd] });
  // Select boundary item
  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  // select item to trim
  trim.selectedItem = core.scene.entities.get(0);
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(0, 60));
  // Perform trim
  trim.action();

  // index 0 is now line two
  // line Two
  expect(core.scene.entities.get(0).points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineTwoEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineTwoEnd.y);

  // index 1 is now line one
  // line One
  expect(core.scene.entities.get(1).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(1).points[0].y).toBe(lineOneStart.y);
  expect(core.scene.entities.get(1).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(1).points[1].y).toBe(50);

  /**
   * Trim test four
   * perpendicular lines
   * trim start from vertical line
   */
  // clear scene items
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [lineTwoStart, lineTwoEnd] });
  // Select boundary item
  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  // select item to trim
  trim.selectedItem = core.scene.entities.get(0);
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(0, 30));
  // Perform trim
  trim.action();

  // index 0 is now line two
  // line two
  expect(core.scene.entities.get(1).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(1).points[0].y).toBe(50);
  expect(core.scene.entities.get(1).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(1).points[1].y).toBe(lineOneEnd.y);

  // index 1 is now line two
  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineTwoStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineTwoStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineTwoEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineTwoEnd.y);


  /**
   * Trim test five
   * crossing lines
   * trim end from crossing line
   */
  // clear scene items
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [crossingLineStart, crossingLineEnd] });
  // Select boundary item
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];
  // select item to trim
  trim.selectedItem = core.scene.entities.get(1);
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(25, 75));
  // Perform trim
  trim.action();

  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineOneStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineOneEnd.y);

  // crossing line
  expect(core.scene.entities.get(1).points[0].x).toBe(crossingLineStart.x);
  expect(core.scene.entities.get(1).points[0].y).toBe(crossingLineStart.y);
  expect(core.scene.entities.get(1).points[1].x).toBe(0);
  expect(core.scene.entities.get(1).points[1].y).toBe(50);

  /**
   * Trim test six
   * crossing lines
   * trim start from crossing line
   */
  // clear scene items
  core.scene.clear();
  // Add items to scene
  core.scene.addItem('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addItem('Line', { points: [crossingLineStart, crossingLineEnd] });
  // Select boundary item
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];
  // select item to trim
  trim.selectedItem = core.scene.entities.get(1);
  // set mouse location - required for trim
  core.mouse.setPosFromScenePoint(new Point(-25, 25));
  // Perform trim
  trim.action();

  // line one
  expect(core.scene.entities.get(0).points[0].x).toBe(lineOneStart.x);
  expect(core.scene.entities.get(0).points[0].y).toBe(lineOneStart.y);
  expect(core.scene.entities.get(0).points[1].x).toBe(lineOneEnd.x);
  expect(core.scene.entities.get(0).points[1].y).toBe(lineOneEnd.y);

  // crossing line
  expect(core.scene.entities.get(1).points[0].x).toBe(0);
  expect(core.scene.entities.get(1).points[0].y).toBe(50);
  expect(core.scene.entities.get(1).points[1].x).toBe(crossingLineEnd.x);
  expect(core.scene.entities.get(1).points[1].y).toBe(crossingLineEnd.y);
});

test('Test Trim.action polyline - trim end segment', () => {
  // Polyline from (0,0) to (50,0) to (100,0)
  // Vertical line at x=75 as boundary
  // Mouse near (90,0) - to the right of the boundary
  // Expected: Polyline trimmed to (0,0) (50,0) (75,0)

  const trim = new Trim();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(75, -50), new Point(75, 50)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(90, 0));
  trim.action();

  // Original polyline removed, new one added
  // Line boundary should still exist at index 0
  expect(core.scene.entities.get(0).points[0].x).toBe(75);
  expect(core.scene.entities.get(0).points[0].y).toBe(-50);

  // Trimmed polyline at index 1
  const trimmed = core.scene.entities.get(1);
  expect(trimmed.points.length).toBe(3);
  expect(trimmed.points[0].x).toBe(0);
  expect(trimmed.points[0].y).toBe(0);
  expect(trimmed.points[1].x).toBe(50);
  expect(trimmed.points[1].y).toBe(0);
  expect(trimmed.points[2].x).toBe(75);
  expect(trimmed.points[2].y).toBe(0);
});

test('Test Trim.action polyline - trim start segment', () => {
  // Polyline from (0,0) to (50,0) to (100,0)
  // Vertical line at x=25 as boundary
  // Mouse near (10,0) - to the left of the boundary
  // Expected: Polyline trimmed to (25,0) (50,0) (100,0)

  const trim = new Trim();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(25, -50), new Point(25, 50)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(10, 0));
  trim.action();

  // Trimmed polyline
  const trimmed = core.scene.entities.get(1);
  expect(trimmed.points.length).toBe(3);
  expect(trimmed.points[0].x).toBe(25);
  expect(trimmed.points[0].y).toBe(0);
  expect(trimmed.points[1].x).toBe(50);
  expect(trimmed.points[1].y).toBe(0);
  expect(trimmed.points[2].x).toBe(100);
  expect(trimmed.points[2].y).toBe(0);
});

test('Test Trim.action polyline - trim middle segment', () => {
  // Polyline from (0,0) to (50,0) to (100,0) to (150,0)
  // Vertical line at x=25 and x=75 as boundary
  // Mouse near (50,0) - between the two boundaries
  // Expected: Two polylines: (0,0)-(25,0) and (75,0)-(100,0)-(150,0)

  const trim = new Trim();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(100, 0), new Point(150, 0)] });
  core.scene.addItem('Line', { points: [new Point(25, -50), new Point(25, 50)] });
  core.scene.addItem('Line', { points: [new Point(75, -50), new Point(75, 50)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1), core.scene.entities.get(2)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(50, 0));
  trim.action();

  // Two boundary lines remain, original polyline removed, two new polylines added
  // Count entities - should have 4 (2 lines + 2 polylines)
  expect(core.scene.entities.count()).toBe(4);

  // Find the two polylines
  const polylines = [];
  for (let i = 0; i < core.scene.entities.count(); i++) {
    const entity = core.scene.entities.get(i);
    if (entity.type === 'Lwpolyline') {
      polylines.push(entity);
    }
  }

  expect(polylines.length).toBe(2);

  // Sort polylines by first point x
  polylines.sort((a, b) => a.points[0].x - b.points[0].x);

  // First polyline: (0,0) to (25,0)
  expect(polylines[0].points.length).toBe(2);
  expect(polylines[0].points[0].x).toBe(0);
  expect(polylines[0].points[1].x).toBe(25);

  // Second polyline: (75,0) to (100,0) to (150,0)
  expect(polylines[1].points.length).toBe(3);
  expect(polylines[1].points[0].x).toBe(75);
  expect(polylines[1].points[1].x).toBe(100);
  expect(polylines[1].points[2].x).toBe(150);
});
