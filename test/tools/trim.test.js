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
  core.scene.addEntity('Line', { points: [new Point(), new Point(10, 0)] });
  // create circle
  core.scene.addEntity('Circle', { points: [new Point(), new Point(10, 0)] });
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
  core.scene.addEntity('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addEntity('Line', { points: [lineTwoStart, lineTwoEnd] });
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
  core.scene.addEntity('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addEntity('Line', { points: [lineTwoStart, lineTwoEnd] });
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
  core.scene.addEntity('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addEntity('Line', { points: [lineTwoStart, lineTwoEnd] });
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
  core.scene.addEntity('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addEntity('Line', { points: [lineTwoStart, lineTwoEnd] });
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
  core.scene.addEntity('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addEntity('Line', { points: [crossingLineStart, crossingLineEnd] });
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
  core.scene.addEntity('Line', { points: [lineOneStart, lineOneEnd] });
  core.scene.addEntity('Line', { points: [crossingLineStart, crossingLineEnd] });
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

  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(100, 0)] });
  core.scene.addEntity('Line', { points: [new Point(75, -50), new Point(75, 50)] });

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

  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(100, 0)] });
  core.scene.addEntity('Line', { points: [new Point(25, -50), new Point(25, 50)] });

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

  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0), new Point(50, 0), new Point(100, 0), new Point(150, 0)] });
  core.scene.addEntity('Line', { points: [new Point(25, -50), new Point(25, 50)] });
  core.scene.addEntity('Line', { points: [new Point(75, -50), new Point(75, 50)] });

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
  // Arc centre: (50,0), radius: 50
  // Boundary: vertical line at x=50
  // Intersection at (50,-50) — bottom of semicircle
  // Mouse at (75,-40) — right of intersection on the arc
  // Expected: polyline trimmed to [(0,0) with partial bulge, (50,-50)]

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0, 1), new Point(100, 0), new Point(200, 0)] });
  core.scene.addEntity('Line', { points: [new Point(50, -100), new Point(50, 100)] });

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
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] });
  DesignCore.Scene.previewEntities.clear();

  const trim = new Trim();
  // selectedBoundaryItems is empty by default
  trim.preview();

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Trim.preview returns early when findClosestItem returns undefined', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] });
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(10, 0)] });
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
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary
  core.scene.addEntity('Text', { points: [new Point(5, 0)], string: 'hello' }); // unsupported
  DesignCore.Scene.previewEntities.clear();

  const notifySpy = jest.spyOn(core, 'notify');
  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  const savedPointOnScene1 = DesignCore.Mouse.pointOnScene;
  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(5, 0);
  trim.preview();
  findSpy.mockRestore();
  notifySpy.mockRestore();
  DesignCore.Mouse.pointOnScene = savedPointOnScene1;

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
  expect(notifySpy).not.toHaveBeenCalled();
});

test('Trim.preview returns early when hovered entity has no intersections with boundary', () => {
  // Two parallel horizontal lines — no intersection with the vertical boundary
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary (vertical)
  core.scene.addEntity('Line', { points: [new Point(-10, 5), new Point(10, 5)] }); // hovered (horizontal, no intersection with boundary)
  DesignCore.Scene.previewEntities.clear();

  // Boundary is entity 0; hovered is entity 1 — they are parallel on the y-axis, so no intersection
  core.scene.addEntity('Line', { points: [new Point(-10, 20), new Point(10, 20)] }); // extra line, no intersection

  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(2)]; // horizontal boundary — parallel to hovered

  const savedPointOnScene2 = DesignCore.Mouse.pointOnScene;
  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(0, 5);
  trim.preview();
  findSpy.mockRestore();
  DesignCore.Mouse.pointOnScene = savedPointOnScene2;

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
});

test('Trim.preview populates previewEntities when entity can be trimmed', () => {
  // Vertical boundary at x=0; horizontal line from (-10,0) to (10,0) is the hovered entity.
  // Mouse at (5,0) → trims the right half, leaving the left half as a preview.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary
  core.scene.addEntity('Line', { points: [new Point(-10, 0), new Point(10, 0)] }); // hovered
  DesignCore.Scene.previewEntities.clear();

  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  const savedPointOnScene3 = DesignCore.Mouse.pointOnScene;
  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(1);
  DesignCore.Mouse.pointOnScene = () => new Point(5, 0);
  trim.preview();
  findSpy.mockRestore();
  DesignCore.Mouse.pointOnScene = savedPointOnScene3;

  // dulled original + at least one trimmed survivor
  expect(DesignCore.Scene.previewEntities.count()).toBeGreaterThanOrEqual(2);
});

test('Trim.execute returns early when boundary input is undefined', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Line', { points: [new Point(), new Point(10, 0)] });

  await withMockInput(core.scene, [undefined], async () => {
    const trim = new Trim();
    await trim.execute();
    expect(trim.selectedBoundaryItems).toHaveLength(0);
  });
});

test('Trim.execute exits selection loop when selection input is undefined', async () => {
  core.scene.clear();
  core.scene.selectionManager.reset();
  core.scene.addEntity('Line', { points: [new Point(), new Point(10, 0)] });
  core.scene.addEntity('Circle', { points: [new Point(), new Point(5, 0)] });
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
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] });
  core.scene.addEntity('Circle', { points: [new Point(-5, 0), new Point(0, 0)] });
  core.scene.addEntity('Circle', { points: [new Point(-5, 0), new Point(0, 0)] });
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
  core.scene.addEntity('Line', { points: [new Point(), new Point(10, 0)] });
  const trim = new Trim();
  trim.selectedItem = null;
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  expect(() => trim.action()).not.toThrow();
});

test('Trim.action does nothing when selectedBoundaryItems is empty', () => {
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(), new Point(10, 0)] });
  const trim = new Trim();
  trim.selectedItem = core.scene.entities.get(0);
  trim.selectedBoundaryItems = [];

  expect(() => trim.action()).not.toThrow();
  expect(trim.selectedItem).toBeNull();
});

test('Trim.action notifies NOTRIM when selected entity lacks fromPolylinePoints', () => {
  // Use a stub entity that has toPolylinePoints but no fromPolylinePoints.
  // action() must notify and not throw.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary

  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];
  trim.selectedItem = {
    type: 'FakeEntity',
    toPolylinePoints: () => [new Point(-5, 0), new Point(5, 0)],
    // deliberately no fromPolylinePoints
  };

  const notifySpy = jest.spyOn(core, 'notify').mockImplementation(() => {});
  trim.action();

  expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining(Strings.Message.NOTRIM));
  expect(trim.selectedItem).toBeNull();
  notifySpy.mockRestore();
});

test('Trim.preview silently skips entity that lacks fromPolylinePoints', () => {
  // Stub entity implements toPolylinePoints but not fromPolylinePoints.
  // preview() must return early without calling notify.
  core.scene.clear();
  core.scene.addEntity('Line', { points: [new Point(0, -10), new Point(0, 10)] }); // boundary
  DesignCore.Scene.previewEntities.clear();

  const stubEntity = {
    type: 'FakeEntity',
    toPolylinePoints: () => [new Point(-5, 0), new Point(5, 0)],
    // deliberately no fromPolylinePoints
  };

  const notifySpy = jest.spyOn(core, 'notify');
  const trim = new Trim();
  trim.selectedBoundaryItems = [core.scene.entities.get(0)];

  const savedPointOnScene = DesignCore.Mouse.pointOnScene;
  const findSpy = jest.spyOn(core.scene.selectionManager, 'findClosestItem').mockReturnValue(0);
  jest.spyOn(core.scene.entities, 'get').mockReturnValue(stubEntity);
  DesignCore.Mouse.pointOnScene = () => new Point(0, 0);
  trim.preview();
  findSpy.mockRestore();
  jest.restoreAllMocks();
  DesignCore.Mouse.pointOnScene = savedPointOnScene;

  expect(DesignCore.Scene.previewEntities.count()).toBe(0);
  expect(notifySpy).not.toHaveBeenCalled();
});

test('Trim.action notifies when no intersection found (parallel lines)', () => {
  core.scene.clear();
  // Two parallel vertical lines - no intersection
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(0, 100)] });
  core.scene.addEntity('Line', { points: [new Point(10, 0), new Point(10, 100)] });

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
  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(100, 0)] });
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
  // Arc: centre (0,0), start (10,0), end (-10,0) — CCW upper semicircle through (0,10)
  // Boundary: vertical line at x=0, intersects arc at (0,10)
  // Mouse at (7,7) — in the right half, selects (10,0)→(0,10) segment for removal
  // Expected: original arc removed, shorter arc from (0,10) to (-10,0) added

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Arc', { points: [new Point(0, 0), new Point(10, 0), new Point(-10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, -20), new Point(0, 20)] });

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
  // Circle: centre (0,0), radius 10
  // Boundary: vertical line at x=0, intersects circle at (0,10) and (0,-10)
  // Mouse at (8,0) — on the right side
  // Expected: original circle removed, arc covering the right side added

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, -20), new Point(0, 20)] });

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
  // Arc centre should match the original circle centre
  expect(arc.points[0].x).toBeCloseTo(0, 10);
  expect(arc.points[0].y).toBeCloseTo(0, 10);
});

test('Trim.action trims a closed polyline - produces open polyline with closed flag cleared', () => {
  // Closed square: (0,0)→(100,0)→(100,100)→(0,100) with flag bit 1
  // Boundary: vertical line at x=50
  // Mouse at (75,50) — right of centre, selects the right side for removal
  // Expected: one open polyline (50,100)→(0,100)→(0,0)→(50,0), flag bit 1 cleared

  const trim = new Trim();
  core.scene.clear();

  // Five points where first === last → constructor pops last and sets flag=1
  core.scene.addEntity('Lwpolyline', {
    points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100), new Point(0, 0)],
  });
  core.scene.addEntity('Line', { points: [new Point(50, -10), new Point(50, 110)] });

  const polyline = core.scene.entities.get(0);
  expect(polyline.flags.hasFlag(1)).toBe(true); // confirm closed before trim

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = polyline;
  core.mouse.setPosFromScenePoint(new Point(75, 50));
  trim.action();

  // Original closed polyline removed, one open polyline added, boundary line remains
  expect(core.scene.entities.count()).toBe(2);

  let trimmed;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Polyline') trimmed = core.scene.entities.get(i);
  }

  expect(trimmed).toBeDefined();
  expect(trimmed.flags.hasFlag(1)).toBe(false); // closed flag removed
  expect(trimmed.points.length).toBe(4);
  // Joined path runs from one intersection, around the left side, to the other
  expect(trimmed.points[0].x).toBeCloseTo(50);
  expect(trimmed.points[3].x).toBeCloseTo(50);
});

test('Trim.action trims middle of a line - circle boundary creates two intersections on the same segment', () => {
  // A circle boundary intersects a single-segment line at two points, both on
  // segment index 1. The sort comparator falls through to the
  // positionAlongSegment comparison (line 179 of trim.js) because the segment
  // indices are equal.
  // Circle: centre (50,0) radius 20 → intersects the x-axis at (30,0) and (70,0)
  // Line: (0,0) → (100,0), mouse at (50,0) — inside the circle
  // Expected: original line removed, two shorter lines (0→30) and (70→100) added

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(100, 0)] });
  core.scene.addEntity('Circle', { points: [new Point(50, 0), new Point(70, 0)] }); // radius 20

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(50, 0));
  trim.action();

  // original line removed; two shorter lines added; circle remains
  expect(core.scene.entities.count()).toBe(3);

  const lines = [];
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Line') lines.push(core.scene.entities.get(i));
  }
  expect(lines.length).toBe(2);
  lines.sort((a, b) => a.points[0].x - b.points[0].x);

  expect(lines[0].points[0].x).toBeCloseTo(0);
  expect(lines[0].points[1].x).toBeCloseTo(30);
  expect(lines[1].points[0].x).toBeCloseTo(70);
  expect(lines[1].points[1].x).toBeCloseTo(100);
});

test('Trim.execute catches and logs errors thrown during input', async () => {
  // Force an error inside execute() to cover the catch block (line 69 of trim.js)
  core.scene.clear();
  core.scene.selectionManager.reset();

  const requestInputSpy = jest.spyOn(DesignCore.Scene.inputManager, 'requestInput')
      .mockRejectedValue(new Error('mocked error'));

  const trim = new Trim();
  // execute() should resolve without re-throwing because the catch block handles it
  await expect(trim.execute()).resolves.toBeUndefined();

  requestInputSpy.mockRestore();
});

test('Trim.action trims a circle near the seam (right side, mouse at angle 0)', () => {
  // Circle: centre (0,0), radius 10.
  // Circle.toPolylinePoints() always places the seam at angle 0 → vertex (10,0).
  // The old code failed when the mouse was near that seam because both intersections
  // appeared "after" the mouse in linear polyline order, leaving trimBefore=null.
  //
  // Boundary: vertical line at x=0, intersects at (0,10) [seg 2] and (0,-10) [seg 1].
  // Mouse at (8,0) — on the RIGHT side, which is the forward arc from (0,-10) → (10,0) → (0,10)
  //   (crosses the seam vertex in the polyline chain but is a valid arc region).
  // Expected: arc from (10,0) → (0,-10) covering the left half, trimming the seam-crossing right arc.

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Circle', { points: [new Point(0, 0), new Point(10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, -20), new Point(0, 20)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(8, 0));
  trim.action();

  expect(core.scene.entities.count()).toBe(2);

  let arc;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Arc') arc = core.scene.entities.get(i);
  }
  expect(arc).toBeDefined();
  // Remaining arc is the left half: from (0,10) CCW through (-10,0) to (0,-10)
  expect(arc.points[0].x).toBeCloseTo(0); // centre
  expect(arc.points[0].y).toBeCloseTo(0);
  expect(arc.points[1].x).toBeCloseTo(0); // start at (0,10)
  expect(arc.points[1].y).toBeCloseTo(10);
  expect(arc.points[2].x).toBeCloseTo(0); // end at (0,-10)
  expect(arc.points[2].y).toBeCloseTo(-10);
});

test('Trim.action trims a closed polyline near the seam vertex', () => {
  // Closed square drawn starting from (0,0): seam is at vertex (0,0).
  // Boundary: horizontal line at y=50, intersects:
  //   left edge (closing segment (0,100)→(0,0)→...) at (0,50) — segment 4 (closing seg)
  //   right edge (100,0)→(100,100) at (100,50) — segment 2
  //
  // Mouse at (50,25) — in the BOTTOM half, which is the forward arc from intA=(100,50)
  //   through the bottom vertices to intB=(0,50). This forward arc crosses the seam vertex.
  //
  // Expected: open polyline (100,50)→(100,0)→(0,0)→(0,50), flag bit 1 cleared.

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Lwpolyline', {
    points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100), new Point(0, 0)],
  });
  core.scene.addEntity('Line', { points: [new Point(-10, 50), new Point(110, 50)] });

  const polyline = core.scene.entities.get(0);
  expect(polyline.flags.hasFlag(1)).toBe(true);

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = polyline;
  // Mouse in the BOTTOM half — forward arc between the two intersections, crosses the seam
  core.mouse.setPosFromScenePoint(new Point(50, 25));
  trim.action();

  expect(core.scene.entities.count()).toBe(2);

  let trimmed;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Polyline') trimmed = core.scene.entities.get(i);
  }

  expect(trimmed).toBeDefined();
  expect(trimmed.flags.hasFlag(1)).toBe(false);
  expect(trimmed.points.length).toBe(4);
  // Forward arc: right edge from y=50 down to corner, across bottom, left edge up to y=50
  expect(trimmed.points[0].x).toBeCloseTo(100);
  expect(trimmed.points[0].y).toBeCloseTo(50);
  expect(trimmed.points[3].x).toBeCloseTo(0);
  expect(trimmed.points[3].y).toBeCloseTo(50);
});

test('Trim.action trims an open polyline with two consecutive arc segments', () => {
  // Polyline: (0,0,b=1) -> arc1 -> (100,0,b=1) -> arc2 -> (200,0)
  // arc1 centre (50,0) radius 50, through (50,-50)
  // arc2 centre (150,0) radius 50, through (150,-50)
  // Boundary: vertical line at x=150, intersection at (150,-50) on arc2.
  // Mouse at (120,-40): on arc2 BEFORE the intersection (in arc-travel order).
  // Expected: keep right portion = (150,-50) -> (200,0); discard left side.

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Lwpolyline', { points: [new Point(0, 0, 1), new Point(100, 0, 1), new Point(200, 0)] });
  core.scene.addEntity('Line', { points: [new Point(150, -100), new Point(150, 100)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(120, -40));
  trim.action();

  expect(core.scene.entities.count()).toBe(2);

  let result;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Polyline') result = core.scene.entities.get(i);
  }

  expect(result).toBeDefined();
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(150);
  expect(result.points[0].y).toBeCloseTo(-50);
  expect(result.points[1].x).toBeCloseTo(200);
  expect(result.points[1].y).toBeCloseTo(0);
});

test('Trim.action trims an arc from the start (portionOne same-segment bulge)', () => {
  // Arc: centre (0,0), start (10,0), end (-10,0) — CCW upper semicircle through (0,10).
  // Boundary: vertical line at x=0, intersection at (0,10).
  // Mouse at (-7,7) — LEFT of intersection, so trimBefore=(0,10), trimAfter=null.
  // portionOne = startLoc(seg1,(10,0)) → trimBefore(seg1,(0,10)) — same-segment arc split.
  // Expected: arc from (10,0) to (0,10), covering the right quarter.

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Arc', { points: [new Point(0, 0), new Point(10, 0), new Point(-10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(0, -20), new Point(0, 20)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(-7, 7));
  trim.action();

  expect(core.scene.entities.count()).toBe(2);

  let arc;
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Arc') arc = core.scene.entities.get(i);
  }
  expect(arc).toBeDefined();
  // Kept portion runs from original start (10,0) to intersection (0,10)
  expect(arc.points[1].x).toBeCloseTo(10);
  expect(arc.points[1].y).toBeCloseTo(0);
  expect(arc.points[2].x).toBeCloseTo(0);
  expect(arc.points[2].y).toBeCloseTo(10);
});

test('Trim.action trims the middle of an arc (two intersections on same arc segment)', () => {
  // Arc: centre (0,0), start (10,0), end (-10,0) — CCW upper semicircle through (0,10).
  // Two boundaries: vertical line at x=-5 and x=5.
  // Intersections at (5,√75)≈(5,8.66) and (-5,√75)≈(-5,8.66), both on segment 1.
  // Mouse at (0,9) — between both intersections at the top.
  // Expected: two arcs: (10,0)→(5,8.66) and (-5,8.66)→(-10,0).

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Arc', { points: [new Point(0, 0), new Point(10, 0), new Point(-10, 0)] });
  core.scene.addEntity('Line', { points: [new Point(5, -20), new Point(5, 20)] });
  core.scene.addEntity('Line', { points: [new Point(-5, -20), new Point(-5, 20)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1), core.scene.entities.get(2)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(0, 9));
  trim.action();

  // Original arc removed, two new arcs added, two boundary lines remain
  expect(core.scene.entities.count()).toBe(4);

  const arcs = [];
  for (let i = 0; i < core.scene.entities.count(); i++) {
    if (core.scene.entities.get(i).type === 'Arc') arcs.push(core.scene.entities.get(i));
  }
  expect(arcs.length).toBe(2);
  arcs.sort((a, b) => a.points[1].x - b.points[1].x); // sort by start x

  // Left arc: start near (-5,8.66), end at (-10,0)
  expect(arcs[0].points[1].x).toBeCloseTo(-5);
  expect(arcs[0].points[1].y).toBeCloseTo(Math.sqrt(75));
  expect(arcs[0].points[2].x).toBeCloseTo(-10);
  expect(arcs[0].points[2].y).toBeCloseTo(0);

  // Right arc: start at (10,0), end near (5,8.66)
  expect(arcs[1].points[1].x).toBeCloseTo(10);
  expect(arcs[1].points[1].y).toBeCloseTo(0);
  expect(arcs[1].points[2].x).toBeCloseTo(5);
  expect(arcs[1].points[2].y).toBeCloseTo(Math.sqrt(75));
});

test('Trim.action trims with multiple boundary items', () => {
  // Line: (0,0)→(200,0). Two separate boundary lines at x=50 and x=150.
  // Mouse at (100,0) — between both boundaries.
  // Expected: two lines: (0,0)→(50,0) and (150,0)→(200,0).

  const trim = new Trim();
  core.scene.clear();

  core.scene.addEntity('Line', { points: [new Point(0, 0), new Point(200, 0)] });
  core.scene.addEntity('Line', { points: [new Point(50, -20), new Point(50, 20)] });
  core.scene.addEntity('Line', { points: [new Point(150, -20), new Point(150, 20)] });

  trim.selectedBoundaryItems = [core.scene.entities.get(1), core.scene.entities.get(2)];
  trim.selectedItem = core.scene.entities.get(0);
  core.mouse.setPosFromScenePoint(new Point(100, 0));
  trim.action();

  // Original line removed, two new lines added, two boundary lines remain
  expect(core.scene.entities.count()).toBe(4);

  const lines = [];
  for (let i = 0; i < core.scene.entities.count(); i++) {
    const e = core.scene.entities.get(i);
    // Identify result lines by both points being at y=0 (boundary lines are vertical)
    if (e.type === 'Line' && e.points[0].y === 0 && e.points[1].y === 0) lines.push(e);
  }
  expect(lines.length).toBe(2);
  lines.sort((a, b) => a.points[0].x - b.points[0].x);

  expect(lines[0].points[0].x).toBeCloseTo(0);
  expect(lines[0].points[1].x).toBeCloseTo(50);
  expect(lines[1].points[0].x).toBeCloseTo(150);
  expect(lines[1].points[1].x).toBeCloseTo(200);
});
