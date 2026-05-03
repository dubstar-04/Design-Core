import { Hatch } from '../../core/entities/hatch.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';

import { PolylineBase } from '../../core/entities/polylineBase.js';
import { Circle } from '../../core/entities/circle.js';
import { Line } from '../../core/entities/line.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Arc } from '../../core/entities/arc.js';
import { Text } from '../../core/entities/text.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';
import { Logging } from '../../core/lib/logging.js';
import { jest } from '@jest/globals';

import { Core } from '../../core/core/core.js';

// initialise core
new Core();

const points = [new Point(100, 100, 1), new Point(200, 100, 1)];
const boundaryShape = new PolylineBase({ points: points });

const hatch = new Hatch({ handle: '1' });
hatch.setProperty('childEntities', [boundaryShape]);

const hatchInputScenarios = [
  {
    desc: 'simple rectangle',
    boundaryItems: [new Line({ points: [new Point(0, 0), new Point(10, 0)] }), new Line({ points: [new Point(10, 0), new Point(10, 10)] }),
      new Line({ points: [new Point(10, 10), new Point(0, 10)] }), new Line({ points: [new Point(0, 10), new Point(0, 0)] })],
    pointCount: 4,
    pattern: 'ANSI31',
    scale: 1,
    angle: 0,
    // expectedPoints: 4,
    expectedPattern: 'ANSI31',
    expectedScale: 1,
    expectedAngle: 0,
  },
  {
    desc: 'triangle, custom pattern and scale',
    boundaryItems: [new Line({ points: [new Point(0, 0), new Point(5, 10)] }), new Line({ points: [new Point(5, 10), new Point(10, 0)] }),
      new Line({ points: [new Point(10, 0), new Point(0, 0)] })],
    pointCount: 3,
    pattern: 'SOLID',
    scale: 2,
    angle: 45,
    // expectedPoints: 3,
    expectedPattern: 'SOLID',
    expectedScale: 2,
    expectedAngle: 45,
  },
];

test.each(hatchInputScenarios)('Hatch.execute handles $desc', async (scenario) => {
  const { boundaryItems, pointCount, pattern, scale, angle, expectedPattern, expectedScale, expectedAngle } = scenario;

  await withMockInput(DesignCore.Scene, [true], async () => {
    // Manual mock for selected items
    DesignCore.Scene.selectionManager.selectedEntities = [];

    for (let i = 0; i < boundaryItems.length; i++) {
      DesignCore.Scene.selectionManager.selectedEntities.push(boundaryItems[i]);
    }

    const hatch = new Hatch({ patternName: pattern, scale: scale, angle: angle });

    await hatch.execute();

    expect(hatch.getProperty('childEntities').length).toBe(1);

    expect(hatch.getProperty('childEntities')[0].points.length).toBe(pointCount); // closed polyline adds extra point

    expect(hatch.points.length).toBe(2);
    // hatch first point should be at 0,0
    expect(hatch.points.at(0).x).toBe(0);
    expect(hatch.points.at(0).y).toBe(0);
    // hatch last point should be at 1,1
    expect(hatch.points.at(-1).x).toBe(1);
    expect(hatch.points.at(-1).y).toBe(1);
    expect(hatch.getProperty('patternName')).toBe(expectedPattern);
    expect(hatch.getProperty('scale')).toBe(expectedScale);
    expect(hatch.getProperty('angle')).toBe(expectedAngle);
  });
});

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

  expect(newHatch.getProperty('patternName')).toBe('HONEY');
  expect(newHatch.getProperty('angle')).toBe(45);
  expect(newHatch.getProperty('scale')).toBe(2);
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

test('Test Hatch patternName', () => {
  expect(hatch.getProperty('patternName')).toBe('ANSI31');

  hatch.setProperty('patternName', 'Solid');
  expect(hatch.getProperty('patternName')).toBe('SOLID');

  hatch.setProperty('patternName', 'Ansi31');
  expect(hatch.getProperty('patternName')).toBe('ANSI31');
});

test('Test Hatch dxfCode 70 overrides patternName to SOLID', () => {
  const data = { '2': 'ANSI31', '70': 1 };
  const h = new Hatch(data);
  expect(h.getProperty('patternName')).toBe('SOLID');
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
0.0
20
0.0
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


  // Export rotated and scaled
  const rotatedScaleHatch = new Hatch({ handle: '1' });
  rotatedScaleHatch.setProperty('angle', 45);
  rotatedScaleHatch.setProperty('scale', 2);

  file = new File();
  rotatedScaleHatch.dxf(file);
  // console.log(file.contents);

  // Don't export hatch if no boundary shapes
  expect(file.contents).toEqual('');

  const shape = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const boundary = rotatedScaleHatch.processSelection([shape]);
  expect(boundary[0]).toBeInstanceOf(Polyline);

  rotatedScaleHatch.setProperty('childEntities', boundary);
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
0.0
20
0.0
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
10
20
0
42
1
10
-10
20
0
42
1
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
  let selectedEntities = [];
  selectedEntities.push(new Line({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedEntities.push(new Line({ points: [new Point(200, 100), new Point(200, 200)] }));
  selectedEntities.push(new Line({ points: [new Point(200, 200), new Point(100, 200)] }));
  selectedEntities.push(new Line({ points: [new Point(100, 200), new Point(100, 100)] }));

  let hatch = new Hatch();
  let boundaryData = hatch.processSelection(selectedEntities);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(4);


  // create selected items defining a circle
  selectedEntities = [];
  selectedEntities.push(new Circle({ points: [new Point(100, 100), new Point(200, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedEntities);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(2);

  // create selected items defining a square (polyline)
  selectedEntities = [];
  selectedEntities.push(new Polyline({
    points: [new Point(100, 100), new Point(200, 100), new Point(200, 200),
      new Point(100, 200), new Point(100, 100)],
  }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedEntities);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(4);

  // create selected items defining a pill shape
  selectedEntities = [];
  selectedEntities.push(new Line({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedEntities.push(new Arc({ points: [new Point(200, 150), new Point(200, 100), new Point(200, 200)] }));
  selectedEntities.push(new Line({ points: [new Point(200, 200), new Point(100, 200)] }));
  selectedEntities.push(new Arc({ points: [new Point(100, 150), new Point(100, 200), new Point(100, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedEntities);
  expect(boundaryData.length).toEqual(1);
  // 2 lines + 2 arcs: each shared connection point is merged (not duplicated),
  // so the result is 4 unique vertices, not 5
  expect(boundaryData[0].points.length).toEqual(4);

  // Test a selection with invalid items
  selectedEntities = [];
  selectedEntities.push(new Text({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedEntities.push(new Circle({ points: [new Point(100, 100), new Point(200, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedEntities);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(2);
});

// Minimal mock canvas context that records moveTo calls and supports try/catch split
/**
 * Create a minimal mock renderer
 * @return {Object} mock renderer
 */
function makeMockCtx() {
  let traceCount = 0;
  let fillCalled = false;
  return {
    setDash: () => {},
    beginPath: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {
      fillCalled = true;
    },
    applyPath: (options) => {
      if (options?.fill) fillCalled = true;
    },
    tracePath: () => {
      traceCount++;
    },
    drawShape: () => {},
    drawSegments: (segments) => {
      traceCount += segments.length;
    },
    getMoveCalls: () => traceCount,
    getFillCalled: () => fillCalled,
  };
}

test('Test Hatch.draw solid fill renders filled boundary', () => {
  const solidHatch = new Hatch({ patternName: 'SOLID' });
  solidHatch.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] })]);

  const ctx = makeMockCtx();
  solidHatch.draw(ctx);

  expect(ctx.getFillCalled()).toBe(true);
});

test('Test Hatch.draw unknown pattern does not stroke pattern lines', () => {
  const unknownHatch = new Hatch({ patternName: 'ANSI31' });
  unknownHatch.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] })]);
  // Override pattern to a nonexistent name
  unknownHatch.setProperty('patternName', 'NOTAPATTERN');

  const ctx = makeMockCtx();
  unknownHatch.draw(ctx);

  // No pattern lines drawn
  expect(ctx.getFillCalled()).toBe(false);
});

test('Test Hatch.draw tight bound line count - square boundary', () => {
  // ANSI31: angle=45, yDelta=3.175, no dashes (dashLength = bbXLength/2)
  // 100x100 square: halfW=halfH=50, sin45=cos45=√2/2
  // halfY = 50*(√2/2) + 50*(√2/2) ≈ 70.71
  // yIncrement = ceil(70.71 / 3.175) = 23 → loop i=-23..22 = 46 raw lines
  // i=-23 (|ly|=73.025 > halfY=70.71) misses the square → 45 clipped segments
  const squareHatch = new Hatch({ patternName: 'ANSI31' });
  squareHatch.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })]);
  const ctx = makeMockCtx();
  squareHatch.draw(ctx);
  expect(ctx.getMoveCalls()).toBe(45);
});

test('Test Hatch.draw tight bound line count - flat boundary', () => {
  // ANSI31: angle=45, yDelta=3.175, no dashes
  // 100x10 flat box: halfW=50, halfH=5, sin45=cos45=√2/2
  // halfY = (50+5)*(√2/2) ≈ 38.89
  // yIncrement = ceil(38.89 / 3.175) = 13 → loop i=-13..12 = 26 raw lines
  // i=-13 (|ly|=41.275 > halfY=38.89) misses the flat box → 25 clipped segments
  const flatHatch = new Hatch({ patternName: 'ANSI31' });
  flatHatch.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 10), new Point(0, 10)] })]);
  const ctx = makeMockCtx();
  flatHatch.draw(ctx);
  expect(ctx.getMoveCalls()).toBe(25);
});

test('Test Hatch.draw tight bound produces fewer lines for flat boundary', () => {
  // A flat boundary (100x10) should produce fewer lines than a square (100x100).
  const squareHatch = new Hatch({ patternName: 'ANSI31' });
  squareHatch.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })]);

  const flatHatch = new Hatch({ patternName: 'ANSI31' });
  flatHatch.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 10), new Point(0, 10)] })]);

  const squareCtx = makeMockCtx();
  squareHatch.draw(squareCtx);

  const flatCtx = makeMockCtx();
  flatHatch.draw(flatCtx);

  expect(flatCtx.getMoveCalls()).toBeLessThan(squareCtx.getMoveCalls());
});

// ── buildPatternCache — early return tests ───────────────────────────────────

test('Hatch.buildPatternCache no childEntities sets cachedPattern to empty array', () => {
  const h = new Hatch({ patternName: 'HONEY' });
  // childEntities is empty by default
  h.buildPatternCache();
  expect(h.cachedPattern).toEqual([]);
});

test('Hatch.buildPatternCache solid fill sets cachedPattern to empty array', () => {
  const h = new Hatch({ patternName: 'SOLID' });
  h.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })]);
  h.buildPatternCache();
  expect(h.cachedPattern).toEqual([]);
});

test('Hatch.buildPatternCache unknown pattern sets cachedPattern to empty array', () => {
  const h = new Hatch({ patternName: 'HONEY' });
  h.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })]);
  h.setProperty('patternName', 'NOTAPATTERN');
  h.buildPatternCache();
  expect(h.cachedPattern).toEqual([]);
});

// ── buildPatternCache — pattern structure and scale tests ────────────────────

/**
 * Build a 100×100 square boundary
 * @return {Array} array containing one PolylineBase boundary
 */
const makeSquare = () => [new PolylineBase({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })];

/**
 * Sum all segment counts across all families in a cached hatch
 * @param {Hatch} h
 * @return {number} total segment count
 */
const totalSegments = (h) => h.cachedPattern.reduce((s, f) => s + f.segments.length, 0);

test('Hatch.buildPatternCache HONEY has 3 families each with dashes and segments', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', makeSquare());
  h.buildPatternCache();

  expect(h.cachedPattern.length).toBe(3);
  for (const family of h.cachedPattern) {
    expect(family.dashes.length).toBeGreaterThan(0);
    expect(family.segments.length).toBeGreaterThan(0);
  }
});

test('Hatch.buildPatternCache HONEY scale 2 dashes are 2× scale 1 dashes', () => {
  const h1 = new Hatch({ patternName: 'HONEY', scale: 1 });
  h1.setProperty('childEntities', makeSquare());
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.setProperty('childEntities', makeSquare());
  h2.buildPatternCache();

  for (let i = 0; i < h1.cachedPattern.length; i++) {
    const d1 = h1.cachedPattern[i].dashes;
    const d2 = h2.cachedPattern[i].dashes;
    expect(d2.length).toBe(d1.length);
    for (let j = 0; j < d1.length; j++) {
      expect(d2[j]).toBeCloseTo(d1[j] * 2, 5);
    }
  }
});

test('Hatch.buildPatternCache HONEY scale 2 produces fewer segments than scale 1', () => {
  const h1 = new Hatch({ patternName: 'HONEY', scale: 1 });
  h1.setProperty('childEntities', makeSquare());
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.setProperty('childEntities', makeSquare());
  h2.buildPatternCache();

  expect(totalSegments(h2)).toBeLessThan(totalSegments(h1));
});

test('Hatch.buildPatternCache ANSI31 scale 2 produces fewer segments than scale 1', () => {
  const h1 = new Hatch({ patternName: 'ANSI31', scale: 1 });
  h1.setProperty('childEntities', makeSquare());
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'ANSI31', scale: 2 });
  h2.setProperty('childEntities', makeSquare());
  h2.buildPatternCache();

  expect(h2.cachedPattern[0].segments.length).toBeLessThan(h1.cachedPattern[0].segments.length);
});

test('Hatch.buildPatternCache HONEY all dashPhase values are non-negative', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', makeSquare());
  h.buildPatternCache();

  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      expect(seg.dashPhase).toBeGreaterThanOrEqual(0);
    }
  }
});

test('Hatch.buildPatternCache scale change invalidates and rebuilds cache with updated dashes', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', makeSquare());
  h.buildPatternCache();

  const dashes1 = [...h.cachedPattern[0].dashes];

  h.setProperty('scale', 2);
  expect(h.cachedPattern).toBeNull();

  h.buildPatternCache();
  const dashes2 = [...h.cachedPattern[0].dashes];

  for (let i = 0; i < dashes1.length; i++) {
    expect(dashes2[i]).toBeCloseTo(dashes1[i] * 2, 5);
  }
});

// ── buildPatternCache — nested boundary tests ────────────────────────────────

/**
 * A 20×20 inner square hole centred in the 100×100 outer square
 * @return {PolylineBase} inner boundary polyline
 */
const makeInnerSquare = () => new PolylineBase({ points: [new Point(40, 40), new Point(60, 40), new Point(60, 60), new Point(40, 60)] });

test('Hatch.buildPatternCache ANSI31 nested boundary: no segment midpoint inside inner hole', () => {
  // Even-odd rule: a ray from inside the hole crosses 2 boundaries → even → not hatched
  const h = new Hatch({ patternName: 'ANSI31', scale: 1 });
  h.setProperty('childEntities', [makeSquare()[0], makeInnerSquare()]);
  h.buildPatternCache();

  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      expect(mx > 40 && mx < 60 && my > 40 && my < 60).toBe(false);
    }
  }
});

test('Hatch.buildPatternCache ANSI31 nested boundary produces more segments than outer-only', () => {
  // Lines that cross the hole are split into two sub-segments, increasing total count
  const outerOnly = new Hatch({ patternName: 'ANSI31', scale: 1 });
  outerOnly.setProperty('childEntities', makeSquare());
  outerOnly.buildPatternCache();

  const withHole = new Hatch({ patternName: 'ANSI31', scale: 1 });
  withHole.setProperty('childEntities', [makeSquare()[0], makeInnerSquare()]);
  withHole.buildPatternCache();

  expect(withHole.cachedPattern[0].segments.length).toBeGreaterThan(outerOnly.cachedPattern[0].segments.length);
});

test('Hatch.buildPatternCache HONEY nested boundary: no segment midpoint inside inner hole', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', [makeSquare()[0], makeInnerSquare()]);
  h.buildPatternCache();

  expect(h.cachedPattern.length).toBe(3);
  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      expect(mx > 40 && mx < 60 && my > 40 && my < 60).toBe(false);
    }
  }
});

test('Hatch.buildPatternCache HONEY nested boundary produces more segments than outer-only', () => {
  const outerOnly = new Hatch({ patternName: 'HONEY', scale: 1 });
  outerOnly.setProperty('childEntities', makeSquare());
  outerOnly.buildPatternCache();

  const withHole = new Hatch({ patternName: 'HONEY', scale: 1 });
  withHole.setProperty('childEntities', [makeSquare()[0], makeInnerSquare()]);
  withHole.buildPatternCache();

  expect(totalSegments(withHole)).toBeGreaterThan(totalSegments(outerOnly));
});

// ── buildPatternCache — circle boundary tests ────────────────────────────────

/**
 * Build a circular boundary by converting a Circle entity to a polyline
 * @param {number} cx - centre x
 * @param {number} cy - centre y
 * @param {number} r - radius
 * @return {Polyline} boundary polyline
 */
const makeCircleBoundary = (cx, cy, r) => {
  const h = new Hatch();
  return h.processSelection([new Circle({ points: [new Point(cx, cy), new Point(cx + r, cy)] })])[0];
};

test('Hatch.buildPatternCache HONEY circle boundary has 3 families with dashes and segments', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', [makeCircleBoundary(50, 50, 40)]);
  h.buildPatternCache();

  expect(h.cachedPattern.length).toBe(3);
  for (const family of h.cachedPattern) {
    expect(family.dashes.length).toBeGreaterThan(0);
    expect(family.segments.length).toBeGreaterThan(0);
  }
});

test('Hatch.buildPatternCache HONEY circle scale 2 dashes are 2× scale 1 dashes', () => {
  const h1 = new Hatch({ patternName: 'HONEY', scale: 1 });
  h1.setProperty('childEntities', [makeCircleBoundary(50, 50, 40)]);
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.setProperty('childEntities', [makeCircleBoundary(50, 50, 40)]);
  h2.buildPatternCache();

  for (let i = 0; i < h1.cachedPattern.length; i++) {
    const d1 = h1.cachedPattern[i].dashes;
    const d2 = h2.cachedPattern[i].dashes;
    expect(d2.length).toBe(d1.length);
    for (let j = 0; j < d1.length; j++) {
      expect(d2[j]).toBeCloseTo(d1[j] * 2, 5);
    }
  }
});

test('Hatch.buildPatternCache HONEY circle scale 2 produces fewer segments than scale 1', () => {
  const h1 = new Hatch({ patternName: 'HONEY', scale: 1 });
  h1.setProperty('childEntities', [makeCircleBoundary(50, 50, 40)]);
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.setProperty('childEntities', [makeCircleBoundary(50, 50, 40)]);
  h2.buildPatternCache();

  expect(totalSegments(h2)).toBeLessThan(totalSegments(h1));
});

test('Hatch.buildPatternCache HONEY circle all dashPhase values are non-negative', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', [makeCircleBoundary(50, 50, 40)]);
  h.buildPatternCache();

  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      expect(seg.dashPhase).toBeGreaterThanOrEqual(0);
    }
  }
});

test('Hatch.buildPatternCache ANSI31 outer square + inner circle hole: no segment midpoint inside circle', () => {
  const h = new Hatch({ patternName: 'ANSI31', scale: 1 });
  h.setProperty('childEntities', [makeSquare()[0], makeCircleBoundary(50, 50, 15)]);
  h.buildPatternCache();

  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      expect((mx - 50) ** 2 + (my - 50) ** 2).toBeGreaterThanOrEqual(15 * 15);
    }
  }
});

test('Hatch.buildPatternCache HONEY outer square + inner circle hole: no segment midpoint inside circle', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', [makeSquare()[0], makeCircleBoundary(50, 50, 15)]);
  h.buildPatternCache();

  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      expect((mx - 50) ** 2 + (my - 50) ** 2).toBeGreaterThanOrEqual(15 * 15);
    }
  }
});

test('Hatch.buildPatternCache ANSI31 outer circle + inner circle hole: no segment midpoint inside inner circle', () => {
  const h = new Hatch({ patternName: 'ANSI31', scale: 1 });
  h.setProperty('childEntities', [makeCircleBoundary(50, 50, 40), makeCircleBoundary(50, 50, 15)]);
  h.buildPatternCache();

  expect(h.cachedPattern[0].segments.length).toBeGreaterThan(0);
  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      expect((mx - 50) ** 2 + (my - 50) ** 2).toBeGreaterThanOrEqual(15 * 15);
    }
  }
});

test('Hatch.buildPatternCache HONEY outer circle + inner circle hole: no segment midpoint inside inner circle', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.setProperty('childEntities', [makeCircleBoundary(50, 50, 40), makeCircleBoundary(50, 50, 15)]);
  h.buildPatternCache();

  expect(h.cachedPattern.length).toBe(3);
  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      expect((mx - 50) ** 2 + (my - 50) ** 2).toBeGreaterThanOrEqual(15 * 15);
    }
  }
});

// ── setProperty ──────────────────────────────────────────────────────────────

test('Hatch.setProperty unknown property does nothing', () => {
  const h = new Hatch({ patternName: 'ANSI31', angle: 10 });
  h.setProperty('nonExistentProperty', 99);
  expect(h.hasOwnProperty('nonExistentProperty')).toBe(false);
  expect(h.getProperty('angle')).toBe(10);
});

test('Hatch.setProperty known property updates value and invalidates cache', () => {
  const h = new Hatch({ patternName: 'ANSI31', angle: 0 });
  h.setProperty('childEntities', makeSquare());
  h.buildPatternCache();
  expect(h.cachedPattern).not.toBeNull();

  h.setProperty('angle', 45);

  expect(h.getProperty('angle')).toBe(45);
  expect(h.cachedPattern).toBeNull();
});

test('Hatch.setProperty patternName updates pattern and solid flag via setter', () => {
  const h = new Hatch({ patternName: 'ANSI31' });
  expect(h.getProperty('patternName')).toBe('ANSI31');

  h.setProperty('patternName', 'SOLID');

  expect(h.getProperty('patternName')).toBe('SOLID');
  expect(h.cachedPattern).toBeNull();
});

test('Hatch.setProperty points translation shifts child entity positions', () => {
  const h = new Hatch({ patternName: 'ANSI31' });
  // h.points = [Point(0,0), Point(1,1)] — 45° angle set by constructor
  h.setProperty('childEntities', [new PolylineBase({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] })]);

  // New points: same 45° angle (delta angle = 0 → no rotation), origin shifted by (5, 0)
  h.setProperty('points', [new Point(5, 0), new Point(6, 1)]);

  expect(h.getProperty('childEntities')[0].points[0].x).toBeCloseTo(5);
  expect(h.getProperty('childEntities')[0].points[0].y).toBeCloseTo(0);
  expect(h.getProperty('childEntities')[0].points[1].x).toBeCloseTo(15);
  expect(h.getProperty('childEntities')[0].points[1].y).toBeCloseTo(0);
  expect(h.cachedPattern).toBeNull();
});

test('Hatch.setProperty points rotation updates hatch angle', () => {
  const h = new Hatch({ patternName: 'ANSI31', angle: 0 });
  h.setProperty('childEntities', makeSquare());
  // h.points = [Point(0,0), Point(1,1)] — 45° angle
  // New points: [Point(0,0), Point(1,0)] — 0° angle → theta = -45°
  h.setProperty('points', [new Point(0, 0), new Point(1, 0)]);

  // hatch.angle should decrease by 45°
  expect(h.getProperty('angle')).toBeCloseTo(-45, 1);
  expect(h.cachedPattern).toBeNull();
});

// ── touched ──────────────────────────────────────────────────────────────────

test('Hatch.touched with no childEntities returns false', () => {
  const h = new Hatch();
  expect(h.touched({ min: new Point(-999, -999), max: new Point(999, 999) })).toBe(false);
});

test('Hatch.touched returns true when selection overlaps boundary', () => {
  const h = new Hatch({ patternName: 'ANSI31' });
  h.setProperty('childEntities', makeSquare()); // 0,0 → 100,100
  expect(h.touched({ min: new Point(-10, -10), max: new Point(50, 50) })).toBe(true);
});

test('Hatch.touched returns false when selection does not overlap boundary', () => {
  const h = new Hatch({ patternName: 'ANSI31' });
  h.setProperty('childEntities', makeSquare()); // 0,0 → 100,100
  expect(h.touched({ min: new Point(200, 200), max: new Point(300, 300) })).toBe(false);
});

// ── draw: scale guard and stroke/dash tracking ───────────────────────────────

test('Hatch.draw scale guard resets sub-zero scale to 1 and rebuilds cache', () => {
  const h = new Hatch({ patternName: 'ANSI31' });
  h.setProperty('childEntities', makeSquare());
  h.setProperty('scale', 0.001); // below guard threshold

  const ctx = makeMockCtx();
  h.draw(ctx);

  expect(h.getProperty('scale')).toBe(1);
  expect(h.cachedPattern).not.toBeNull();
});

/**
 * Create a mock renderer that tracks stroke call count and setDash offset arguments
 * @return {Object} tracking mock renderer
 */
function makeTrackingCtx() {
  let strokeCount = 0;
  const lineDashOffsets = [];
  return {
    setDash: () => {},
    beginPath: () => {},
    closePath: () => {},
    tracePath: () => {},
    stroke: () => {
      strokeCount++;
    },
    fill: () => {},
    drawShape: () => {},
    drawSegments: (segments, dashes) => {
      if (!dashes.length) {
        strokeCount++;
      } else {
        for (const seg of segments) {
          lineDashOffsets.push(seg.dashPhase ?? 0);
          strokeCount++;
        }
      }
    },
    getStrokeCalls: () => strokeCount,
    getLineDashOffsets: () => lineDashOffsets,
  };
}

test('Hatch.draw ANSI31 solid-line family batches all segments into one stroke call', () => {
  const h = new Hatch({ patternName: 'ANSI31' });
  h.setProperty('childEntities', makeSquare());

  const ctx = makeTrackingCtx();
  h.draw(ctx);

  // ANSI31 has no dashes → solid-line branch → one beginPath + all tracePath + one stroke()
  expect(ctx.getStrokeCalls()).toBe(1);
  expect(ctx.getLineDashOffsets().length).toBe(0);
});

test('Hatch.draw HONEY dashed family sets lineDashOffset and strokes once per segment', () => {
  const h = new Hatch({ patternName: 'HONEY' });
  h.setProperty('childEntities', makeSquare());
  h.buildPatternCache();
  const expectedSegs = totalSegments(h);

  const ctx = makeTrackingCtx();
  h.draw(ctx);

  // Every dashed segment gets its own setDash offset and stroke call
  expect(ctx.getLineDashOffsets().length).toBe(expectedSegs);
  expect(ctx.getStrokeCalls()).toBe(expectedSegs);
});

// ── unknown pattern ───────────────────────────────────────────────────────────

describe('unknown hatch pattern', () => {
  test('logs a warning when pattern name is not recognised', () => {
    const warnSpy = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
    try {
      new Hatch({ patternName: 'NOTAPATTERN' });
      expect(warnSpy).toHaveBeenCalledWith("Hatch: pattern 'NOTAPATTERN' not found");
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('retains the original pattern name when pattern is not recognised', () => {
    const warnSpy = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
    try {
      const h = new Hatch({ patternName: 'NOTAPATTERN' });
      expect(h.getProperty('patternName')).toBe('NOTAPATTERN');
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('does not log a warning for a known pattern', () => {
    const warnSpy = jest.spyOn(Logging.instance, 'warn').mockImplementation(() => {});
    try {
      new Hatch({ patternName: 'ANSI31' });
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });
});

// ── processSelection: uncloseable items ──────────────────────────────────────

test('Hatch.processSelection returns empty array when items cannot form a closed loop', () => {
  // Two parallel lines that share no endpoints — no closed boundary possible
  const disconnected = [
    new Line({ points: [new Point(0, 0), new Point(10, 0)] }),
    new Line({ points: [new Point(0, 5), new Point(10, 5)] }),
  ];
  const h = new Hatch();
  expect(h.processSelection(disconnected)).toEqual([]);
});
