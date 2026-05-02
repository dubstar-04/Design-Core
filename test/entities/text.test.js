import { Text } from '../../core/entities/text.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';
import { Input } from '../../core/lib/input.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

const textInputScenarios = [
  {
    desc: 'standard style, custom height and rotation',
    pt0: new Point(1, 2),
    styleName: 'STANDARD',
    // style: { textHeight: 2.5, backwards: false, upsideDown: false },
    heightInput: 5,
    rotationInput: 45,
    stringInput: 'Hello',
    expectedHeight: 5,
    expectedRotation: 45,
    expectedString: 'Hello',
  },
  {
    desc: 'custom style, default height, rotation 90',
    pt0: new Point(10, 20),
    styleName: 'STANDARD',
    // style: { textHeight: 3, backwards: true, upsideDown: true },
    heightInput: 3,
    rotationInput: 90,
    stringInput: 'World',
    expectedHeight: 3,
    expectedRotation: 90,
    expectedString: 'World',
  },
];

test.each(textInputScenarios)('Text.execute handles $desc', async (scenario) => {
  const { pt0, styleName, heightInput, rotationInput, stringInput, expectedHeight, expectedRotation, expectedString } = scenario;

  await withMockInput(DesignCore.Scene, [pt0, heightInput, rotationInput, stringInput], async () => {
    const text = new Text({});
    await text.execute();

    expect(text.points.length).toBeGreaterThanOrEqual(1);
    expect(text.points[0].x).toBe(pt0.x);
    expect(text.points[0].y).toBe(pt0.y);
    expect(text.getProperty('height')).toBe(expectedHeight);
    expect(text.getProperty('rotation')).toBe(expectedRotation);
    expect(text.getProperty('string')).toBe(expectedString);
    expect(text.getProperty('styleName')).toBe(styleName);
  });
});

test('Test Text.closestPoint', () => {
  const text = new Text({ points: [new Point(100, 100)] });
  const point1 = new Point(90, 90);
  const closest1 = text.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(105);
  expect(closest1[0].y).toBeCloseTo(105);
  expect(closest1[1]).toBeCloseTo(21.21);
});


test('Test Text.getTextFrameCorners', () => {
  const text = new Text({ points: [new Point(100, 100)] });
  let corners = text.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(100);
  expect(corners[0].y).toBeCloseTo(100);

  expect(corners[1].x).toBeCloseTo(110);
  expect(corners[1].y).toBeCloseTo(100);

  expect(corners[2].x).toBeCloseTo(110);
  expect(corners[2].y).toBeCloseTo(110);

  expect(corners[3].x).toBeCloseTo(100);
  expect(corners[3].y).toBeCloseTo(110);

  // Rotate 45 degrees
  text.setRotation(45);
  corners = text.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(100);
  expect(corners[0].y).toBeCloseTo(100);

  expect(corners[1].x).toBeCloseTo(107.07106);
  expect(corners[1].y).toBeCloseTo(107.07106);

  expect(corners[2].x).toBeCloseTo(100);
  expect(corners[2].y).toBeCloseTo(114.14213);

  expect(corners[3].x).toBeCloseTo(92.92893);
  expect(corners[3].y).toBeCloseTo(107.07106);

  // backwards and upsideDown
  text.setRotation(0);
  text.setProperty('backwards', true);
  text.setProperty('upsideDown', true);
  corners = text.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(90);
  expect(corners[0].y).toBeCloseTo(90);

  expect(corners[1].x).toBeCloseTo(100);
  expect(corners[1].y).toBeCloseTo(90);

  expect(corners[2].x).toBeCloseTo(100);
  expect(corners[2].y).toBeCloseTo(100);

  expect(corners[3].x).toBeCloseTo(90);
  expect(corners[3].y).toBeCloseTo(100);

  // Text frame calculation with text alignment
  // bounding rect is 10x10, so with center/middle alignment the text frame should be offset by 5 in both x and y from the insertion point
  const alignedText = new Text({ points: [new Point(100, 100)] });
  alignedText.setProperty('horizontalAlignment', 1); // center
  corners = alignedText.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(95);
  expect(corners[0].y).toBeCloseTo(100);

  expect(corners[1].x).toBeCloseTo(105);
  expect(corners[1].y).toBeCloseTo(100);

  expect(corners[2].x).toBeCloseTo(105);
  expect(corners[2].y).toBeCloseTo(110);

  expect(corners[3].x).toBeCloseTo(95);
  expect(corners[3].y).toBeCloseTo(110);

  // set vertical alignment to middle as well
  // offset the text frame up by another 5 in y so the corners should be at 95,95 - 105,105
  alignedText.setProperty('verticalAlignment', 2); // middle
  corners = alignedText.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(95);
  expect(corners[0].y).toBeCloseTo(95);

  expect(corners[1].x).toBeCloseTo(105);
  expect(corners[1].y).toBeCloseTo(95);

  expect(corners[2].x).toBeCloseTo(105);
  expect(corners[2].y).toBeCloseTo(105);

  expect(corners[3].x).toBeCloseTo(95);
  expect(corners[3].y).toBeCloseTo(105);


  // add rotation of 45 degrees to the center/middle aligned text and ensure the text frame corners are correctly calculated with both alignment and rotation applied
  alignedText.setRotation(45);
  corners = alignedText.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(100);
  expect(corners[0].y).toBeCloseTo(92.92893);

  expect(corners[1].x).toBeCloseTo(107.07106);
  expect(corners[1].y).toBeCloseTo(100);

  expect(corners[2].x).toBeCloseTo(100);
  expect(corners[2].y).toBeCloseTo(107.07106);

  expect(corners[3].x).toBeCloseTo(92.92893);
  expect(corners[3].y).toBeCloseTo(100);

  // flip the text backwards and ensure the text frame corners are still correctly calculated with the flipped text
  alignedText.setProperty('backwards', true);
  corners = alignedText.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(92.92893);
  expect(corners[0].y).toBeCloseTo(85.8579);

  expect(corners[1].x).toBeCloseTo(100);
  expect(corners[1].y).toBeCloseTo(92.92893);

  expect(corners[2].x).toBeCloseTo(92.92893);
  expect(corners[2].y).toBeCloseTo(100);

  expect(corners[3].x).toBeCloseTo(85.8579);
  expect(corners[3].y).toBeCloseTo(92.92893);

  // test right and top alignment
  const rightAlignedtext = new Text({ points: [new Point(100, 100)] });
  rightAlignedtext.setProperty('horizontalAlignment', 2); // right
  corners = rightAlignedtext.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(90);
  expect(corners[0].y).toBeCloseTo(100);

  expect(corners[1].x).toBeCloseTo(100);
  expect(corners[1].y).toBeCloseTo(100);

  expect(corners[2].x).toBeCloseTo(100);
  expect(corners[2].y).toBeCloseTo(110);

  expect(corners[3].x).toBeCloseTo(90);
  expect(corners[3].y).toBeCloseTo(110);

  // add vertical alignment top and ensure the text frame is still correctly calculated with the right and top alignment applied
  rightAlignedtext.setProperty('verticalAlignment', 3); // top
  corners = rightAlignedtext.getTextFrameCorners();

  expect(corners[0].x).toBeCloseTo(90);
  expect(corners[0].y).toBeCloseTo(90);

  expect(corners[1].x).toBeCloseTo(100);
  expect(corners[1].y).toBeCloseTo(90);

  expect(corners[2].x).toBeCloseTo(100);
  expect(corners[2].y).toBeCloseTo(100);

  expect(corners[3].x).toBeCloseTo(90);
  expect(corners[3].y).toBeCloseTo(100);
});

test('Test Text.setRotation', () => {
  const setRotText = new Text({ points: [new Point()] });

  // Zero
  setRotText.setRotation(0);
  expect(setRotText.getProperty('rotation')).toBeCloseTo(0);

  // Positive
  setRotText.setRotation(22.5);
  expect(setRotText.getProperty('rotation')).toBe(22.5);

  setRotText.setRotation(23);
  expect(setRotText.getProperty('rotation')).toBe(23);

  setRotText.setRotation(45);
  expect(setRotText.getProperty('rotation')).toBe(45);

  setRotText.setRotation(90);
  expect(setRotText.getProperty('rotation')).toBe(90);

  setRotText.setRotation(135);
  expect(setRotText.getProperty('rotation')).toBe(135);

  setRotText.setRotation(180);
  expect(setRotText.getProperty('rotation')).toBe(180);

  setRotText.setRotation(225);
  expect(setRotText.getProperty('rotation')).toBe(225);

  setRotText.setRotation(270);
  expect(setRotText.getProperty('rotation')).toBe(270);

  // Greater than 360
  setRotText.setRotation((360 + 90));
  expect(setRotText.getProperty('rotation')).toBe(90);

  // Negative
  setRotText.setRotation(-22.5);
  expect(setRotText.getProperty('rotation')).toBe(337.5);

  setRotText.setRotation(-90);
  expect(setRotText.getProperty('rotation')).toBe(270);

  // precision - rounds to closest 5 dp
  setRotText.setRotation(10.123456789);
  expect(setRotText.getProperty('rotation')).toBe(10.12346);
});


test('Test Text.getRotation', () => {
  const getRotText = new Text();

  // 0 degrees
  getRotText.points = [new Point(), new Point(100, 0)];
  // expect(getRotText.getRotation()).toBe(0); // Returns 360

  // 45 degrees
  getRotText.points = [new Point(), new Point(100, 100)];
  expect(getRotText.getRotation()).toBe(45);

  getRotText.points = [new Point(100, 100), new Point(200, 200)];
  expect(getRotText.getRotation()).toBe(45);

  // 90 degrees
  getRotText.points = [new Point(), new Point(0, 100)];
  expect(getRotText.getRotation()).toBe(90);

  getRotText.points = [new Point(100, 100), new Point(100, 200)];
  expect(getRotText.getRotation()).toBe(90);

  // 135 degrees
  getRotText.points = [new Point(), new Point(-100, 100)];
  expect(getRotText.getRotation()).toBe(135);

  getRotText.points = [new Point(100, 100), new Point(0, 200)];
  expect(getRotText.getRotation()).toBe(135);

  // 180 degrees
  getRotText.points = [new Point(), new Point(-100, 0)];
  expect(getRotText.getRotation()).toBe(180);

  getRotText.points = [new Point(100, 100), new Point(0, 100)];
  expect(getRotText.getRotation()).toBe(180);
});


test('Test Text.flags', () => {
  // DXF Groupcode 71 - flags (bit-coded values):
  // 2 = Text is backward (mirrored in X).
  // 4 = Text is upside down (mirrored in Y).
  const text = new Text();
  expect(text.flags.getFlagValue()).toBe(0);
  // set backwards - set 2 on flags
  text.setProperty('backwards', true);
  expect(text.flags.getFlagValue()).toBe(2);
  // set upsideDown - set 4 on flags
  text.setProperty('upsideDown', true);
  expect(text.flags.getFlagValue()).toBe(6);
  // unset backwards - remove 2 on flags
  text.setProperty('backwards', false);
  expect(text.flags.getFlagValue()).toBe(4);
});

test('Test Text.backwards', () => {
  // DXF Groupcode 71 - flags (bit-coded values):
  // 2 = Text is backward (mirrored in X).
  // 4 = Text is upside down (mirrored in Y).
  const text = new Text();
  expect(text.getProperty('backwards')).toBe(false);
  expect(text.flags.getFlagValue()).toBe(0);
  text.setProperty('backwards', true);
  expect(text.getProperty('backwards')).toBe(true);
  expect(text.flags.getFlagValue()).toBe(2);
});

test('Test Text.upsideDown', () => {
  // DXF Groupcode 71 - flags (bit-coded values):
  // 2 = Text is backward (mirrored in X).
  // 4 = Text is upside down (mirrored in Y).
  const text = new Text();
  expect(text.getProperty('upsideDown')).toBe(false);
  expect(text.flags.getFlagValue()).toBe(0);
  text.setProperty('upsideDown', true);
  expect(text.getProperty('upsideDown')).toBe(true);
  expect(text.flags.getFlagValue()).toBe(4);
});

test('Test Text.boundingBox', () => {
  const text = new Text({ points: [new Point(11, 12)] });
  expect(text.boundingBox().xMin).toBeCloseTo(11);
  expect(text.boundingBox().xMax).toBeCloseTo(21);
  expect(text.boundingBox().yMin).toBeCloseTo(12);
  expect(text.boundingBox().yMax).toBeCloseTo(22);
});

test('Test Text.dxf', () => {
  const text = new Text({ handle: '1', points: [new Point(100, 200)] });
  let file = new File();
  text.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
TEXT
5
1
100
AcDbEntity
8
0
100
AcDbText
10
100
20
200
30
0.0
40
2.5
1

50
0
71
0
72
0
100
AcDbText
`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newText = new Text({
    handle: text.getProperty('handle'),
    points: text.points,
    string: text.getProperty('string'),
    height: text.getProperty('height'),
    styleName: text.getProperty('styleName'),
    horizontalAlignment: text.getProperty('horizontalAlignment'),
    verticalAlignment: text.getProperty('verticalAlignment'),
  });
  file = new File();
  newText.dxf(file);
  expect(file.contents).toEqual(dxfString);


  // create new entity to test text alignment
  // this should include dxf groupcodes 73 and 72 for vertical and horizontal alignment respectively
  // and a second alignment point with groupcode 11,21,31 for the text insertion point
  // bounding rect is 10x10, so second point should be at 100-(10*0.5), 200-(10*0.5) = 95, 195

  const centeredText = new Text({
    handle: text.getProperty('handle'),
    points: text.points,
    string: text.getProperty('string'),
    height: text.getProperty('height'),
    styleName: text.getProperty('styleName'),
    horizontalAlignment: text.getProperty('horizontalAlignment'),
    verticalAlignment: text.getProperty('verticalAlignment'),
  });
  centeredText.setProperty('horizontalAlignment', 1); // center
  centeredText.setProperty('verticalAlignment', 2); // middle
  file = new File();
  centeredText.dxf(file);

  const dxfCenteredString = `0
TEXT
5
1
100
AcDbEntity
8
0
100
AcDbText
10
95
20
195
30
0.0
40
2.5
1

50
0
71
0
72
1
11
100
21
200
31
0.0
100
AcDbText
73
2
`;
  expect(file.contents).toEqual(dxfCenteredString);

  // create new entity from entity data to ensure all props are loaded
  const importCenteredText = new Text({
    handle: centeredText.getProperty('handle'),
    points: centeredText.points,
    string: centeredText.getProperty('string'),
    height: centeredText.getProperty('height'),
    styleName: centeredText.getProperty('styleName'),
    horizontalAlignment: centeredText.getProperty('horizontalAlignment'),
    verticalAlignment: centeredText.getProperty('verticalAlignment'),
  });
  file = new File();
  importCenteredText.dxf(file);
  expect(file.contents).toEqual(dxfCenteredString);
});

test('Text constructor covers all property branches', () => {
  // Minimal data
  let t = new Text({ points: [new Point(1, 2)] });
  expect(t.getProperty('string')).toBe('');
  expect(t.getProperty('height')).toBe(2.5);
  expect(t.getProperty('horizontalAlignment')).toBe(0);
  expect(t.getProperty('verticalAlignment')).toBe(0);
  expect(t.getProperty('styleName')).toBe('STANDARD');

  // All DXF groupcodes
  t = new Text({
    points: [new Point(0, 0)],
    string: 'abc',
    1: 'def',
    styleName: 'FOO',
    7: 'BAR',
    height: 5,
    40: 6,
    rotation: 45,
    50: 90,
    horizontalAlignment: 2,
    72: 1,
    verticalAlignment: 3,
    73: 2,
    flags: 2,
    71: 4,
  });
  expect(['abc', 'def']).toContain(t.getProperty('string'));
  expect(['FOO', 'BAR']).toContain(t.getProperty('styleName'));
  expect([5, 6]).toContain(t.getProperty('height'));
  expect([45, 90]).toContain(t.getProperty('rotation'));
  expect([2, 1]).toContain(t.getProperty('horizontalAlignment'));
  expect([3, 2]).toContain(t.getProperty('verticalAlignment'));
  expect([2, 4, 6, 0]).toContain(t.flags.getFlagValue());
});

test('Text static register and getApproximateWidth', () => {
  expect(Text.register()).toEqual({ command: 'Text', shortcut: 'DT', type: 'Entity' });
  expect(Text.getApproximateWidth('abc', 10)).toBeCloseTo(16.2);
});

test('Text getHorizontalAlignment covers all cases', () => {
  const t = new Text({ points: [new Point()] });
  t.setProperty('horizontalAlignment', 0);
  expect(t.getHorizontalAlignment()).toBe('left');
  t.setProperty('horizontalAlignment', 1);
  expect(t.getHorizontalAlignment()).toBe('center');
  t.setProperty('horizontalAlignment', 2);
  expect(t.getHorizontalAlignment()).toBe('right');
  t.setProperty('horizontalAlignment', 3); t.setProperty('verticalAlignment', 0);
  expect(t.getHorizontalAlignment()).toBe('aligned');
  t.setProperty('horizontalAlignment', 4); t.setProperty('verticalAlignment', 0);
  expect(t.getHorizontalAlignment()).toBe('center');
  t.setProperty('horizontalAlignment', 5); t.setProperty('verticalAlignment', 0);
  expect(t.getHorizontalAlignment()).toBe('fit');
  t.setProperty('horizontalAlignment', 99);
  expect(t.getHorizontalAlignment()).toBe('left');
});

test('Text getVerticalAlignment covers all cases', () => {
  const t = new Text({ points: [new Point()] });
  t.setProperty('verticalAlignment', 0);
  expect(t.getVerticalAlignment()).toBe('alphabetic');
  t.setProperty('verticalAlignment', 1);
  expect(t.getVerticalAlignment()).toBe('bottom');
  t.setProperty('verticalAlignment', 2);
  expect(t.getVerticalAlignment()).toBe('middle');
  t.setProperty('verticalAlignment', 3);
  expect(t.getVerticalAlignment()).toBe('top');
  t.setProperty('verticalAlignment', 99);
  expect(t.getVerticalAlignment()).toBe('alphabetic');
});

test('Text getBoundingRect returns correct object', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 5, height: 6 };
  const rect = t.getBoundingRect();
  expect(rect).toEqual({ width: 5, height: 6, x: 1, y: 2 });
});

test('Text snaps returns all snap points', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 10, height: 10 };
  const snaps = t.snaps(new Point(0, 0), 1);
  expect(snaps.length).toBe(1);
  expect(snaps[0].type).toBe('node');
});

test('Text closestPoint returns correct distance', () => {
  const t = new Text({ points: [new Point(0, 0)] });
  t.boundingRect = { width: 10, height: 10 };
  const [mid, dist] = t.closestPoint(new Point(5, 5));
  expect(mid.x).toBe(5);
  expect(mid.y).toBe(5);
  expect(dist).toBe(0);
  const [mid2, dist2] = t.closestPoint(new Point(100, 100));
  expect(mid2.x).toBe(5);
  expect(mid2.y).toBe(5);
  expect(dist2).toBeGreaterThan(0);
});

test('Text boundingBox returns BoundingBox', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 10, height: 10 };
  const box = t.getBoundingRect();
  expect(box.x).toBe(1);
  expect(box.y).toBe(2);
  expect(box.width).toBe(10);
  expect(box.height).toBe(10);
});

test('Text toPolylinePoints returns correct array', () => {
  const t = new Text({ points: [new Point(1, 2)] });
  t.boundingRect = { width: 10, height: 10 };
  const pts = t.toPolylinePoints();
  expect(pts.length).toBe(5);
  expect(pts[0].x).toBe(1);
  expect(pts[0].y).toBe(2);
  expect(pts[2].x).toBe(11);
  expect(pts[2].y).toBe(12);
  expect(pts[4].x).toBe(pts[0].x);
  expect(pts[4].y).toBe(pts[0].y);
});

test('Text setBackwards and setUpsideDown edge cases', () => {
  const t = new Text({ points: [new Point()] });
  t.setBackwards(true);
  expect(t.getProperty('backwards')).toBe(true);
  t.setBackwards(false);
  expect(t.getProperty('backwards')).toBe(false);
  t.setUpsideDown(true);
  expect(t.getProperty('upsideDown')).toBe(true);
  t.setUpsideDown(false);
  expect(t.getProperty('upsideDown')).toBe(false);
});

test('Text setRotation handles undefined and height 0', () => {
  const t = new Text({ points: [new Point()] });
  t.setRotation(45);
  expect(t.points[1].x).toBeCloseTo(1.7677);
  expect(t.points[1].y).toBeCloseTo(1.7677);
  t.setRotation(undefined);
  expect(t.points[1].x).toBeCloseTo(1.7677);
  expect(t.points[1].y).toBeCloseTo(1.7677);
});

test('Text getRotation returns 0 if points[1] undefined', () => {
  const t = new Text({ points: [new Point()] });
  t.points[1] = undefined;
  expect(t.getRotation()).toBe(0);
});

test('Text.execute re-prompts on zero or negative height', async () => {
  const pt = new Point(0, 0);

  // 0 and -5 are rejected; 5 is accepted
  await withMockInput(DesignCore.Scene, [pt, 0, -5, 5, 0, 'Hello'], async () => {
    const text = new Text({});
    await text.execute();

    expect(text.getProperty('height')).toBe(5);
    expect(text.getProperty('string')).toBe('Hello');
  });
});

test('Text.execute does not create entity for empty string', async () => {
  const pt = new Point(0, 0);
  let executeCommandCalled = false;

  await withMockInput(DesignCore.Scene, [pt, 5, 0, ''], async () => {
    const text = new Text({});
    await text.execute();

    expect(text.getProperty('string')).toBe('');
  }, { extraMethods: { executeCommand: () => {
    executeCommandCalled = true;
  } } });

  expect(executeCommandCalled).toBe(false);
});

test('Text.snaps node snap position matches points[0]', () => {
  const t = new Text({ points: [new Point(5, 10)] });
  const nodeSnaps = t.snaps(new Point(0, 0), 100).filter((s) => s.type === 'node');
  expect(nodeSnaps.length).toBe(1);
  expect(nodeSnaps[0].snapPoint.x).toBe(5);
  expect(nodeSnaps[0].snapPoint.y).toBe(10);
});

test('Text.preview - uses rubber band when not waiting for string input', () => {
  const text = new Text({ points: [new Point(5, 5)] });
  DesignCore.Scene.auxiliaryEntities.clear();
  DesignCore.Scene.previewEntities.clear();
  // Simulate a pending POINT prompt (not STRING)
  DesignCore.Scene.inputManager.promptOption = { types: [Input.Type.POINT] };

  text.preview();

  expect(DesignCore.Scene.auxiliaryEntities.count()).toBeGreaterThanOrEqual(1);
  expect(DesignCore.Scene.previewEntities.count()).toBe(0);

  DesignCore.Scene.inputManager.promptOption = undefined;
});

test('Text.preview - shows text entity when waiting for string input', () => {
  const text = new Text({ points: [new Point(5, 5)], height: 5, rotation: 0, string: '' });
  DesignCore.Scene.auxiliaryEntities.clear();
  DesignCore.Scene.previewEntities.clear();
  // Simulate a pending STRING prompt
  DesignCore.Scene.inputManager.promptOption = { types: [Input.Type.STRING] };

  text.preview();

  expect(DesignCore.Scene.previewEntities.count()).toBeGreaterThanOrEqual(1);
  expect(DesignCore.Scene.auxiliaryEntities.count()).toBe(0);

  DesignCore.Scene.inputManager.promptOption = undefined;
});

test('Text.getApproximateWidth unknown character uses fallback width', () => {
  // Unknown characters fall back to 0.56 em per character
  const unknown = Text.getApproximateWidth('€', 10);
  expect(unknown).toBeCloseTo(5.6);
});

test('Text.getApproximateWidth empty string returns 0', () => {
  expect(Text.getApproximateWidth('', 10)).toBe(0);
});

test('Text setRotation with height 0 does not move points[1]', () => {
  const t = new Text({ points: [new Point(0, 0)] });
  t.setProperty('height', 0);
  const originalPoint1 = t.points[1];
  t.setRotation(45);
  expect(t.points[1]).toBe(originalPoint1);
});

test('Text.fromDxf remaps insertion point from sequence-11 point', () => {
  // When DXF points[1] has sequence == 11, fromDxf uses it as the insertion point (points[0])
  const data = Text.fromDxf({
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 75, sequence: 11 },
    ],
  });
  const t = new Text(data);
  expect(t.points[0].x).toBe(50);
  expect(t.points[0].y).toBe(75);
});

test('Text getHorizontalAlignment unsupported cases return left when verticalAlignment !== 0', () => {
  const t = new Text({ points: [new Point()] });
  t.setProperty('verticalAlignment', 1); // non-zero

  t.setProperty('horizontalAlignment', 3);
  expect(t.getHorizontalAlignment()).toBe('left');

  t.setProperty('horizontalAlignment', 4);
  expect(t.getHorizontalAlignment()).toBe('left');

  t.setProperty('horizontalAlignment', 5);
  expect(t.getHorizontalAlignment()).toBe('left');
});

test('Text.dxf includes non-zero flags and rotation', () => {
  const text = new Text({ handle: '1', points: [new Point(0, 0)] });
  text.setProperty('backwards', true); // flag value 2
  text.setProperty('upsideDown', true); // flag value 4  → combined = 6
  text.setRotation(90);
  text.setProperty('string', 'R');

  const file = new File();
  text.dxf(file);

  expect(file.contents).toContain('71\n6\n');
  expect(file.contents).toContain('50\n90\n');
});

test('Text.toCharacters returns one entry with scene coords, rotation and string', () => {
  const text = new Text({ points: [new Point(5, 10), new Point(15, 10)], string: 'Hello', height: 2.5, rotation: 0 });
  const chars = text.toCharacters();
  expect(chars).toHaveLength(1);
  expect(chars[0].char).toBe('Hello');
  expect(typeof chars[0].x).toBe('number');
  expect(typeof chars[0].y).toBe('number');
  expect(chars[0].rotation).toBeCloseTo(0);
  expect(chars[0].upsideDownOffset).toBe(0);
  expect(chars[0].backwardsOffset).toBe(0);
});

test('Text.toCharacters returns empty array for empty string', () => {
  const text = new Text({ points: [new Point(0, 0), new Point(10, 0)], string: '', height: 2.5 });
  expect(text.toCharacters()).toEqual([]);
});

test('Text.draw calls renderer.drawText with correct font and string', () => {
  const text = new Text({ points: [new Point(0, 0), new Point(10, 0)], string: 'Hello', height: 2.5 });
  let calledChars; let calledHeight;
  const mockRenderer = {
    drawText(characters, fontName, height) {
      calledChars = characters;
      calledHeight = height;
    },
    measureText: () => ({ width: 20 }),
  };
  text.draw(mockRenderer);
  expect(calledChars).toHaveLength(1);
  expect(calledChars[0].char).toBe('Hello');
  expect(calledHeight).toBe(2.5);
});

test('Text.draw skips call for empty string', () => {
  const text = new Text({ points: [new Point(0, 0), new Point(10, 0)], string: '', height: 2.5 });
  let drawTextCalled = false;
  const mockRenderer = { drawText() {
    drawTextCalled = true;
  }, measureText() {} };
  text.draw(mockRenderer);
  expect(drawTextCalled).toBe(false);
});

test('Text.draw updates boundingRect from measureText result', () => {
  const text = new Text({ points: [new Point(0, 0), new Point(10, 0)], string: 'Hi', height: 3 });
  const mockRenderer = {
    drawText() {},
    measureText: () => ({ width: 42 }),
  };
  text.draw(mockRenderer);
  expect(text.boundingRect.width).toBe(42);
  expect(text.boundingRect.height).toBe(3);
});

describe('Text.fromDxf', () => {
  test('projects points[1] from rotation angle (group code 50)', () => {
    const data = Text.fromDxf({
      points: [new Point(10, 20)],
      50: 90,
      40: 2.5,
    });
    const t = new Text(data);
    expect(t.getProperty('rotation')).toBeCloseTo(90);
    expect(t.points[1].x).toBeCloseTo(10);
    expect(t.points[1].y).toBeCloseTo(22.5);
  });

  test('remaps sequence-11 alignment point to points[0]', () => {
    const data = Text.fromDxf({
      points: [
        new Point(0, 0),
        { x: 30, y: 40, sequence: 11 },
      ],
    });
    const t = new Text(data);
    expect(t.points[0].x).toBe(30);
    expect(t.points[0].y).toBe(40);
  });

  test('preserves other properties unchanged', () => {
    const data = Text.fromDxf({
      points: [new Point(0, 0)],
      1: 'hello',
      40: 5,
      layer: 'TEST',
    });
    expect(data[1]).toBe('hello');
    expect(data[40]).toBe(5);
    expect(data.layer).toBe('TEST');
  });

  test('returns data unchanged when no points present', () => {
    const data = Text.fromDxf({ 1: 'abc' });
    expect(data[1]).toBe('abc');
    expect(data.points).toEqual([]);
  });

  test('result equivalent to direct construction with setRotation', () => {
    const pt = new Point(5, 10);
    const fromDxfData = Text.fromDxf({ points: [pt], 50: 45, 40: 2.5 });
    const t1 = new Text(fromDxfData);

    const t2 = new Text({ points: [pt] });
    t2.setRotation(45);

    expect(t1.points[0].x).toBeCloseTo(t2.points[0].x);
    expect(t1.points[0].y).toBeCloseTo(t2.points[0].y);
    expect(t1.getProperty('rotation')).toBeCloseTo(t2.getProperty('rotation'));
  });
});
