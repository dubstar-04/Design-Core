import { RotatedDimension } from '../../core/dimensions/rotatedDimension.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { Core } from '../../core/core/core.js';
import { Line } from '../../core/entities/line.js';
import { File, withMockInput } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

// Test cases for user input
const scenarios = [

  { desc: 'Rotated dimension from point selection (angle 0)',
    input: [0, new Point(), new Point(10, 0), new Point(5, 5)],
    selectedEntities: [],
    expectedDimType: 0,
    dimensionValue: 10,
  },
  { desc: 'Rotated dimension from point selection (angle 90)',
    input: [90, new Point(), new Point(0, 10), new Point(5, 5)],
    selectedEntities: [],
    expectedDimType: 0,
    dimensionValue: 10,
  },
];

test.each(scenarios)('Dimension.execute handles $desc', async (scenario) => {
  const { input, selectedEntities, expectedDimType, dimensionValue } = scenario;

  await withMockInput(DesignCore.Scene, input, async () => {
    const dim = new RotatedDimension();
    await dim.execute();

    expect(dim.dimType.getBaseDimType()).toBe(expectedDimType);
    // get the text entities from the dimension block
    const dimensionBlockEntities = dim.buildDimension();
    expect(dimensionBlockEntities.length).toBe(7);

    // check if the text value matches the expected dimension value
    for (const entity of dimensionBlockEntities) {
      if (entity.type === 'Text') {
        expect(Number(entity.getProperty('string'))).toBeCloseTo(dimensionValue);
      }
    }
  }, { selectedEntities });
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
      angle: 0,
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
      angle: 90,
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
      angle: 90,
      expected: {
        text: { x: 5, y: 0 },
        arrow: { x: 5, y: 10 },
      },
    },
  ];

  test.each(scenarios)('returns correct sequenced points for $desc', ({ pt1, pt2, textPos, angle, expected }) => {
    const line = new Line({ points: [pt1, pt2] });
    const result = RotatedDimension.getPointsFromSelection([line], textPos, angle);
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
  const origAddAux = DesignCore.Scene.auxiliaryEntities.add;
  const origCreateTempItem = DesignCore.Scene.previewEntities.create;
  const origPointOnScene = DesignCore.Mouse.pointOnScene;
  // Manual mock for createTempItem
  const createTempItemCalls = [];
  DesignCore.Scene.previewEntities.create = function(type, obj) {
    createTempItemCalls.push([type, obj]);
  };
  // Manual mock for auxiliaryEntities.add
  const addAuxCalls = [];
  DesignCore.Scene.auxiliaryEntities.add = function(item) {
    addAuxCalls.push(item);
  };
  // Manual mock for pointOnScene
  DesignCore.Mouse.pointOnScene = function() {
    return new Point(5, 5);
  };

  // Test with 1 point (should add a RubberBand to auxiliaryEntities)
  const dim1 = new RotatedDimension();
  dim1.points = [new Point(0, 0)];
  expect(() => dim1.preview()).not.toThrow();
  expect(addAuxCalls.length).toBeGreaterThanOrEqual(1);

  // Test with >1 point (should call createTempItem with this.type)
  const dim2 = new RotatedDimension();
  dim2.points = [new Point(0, 0), new Point(10, 0), new Point(5, 5)];
  expect(() => dim2.preview()).not.toThrow();
  expect(createTempItemCalls.some((call) => call[0] === dim2.type)).toBe(true);

  // Restore
  DesignCore.Scene.auxiliaryEntities.add = origAddAux;
  DesignCore.Scene.previewEntities.create = origCreateTempItem;
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

  const dimension = new RotatedDimension({ points: points, handle: '1' });
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
  const newDimension = new RotatedDimension({ handle: dimension.getProperty('handle'), points: dimension.points, ...dimension });
  file = new File();
  newDimension.dxf(file);
  expect(file.contents).toEqual(dxfString);
});
