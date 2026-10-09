import { Dimension } from '../../core/dimensions/dimension.js';
import { DiametricDimension } from '../../core/dimensions/diametricDimension.js';
import { Circle } from '../../core/entities/circle.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Arc } from '../../core/entities/arc.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { withMockInput } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

// Test cases for user input
const scenarios = [

  { desc: 'Rotated dimension from line selection',
    input: [new SingleSelection(0, new Point()), new Point(5, 5)],
    selectedEntities: [new Line({ points: [new Point(), new Point(10, 0)] })],
    expectedDimType: 0,
  },
  { desc: 'Aligned dimension from line selection',
    input: [new SingleSelection(0, new Point()), new Point(6.5, 3.5)],
    selectedEntities: [new Line({ points: [new Point(), new Point(10, 10)] })],
    expectedDimType: 1,
  },
  { desc: 'Rotated dimension from point selection',
    input: [new Point(), new Point(10, 0), new Point(5, 5)],
    selectedEntities: [],
    expectedDimType: 0,
  },
  { desc: 'Diametric dimension from circle selection',
    input: [new SingleSelection(0, new Point()), new Point(20, 10)],
    selectedEntities: [new Circle({ points: [new Point(), new Point(10, 0)] })],
    expectedDimType: 3,
  },
  { desc: 'Radial dimension from arc selection',
    input: [new SingleSelection(0, new Point()), new Point(20, 10)],
    selectedEntities: [new Arc({ points: [new Point(), new Point(10, 0), new Point(10, 10)] })],
    expectedDimType: 4,
  },
  { desc: 'Angular dimension from line selection',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, 5)],
    selectedEntities: [new Line({ points: [new Point(), new Point(10, 0)] }), new Line({ points: [new Point(), new Point(10, 10)] })],
    expectedDimType: 2,
  },
  { desc: 'Aligned dimension from polyline selection',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, 5)],
    selectedEntities: [new Polyline({ points: [new Point(), new Point(10, 0)] })],
    expectedDimType: 1,
  },
  { desc: 'Radial dimension from polyline selection',
    input: [new SingleSelection(0, new Point(16, 5)), new Point(20, 5)],
    selectedEntities: [new Polyline({ points: [new Point(), new Point(10, 0, 1), new Point(10, 10)] })],
    expectedDimType: 4,
  },
  { desc: 'Angular dimension from polyline selection',
    input: [new SingleSelection(0, new Point(5, 0)), new SingleSelection(1, new Point(5, 5)), new Point(5, 5)],
    selectedEntities: [new Polyline({ points: [new Point(), new Point(10, 0)] }), new Polyline({ points: [new Point(), new Point(10, 10)] })],
    expectedDimType: 2,
  },

];

test.each(scenarios)('Dimension.execute handles $desc', async (scenario) => {
  const { input, selectedEntities, expectedDimType } = scenario;

  await withMockInput(DesignCore.Scene, input, async () => {
    const dim = new Dimension();
    await dim.execute();

    expect(dim.dimType.getBaseDimType()).toBe(expectedDimType);
  }, { selectedEntities });
});

test('constructor instantiates correct dimension type', () => {
  const data = { 70: 3, 2: 'blockName' };
  const dim = new Dimension(data);
  expect(dim instanceof DiametricDimension).toBe(true);
});

test('register returns command object', () => {
  expect(Dimension.register()).toEqual({ command: 'Dimension', shortcut: 'DIM' });
});

test('get linear dimension type', () => {
  const dim = new Dimension();
  expect(dim.getLinearDimensionType(new Point(0, 0), new Point(10, 0), new Point(5, 5))).toBe(0);
  expect(dim.getLinearDimensionType(new Point(0, 0), new Point(10, 10), new Point(7.5, 2.5))).toBe(1);
  expect(dim.getLinearDimensionType(new Point(0, 0), new Point(10, 10), new Point(12.5, 8.5))).toBe(0);
});

test('get rotated dimension angle', () => {
  const dim = new Dimension();
  // vertical edge - only a vertical dimension is non-degenerate
  expect(dim.getRotatedDimensionAngle(new Point(0, 0), new Point(0, 100), new Point(50, 50))).toBe(90);
  // horizontal edge - only a horizontal dimension is non-degenerate
  expect(dim.getRotatedDimensionAngle(new Point(0, 0), new Point(100, 0), new Point(50, 50))).toBe(0);
  // diagonal edge, pick point deviates mostly in x - vertical dimension
  expect(dim.getRotatedDimensionAngle(new Point(0, 0), new Point(100, 100), new Point(300, 50))).toBe(90);
  // diagonal edge, pick point deviates mostly in y - horizontal dimension
  expect(dim.getRotatedDimensionAngle(new Point(0, 0), new Point(100, 100), new Point(50, 300))).toBe(0);
});

test.each([
  { desc: 'vertical', line: new Line({ points: [new Point(0, 0), new Point(0, 100)] }), textPos: new Point(50, 50), expectedAngle: 90 },
  { desc: 'horizontal', line: new Line({ points: [new Point(0, 0), new Point(100, 0)] }), textPos: new Point(50, 50), expectedAngle: 0 },
])('Dimension.execute commits a non-degenerate Rotated dimension for a $desc edge', async (scenario) => {
  const { line, textPos, expectedAngle } = scenario;
  let committed;

  await withMockInput(DesignCore.Scene, [new SingleSelection(0, new Point()), textPos], async () => {
    const dim = new Dimension();
    await dim.execute();
  }, {
    selectedEntities: [line],
    extraMethods: { executeCommand: (entity) => {
      committed = entity;
    } },
  });

  expect(committed.getProperty('linearDimAngle')).toBe(expectedAngle);
  const box = committed.boundingBox();
  expect(box.xLength).toBeGreaterThan(0);
  expect(box.yLength).toBeGreaterThan(0);
});

test.each([
  { desc: 'pick far to the right picks a vertical dimension', line: new Line({ points: [new Point(0, 0), new Point(100, 100)] }), textPos: new Point(300, 50), expectedAngle: 90 },
  { desc: 'pick far above picks a horizontal dimension', line: new Line({ points: [new Point(0, 0), new Point(100, 100)] }), textPos: new Point(50, 300), expectedAngle: 0 },
])('Dimension.execute allows $desc for a diagonal edge', async (scenario) => {
  const { line, textPos, expectedAngle } = scenario;
  let committed;

  await withMockInput(DesignCore.Scene, [new SingleSelection(0, new Point()), textPos], async () => {
    const dim = new Dimension();
    await dim.execute();
  }, {
    selectedEntities: [line],
    extraMethods: { executeCommand: (entity) => {
      committed = entity;
    } },
  });

  expect(committed.dimType.getBaseDimType()).toBe(0);
  expect(committed.getProperty('linearDimAngle')).toBe(expectedAngle);
  const box = committed.boundingBox();
  expect(box.xLength).toBeGreaterThan(0);
  expect(box.yLength).toBeGreaterThan(0);
});

test('Dimension.execute still allows an Aligned dimension for a diagonal edge', async () => {
  const line = new Line({ points: [new Point(0, 0), new Point(100, 100)] });
  let committed;

  await withMockInput(DesignCore.Scene, [new SingleSelection(0, new Point()), new Point(60, 40)], async () => {
    const dim = new Dimension();
    await dim.execute();
  }, {
    selectedEntities: [line],
    extraMethods: { executeCommand: (entity) => {
      committed = entity;
    } },
  });

  expect(committed.dimType.getBaseDimType()).toBe(1);
});

test('Dimension.execute does not show a polar tracking line while picking pt14 or the text position', async () => {
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const hoverAt = (point) => {
    DesignCore.Mouse.setPosFromScenePoint(point);
    DesignCore.Canvas.mouseMoved();
  };
  const clickAt = (point) => {
    DesignCore.Mouse.setPosFromScenePoint(point);
    DesignCore.Canvas.mouseDown(0);
    DesignCore.Canvas.mouseUp(0);
  };

  const prevEndSnap = DesignCore.Settings.endsnap;
  const prevMidSnap = DesignCore.Settings.midsnap;
  const prevCentreSnap = DesignCore.Settings.centresnap;
  const prevPolar = DesignCore.Settings.polar;
  DesignCore.Settings.endsnap = false;
  DesignCore.Settings.midsnap = false;
  DesignCore.Settings.centresnap = false;
  DesignCore.Settings.polar = true;

  try {
    const dim = new Dimension();
    DesignCore.Scene.inputManager.activeCommand = dim;
    const execPromise = dim.execute();
    await flush();

    // pick pt13 directly (point path, not selecting an existing entity)
    clickAt(new Point(0, 0));
    await flush();

    // hover to pick pt14 - should not draw a polar tracking line from pt13
    hoverAt(new Point(100, 1));
    expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(0);

    clickAt(new Point(100, 0));
    await flush();

    // hover to pick the text position - should not draw a polar tracking line from pt14
    hoverAt(new Point(50, 50));
    expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(0);

    clickAt(new Point(50, 50));
    await flush();
    await execPromise;
  } finally {
    DesignCore.Settings.endsnap = prevEndSnap;
    DesignCore.Settings.midsnap = prevMidSnap;
    DesignCore.Settings.centresnap = prevCentreSnap;
    DesignCore.Settings.polar = prevPolar;
    DesignCore.Scene.inputManager.reset();
  }
});


test('preview calls createTempItem with correct args', () => {
  const dim = new Dimension({ 70: 1 });
  dim.selectedEntities = [1];
  dim.points = [{}, {}];
  // Should not throw
  expect(() => dim.preview()).not.toThrow();
});
