
import { AngularDimension } from '../../core/dimensions/angularDimension.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';

import { File } from '../test-helpers/test-helpers.js';

// initialise core
new Core();


// Test cases for user input
const scenarios = [

  { desc: 'Angular dimension from line selection - 45 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, 5)],
    selectedItems: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 45,
    dimensionEntities: 5,
  },
  { desc: 'Angular dimension from line selection - 135 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(-5, 5)],
    selectedItems: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 135,
    dimensionEntities: 6,
  },
  { desc: 'Angular dimension from line selection - 45 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(-5, -5)],
    selectedItems: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 45,
    dimensionEntities: 7,
  },
  { desc: 'Angular dimension from line selection - 135 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, -5)],
    selectedItems: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 135,
    dimensionEntities: 6,
  },
  { desc: 'Angular dimension from polyline selection - 45 degrees',
    input: [new SingleSelection(0, new Point(5, 0)), new SingleSelection(1, new Point(5, 5)), new Point(5, 5)],
    selectedItems: [new Polyline({ points: [new Point(0, 0), new Point(10, 0)] }), new Polyline({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 45,
    dimensionEntities: 5,
  },
];

test.each(scenarios)('Dimension.execute handles $desc', async (scenario) => {
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

  const dim = new AngularDimension();
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
      expect(entity.string).toContain('°');
    }
  }

  // Restore
  DesignCore.Scene.inputManager = origInputManager;
  DesignCore.Scene.entities.get = origGetItem;
});

test('constructor sets default properties', () => {
  const dim = new AngularDimension();
  expect(dim).toBeInstanceOf(AngularDimension);
  expect(dim.points).toBeDefined();
});

test('register returns command object', () => {
  expect(AngularDimension.register()).toEqual({ command: 'AngularDimension', shortcut: 'DIMANG' });
});

test('getPointsFromSelection returns correct sequenced points', () => {
  const pt1 = new Point(0, 0);
  const pt2 = new Point(10, 0);
  const pt3 = new Point(10, 10);
  const textPos = new Point(5, 5);
  const line1 = new Line({ points: [pt1, pt2] });
  const line2 = new Line({ points: [pt2, pt3] });
  const result = AngularDimension.getPointsFromSelection([line1, line2], textPos);
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThanOrEqual(4);
});

test('AngularDimension.preview runs without error and calls createTempItem', () => {
  const origCreateTempItem = DesignCore.Scene.tempEntities.create;
  const origPointOnScene = DesignCore.Mouse.pointOnScene;
  // Manual mock for createTempItem
  const createTempItemCalls = [];
  DesignCore.Scene.tempEntities.create = function(type, obj) {
    createTempItemCalls.push([type, obj]);
  };
  // Manual mock for pointOnScene
  DesignCore.Mouse.pointOnScene = function() {
    return new Point(5, 5);
  };


  // Test with >4 point (should call createTempItem with this.type)
  const dim2 = new AngularDimension();

  dim2.points = [];

  const Pt10 = new Point();
  Pt10.sequence = 10;
  dim2.points.push(Pt10);

  const Pt13 = new Point();
  Pt13.sequence = 13;
  dim2.points.push(Pt13);

  const Pt14 = new Point();
  Pt14.sequence = 14;
  dim2.points.push(Pt14);

  const Pt15 = new Point();
  Pt15.sequence = 15;
  dim2.points.push(Pt15);

  expect(() => dim2.preview()).not.toThrow();
  expect(createTempItemCalls.some((call) => call[0] === dim2.type)).toBe(true);

  // Restore
  DesignCore.Scene.tempEntities.create = origCreateTempItem;
  DesignCore.Mouse.pointOnScene = origPointOnScene;
});

test('Test AngularDimension.dxf', () => {
  const points = [];

  const Pt10 = new Point(5, 6);
  Pt10.sequence = 10;
  points.push(Pt10);

  const Pt11 = new Point(7, 8);
  Pt11.sequence = 11;
  points.push(Pt11);

  const Pt13 = new Point(9, 10);
  Pt13.sequence = 13;
  points.push(Pt13);

  const Pt14 = new Point(11, 12);
  Pt14.sequence = 14;
  points.push(Pt14);

  const Pt15 = new Point(13, 14);
  Pt15.sequence = 15;
  points.push(Pt15);

  const Pt16 = new Point(15, 16);
  Pt16.sequence = 16;
  points.push(Pt16);


  points.push(Pt10, Pt11, Pt13, Pt14, Pt15, Pt16);

  const dimension = new AngularDimension({ points: points });
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
6
30
0.0
11
7
21
8
31
0.0
70
2
3
STANDARD
100
AcDb2LineAngularDimension
13
9
23
10
33
0.0
14
11
24
12
34
0.0
15
13
25
14
35
0.0
16
15
26
16
36
0.0
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newDimension = new AngularDimension(dimension);
  file = new File();
  newDimension.dxf(file);
  expect(file.contents).toEqual(dxfString);
});


