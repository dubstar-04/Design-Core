import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Trim } from '../../core/tools/trim.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { Strings } from '../../core/lib/strings.js';
import { DesignCore } from '../../core/designCore.js';
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

  // Original polyline removed, new one added, boundary line remains
  expect(core.scene.entities.count()).toBe(2);

  // Find entities by type
  let boundary;
  let trimmed;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    const entity = core.scene.entities.get(i);
    if (entity.type === 'Line') boundary = entity;
    if (entity.type === 'Polyline') trimmed = entity;
  }

  // Boundary line unchanged
  expect(boundary.points[0].x).toBe(75);
  expect(boundary.points[0].y).toBe(-50);

  // Trimmed polyline
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

  // Original polyline removed, new one added, boundary line remains
  expect(core.scene.entities.count()).toBe(2);

  // Find trimmed polyline by type
  let trimmed;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Polyline') {
      trimmed = core.scene.entities.get(i);
    }
  }

  expect(trimmed).toBeDefined();
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
    if (entity.type === 'Polyline') {
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

test('Test Trim.action polyline - trim bulged arc segment', () => {
  // Polyline: (0,0) with bulge=1 -> arc -> (100,0) -> straight -> (200,0)
  // With bulge=1 (CCW) the semicircular arc goes through (50,-50)
  // Arc center: (50,0), radius: 50
  // Boundary: vertical line at x=50
  // Intersection at (50,-50) — bottom of semicircle
  // Mouse at (75,-40) — right of intersection on the arc
  // Expected: polyline trimmed to [(0,0) with partial bulge, (50,-50)]

  const trim = new Trim();
  core.scene.clear();

  core.scene.addItem('Lwpolyline', { points: [new Point(0, 0, 1), new Point(100, 0), new Point(200, 0)] });
  core.scene.addItem('Line', { points: [new Point(50, -100), new Point(50, 100)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(75, -40));
  trim.action();

  // Original polyline removed, one new trimmed piece added, boundary remains
  expect(core.scene.entities.count()).toBe(2);

  // Find the trimmed polyline
  let trimmed;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Polyline') {
      trimmed = core.scene.entities.get(i);
    }
  }

  expect(trimmed).toBeDefined();
  expect(trimmed.points.length).toBe(2);

  // First point: (0,0) with partial bulge for 90° arc
  // Original 180° arc split at midpoint -> 90° arc
  // bulge = tan(includedAngle/4) = tan(π/8) = √2 - 1
  expect(trimmed.points[0].x).toBeCloseTo(0, 5);
  expect(trimmed.points[0].y).toBeCloseTo(0, 5);
  expect(trimmed.points[0].bulge).toBeCloseTo(Math.tan(Math.PI / 8), 5);

  // Second point: intersection at (50,-50), no bulge
  expect(trimmed.points[1].x).toBeCloseTo(50, 5);
  expect(trimmed.points[1].y).toBeCloseTo(-50, 5);
  expect(trimmed.points[1].bulge).toBe(0);
});

test('Trim.register returns correct metadata', () => {
  const reg = Trim.register();
  expect(reg.command).toBe('Trim');
  expect(reg.shortcut).toBe('TR');
  expect(reg.type).toBe('Tool');
});

test('Trim.preview does not throw', () => {
  const trim = new Trim();
  expect(() => trim.preview()).not.toThrow();
});

test('Trim.preview returns early when no boundary items set', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, -10), new Point(0, 10)] });
  DesignCore.Scene.previewEntities.clear();

  const trim = new Trim();
  // selectedBoundaryItems is empty by default
  trim.preview();

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Trim.preview returns early when findClosestItem returns undefined', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, -10), new Point(0, 10)] });
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
  DesignCore.Scene.previewEntities.clear();

  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(undefined);
  trim.preview();
  findSpy.mockRestore();

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Trim.preview returns early when hovered entity does not implement trim', () => {
  // Text does not override Entity.trim() — preview must not emit a notification.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary
  core.scene.addItem('Text', { points: [new Point(5, 0)], string: 'hello' }); // unsupported
  DesignCore.Scene.previewEntities.clear();

  const notifySpy = jest.spyOn(core, 'notify');
  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(5, 0);
  trim.preview();
  findSpy.mockRestore();
  notifySpy.mockRestore();

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
  expect(notifySpy).not.toHaveBeenCalled();
});

test('Trim.preview returns early when hovered entity has no intersections with boundary', () => {
  // Two parallel horizontal lines — no intersection with the vertical boundary
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary (vertical)
  core.scene.addItem('Line', { points: [new Point(-10, 5), new Point(10, 5)] }); // hovered (horizontal, no intersection with boundary)
  DesignCore.Scene.previewEntities.clear();

  // Boundary is entity 0; hovered is entity 1 — they are parallel on the y-axis, so no intersection
  core.scene.addItem('Line', { points: [new Point(-10, 20), new Point(10, 20)] }); // extra line, no intersection

  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(2)]; // horizontal boundary — parallel to hovered

  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(0, 5);
  trim.preview();
  findSpy.mockRestore();

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Trim.preview populates previewEntities when entity can be trimmed', () => {
  // Vertical boundary at x=0; horizontal line from (-10,0) to (10,0) is the hovered entity.
  // Mouse at (5,0) → trims the right half, leaving the left half as a preview.
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary
  core.scene.addItem('Line', { points: [new Point(-10, 0), new Point(10, 0)] }); // hovered
  DesignCore.Scene.previewEntities.clear();

  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(5, 0);
  trim.preview();
  findSpy.mockRestore();

  // dulled original + at least one trimmed survivor
  expect(DesignCore.Scene.previewEntities.count()).toBeGreaterThanOrEqual(2);
});

test('Trim.execute returns early when boundary input is undefined', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Line', { points: [new Point(), new Point(10, 0)] });

  await withMockInput(core.scene, [undefined], async () => {
    const trim = new Trim();
    await trim.execute();
    expect(trim.selectedBoundaryItems).toHaveLength(0);
  });
});

test('Trim.execute exits selection loop when selection input is undefined', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Line', { points: [new Point(), new Point(10, 0)] });
  core.scene.addItem('Circle', { points: [new Point(), new Point(5, 0)] });
  // preselect first item as boundary
  core.scene.selectionManager.selectionSet.selectionSet.push(0);

  const executeCommandSpy = jest.fn();
  await withMockInput(core.scene, [undefined], async () => {
    const trim = new Trim();
    await trim.execute();
    expect(trim.selectedBoundaryItems).toHaveLength(1);
    expect(executeCommandSpy).toHaveBeenCalled();
  }, { extraMethods: { executeCommand: () => executeCommandSpy() } });
});

test('Trim.execute calls actionCommand once per trim selection', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addItem('Line', { points: [new Point(0, -10), new Point(0, 10)] });
  core.scene.addItem('Circle', { points: [new Point(-5, 0), new Point(0, 0)] });
  core.scene.addItem('Circle', { points: [new Point(-5, 0), new Point(0, 0)] });
  // preselect line as boundary
  core.scene.selectionManager.selectionSet.selectionSet.push(0);

  const actionSpy = jest.fn();
  await withMockInput(
      core.scene,
      [new SingleSelection(1, new Point()), new SingleSelection(2, new Point()), undefined],
      async () => {
        const trim = new Trim();
        await trim.execute();
        expect(actionSpy).toHaveBeenCalledTimes(2);
      },
      { extraMethods: { actionCommand: () => actionSpy() } },
  );
});

test('Trim.action does nothing when selectedItem is null', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(), new Point(10, 0)] });
  const trim = new Trim();
  trim.selectedItem = null;
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  expect(() => trim.action()).not.toThrow();
});

test('Trim.action does nothing when selectedBoundaryItems is empty', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(), new Point(10, 0)] });
  const trim = new Trim();
  trim.selectedItem = core.scene.entities.get(0);
  trim.selectedBoundaryItems = [];

  expect(() => trim.action()).not.toThrow();
  expect(trim.selectedItem).toBeNull();
});

test('Trim.action notifies when no intersection found (parallel lines)', () => {
  core.scene.clear();
  // Two parallel vertical lines - no intersection
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(0, 100)] });
  core.scene.addItem('Line', { points: [new Point(10, 0), new Point(10, 100)] });

  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];
  trim.selectedItem = core.scene.entities.get(1);

  const notifySpy = jest.spyOn(core, 'notify').mockImplementation(() => {});
  trim.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOTRIM));
  expect(trim.selectedItem).toBeNull();
  notifySpy.mockRestore();
});

test('Trim.action notifies when boundary item equals selected item', () => {
  core.scene.clear();
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(100, 0)] });
  const entity = core.scene.entities.get(0);

  const trim = new Trim();
  trim.selectedBoundaryItems = [entity];
  trim.selectedItem = entity;

  const notifySpy = jest.spyOn(core, 'notify').mockImplementation(() => {});
  trim.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOTRIM));
  notifySpy.mockRestore();
});

test('Trim.action trims an arc', () => {
  // Arc: center (0,0), start (10,0), end (-10,0) — CCW upper semicircle through (0,10)
  // Boundary: vertical line at x=0, intersects arc at (0,10)
  // Mouse at (7,7) — in the right half, selects (10,0)→(0,10) segment for removal
  // Expected: original arc removed, shorter arc from (0,10) to (-10,0) added

  const trim = new Trim();
  core.scene.clear();

  core.scene.addItem('Arc', { points: [new Point(0, 0), new Point(10, 0), new Point(-10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, -20), new Point(0, 20)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(7, 7));
  trim.action();

  expect(core.scene.entities.count()).toBe(2);

  let arc;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Arc') arc = core.scene.entities.get(i);
  }
  expect(arc).toBeDefined();
  // Remaining arc runs from the intersection (0,10) to the original end (-10,0)
  expect(arc.points[1].x).toBeCloseTo(0);
  expect(arc.points[1].y).toBeCloseTo(10);
  expect(arc.points[2].x).toBeCloseTo(-10);
  expect(arc.points[2].y).toBeCloseTo(0);
});

test('Trim.action trims a circle', () => {
  // Circle: center (0,0), radius 10
  // Boundary: vertical line at x=0, intersects circle at (0,10) and (0,-10)
  // Mouse at (8,0) — on the right side
  // Expected: original circle removed, arc covering the right side added

  const trim = new Trim();
  core.scene.clear();

  core.scene.addItem('Circle', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addItem('Line', { points: [new Point(0, -20), new Point(0, 20)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(8, 0));
  trim.action();

  // circle removed, arc added, boundary line remains
  expect(core.scene.entities.count()).toBe(2);

  let arc;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Arc') arc = core.scene.entities.get(i);
  }
  expect(arc).toBeDefined();
  // Arc center should match the original circle center
  expect(arc.points[0].x).toBe(0);
  expect(arc.points[0].y).toBe(0);
});
