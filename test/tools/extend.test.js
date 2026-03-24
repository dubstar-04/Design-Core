import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Extend } from '../../core/tools/extend.js';
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
    const extend = new Extend();
    await extend.execute();

    expect(extend.selectedBoundaryItems[0]).toEqual(core.scene.entities.get(0));
    expect(extend.selectedItem).toBe(core.scene.entities.get(1));
    expect(actionSpy).toHaveBeenCalled();
  }, { extraMethods: { actionCommand: () => actionSpy() } });
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
  // select item to extend
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

test('Test Extend.action line - endpoint coincident with intersection', () => {
  // Line from (0,50) to (25,50)
  // Zig-zag boundary polyline crossing at x=50, x=100, x=150, x=200
  // Successive extends should step through each crossing

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Line', { points: [new Point(0, 50), new Point(25, 50)] });
  core.scene.addItem('Lwpolyline', { points: [
    new Point(50, 0), new Point(50, 100), new Point(100, 100),
    new Point(100, 0), new Point(150, 0), new Point(150, 100),
    new Point(200, 100), new Point(200, 0),
  ] });

  const boundary = core.scene.entities.get(1);
  const line = core.scene.entities.get(0);

  const expected = [50, 100, 150, 200];
  for (const ex of expected) {
    extend.selectedBoundaryItems = [boundary];
    extend.selectedItem = line;
    core.mouse.setPosFromScenePoint(new Point(line.points[1].x - 5, 50));
    extend.action();
    expect(line.points[1].x).toBe(ex);
    expect(line.points[1].y).toBe(50);
  }
});

test('Test Extend.action polyline - endpoint coincident with intersection', () => {
  // Polyline from (0,0) to (50,50)
  // Boundary line from (100,0) to (100,100)
  // Endpoint is already at (50,50) (coincident with first intersection)
  // Expected: polyline extends to (100,100)

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 50)] });
  core.scene.addItem('Line', { points: [new Point(100, 0), new Point(100, 100)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(45, 45));
  extend.action();

  const polyline = core.scene.entities.get(0);
  expect(polyline.points[1].x).toBe(100);
  expect(polyline.points[1].y).toBe(100);
});

test('Test Extend.action polyline - 2-point polyline extend start', () => {
  // 2-point polyline from (50,0) to (100,0)
  // Boundary line at x=0
  // Mouse near (50,0) - the start of the polyline
  // Expected: first point extended to (0,0)

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(50, 0), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, -50), new Point(0, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(55, 0));
  extend.action();

  const polyline = core.scene.entities.get(0);
  expect(polyline.points[0].x).toBe(0);
  expect(polyline.points[0].y).toBe(0);
  expect(polyline.points[1].x).toBe(100);
  expect(polyline.points[1].y).toBe(0);
});

test('Test Extend.action polyline - extend end segment', () => {
  // Polyline from (0,0) to (50,0) to (75,0)
  // Vertical boundary line at x=100
  // Mouse near (75,0) - the end of the polyline
  // Expected: last point extended to (100,0)

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(75, 0)] });
  core.scene.addItem('Line', { points: [new Point(100, -50), new Point(100, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(80, 0));
  extend.action();

  const polyline = core.scene.entities.get(0);
  expect(polyline.points.length).toBe(3);
  expect(polyline.points[0].x).toBe(0);
  expect(polyline.points[0].y).toBe(0);
  expect(polyline.points[1].x).toBe(50);
  expect(polyline.points[1].y).toBe(0);
  expect(polyline.points[2].x).toBe(100);
  expect(polyline.points[2].y).toBe(0);
});

test('Test Extend.action polyline - extend start segment', () => {
  // Polyline from (25,0) to (50,0) to (100,0)
  // Vertical boundary line at x=0
  // Mouse near (25,0) - the start of the polyline
  // Expected: first point extended to (0,0)

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(25, 0), new Point(50, 0), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, -50), new Point(0, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(20, 0));
  extend.action();

  const polyline = core.scene.entities.get(0);
  expect(polyline.points.length).toBe(3);
  expect(polyline.points[0].x).toBe(0);
  expect(polyline.points[0].y).toBe(0);
  expect(polyline.points[1].x).toBe(50);
  expect(polyline.points[1].y).toBe(0);
  expect(polyline.points[2].x).toBe(100);
  expect(polyline.points[2].y).toBe(0);
});

test('Test Extend.action polyline - reject arc end segment', () => {
  // Polyline: (0,0) -> straight -> (50,0) with bulge=1 -> arc -> (100,0)
  // Vertical boundary line at x=125
  // Mouse near (100,0) - the end of the polyline (arc segment)
  // Expected: no extension, polyline unchanged

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0, 1), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(125, -50), new Point(125, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(100, 0));
  extend.action();

  // Polyline should be unchanged
  const polyline = core.scene.entities.get(0);
  expect(polyline.points.length).toBe(3);
  expect(polyline.points[0].x).toBe(0);
  expect(polyline.points[0].y).toBe(0);
  expect(polyline.points[1].x).toBe(50);
  expect(polyline.points[1].y).toBe(0);
  expect(polyline.points[2].x).toBe(100);
  expect(polyline.points[2].y).toBe(0);
});

test('Test Extend.action polyline - reject intersection behind endpoint', () => {
  // Polyline from (50,0) to (75,0) to (100,0)
  // Boundary line at x=25 (behind the start)
  // Mouse near (100,0) - the end of the polyline
  // The boundary is behind the end, so no extension should occur

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(50, 0), new Point(75, 0), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(25, -50), new Point(25, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(95, 0));
  extend.action();

  // Polyline should be unchanged - intersection is behind the endpoint
  const polyline = core.scene.entities.get(0);
  expect(polyline.points[2].x).toBe(100);
  expect(polyline.points[2].y).toBe(0);
});

test('Test Extend.action polyline - reject shortening intersection', () => {
  // Polyline from (0,0) to (50,0) to (100,0)
  // Boundary line at x=75 (between adjacent and endpoint)
  // Mouse near (100,0) - the end of the polyline
  // Intersection is in the correct direction but would shorten the polyline

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(75, -50), new Point(75, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(95, 0));
  extend.action();

  // Polyline should be unchanged - intersection would shorten it
  const polyline = core.scene.entities.get(0);
  expect(polyline.points[2].x).toBe(100);
  expect(polyline.points[2].y).toBe(0);
});

test('Test Extend.action polyline - extend with arc start segment', () => {
  // Polyline: bulge=1 arc -> (50,0) -> straight -> (100,0)
  // Boundary at x=125, mouse near (100,0)
  // The mouse is near the end (line segment), not the arc start
  // Should extend the line segment end

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0, 1), new Point(50, 0), new Point(100, 0)] });
  core.scene.addItem('Line', { points: [new Point(125, -50), new Point(125, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(110, 0));
  extend.action();

  const polyline = core.scene.entities.get(0);
  expect(polyline.points[2].x).toBe(125);
  expect(polyline.points[2].y).toBe(0);
});

test('Test Extend.action polyline - no intersections', () => {
  // Polyline from (0,0) to (50,0)
  // Boundary line parallel to polyline (no intersection possible)
  // Expected: no extension

  const extend = new Extend();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, 50), new Point(100, 50)] });

  extend.selectedBoundaryItems = [core.scene.entities.get(1)];
  extend.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(45, 0));
  extend.action();

  const polyline = core.scene.entities.get(0);
  expect(polyline.points[0].x).toBe(0);
  expect(polyline.points[1].x).toBe(50);
});
