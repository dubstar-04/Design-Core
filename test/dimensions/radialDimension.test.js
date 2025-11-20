import { RadialDimension } from '../../core/dimensions/radialDimension.js';
import { Point } from '../../core/entities/point.js';
import { Arc } from '../../core/entities/arc.js';
import { File } from '../test-helpers/test-helpers.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { Circle } from '../../core/entities/circle.js';
import { Polyline } from '../../core/entities/polyline.js';


// initialise core
new Core();

// Test cases for user input
const scenarios = [

  { desc: 'Radial dimension from circle selection - Text outside circle',
    input: [new SingleSelection(0, new Point()), new Point(20, 0)],
    selectedItems: [new Circle({ points: [new Point(0, 0), new Point(10, 0)] })],
    expectedDimType: 4,
    dimensionValue: 10,
    dimensionEntities: 6,
  },
  { desc: 'Radial dimension from circle selection - Text inside circle',
    input: [new SingleSelection(0, new Point()), new Point(0, 0)],
    selectedItems: [new Circle({ points: [new Point(0, 0), new Point(10, 0)] })],
    expectedDimType: 4,
    dimensionValue: 10,
    dimensionEntities: 5,
  },
  { desc: 'Radial dimension from arc selection',
    input: [new SingleSelection(0, new Point()), new Point(20, 10)],
    selectedItems: [new Arc({ points: [new Point(0, 0), new Point(20, 0), new Point(20, 20)] })],
    expectedDimType: 4,
    dimensionValue: 20,
    dimensionEntities: 6,
  },
  { desc: 'Radial dimension from polyline selection',
    input: [new SingleSelection(0, new Point(30, 10)), new Point(30, 10)],
    selectedItems: [new Polyline({ points: [new Point(0, 0), new Point(20, 0, 1), new Point(20, 20)] })],
    expectedDimType: 4,
    dimensionValue: 10,
    dimensionEntities: 6,
  },
];

test.each(scenarios)('RadialDimension.execute handles $desc', async (scenario) => {
  const origInputManager = DesignCore.Scene.inputManager;
  const origGetItem = DesignCore.Scene.entities.get;

  const { input, selectedItems, expectedDimType, dimensionValue, dimensionEntities } = scenario;
  let requestInputCallCount = 0;
  let selectedItemsCallCount = 0;

  DesignCore.Scene.inputManager = {
    requestInput: async () => {
      requestInputCallCount++;
      return input[requestInputCallCount - 1];
    },
    executeCommand: () => {},
  };

  DesignCore.Scene.entities.get = () => {
    selectedItemsCallCount++;
    return selectedItems[selectedItemsCallCount - 1];
  };

  const dim = new RadialDimension();
  await dim.execute();

  expect(dim.dimType.getBaseDimType()).toBe(expectedDimType);
  // get the text entities from the dimension block
  const dimensionBlockEntities = dim.buildDimension();
  expect(dimensionBlockEntities.length).toBe(dimensionEntities );

  // check if the text value matches the expected dimension value
  for (const entity of dimensionBlockEntities) {
    if (entity.type === 'Text') {
      // remove all non-numeric characters except . and -
      const numbersOnly = entity.string.replace(/[^0-9.-]+/g, '');
      expect(Number(numbersOnly)).toBeCloseTo(dimensionValue);
      expect(entity.string).toContain('R');
    }
  }

  // Restore
  DesignCore.Scene.inputManager = origInputManager;
  DesignCore.Scene.entities.get = origGetItem;
});

test('constructor sets default properties', () => {
  const dim = new RadialDimension();
  expect(dim).toBeInstanceOf(RadialDimension);
  expect(dim.points).toBeDefined();
});


test('getPointsFromSelection returns correct sequenced points', () => {
  const center = new Point(0, 0);
  const textPos = new Point(10, 0);
  // Mock item with getRadius
  const item = { points: [center], getRadius: () => 10 };
  const result = RadialDimension.getPointsFromSelection([item], textPos);
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(3);
  expect(result[0].sequence).toBe(10); // center
  expect(result[1].sequence).toBe(15); // radius point
  expect(result[2].sequence).toBe(11); // text position
});

test('RadialDimension.preview runs without error and calls createTempItem', () => {
  const origCreateTempItem = DesignCore.Scene.tempEntities.create;
  const origPointOnScene = DesignCore.Mouse.pointOnScene;
  const origSeletionSet = DesignCore.Scene.selectionManager.selectionSet.selectionSet.length;

  // Manual mock for createTempItem
  const createTempItemCalls = [];
  DesignCore.Scene.tempEntities.create = function(type, obj) {
    createTempItemCalls.push([type, obj]);
  };
  // Manual mock for pointOnScene
  DesignCore.Mouse.pointOnScene = function() {
    return new Point(5, 5);
  };
  // Manual mock for selection set
  DesignCore.Scene.selectionManager.selectionSet.selectionSet = [];

  const points = [];

  const Pt10 = new Point();
  Pt10.sequence = 10;
  points.push(Pt10);

  const Pt15 = new Point(10, 0);
  Pt15.sequence = 15;
  points.push(Pt15);

  // Test with no selection - no action
  const dim1 = new RadialDimension();
  dim1.points = points;
  expect(() => dim1.preview()).not.toThrow();
  expect(createTempItemCalls.length).toBe(0);

  // Test with selection (should call createTempItem with this.type)
  const dim2 = new RadialDimension();
  dim2.points = points;
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.push(1);
  expect(() => dim2.preview()).not.toThrow();
  expect(createTempItemCalls.some((call) => call[0] === dim2.type)).toBe(true);

  // Restore
  DesignCore.Scene.tempEntities.create = origCreateTempItem;
  DesignCore.Mouse.pointOnScene = origPointOnScene;
  DesignCore.Scene.selectionManager.selectionSet.selectionSet.length = origSeletionSet;
});

test('Test RadialDimension.dxf', () => {
  const points = [];

  const Pt10 = new Point();
  Pt10.sequence = 10;
  points.push(Pt10);

  const Pt11 = new Point(20, 0);
  Pt11.sequence = 11;
  points.push(Pt11);

  const Pt15 = new Point(10, 0);
  Pt15.sequence = 15;
  points.push(Pt15);

  points.push(Pt10, Pt11, Pt15);

  const dimension = new RadialDimension({ points: points });
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
0
20
0
30
0.0
11
20
21
0
31
0.0
70
4
3
STANDARD
100
AcDbRadialDimension
15
10
25
0
35
0.0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newDimension = new RadialDimension(dimension);
  file = new File();
  newDimension.dxf(file);
  expect(file.contents).toEqual(dxfString);
});
