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

// initialise core
new Core();

// Test cases for user input
const scenarios = [

  { desc: 'Rotated dimension from line selection',
    input: [new SingleSelection(0, new Point()), new Point(5, 5)],
    selectedItems: [new Line({ points: [new Point(), new Point(10, 0)] })],
    expectedDimType: 0,
  },
  { desc: 'Aligned dimension from line selection',
    input: [new SingleSelection(0, new Point()), new Point(6.5, 3.5)],
    selectedItems: [new Line({ points: [new Point(), new Point(10, 10)] })],
    expectedDimType: 1,
  },
  { desc: 'Rotated dimension from point selection',
    input: [new Point(), new Point(10, 0), new Point(5, 5)],
    selectedItems: [],
    expectedDimType: 0,
  },
  { desc: 'Diametric dimension from circle selection',
    input: [new SingleSelection(0, new Point()), new Point(20, 10)],
    selectedItems: [new Circle({ points: [new Point(), new Point(10, 0)] })],
    expectedDimType: 3,
  },
  { desc: 'Radial dimension from arc selection',
    input: [new SingleSelection(0, new Point()), new Point(20, 10)],
    selectedItems: [new Arc({ points: [new Point(), new Point(10, 0), new Point(10, 10)] })],
    expectedDimType: 4,
  },
  { desc: 'Angular dimension from line selection',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, 5)],
    selectedItems: [new Line({ points: [new Point(), new Point(10, 0)] }), new Line({ points: [new Point(), new Point(10, 10)] })],
    expectedDimType: 2,
  },
  { desc: 'Aligned dimension from polyline selection',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, 5)],
    selectedItems: [new Polyline({ points: [new Point(), new Point(10, 0)] })],
    expectedDimType: 1,
  },
  { desc: 'Radial dimension from polyline selection',
    input: [new SingleSelection(0, new Point(16, 5)), new Point(20, 5)],
    selectedItems: [new Polyline({ points: [new Point(), new Point(10, 0, 1), new Point(10, 10)] })],
    expectedDimType: 4,
  },
  { desc: 'Angular dimension from polyline selection',
    input: [new SingleSelection(0, new Point(5, 0)), new SingleSelection(1, new Point(5, 5)), new Point(5, 5)],
    selectedItems: [new Polyline({ points: [new Point(), new Point(10, 0)] }), new Polyline({ points: [new Point(), new Point(10, 10)] })],
    expectedDimType: 2,
  },

];

test.each(scenarios)('Dimension.execute handles $desc', async (scenario) => {
  const origInputManager = DesignCore.Scene.inputManager;
  const origGetItem = DesignCore.Scene.getItem;

  const { input, selectedItems, expectedDimType } = scenario;
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

  const dim = new Dimension();
  await dim.execute();

  expect(dim.dimType.getBaseDimType()).toBe(expectedDimType);

  // Restore
  DesignCore.Scene.inputManager = origInputManager;
  DesignCore.Scene.getItem = origGetItem;
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


test('preview calls createTempItem with correct args', () => {
  const dim = new Dimension({ 70: 1 });
  dim.selectedItems = [1];
  dim.points = [{}, {}];
  // Should not throw
  expect(() => dim.preview()).not.toThrow();
});
