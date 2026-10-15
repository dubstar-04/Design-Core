import { AlignedDimension } from '../../core/dimensions/alignedDimension.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { Core } from '../../core/core/core.js';
import { Line } from '../../core/entities/line.js';
import { DxfIterator } from '../../core/lib/dxf/dxfIterator.js';
import { Entities } from '../../core/lib/dxf/sections/entities.js';
import { File, withMockInput } from '../test-helpers/test-helpers.js';

// initialise core
new Core();

// Test cases for user input
const scenarios = [

  { desc: 'Aligned dimension from point selection',
    input: [new Point(), new Point(10, 0), new Point(5, 5)],
    selectedEntities: [],
    expectedDimType: 1,
    dimensionValue: 10,
  },
];

test.each(scenarios)('Dimension.execute handles $desc', async (scenario) => {
  const { input, selectedEntities, expectedDimType, dimensionValue } = scenario;

  await withMockInput(DesignCore.Scene, input, async () => {
    const dim = new AlignedDimension();
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
  const dim = new AlignedDimension();
  expect(dim).toBeInstanceOf(AlignedDimension);
  expect(dim.points).toBeDefined();
});


test('register returns command object', () => {
  expect(AlignedDimension.register()).toEqual({ command: 'AlignedDimension', shortcut: 'DIMALI' });
});


describe('AlignedDimension.getPointsFromSelection', () => {
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
        arrow: { x: 12.5, y: 7.5 },
      },
    },
  ];

  test.each(scenarios)('returns correct sequenced points for $desc', ({ pt1, pt2, textPos, expected }) => {
    const line = new Line({ points: [pt1, pt2] });
    const result = AlignedDimension.getPointsFromSelection([line], textPos);
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

// Regression test: dragging the Pt11 (text) grip must recompute Pt10 (the dimension line's
// far end) from the unchanged Pt13/Pt14 - previously Pt10 was left frozen at its creation-time
// value, so moving Pt11 alone produced no visible change (text falls back to the midpoint,
// and the dimension line/value are driven entirely by the stale Pt10)
test('getGrips recomputes Pt10 (not stale) when the Pt11 grip moves', () => {
  const pt13 = new Point(0, 0);
  const pt14 = new Point(10, 0);
  const points = AlignedDimension.getPointsFromSelection([new Line({ points: [pt13, pt14] })], new Point(5, 5));
  const dim = new AlignedDimension({ points });

  const originalPt10 = dim.getPointBySequence(dim.points, 10);
  expect(originalPt10.x).toBeCloseTo(10);
  expect(originalPt10.y).toBeCloseTo(5);

  const grips = dim.getGrips();
  expect(grips).toHaveLength(1);
  expect(grips[0].point.x).toBeCloseTo(5);
  expect(grips[0].point.y).toBeCloseTo(5);

  const newPoints = grips[0].apply(new Point(5, 20));
  const newPt11 = newPoints.find((p) => p.sequence === 11);
  const newPt10 = newPoints.find((p) => p.sequence === 10);

  expect(newPt11.x).toBeCloseTo(5);
  expect(newPt11.y).toBeCloseTo(20);
  // Pt10 must track the moved Pt11, not stay frozen at its original position
  expect(newPt10.y).not.toBeCloseTo(originalPt10.y);
  expect(newPt10.x).toBeCloseTo(10);
  expect(newPt10.y).toBeCloseTo(20);

  // the measured value (driven by Pt13/Pt14, unchanged) must still be correct
  const rebuilt = new AlignedDimension({ points: newPoints });
  const text = rebuilt.buildDimension().find((e) => e.type === 'Text');
  expect(Number(text.getProperty('string'))).toBeCloseTo(10);
});

// Regression test: committing a grip-dragged Pt11 (the InputManager drop path - setProperty('points', ...))
// must actually move the rendered text, not just the stored point. DIMJUST=0 (the default) hardcodes
// textPosition to the midpoint when text fits inside the extension lines, ignoring Pt11 entirely -
// unless the dimension is flagged as user-positioned (DXF bit 128), which setProperty() must now detect
test('dragging the Pt11 grip via setProperty moves the rendered text, not just the stored point', () => {
  const pt13 = new Point(0, 0);
  const pt14 = new Point(10, 0);
  const points = AlignedDimension.getPointsFromSelection([new Line({ points: [pt13, pt14] })], new Point(5, 1));
  const dim = new AlignedDimension({ points });

  // sanity check: with the default DIMJUST=0 and short text fitting inside, text starts at the midpoint
  const textBefore = dim.buildDimension().find((e) => e.type === 'Text');
  expect(textBefore.points[0].x).toBeCloseTo(5);

  expect(dim.dimType.hasUserPositionedText()).toBe(false);

  const grip = dim.getGrips()[0];
  const newPoints = grip.apply(new Point(5, 30));

  // exactly what InputManager's drop handler does: entity.setProperty('points', newPoints)
  dim.setProperty('points', newPoints);

  expect(dim.dimType.hasUserPositionedText()).toBe(true);

  const textAfter = dim.buildDimension().find((e) => e.type === 'Text');
  expect(textAfter.points[0].x).toBeCloseTo(5);
  expect(textAfter.points[0].y).toBeCloseTo(30);
});

// Regression test: DIMTAD's vertical offset must still apply on top of a user-positioned
// (grip-dragged) text anchor - user-positioning only replaces the DIMJUST auto-anchor, it
// doesn't bypass DIMTAD entirely
test('DIMTAD vertical offset still applies on top of a user-positioned text', () => {
  const pt13 = new Point(0, 0);
  const pt14 = new Point(10, 0);
  const points = AlignedDimension.getPointsFromSelection([new Line({ points: [pt13, pt14] })], new Point(5, 5));
  const dim = new AlignedDimension({ points });

  const realStyle = dim.getDimensionStyle();
  const DIMTXT = realStyle.getValue('DIMTXT');
  const DIMGAP = realStyle.getValue('DIMGAP');
  // DIMTAD = 4: places the dimension text below the dimension line
  dim.getDimensionStyle = () => ({
    getValue: (prop) => (prop === 'DIMTAD' ? 4 : realStyle.getValue(prop)),
  });

  const grip = dim.getGrips()[0];
  const newPoints = grip.apply(new Point(5, 30));
  dim.setProperty('points', newPoints);

  expect(dim.dimType.hasUserPositionedText()).toBe(true);

  const text = dim.buildDimension().find((e) => e.type === 'Text');
  // anchored at the user-positioned Pt11 (x=5, y=30), then offset below by DIMTAD=4
  expect(text.points[0].x).toBeCloseTo(5);
  expect(text.points[0].y).toBeCloseTo(30 - (DIMTXT * 0.5 + DIMGAP));
});

// Regression test: userPositionedText (DXF group 70 bit 128) must survive a real write -> parse ->
// reconstruct DXF round-trip. AlignedDimension's constructor used to call dimType.setDimType(1) after
// super(data), which clobbered the flags super(data) had just loaded from group 70, reverting a
// grip-edited dimension back to automatic text placement when the file was reopened
test('grip-edited dimension preserves userPositionedText through a DXF round-trip', () => {
  const pt13 = new Point(0, 0);
  const pt14 = new Point(10, 0);
  const points = AlignedDimension.getPointsFromSelection([new Line({ points: [pt13, pt14] })], new Point(5, 5));
  const dim = new AlignedDimension({ points, handle: '1' });

  // grip-drag Pt11 away from the DIMJUST-computed anchor
  const grip = dim.getGrips()[0];
  const newPoints = grip.apply(new Point(5, 30));
  dim.setProperty('points', newPoints);
  expect(dim.dimType.hasUserPositionedText()).toBe(true);

  // write the grip-edited dimension to DXF text
  const file = new File();
  dim.dxf(file);

  // parse the written text back through the real DXF entity reader (not an object-spread shortcut)
  const iterator = new DxfIterator();
  iterator.loadFile(`0\nENTITIES\n${file.contents}0\nENDSEC\n0\nEOF`);
  const [rawEntity] = new Entities().read(iterator);
  rawEntity.points = rawEntity.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence));

  // reconstruct through the same command dispatch path used when loading a DXF file
  const reloaded = DesignCore.CommandManager.createNew(rawEntity[0], rawEntity);

  expect(reloaded).toBeInstanceOf(AlignedDimension);
  expect(reloaded.dimType.hasUserPositionedText()).toBe(true);

  const text = reloaded.buildDimension().find((e) => e.type === 'Text');
  expect(text.points[0].x).toBeCloseTo(5);
  expect(text.points[0].y).toBeCloseTo(30);
});

// Regression test: a rigid whole-dimension Move (all points translated together, including Pt11)
// must NOT be mistaken for a grip-drag - auto text placement should keep working normally
test('a rigid Move (all points translated together) does not set userPositionedText', () => {
  const pt13 = new Point(0, 0);
  const pt14 = new Point(10, 0);
  const points = AlignedDimension.getPointsFromSelection([new Line({ points: [pt13, pt14] })], new Point(5, 5));
  const dim = new AlignedDimension({ points });

  const delta = new Point(100, 100);
  const movedPoints = dim.points.map((p) => new Point(p.x + delta.x, p.y + delta.y, p.bulge, p.sequence));

  dim.setProperty('points', movedPoints);

  expect(dim.dimType.hasUserPositionedText()).toBe(false);
});


test('AlignedDimension.preview runs without error and calls createTempItem', () => {
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
  const dim1 = new AlignedDimension();
  dim1.points = [new Point(0, 0)];
  expect(() => dim1.preview()).not.toThrow();
  expect(addAuxCalls.length).toBeGreaterThanOrEqual(1);

  // Test with >1 point (should call createTempItem with this.type)
  const dim2 = new AlignedDimension();
  dim2.points = [new Point(0, 0), new Point(10, 0), new Point(5, 5)];
  expect(() => dim2.preview()).not.toThrow();
  expect(createTempItemCalls.some((call) => call[0] === dim2.type)).toBe(true);

  // Restore
  DesignCore.Scene.auxiliaryEntities.add = origAddAux;
  DesignCore.Scene.previewEntities.create = origCreateTempItem;
  DesignCore.Mouse.pointOnScene = origPointOnScene;
});

test('Test AlignedDimension.dxf', () => {
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

  const dimension = new AlignedDimension({ points: points, handle: '1' });
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
1
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
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newDimension = new AlignedDimension({ handle: dimension.getProperty('handle'), points: dimension.points, ...dimension });
  file = new File();
  newDimension.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('snaps returns END snaps at the dimension line endpoints', () => {
  const points = AlignedDimension.getPointsFromSelection([new Line({ points: [new Point(0, 0), new Point(10, 0)] })], new Point(5, 5));
  const dim = new AlignedDimension({ points });
  const snaps = dim.snaps(new Point(), 1);

  expect(snaps.length).toBe(2);
  expect(snaps.every((snap) => snap.type === 'end')).toBe(true);
  expect(snaps[0].snapPoint.isSame(new Point(0, 5))).toBe(true);
  expect(snaps[1].snapPoint.isSame(new Point(10, 5))).toBe(true);
});

test('snaps returns no snaps when the dimension has no points', () => {
  expect(new AlignedDimension().snaps(new Point(), 1)).toEqual([]);
});
