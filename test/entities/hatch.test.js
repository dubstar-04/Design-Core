import { BasePolyline } from '../../core/entities/basePolyline.js';
import { Circle } from '../../core/entities/circle.js';
import { Hatch } from '../../core/entities/hatch.js';
import { Line } from '../../core/entities/line.js';
import { Point } from '../../core/entities/point.js';

import { File } from '../test-helpers/test-helpers.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Arc } from '../../core/entities/arc.js';
import { Text } from '../../core/entities/text.js';

const points = [new Point(100, 100, 1), new Point(200, 100, 1)];
const boundaryShape = new BasePolyline({ points: points });

const hatch = new Hatch();
hatch.boundaryShapes = [boundaryShape];

test('Test Hatch', () => {
  const data =
  {
    '0': 'HATCH',
    '2': 'HONEY', // hatch name
    // '8': '0', // layer name
    '41': 2, // Pattern scale
    // '43': 0, // Pattern line base X
    // '44': 0, // Pattern line base Y
    // '45': -2.245064030267288, // Pattern line offset x
    // '46': 2.245064030267288, // Pattern line offset y
    // '47': 0.5126851563522042, // pixel size
    '52': 45, // pattern angle
    // '53': 45, // Pattern line angle
    '70': 0, // Solid fill flag
    // '71': 1, // Associativity flag
    // '72': [0, 1], // Edge type
    // '73': [1, 1], // Boundary annotation flag
    // '75': 1, // Hatch style
    // '76': 1, // Hatch pattern type
    // '77': 0, // Hatch pattern double flag
    // '78': 1, // Number of pattern definition lines
    // '79': 0, // Number of dash length items
    // '91': 2, // Number of boundary path loops
    // '92': [7, 7], // Boundary path type flag
    // '93': [4, 2], // Number of edges in this boundary path / number of points in polyline
    // '97': [1, 1], // Number of source boundary objects
    // '98': 2, // Number of seed points
  };

  const newHatch = new Hatch(data);

  expect(newHatch.patternName).toBe('HONEY');
  expect(newHatch.angle).toBe(45);
  expect(newHatch.scale).toBe(2);
  expect(newHatch.solid).toBe(false);
});

test('Test Hatch.getDataValue', () => {
  const data =
  {
    '2': 'ANSI31', // hatch name
    '72': [0, 1], // Edge type
  };

  expect(hatch.getDataValue(data, 2)).toBe('ANSI31');
  expect(hatch.getDataValue(data, 72)).toBe(0);
});

test('Test Hatch.getPatternName', () => {
  expect(hatch.getPatternName()).toBe('ANSI31');
});

test('Test Hatch.setPatternName', () => {
  expect(hatch.solid).toBe(false);
  hatch.setPatternName('Solid');
  expect(hatch.pattern).toBe('SOLID');
  expect(hatch.solid).toBe(true);

  hatch.setPatternName('Ansi31');
  expect(hatch.pattern).toBe('ANSI31');
  expect(hatch.solid).toBe(false);
});

test('Test Hatch.closestPoint', () => {
  // inside
  const point1 = new Point(150, 100);
  const closest1 = hatch.closestPoint(point1);
  expect(closest1[0].x).toBeCloseTo(150);
  expect(closest1[0].y).toBeCloseTo(100);
  expect(closest1[1]).toBe(0);

  // outside
  const point2 = new Point();
  const closest2 = hatch.closestPoint(point2);
  expect(closest2[0].x).toBeCloseTo(0);
  expect(closest2[0].y).toBeCloseTo(0);
  expect(closest2[1]).toBeCloseTo(Infinity);
});

test('Test Hatch.isInside', () => {
  // Inside Points
  // upper right quad of circle
  expect(hatch.isInside(new Point(165, 115))).toBe(true);
  // upper left quad of circle
  expect(hatch.isInside(new Point(130, 115))).toBe(true);
  // lower left quad of circle
  expect(hatch.isInside(new Point(130, 80))).toBe(true);
  // lower right quad of circle
  expect(hatch.isInside(new Point(165, 80))).toBe(true);
  // middle of circle
  expect(hatch.isInside(new Point(150, 100))).toBe(true);

  // Outside Points
  // upper right quad of circle
  expect(hatch.isInside(new Point(190, 140))).toBe(false);
  // upper left quad of circle
  expect(hatch.isInside(new Point(110, 140))).toBe(false);
  // lower left quad of circle
  expect(hatch.isInside(new Point(110, 60))).toBe(false);
  // lower right quad of circle
  expect(hatch.isInside(new Point(190, 60))).toBe(false);
  // middle of circle
  expect(hatch.isInside(new Point(205, 100))).toBe(false);
});

test('Test Hatch.boundingBox', () => {
  expect(hatch.boundingBox().xMin).toBe(100);
  expect(hatch.boundingBox().xMax).toBe(200);
  expect(hatch.boundingBox().yMin).toBe(50);
  expect(hatch.boundingBox().yMax).toBe(150);
});

test('Test Hatch.dxf', () => {
  let file = new File();
  hatch.dxf(file);
  // console.log(file.contents);

  let dxfString = `0
HATCH
5
1
100
AcDbEntity
8
0
100
AcDbHatch
10
0
20
0
30
0.0
210
0.0
220
0.0
230
1.0
2
ANSI31
70
0
71
0
91
1
92
7
72
1
73
1
93
2
10
100
20
100
42
1
10
200
20
100
42
1
97
0
75
1
76
1
52
0
41
1
77
0
78
1
53
45
43
0
44
0
45
-2.245064030267288
46
2.2450640302672884
79
0
47
0.5
98
1
10
1
20
1
`;
  expect(file.contents).toEqual(dxfString);

  // create new entity from entity data to ensure all props are loaded
  const newHatch = new Hatch(hatch);
  file = new File();
  newHatch.dxf(file);
  expect(file.contents).toEqual(dxfString);

  // Export rotated and scaled
  const rotatedScaleHatch = new Hatch();
  rotatedScaleHatch.angle = 45;
  rotatedScaleHatch.scale = 2;

  file = new File();
  rotatedScaleHatch.dxf(file);
  // console.log(file.contents);

  dxfString = `0
HATCH
5
1
100
AcDbEntity
8
0
100
AcDbHatch
10
0
20
0
30
0.0
210
0.0
220
0.0
230
1.0
2
ANSI31
70
0
71
0
91
0
97
0
75
1
76
1
52
45
41
2
77
0
78
1
53
90
43
0
44
0
45
-6.35
46
3.888253587292846e-16
79
0
47
0.5
98
1
10
1
20
1
`;
  expect(file.contents).toEqual(dxfString);
});

test('Test Hatch.processBoundaryData', () => {
  // create data defining a square and a circle
  const data =
  {
    '0': 'HATCH',
    // '2': 'ANSI31', // hatch name
    // '8': '0', // layer name
    // '41': 1, // Pattern scale
    // '43': 0, // Pattern line base X
    // '44': 0, // Pattern line base Y
    // '45': -2.245064030267288, // Pattern line offset x
    // '46': 2.245064030267288, // Pattern line offset y
    // '47': 0.5126851563522042, // pixel size
    // '52': 0, // pattern angle
    // '53': 45, // Pattern line angle
    // '70': 0, // Solid fill flag
    // '71': 1, // Associativity flag
    '72': [0, 1], // Edge type
    // '73': [1, 1], // Boundary annotation flag
    // '75': 1, // Hatch style
    // '76': 1, // Hatch pattern type
    // '77': 0, // Hatch pattern double flag
    '78': 1, // Number of pattern definition lines
    // '79': 0, // Number of dash length items
    '91': 2, // Number of boundary path loops
    '92': [7, 7], // Boundary path type flag
    '93': [4, 2], // Number of edges in this boundary path / number of points in polyline
    // '97': [1, 1], // Number of source boundary objects
    // '98': 2, // Number of seed points
    // Points 0 and -1 are stripped before processing
    'points': [new Point(), new Point(200, 200), new Point(100, 200), new Point(100, 100), new Point(200, 100), new Point(350, 300, 1),
    new Point(250, 300, 1), new Point(350, 300, 1)],
  };

  const hatch = new Hatch();

  const boundaryData = hatch.processBoundaryData(data);

  // console.log(boundaryData);
  expect(boundaryData[0].points.length).toEqual(4);
  expect(boundaryData[1].points.length).toEqual(2);
});


test('Test Hatch.processSelection', () => {
  // create selected items defining a square
  let selectedItems = [];
  selectedItems.push(new Line({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedItems.push(new Line({ points: [new Point(200, 100), new Point(200, 200)] }));
  selectedItems.push(new Line({ points: [new Point(200, 200), new Point(100, 200)] }));
  selectedItems.push(new Line({ points: [new Point(100, 200), new Point(100, 100)] }));

  let hatch = new Hatch();
  let boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(8);


  // create selected items defining a circle
  selectedItems = [];
  selectedItems.push(new Circle({ points: [new Point(100, 100), new Point(200, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(3);

  // create selected items defining a square (polyline)
  selectedItems = [];
  selectedItems.push(new Polyline({
    points: [new Point(100, 100), new Point(200, 100), new Point(200, 200),
    new Point(100, 200), new Point(100, 100)],
  }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(5);

  // create selected items defining a pill shape
  selectedItems = [];
  selectedItems.push(new Line({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedItems.push(new Arc({ points: [new Point(200, 150), new Point(200, 100), new Point(200, 200)] }));
  selectedItems.push(new Line({ points: [new Point(200, 200), new Point(100, 200)] }));
  selectedItems.push(new Arc({ points: [new Point(100, 150), new Point(100, 200), new Point(100, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(8);

  // Test a selection with invalid items
  selectedItems = [];
  selectedItems.push(new Text({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedItems.push(new Circle({ points: [new Point(100, 100), new Point(200, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(3);
});
