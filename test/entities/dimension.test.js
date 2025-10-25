import { Dimension } from '../../core/entities/dimension';
// import { AlignedDimension } from '../../core/entities/alignedDimension';
import { DiametricDimension } from '../../core/entities/diametricDimension';
// import { AngularDimension } from '../../core/entities/angularDimension';
// import { RadialDimension } from '../../core/entities/radialDimension';
import { Property } from '../../core/properties/property';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

describe('Dimension', () => {
  let origPropertyLoadValue;
  let origDesignCore;

  beforeAll(() => {
    // Save and mock Property.loadValue
    origPropertyLoadValue = Property.loadValue;
    Property.loadValue = (arr, def) => (arr && arr[0] !== undefined ? arr[0] : def);
    // Minimal DesignCore mock
    origDesignCore = global.DesignCore;
    global.DesignCore = {
      Scene: {
        findItem: () => [],
        removeItem: () => {},
        inputManager: { requestInput: async () => ({}) },
        getItem: () => ({}),
        selectionManager: { reset: () => {}, removeLastSelection: () => {} },
        createTempItem: () => {},
      },
      DimStyleManager: { getCstyle: () => 'STANDARD' },
      Core: { notify: () => {} },
      Mouse: { pointOnScene: () => ({}) },
    };
  });

  afterAll(() => {
    Property.loadValue = origPropertyLoadValue;
    global.DesignCore = origDesignCore;
  });

  test('constructor instantiates correct dimension type', () => {
    const data = { 70: 3, 2: 'blockName' };
    const dim = new Dimension(data);
    expect(dim instanceof DiametricDimension).toBe(true);
  });

  test('constructor throws on invalid dimType', () => {
    expect(() => new Dimension({ 70: 99 })).toThrow(/Invalid DimType/);
  });

  test('register returns command object', () => {
    expect(Dimension.register()).toEqual({ command: 'Dimension', shortcut: 'DIM' });
  });

  test('preview calls createTempItem with correct args', () => {
    const dim = new Dimension({ 70: 1 });
    dim.selectedItems = [1];
    dim.points = [{}, {}];
    // Should not throw
    expect(() => dim.preview()).not.toThrow();
  });
});
