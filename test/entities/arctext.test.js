import { ArcAlignedText } from '../../core/entities/arctext.js';
import { ArcAlignedCharacter } from '../../core/entities/arctext.js';
import { Arc } from '../../core/entities/arc.js';
import { Point } from '../../core/entities/point.js';
import { BoundingBox } from '../../core/lib/boundingBox.js';
import { DesignCore } from '../../core/designCore.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

const arcInputScenarios = [
  {
    desc: 'two points and an angle',
    input: [new SingleSelection(0, new Point(5, 0)), 2.5, 'Test Arc'],
    selectedEntities: [new Arc({ points: [new Point(), new Point(100, 0), new Point(-100, 0)] })],
    expectedTextHeight: 2.5,
    expectedText: 'Test Arc',
  },
];

test.each(arcInputScenarios)('ArcText.execute handles $desc', async (scenario) => {
  const { input, selectedEntities, expectedTextHeight, expectedText } = scenario;

  await withMockInput(DesignCore.Scene, input, async () => {
    const arcText = new ArcAlignedText();
    await arcText.execute();

    expect(arcText.getProperty('styleName')).toBe('STANDARD');
    expect(arcText.getProperty('height')).toBe(expectedTextHeight);
    expect(arcText.getProperty('string')).toBe(expectedText);

    // arc props
    expect(arcText.getProperty('radius')).toBe(100);
    expect(arcText.startAngle()).toBe(0);
    expect(arcText.endAngle()).toBeCloseTo(3.14159);
  }, { selectedEntities });
});

test('ArcAlignedCharacter', () => {
  const point = new Point(10, 20);
  const char = 'T';
  const angle = Math.PI / 2;

  const ac = new ArcAlignedCharacter(char, point, angle);

  expect(ac.character).toBe(char);
  expect(ac.position.x).toBe(point.x);
  expect(ac.position.y).toBe(point.y);
  expect(ac.angle).toBeCloseTo(angle);
  expect(ac.baseline.x).toBe(10.5);
  expect(ac.baseline.y).toBe(19.5);
  expect(ac.boundingBox).toBeInstanceOf(BoundingBox);
});


test('ArcText startAngle', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)] });
  expect(arcText.startAngle()).toBeCloseTo(0);

  const arcText90 = new ArcAlignedText({ points: [new Point(0, 0)], startAngle: 90 });
  expect(arcText90.startAngle()).toBeCloseTo(Math.PI / 2);
});

test('ArcText endAngle', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)] });
  expect(arcText.endAngle()).toBeCloseTo(Math.PI);

  const arcText90 = new ArcAlignedText({ points: [new Point(0, 0)], endAngle: 90 });
  expect(arcText90.endAngle()).toBeCloseTo(Math.PI / 2);
});

test('ArcText linearToAngular', () => {
  const arcText = new ArcAlignedText();

  // linearToAngular(length, radius) - returns angle in radians
  expect(arcText.linearToAngular(0, 100)).toBeCloseTo(0);
  expect(arcText.linearToAngular(10, 100)).toBeCloseTo(0.199337);
  expect(arcText.linearToAngular(-10, 100)).toBeCloseTo(-0.199337);

  expect(arcText.linearToAngular(0, 0)).toBeCloseTo(0);
  expect(arcText.linearToAngular(10, -101.247222)).toBeCloseTo(0.199337);
  expect(arcText.linearToAngular(-10, -101.247222)).toBeCloseTo(-0.199337);
});

test('ArcText arcMidAngle', () => {
  const arcText = new ArcAlignedText();
  // arcMidAngle(startAngle, endAngle) - returns angle in radians
  expect(arcText.arcMidAngle(0, Math.PI / 2)).toBeCloseTo(Math.PI / 4);
  expect(arcText.arcMidAngle(Math.PI / 2, Math.PI)).toBeCloseTo((3 * Math.PI) / 4);
  expect(arcText.arcMidAngle(Math.PI, (3 * Math.PI) / 2)).toBeCloseTo((5 * Math.PI) / 4);
  expect(arcText.arcMidAngle((3 * Math.PI) / 2, 2 * Math.PI)).toBeCloseTo((7 * Math.PI) / 4);
  expect(arcText.arcMidAngle(0, Math.PI)).toBeCloseTo(Math.PI / 2);
  expect(arcText.arcMidAngle(Math.PI, 0)).toBeCloseTo(Math.PI * 1.5);
});

test('ArcText getArcAlignedCharacters', () => {
  // ArcText properties:
  // startAngle 0 - degrees
  // endAngle 180 - degrees
  // offsetFromRight 0 - mm
  // offsetFromLeft 0 - mm
  // textReversed 0 = forward, 1 = reversed
  // textOrientation 1 = outward, 2 = inward
  // textAlignment 1 = fit to arc, 2 = left align, 3 = right align, 4 = centre
  // ArcSide convex = 1, concave = 2
  let chars = [];

  // Create ArcAlignedText with string 'Test' and radius 100
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  chars = arcText.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-2.05483);
  expect(chars[0].position.y).toBeCloseTo(101.22915);
  expect(chars[0].angle).toBeCloseTo(0.02030);
  // Fourth character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(2.05483);
  expect(chars.at(-1).position.y).toBeCloseTo(101.22915);
  expect(chars.at(-1).angle).toBeCloseTo(-0.02030);


  // //////// Text Alignment Tests //////////

  // Create ArcAlignedText - right aligned - textAlignment = 3 - Characters should be reversed
  const arcTextAlignRight = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 3 });
  chars = arcTextAlignRight.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character - Reversed!
  expect(chars[0].character).toBe('t');
  expect(chars[0].position.x).toBeCloseTo(101.23852);
  expect(chars[0].position.y).toBeCloseTo(1.52491);
  expect(chars[0].angle).toBeCloseTo(-1.55573);
  // Last character - Reversed!
  expect(chars.at(-1).character).toBe('T');
  expect(chars.at(-1).position.x).toBeCloseTo(101.09324);
  expect(chars.at(-1).position.y).toBeCloseTo(5.63200);
  expect(chars.at(-1).angle).toBeCloseTo(-1.51514);

  // Create ArcAlignedText - left aligned - textAlignment = 2
  const arcTextAlignLeft = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 2 });
  chars = arcTextAlignLeft.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-101.24664);
  expect(chars[0].position.y).toBeCloseTo(0.82499);
  expect(chars[0].angle).toBeCloseTo(1.56265);
  // Last character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(-101.12976);
  expect(chars.at(-1).position.y).toBeCloseTo(4.93298);
  expect(chars.at(-1).angle).toBeCloseTo(1.52206);

  // Create ArcAlignedText - fit to arc - textAlignment = 1
  const arcTextFitToArc = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 1 });
  chars = arcTextFitToArc.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-101.24664);
  expect(chars[0].position.y).toBeCloseTo(0.82499);
  expect(chars[0].angle).toBeCloseTo(1.56265);
  // Last character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(101.23852);
  expect(chars.at(-1).position.y).toBeCloseTo(1.52491);
  expect(chars.at(-1).angle).toBeCloseTo(-1.55573);

  // //////// Arc Side Tests //////////

  // Create ArcAlignedText with string 'Test' and radius 100
  const arcTextConvex = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, arcSide: 1 });
  chars = arcTextConvex.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-2.05483);
  expect(chars[0].position.y).toBeCloseTo(101.22915);
  expect(chars[0].angle).toBeCloseTo(0.02030);
  // Fourth character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(2.05483);
  expect(chars.at(-1).position.y).toBeCloseTo(101.22915);
  expect(chars.at(-1).angle).toBeCloseTo(-0.02030);

  // Create ArcAlignedText with string 'Test' and radius 100
  const arcTextConcave = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, arcSide: 2 });
  chars = arcTextConcave.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-2.05482);
  expect(chars[0].position.y).toBeCloseTo(98.72862);
  expect(chars[0].angle).toBeCloseTo(0.02081);
  // Fourth character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(2.05482);
  expect(chars.at(-1).position.y).toBeCloseTo(98.72862);
  expect(chars.at(-1).angle).toBeCloseTo(-0.02081);
});

test('ArcText.dxf', () => {
  const arctext = new ArcAlignedText({ handle: '1', points: [new Point(100, 100)], string: 'Test', radius: 100 });
  let file = new File();
  arctext.dxf(file);
  // console.log(file.contents);

  const dxfString = `0
ARCALIGNEDTEXT
5
1
100
AcDbEntity
8
0
100
AcDbArcAlignedText
1
Test
2
Arial
3

7
STANDARD
10
100
20
100
30
0.0
40
100
41
1
42
2.5
43
0.095
44
0
45
0
46
0
50
0
51
180
70
0
71
1
72
4
73
1
74
0
75
0
76
0
77
0
78
34
79
0
90
256
210
0
220
0
230
1
280
1
330

`;

  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newArcAlignedText = new ArcAlignedText({
    handle: arctext.getProperty('handle'),
    points: arctext.points,
    string: arctext.getProperty('string'),
    styleName: arctext.getProperty('styleName'),
    radius: arctext.getProperty('radius'),
    height: arctext.getProperty('height'),
    characterSpacing: arctext.getProperty('characterSpacing'),
    offsetFromArc: arctext.getProperty('offsetFromArc'),
    offsetFromRight: arctext.getProperty('offsetFromRight'),
    offsetFromLeft: arctext.getProperty('offsetFromLeft'),
    textOrientation: arctext.getProperty('textOrientation'),
    textAlignment: arctext.getProperty('textAlignment'),
    arcSide: arctext.getProperty('arcSide'),
  });
  file = new File();
  newArcAlignedText.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Test ArcText.snaps', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  const point = new Point(100, 100);
  const snaps = arcText.snaps(point, 1);
  const nodeSnaps = snaps.filter((s) => s.type === 'node');
  expect(nodeSnaps[0].snapPoint.x).toBeCloseTo(-2.05483);
  expect(nodeSnaps[0].snapPoint.y).toBeCloseTo(101.22915);
});

test('Test ArcText.closestPoint', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  const point = new Point(100, 100);
  const closest = arcText.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(2.05483);
  expect(closest[0].y).toBeCloseTo(101.22915);
});

test('Test ArcText.boundingBox', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  expect(arcText.boundingBox().xMin).toBeCloseTo(-2.81733);
  expect(arcText.boundingBox().xMax).toBeCloseTo(2.46733);
  expect(arcText.boundingBox().yMin).toBeCloseTo(99.97915);
  expect(arcText.boundingBox().yMax).toBeCloseTo(102.49878);
});

test('Test ArcText.toPolylinePoints - returns correct points array', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  const result = arcText.toPolylinePoints();
  expect(result.length).toBe(4);
  expect(result[0].x).toBeCloseTo(-2.05483);
  expect(result[0].y).toBeCloseTo(101.22915);
});

test('ArcText.snaps returns a centre snap at points[0]', () => {
  const arcText = new ArcAlignedText({ points: [new Point(3, 7)], string: 'Hi', radius: 50 });
  const centreSnaps = arcText.snaps(new Point(0, 0), 100).filter((s) => s.type === 'centre');
  expect(centreSnaps.length).toBe(1);
  expect(centreSnaps[0].snapPoint.x).toBe(3);
  expect(centreSnaps[0].snapPoint.y).toBe(7);
});

test('ArcText.snaps returns node snaps only for non-space characters', () => {
  // 'A B' has 3 characters: 'A', ' ', 'B' — only 'A' and 'B' produce node snaps
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'A B', radius: 100 });
  const nodeSnaps = arcText.snaps(new Point(0, 0), 100).filter((s) => s.type === 'node');
  expect(nodeSnaps.length).toBe(2);
});

test('ArcAlignedCharacter respects explicit height and width', () => {
  const ac = new ArcAlignedCharacter('A', new Point(0, 0), 0, 5, 3);
  expect(ac.height).toBe(5);
  expect(ac.width).toBe(3);
});

test('ArcText getArcAlignedCharacters empty string returns empty array', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: '', radius: 100 });
  expect(arcText.getArcAlignedCharacters()).toHaveLength(0);
});

test('ArcText boundingBox empty string returns BoundingBox instance', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: '', radius: 100 });
  expect(arcText.boundingBox()).toBeInstanceOf(BoundingBox);
});

test('ArcText toPolylinePoints empty string returns empty array', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: '', radius: 100 });
  expect(arcText.toPolylinePoints()).toHaveLength(0);
});

test('ArcText snaps with empty string returns only centre snap', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: '', radius: 100 });
  const snaps = arcText.snaps(new Point(0, 0), 1);
  expect(snaps).toHaveLength(1);
  expect(snaps[0].type).toBe('centre');
});

test('ArcText closestPoint returns distance 0.1 when within height * 0.35', () => {
  // Single char 'T' centre-aligned sits at (0, 101.25); height = 2.5, threshold = 0.875
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'T', radius: 100 });
  const chars = arcText.getArcAlignedCharacters();
  const charPos = chars[0].position;
  // 0.5 units away is within the 0.875 threshold
  const closePoint = new Point(charPos.x + 0.5, charPos.y);
  const [, dist] = arcText.closestPoint(closePoint);
  expect(dist).toBe(0.1);
});

test('ArcText getArcAlignedCharacters fit-to-arc single character places at midpoint', () => {
  const t = new ArcAlignedText({ points: [new Point(0, 0)], radius: 10, string: 'X',
    startAngle: 0, endAngle: 180, textAlignment: 1 });
  const chars = t.getArcAlignedCharacters();
  expect(chars).toHaveLength(1);
  // midpoint of 0°–180° arc at radius 10 is 90° → point near (0, 10)
  expect(chars[0].position.x).toBeCloseTo(0, 0);
  expect(chars[0].position.y).toBeGreaterThan(0);
});

test('ArcText getArcAlignedCharacters single character is placed at arc midpoint', () => {
  // Single char with centre alignment: charOffsetAngles = [0], stringStartPoint = arcMidPoint
  // arcMidAngle(0, PI) = PI/2 → project(PI/2, 101.25) = (0, 101.25), angle = PI/2 - PI/2 = 0
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'X', radius: 100 });
  const chars = arcText.getArcAlignedCharacters();
  expect(chars).toHaveLength(1);
  expect(chars[0].character).toBe('X');
  expect(chars[0].position.x).toBeCloseTo(0, 4);
  expect(chars[0].position.y).toBeCloseTo(101.25, 4);
  expect(chars[0].angle).toBeCloseTo(0, 4);
});

test('ArcText getArcAlignedCharacters textOrientation inward reverses character order', () => {
  // textOrientation 2 reverses the string before placing characters
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textOrientation: 2 });
  const chars = arcText.getArcAlignedCharacters();
  expect(chars).toHaveLength(4);
  expect(chars[0].character).toBe('t'); // reversed
  expect(chars.at(-1).character).toBe('T'); // reversed
});

test('ArcText getArcAlignedCharacters offsetFromLeft shifts character positions', () => {
  // offsetFromLeft moves the string start away from the arc end for left-aligned text
  const base = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 2, offsetFromLeft: 0 });
  const offset = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 2, offsetFromLeft: 10 });
  const baseChars = base.getArcAlignedCharacters();
  const offsetChars = offset.getArcAlignedCharacters();
  expect(offsetChars[0].position.x).not.toBeCloseTo(baseChars[0].position.x, 1);
});

test('ArcText getArcAlignedCharacters offsetFromRight shifts character positions', () => {
  // offsetFromRight moves the string start away from the arc start for right-aligned text
  const base = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 3, offsetFromRight: 0 });
  const offset = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 3, offsetFromRight: 10 });
  const baseChars = base.getArcAlignedCharacters();
  const offsetChars = offset.getArcAlignedCharacters();
  expect(offsetChars[0].position.x).not.toBeCloseTo(baseChars[0].position.x, 1);
});

test('ArcAlignedText.toCharacters returns one entry per character with scene coords', () => {
  const arc = new ArcAlignedText({ points: [new Point(0, 0)], string: 'AB', radius: 100 });
  const chars = arc.toCharacters();
  expect(chars).toHaveLength(2);
  expect(chars[0].char).toBe('A');
  expect(chars[1].char).toBe('B');
  expect(typeof chars[0].x).toBe('number');
  expect(typeof chars[0].y).toBe('number');
  expect(typeof chars[0].rotation).toBe('number');
});

test('ArcAlignedText.draw calls renderer.drawText with all characters', () => {
  const arc = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Hi', radius: 50 });
  let calledChars;
  const mockRenderer = {
    drawText(characters) {
      calledChars = characters;
    },
  };
  arc.draw(mockRenderer);
  expect(calledChars).toHaveLength(2);
  expect(calledChars[0].char).toBe('H');
  expect(calledChars[1].char).toBe('i');
});
