import { ArcAlignedText } from '../../core/entities/arctext.js';
import { ArcAlignedCharacter } from '../../core/entities/arctext.js';
import { Arc } from '../../core/entities/arc.js';
import { Point } from '../../core/entities/point.js';
import { BoundingBox } from '../../core/lib/boundingBox.js';
import { DesignCore } from '../../core/designCore.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';

import { File } from '../test-helpers/test-helpers.js';
import { Core } from '../../core/core/core.js';

// initialise core
new Core();

const arcInputScenarios = [
  {
    desc: 'two points and an angle',
    input: [new SingleSelection(0, new Point(5, 0)), 2.5, 'Test Arc'],
    selectedItems: [new Arc({ points: [new Point(), new Point(100, 0), new Point(-100, 0)] })],
    expectedTextHeight: 2.5,
    expectedText: 'Test Arc',
  },
];

test.each(arcInputScenarios)('ArcText.execute handles $desc', async (scenario) => {
  const { input, selectedItems, expectedTextHeight, expectedText } = scenario;
  const origInputManager = DesignCore.Scene.inputManager;
  let requestInputCallCount = 0;

  DesignCore.Scene.inputManager = {
    requestInput: async () => {
      requestInputCallCount++;
      return input[requestInputCallCount - 1];
    },
    executeCommand: () => {},
  };

  DesignCore.Scene.entities.get = () => {
    return selectedItems[0];
  };

  const arcText = new ArcAlignedText();
  await arcText.execute();

  expect(arcText.styleName).toBe('STANDARD');
  expect(arcText.height).toBe(expectedTextHeight);
  expect(arcText.string).toBe(expectedText);

  // arc props
  expect(arcText.radius).toBe(100);
  expect(arcText.startAngle()).toBe(0);
  expect(arcText.endAngle()).toBeCloseTo(3.14159);

  // Restore original inputManager
  DesignCore.Scene.inputManager = origInputManager;
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
  expect(ac.baseline.y).toBe(19.7);
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
  // textAlignment 1 = fit to arc, 2 = left align, 3 = right align, 4 = center
  // ArcSide convex = 1, concave = 2
  let chars = [];

  // Create ArcAlignedText with string 'Test' and radius 100
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  chars = arcText.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-2.39222);
  expect(chars[0].position.y).toBeCloseTo(101.22173);
  expect(chars[0].angle).toBeCloseTo(0.02362);
  // Fourth character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(2.39222);
  expect(chars.at(-1).position.y).toBeCloseTo(101.22173);
  expect(chars.at(-1).angle).toBeCloseTo(-0.02362);


  // //////// Text Alignment Tests //////////

  // Create ArcAlignedText - right aligned - textAlignment = 3 - Characters should be reversed
  const arcTextAlignRight = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 3 });
  chars = arcTextAlignRight.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character - Reversed!
  expect(chars[0].character).toBe('t');
  expect(chars[0].position.x).toBeCloseTo(101.24722);
  expect(chars[0].position.y).toBeCloseTo(0.74997);
  expect(chars[0].angle).toBeCloseTo(-1.56338);
  // Last character - Reversed!
  expect(chars.at(-1).character).toBe('T');
  expect(chars.at(-1).position.x).toBeCloseTo(101.09875);
  expect(chars.at(-1).position.y).toBeCloseTo(5.53213);
  expect(chars.at(-1).angle).toBeCloseTo(-1.51613);

  // Create ArcAlignedText - left aligned - textAlignment = 3
  const arcTextAlignLeft = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 2 });
  chars = arcTextAlignLeft.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-101.247222);
  expect(chars[0].position.y).toBeCloseTo(0.749979);
  expect(chars[0].angle).toBeCloseTo(1.56338);
  // Last character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(-101.09875);
  expect(chars.at(-1).position.y).toBeCloseTo(5.53213);
  expect(chars.at(-1).angle).toBeCloseTo(1.51613);

  // Create ArcAlignedText - fit to arc - textAlignment = 1
  const arcTextFitToArc = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, textAlignment: 1 });
  chars = arcTextFitToArc.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-101.247222);
  expect(chars[0].position.y).toBeCloseTo(0.74997);
  expect(chars[0].angle).toBeCloseTo(1.56338);
  // Last character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(101.24722);
  expect(chars.at(-1).position.y).toBeCloseTo(0.74997);
  expect(chars.at(-1).angle).toBeCloseTo(-1.56338);

  // //////// Arc Side Tests //////////

  // Create ArcAlignedText with string 'Test' and radius 100
  const arcTextConvex = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, arcSide: 1 });
  chars = arcTextConvex.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-2.39222);
  expect(chars[0].position.y).toBeCloseTo(101.22173);
  expect(chars[0].angle).toBeCloseTo(0.02362);
  // Fourth character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(2.39222);
  expect(chars.at(-1).position.y).toBeCloseTo(101.22173);
  expect(chars.at(-1).angle).toBeCloseTo(-0.02362);

  // Create ArcAlignedText with string 'Test' and radius 100
  const arcTextConcave = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100, arcSide: 2 });
  chars = arcTextConcave.getArcAlignedCharacters();
  expect(chars.length).toBe(4);
  // First character
  expect(chars[0].character).toBe('T');
  expect(chars[0].position.x).toBeCloseTo(-2.39222);
  expect(chars[0].position.y).toBeCloseTo(98.72102);
  expect(chars[0].angle).toBeCloseTo(0.02422);
  // Fourth character
  expect(chars.at(-1).character).toBe('t');
  expect(chars.at(-1).position.x).toBeCloseTo(2.39222);
  expect(chars.at(-1).position.y).toBeCloseTo(98.72102);
  expect(chars.at(-1).angle).toBeCloseTo(-0.02362);
});

test('ArcText.dxf', () => {
  const arctext = new ArcAlignedText({ points: [new Point(100, 100)], string: 'Test', radius: 100 });
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
  const newArcAlignedText = new ArcAlignedText(arctext);
  file = new File();
  newArcAlignedText.dxf(file);
  expect(file.contents).toEqual(dxfString);
});

test('Test ArcText.snaps', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  const point = new Point(100, 100);
  const snaps = arcText.snaps(point, 1);
  expect(snaps[0].x).toBeCloseTo(-2.39222);
  expect(snaps[0].y).toBeCloseTo(101.22173);
});

test('Test ArcText.closestPoint', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  const point = new Point(100, 100);
  const closest = arcText.closestPoint(point);
  expect(closest[0].x).toBeCloseTo(2.39222);
  expect(closest[0].y).toBeCloseTo(101.22173);
});

test('Test ArcText.boundingBox', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  expect(arcText.boundingBox().xMin).toBeCloseTo(-3.14222);
  expect(arcText.boundingBox().xMax).toBeCloseTo(3.14222);
  expect(arcText.boundingBox().yMin).toBeCloseTo(99.97173);
  expect(arcText.boundingBox().yMax).toBeCloseTo(102.49685);
});

test('Test ArcText.intersectPoints - returns correct points array', () => {
  const arcText = new ArcAlignedText({ points: [new Point(0, 0)], string: 'Test', radius: 100 });
  const result = arcText.intersectPoints();
  expect(result).toHaveProperty('points');
  expect(result.points[0].x).toBeCloseTo(-2.39222);
  expect(result.points[0].y).toBeCloseTo(101.22173);
});
