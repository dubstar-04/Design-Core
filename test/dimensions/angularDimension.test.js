
import { AngularDimension } from '../../core/dimensions/angularDimension.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';
import { Utils } from '../../core/lib/utils.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';

// initialise core
new Core();


// Test cases for user input
const scenarios = [

  { desc: 'Angular dimension from line selection - 45 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, 5)],
    selectedEntities: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 45,
    dimensionEntities: 5,
  },
  { desc: 'Angular dimension from line selection - 135 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(-5, 5)],
    selectedEntities: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 135,
    dimensionEntities: 6,
  },
  { desc: 'Angular dimension from line selection - 45 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(-5, -5)],
    selectedEntities: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 45,
    dimensionEntities: 7,
  },
  { desc: 'Angular dimension from line selection - 135 degrees',
    input: [new SingleSelection(0, new Point()), new SingleSelection(1, new Point()), new Point(5, -5)],
    selectedEntities: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 135,
    dimensionEntities: 6,
  },
  { desc: 'Angular dimension from polyline selection - 45 degrees',
    input: [new SingleSelection(0, new Point(5, 0)), new SingleSelection(1, new Point(5, 5)), new Point(5, 5)],
    selectedEntities: [new Polyline({ points: [new Point(0, 0), new Point(10, 0)] }), new Polyline({ points: [new Point(0, 0), new Point(10, 10)] })],
    expectedDimType: 2,
    dimensionValue: 45,
    dimensionEntities: 5,
  },
];

test.each(scenarios)('Dimension.execute handles $desc', async (scenario) => {
  const { input, selectedEntities, expectedDimType, dimensionValue, dimensionEntities } = scenario;

  await withMockInput(DesignCore.Scene, input, async () => {
    const dim = new AngularDimension();
    await dim.execute();

    expect(dim.dimType.getBaseDimType()).toBe(expectedDimType);
    // get the text entities from the dimension block
    const dimensionBlockEntities = dim.buildDimension();
    expect(dimensionBlockEntities.length).toBe(dimensionEntities);

    // check if the text value matches the expected dimension value
    for (const entity of dimensionBlockEntities) {
      if (entity.type === 'Text') {
        // remove all non-numeric characters except . and -
        const numbersOnly = entity.getProperty('string').replace(/[^0-9.-]+/g, '');
        expect(Number(numbersOnly)).toBeCloseTo(dimensionValue);
        expect(entity.getProperty('string')).toContain('°');
      }
    }
  }, { selectedEntities });
});

// Regression test: rigidly rotating an AngularDimension (points, as the Rotate tool
// does) must not change the measured angle - buildDimension() derives everything from
// relative angles between the points, not world-axis alignment, so this should already
// be rotation-invariant (confirms it, mirroring the RotatedDimension/DiametricDimension checks)
test.each([0, 30, 45, 90, 137, 200])('measured angle is rotation-invariant at %s degrees', (rotationDeg) => {
  const line1 = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const line2 = new Line({ points: [new Point(0, 0), new Point(10, 10)] }); // 45 degree angle
  const textPos = new Point(5, 5);

  const points = AngularDimension.getPointsFromSelection([line1, line2], textPos);
  const dim = new AngularDimension({ points });

  const theta = Utils.degrees2radians(rotationDeg);
  const centre = new Point(0, 0);
  const rotatedPoints = dim.points.map((p) => new Point(p.x, p.y, p.bulge, p.sequence).rotate(centre, theta));
  const rotatedDim = new AngularDimension({ points: rotatedPoints });

  const entities = rotatedDim.buildDimension();
  const text = entities.find((e) => e.type === 'Text');
  expect(text).toBeDefined();
  expect(Number(text.getProperty('string').replace(/[^0-9.-]+/g, ''))).toBeCloseTo(45);
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

// Regression test: dragging the Pt11 (text) grip must recompute Pt16 (the dimension arc's
// radial position) from the unchanged defining lines - previously Pt16 was a frozen copy of
// Pt11 taken at creation time, so the arc stayed at its original radius when only Pt11 moved
test('getGrips recomputes Pt16 (not stale) when the Pt11 grip moves', () => {
  const lineOne = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const lineTwo = new Line({ points: [new Point(0, 0), new Point(10, 10)] });
  const points = AngularDimension.getPointsFromSelection([lineOne, lineTwo], new Point(5, 5));
  const dim = new AngularDimension({ points });

  const originalPt16 = dim.getPointBySequence(dim.points, 16);

  const grips = dim.getGrips();
  expect(grips).toHaveLength(1);
  expect(grips[0].point.x).toBeCloseTo(5);
  expect(grips[0].point.y).toBeCloseTo(5);

  const newPoints = grips[0].apply(new Point(20, 20));
  const newPt11 = newPoints.find((p) => p.sequence === 11);
  const newPt16 = newPoints.find((p) => p.sequence === 16);

  expect(newPt11.x).toBeCloseTo(20);
  expect(newPt11.y).toBeCloseTo(20);
  // Pt16 must track the moved Pt11 (further out along the angle), not stay at its original radius
  expect(newPt16.x).not.toBeCloseTo(originalPt16.x);
  expect(newPt16.y).not.toBeCloseTo(originalPt16.y);

  // the measured angle (driven by the two defining lines, unchanged) must still be correct
  const rebuilt = new AngularDimension({ points: newPoints });
  const text = rebuilt.buildDimension().find((e) => e.type === 'Text');
  expect(Number(text.getProperty('string').replace(/[^0-9.-]+/g, ''))).toBeCloseTo(45);
});

// Regression test: committing a grip-dragged Pt11 (the InputManager drop path - setProperty('points', ...))
// must actually move the rendered text, not just the stored point - the default auto-placement
// (arcMiddle) ignores Pt11 entirely unless the dimension is flagged as user-positioned (DXF bit 128)
test('dragging the Pt11 grip via setProperty moves the rendered text, not just the stored point', () => {
  const lineOne = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const lineTwo = new Line({ points: [new Point(0, 0), new Point(10, 10)] });
  const points = AngularDimension.getPointsFromSelection([lineOne, lineTwo], new Point(5, 5));
  const dim = new AngularDimension({ points });

  expect(dim.dimType.hasUserPositionedText()).toBe(false);

  const grip = dim.getGrips()[0];
  const newPoints = grip.apply(new Point(20, 20));

  // exactly what InputManager's drop handler does: entity.setProperty('points', newPoints)
  dim.setProperty('points', newPoints);

  expect(dim.dimType.hasUserPositionedText()).toBe(true);

  const text = dim.buildDimension().find((e) => e.type === 'Text');
  expect(text.points[0].x).toBeCloseTo(20);
  expect(text.points[0].y).toBeCloseTo(20);
});

// Regression test: DIMTAD's vertical offset must still apply on top of a user-positioned
// (grip-dragged) text anchor - user-positioning only replaces the DIMJUST auto-anchor, it
// doesn't bypass DIMTAD entirely
test('DIMTAD vertical offset still applies on top of a user-positioned text', () => {
  const lineOne = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const lineTwo = new Line({ points: [new Point(0, 0), new Point(10, 10)] });
  const points = AngularDimension.getPointsFromSelection([lineOne, lineTwo], new Point(5, 5));
  const dim = new AngularDimension({ points });

  const realStyle = dim.getDimensionStyle();
  // DIMTAD = 4: places the dimension text below the dimension line
  dim.getDimensionStyle = () => ({
    getValue: (prop) => (prop === 'DIMTAD' ? 4 : realStyle.getValue(prop)),
  });

  const grip = dim.getGrips()[0];
  const newPoints = grip.apply(new Point(20, 20));
  dim.setProperty('points', newPoints);

  expect(dim.dimType.hasUserPositionedText()).toBe(true);

  const text = dim.buildDimension().find((e) => e.type === 'Text');
  // DIMTAD=4 must offset the text away from the pure user-positioned anchor (20,20)
  const distanceFromAnchor = text.points[0].distance(new Point(20, 20));
  expect(distanceFromAnchor).toBeGreaterThan(0.01);
});

// Regression test: a grip-dragged text's rotation must follow the tangent at its new
// (dragged) position, not stay frozen at the pre-drag DIMJUST-computed rotation
test('text rotation follows the dragged position, not the pre-drag rotation', () => {
  const lineOne = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const lineTwo = new Line({ points: [new Point(0, 0), new Point(10, 10)] });
  const points = AngularDimension.getPointsFromSelection([lineOne, lineTwo], new Point(5, 5));
  const dim = new AngularDimension({ points });

  const realStyle = dim.getDimensionStyle();
  // DIMTIH/DIMTOH = 0: text follows the dimension line's direction rather than staying horizontal
  dim.getDimensionStyle = () => ({
    getValue: (prop) => ((prop === 'DIMTIH' || prop === 'DIMTOH') ? 0 : realStyle.getValue(prop)),
  });

  const grip = dim.getGrips()[0];
  const dragTo = new Point(-20, 5);
  const newPoints = grip.apply(dragTo);
  dim.setProperty('points', newPoints);

  const text = dim.buildDimension().find((e) => e.type === 'Text');
  // expected rotation is the tangent at the dragged point, not the original chord-based angle
  const expectedRotation = Utils.radians2degrees(dim.getTextDirection(new Point(0, 0).angle(dragTo) + Math.PI / 2)) % 360;
  expect(text.getProperty('rotation')).toBeCloseTo(expectedRotation);
});

test('AngularDimension.preview runs without error and calls createTempItem', () => {
  const origCreateTempItem = DesignCore.Scene.previewEntities.create;
  const origPointOnScene = DesignCore.Mouse.pointOnScene;
  // Manual mock for createTempItem
  const createTempItemCalls = [];
  DesignCore.Scene.previewEntities.create = function(type, obj) {
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
  DesignCore.Scene.previewEntities.create = origCreateTempItem;
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

  const dimension = new AngularDimension({ points: points, handle: '1' });
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
  const newDimension = new AngularDimension({ handle: dimension.getProperty('handle'), points: dimension.points, ...dimension });
  file = new File();
  newDimension.dxf(file);
  expect(file.contents).toEqual(dxfString);
});


test('snaps returns END snaps at the dimension arc end points', () => {
  const lineOne = new Line({ points: [new Point(0, 0), new Point(10, 0)] });
  const lineTwo = new Line({ points: [new Point(0, 0), new Point(0, 10)] });
  const points = AngularDimension.getPointsFromSelection([lineOne, lineTwo], new Point(5, 5));
  const dim = new AngularDimension({ points });
  const snaps = dim.snaps(new Point(), 1);
  const radius = Math.hypot(5, 5);

  expect(snaps.length).toBe(2);
  expect(snaps.every((snap) => snap.type === 'end')).toBe(true);
  expect(snaps.some((snap) => snap.snapPoint.isSame(new Point(radius, 0)))).toBe(true);
  expect(snaps.some((snap) => snap.snapPoint.isSame(new Point(0, radius)))).toBe(true);
});

test('snaps returns no snaps when the dimension has no points', () => {
  expect(new AngularDimension().snaps(new Point(), 1)).toEqual([]);
});
