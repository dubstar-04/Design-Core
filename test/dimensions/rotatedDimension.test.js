import { RotatedDimension } from '../../core/dimensions/rotatedDimension.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { Core } from '../../core/core/core.js';
import { Line } from '../../core/entities/line.js';
import { File } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

// Test cases for user input
const scenarios = [

  { desc: 'Rotated dimension from point selection',
    input: [new Point(), new Point(10, 0), new Point(5, 5)],
    selectedItems: [],
    expectedDimType: 0,
    dimensionValue: 10,
  },
];

test.each(scenarios)('Dimension.execute handles $desc', async (scenario) => {
  const origInputManager = DesignCore.Scene.inputManager;
  const origGetItem = DesignCore.Scene.getItem;

  const { input, selectedItems, expectedDimType, dimensionValue } = scenario;
  let requestInputCallCount = 0;
  let selectedItemsCallCount = 0;

  DesignCore.Scene.inputManager = {
    requestInput: async () => {
      requestInputCallCount++;
      return input[requestInputCallCount - 1];
    },
    executeCommand: () => {},
  };

  DesignCore.Scene.getItem = () => {
    selectedItemsCallCount++;
    return selectedItems[selectedItemsCallCount - 1];
  };

  const dim = new RotatedDimension();
  await dim.execute();

  expect(dim.dimType.getBaseDimType()).toBe(expectedDimType);
  // get the text entities from the dimension block
  const dimensionBlockEntities = dim.buildDimension();
  expect(dimensionBlockEntities.length).toBe(7);

  // check if the text value matches the expected dimension value
  for (const entity of dimensionBlockEntities) {
    if (entity.type === 'Text') {
      expect(Number(entity.string)).toBeCloseTo(dimensionValue);
    }
  }

  // Restore
  DesignCore.Scene.inputManager = origInputManager;
  DesignCore.Scene.getItem = origGetItem;
});

test('constructor sets default properties', () => {
  const dim = new RotatedDimension();
  expect(dim).toBeInstanceOf(RotatedDimension);
  expect(dim.points).toBeDefined();
});


test('register returns command object', () => {
  expect(RotatedDimension.register()).toEqual({ command: 'RotatedDimension', shortcut: 'DIMROT' });
});


describe('RotatedDimension.getPointsFromSelection', () => {
  const scenarios = [
    {
      desc: 'horizontal line',
      pt1: new Point(0, 0),
      pt2: new Point(10, 0),
      textPos: new Point(5, 5),
      expected: {
        text: { x: 5, y: 5 },
        arrow: { x: 10, y: 5 },
      },
    },
    {
      desc: 'vertical line',
      pt1: new Point(0, 0),
      pt2: new Point(0, 10),
      textPos: new Point(5, 5),
      expected: {
        text: { x: 5, y: 5 },
        arrow: { x: 5, y: 10 },
      },
    },
    {
      desc: 'diagonal line',
      pt1: new Point(0, 0),
      pt2: new Point(10, 10),
      textPos: new Point(5, 0),
      expected: {
        text: { x: 5, y: 0 },
        arrow: { x: 5, y: 10 },
      },
    },
  ];

  test.each(scenarios)('returns correct sequenced points for $desc', ({ pt1, pt2, textPos, expected }) => {
    const line = new Line({ points: [pt1, pt2] });
    const result = RotatedDimension.getPointsFromSelection([line], textPos);
    expect(result).toHaveLength(4);
    expect(result[0].sequence).toBe(13);
    expect(result[1].sequence).toBe(14);
    expect(result[2].sequence).toBe(11);
    expect(result[3].sequence).toBe(10);
    // check text position
    expect(result[2].x).toBeCloseTo(expected.text.x);
    expect(result[2].y).toBeCloseTo(expected.text.y);
    // check arrow position
    expect(result[3].x).toBeCloseTo(expected.arrow.x);
    expect(result[3].y).toBeCloseTo(expected.arrow.y);
  });
});

test('RotatedDimension.preview runs without error and calls createTempItem', () => {
  const origCreateTempItem = DesignCore.Scene.createTempItem;
  const origPointOnScene = DesignCore.Mouse.pointOnScene;
  // Manual mock for createTempItem
  const createTempItemCalls = [];
  DesignCore.Scene.createTempItem = function(type, obj) {
    createTempItemCalls.push([type, obj]);
  };
  // Manual mock for pointOnScene
  DesignCore.Mouse.pointOnScene = function() {
    return new Point(5, 5);
  };

  // Test with 1 point (should call createTempItem with 'Line')
  const dim1 = new RotatedDimension();
  dim1.points = [new Point(0, 0)];
  expect(() => dim1.preview()).not.toThrow();
  expect(createTempItemCalls.some((call) => call[0] === 'Line')).toBe(true);

  // Test with >1 point (should call createTempItem with this.type)
  const dim2 = new RotatedDimension();
  dim2.points = [new Point(0, 0), new Point(10, 0), new Point(5, 5)];
  expect(() => dim2.preview()).not.toThrow();
  expect(createTempItemCalls.some((call) => call[0] === dim2.type)).toBe(true);

  // Restore
  DesignCore.Scene.createTempItem = origCreateTempItem;
  DesignCore.Mouse.pointOnScene = origPointOnScene;
});

test('Test RotatedDimension.dxf', () => {
  const points = [];

  const Pt13 = new Point(0, 0);
  Pt13.sequence = 13;
  points.push(Pt13);

  const Pt14 = new Point(10, 0);
  Pt14.sequence = 14;
  points.push(Pt14);

  const Pt10 = new Point(5, 5);
  Pt10.sequence = 10;
  points.push(Pt10);

  const Pt11 = new Point(5, 5);
  Pt11.sequence = 11;
  points.push(Pt11);

  points.push(Pt10, Pt14, Pt13, Pt11);

  const dimension = new RotatedDimension({ points: points });
  let file = new File();
  dimension.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
DIMENSION
5
1
100
AcDbEntity
100
AcDbDimension
8
0
10
5
20
5
30
0.0
11
5
21
5
31
0.0
70
0
3
STANDARD
100
AcDbAlignedDimension
13
0
23
0
33
0.0
14
10
24
0
34
0.0
50
0
100
AcDbRotatedDimension
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newDimension = new RotatedDimension(dimension);
  file = new File();
  newDimension.dxf(file);
  expect(file.contents).toEqual(dxfString);
});
