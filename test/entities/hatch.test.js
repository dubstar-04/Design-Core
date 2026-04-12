import { Hatch } from '../../core/entities/hatch.js';
import { Point } from '../../core/entities/point.js';
import { DesignCore } from '../../core/designCore.js';

import { BasePolyline } from '../../core/entities/basePolyline.js';
import { Circle } from '../../core/entities/circle.js';
import { Line } from '../../core/entities/line.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Arc } from '../../core/entities/arc.js';
import { Text } from '../../core/entities/text.js';

import { File, withMockInput } from '../test-helpers/test-helpers.js';

import { Core } from '../../core/core/core.js';

// initialise core
new Core();

const points = [new Point(100, 100, 1), new Point(200, 100, 1)];
const boundaryShape = new BasePolyline({ points: points });

const hatch = new Hatch({ handle: '1' });
hatch.childEntities = [boundaryShape];

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
    DesignCore.Scene.selectionManager.selectedItems = [];

    for (let i = 0; i < boundaryItems.length; i++) {
      DesignCore.Scene.selectionManager.selectedItems.push(boundaryItems[i]);
    }

    const hatch = new Hatch({ patternName: pattern, scale: scale, angle: angle });

    await hatch.execute();

    expect(hatch.childEntities.length).toBe(1);

    expect(hatch.childEntities[0].points.length).toBe(pointCount); // closed polyline adds extra point

    expect(hatch.points.length).toBe(2);
    // hatch first point should be at 0,0
    expect(hatch.points.at(0).x).toBe(0);
    expect(hatch.points.at(0).y).toBe(0);
    // hatch last point should be at 1,1
    expect(hatch.points.at(-1).x).toBe(1);
    expect(hatch.points.at(-1).y).toBe(1);
    expect(hatch.pattern).toBe(expectedPattern);
    expect(hatch.scale).toBe(expectedScale);
    expect(hatch.angle).toBe(expectedAngle);
    expect(hatch.solid).toBe(expectedPattern === 'SOLID');
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
  rotatedScaleHatch.angle = 45;
  rotatedScaleHatch.scale = 2;

  file = new File();
  rotatedScaleHatch.dxf(file);
  // console.log(file.contents);

  // Don't export hatch if no boundary shapes
  expect(file.contents).toEqual('');

  const shape = new Circle({ points: [new Point(0, 0), new Point(10, 0)] });
  const boundary = rotatedScaleHatch.processSelection([shape]);
  expect(boundary[0]).toBeInstanceOf(Polyline);

  rotatedScaleHatch.childEntities = boundary;
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
  let selectedItems = [];
  selectedItems.push(new Line({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedItems.push(new Line({ points: [new Point(200, 100), new Point(200, 200)] }));
  selectedItems.push(new Line({ points: [new Point(200, 200), new Point(100, 200)] }));
  selectedItems.push(new Line({ points: [new Point(100, 200), new Point(100, 100)] }));

  let hatch = new Hatch();
  let boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(4);


  // create selected items defining a circle
  selectedItems = [];
  selectedItems.push(new Circle({ points: [new Point(100, 100), new Point(200, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(2);

  // create selected items defining a square (polyline)
  selectedItems = [];
  selectedItems.push(new Polyline({
    points: [new Point(100, 100), new Point(200, 100), new Point(200, 200),
      new Point(100, 200), new Point(100, 100)],
  }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(4);

  // create selected items defining a pill shape
  selectedItems = [];
  selectedItems.push(new Line({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedItems.push(new Arc({ points: [new Point(200, 150), new Point(200, 100), new Point(200, 200)] }));
  selectedItems.push(new Line({ points: [new Point(200, 200), new Point(100, 200)] }));
  selectedItems.push(new Arc({ points: [new Point(100, 150), new Point(100, 200), new Point(100, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  // 2 lines + 2 arcs: each shared connection point is merged (not duplicated),
  // so the result is 4 unique vertices, not 5
  expect(boundaryData[0].points.length).toEqual(4);

  // Test a selection with invalid items
  selectedItems = [];
  selectedItems.push(new Text({ points: [new Point(100, 100), new Point(200, 100)] }));
  selectedItems.push(new Circle({ points: [new Point(100, 100), new Point(200, 100)] }));

  hatch = new Hatch();
  boundaryData = hatch.processSelection(selectedItems);
  expect(boundaryData.length).toEqual(1);
  expect(boundaryData[0].points.length).toEqual(2);
});

// Minimal mock canvas context that records moveTo calls and supports try/catch split
/**
 * Create a minimal mock canvas context
 * @return {Object} mock context
 */
function makeMockCtx() {
  let moveCount = 0;
  let fillCalled = false;
  return {
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    clip: () => {},
    rect: () => {},
    setLineDash: () => {},
    lineWidth: 0,
    moveTo: () => {
      moveCount++;
    },
    lineTo: () => {},
    stroke: () => {},
    fill: () => {
      fillCalled = true;
    },
    getMoveCalls: () => moveCount,
    getFillCalled: () => fillCalled,
  };
}

test('Test Hatch.draw solid fill calls ctx.fill', () => {
  const solidHatch = new Hatch({ patternName: 'SOLID' });
  solidHatch.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] })];

  const ctx = makeMockCtx();
  solidHatch.draw(ctx, 1);

  expect(ctx.getFillCalled()).toBe(true);
});

test('Test Hatch.draw unknown pattern does not stroke pattern lines', () => {
  const unknownHatch = new Hatch({ patternName: 'ANSI31' });
  unknownHatch.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(10, 0), new Point(10, 10), new Point(0, 10)] })];
  // Override pattern to a nonexistent name without going through setPatternName
  unknownHatch.pattern = 'NOTAPATTERN';

  const ctx = makeMockCtx();
  unknownHatch.draw(ctx, 1);

  // No pattern lines drawn — only boundary moveTo calls from clip setup
  expect(ctx.getFillCalled()).toBe(false);
});

test('Test Hatch.draw tight bound line count - square boundary', () => {
  // ANSI31: angle=45, yDelta=3.175, no dashes (dashLength = bbXLength/2)
  // 100x100 square: halfW=halfH=50, sin45=cos45=√2/2
  // halfY = 50*(√2/2) + 50*(√2/2) ≈ 70.71
  // yIncrement = ceil(70.71 / 3.175) = 23 → loop i=-23..22 = 46 raw lines
  // i=-23 (|ly|=73.025 > halfY=70.71) misses the square → 45 clipped segments
  const squareHatch = new Hatch({ patternName: 'ANSI31' });
  squareHatch.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })];
  const ctx = makeMockCtx();
  squareHatch.draw(ctx, 1);
  expect(ctx.getMoveCalls()).toBe(45);
});

test('Test Hatch.draw tight bound line count - flat boundary', () => {
  // ANSI31: angle=45, yDelta=3.175, no dashes
  // 100x10 flat box: halfW=50, halfH=5, sin45=cos45=√2/2
  // halfY = (50+5)*(√2/2) ≈ 38.89
  // yIncrement = ceil(38.89 / 3.175) = 13 → loop i=-13..12 = 26 raw lines
  // i=-13 (|ly|=41.275 > halfY=38.89) misses the flat box → 25 clipped segments
  const flatHatch = new Hatch({ patternName: 'ANSI31' });
  flatHatch.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 10), new Point(0, 10)] })];
  const ctx = makeMockCtx();
  flatHatch.draw(ctx, 1);
  expect(ctx.getMoveCalls()).toBe(25);
});

test('Test Hatch.draw tight bound produces fewer lines for flat boundary', () => {
  // A flat boundary (100x10) should produce fewer lines than a square (100x100).
  const squareHatch = new Hatch({ patternName: 'ANSI31' });
  squareHatch.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })];

  const flatHatch = new Hatch({ patternName: 'ANSI31' });
  flatHatch.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 10), new Point(0, 10)] })];

  const squareCtx = makeMockCtx();
  squareHatch.draw(squareCtx, 1);

  const flatCtx = makeMockCtx();
  flatHatch.draw(flatCtx, 1);

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
  h.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })];
  h.buildPatternCache();
  expect(h.cachedPattern).toEqual([]);
});

test('Hatch.buildPatternCache unknown pattern sets cachedPattern to empty array', () => {
  const h = new Hatch({ patternName: 'HONEY' });
  h.childEntities = [new BasePolyline({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })];
  h.pattern = 'NOTAPATTERN';
  h.buildPatternCache();
  expect(h.cachedPattern).toEqual([]);
});

// ── buildPatternCache — pattern structure and scale tests ────────────────────

/**
 * Build a 100×100 square boundary
 * @return {Array} array containing one BasePolyline boundary
 */
const makeSquare = () => [new BasePolyline({ points: [new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100)] })];

/**
 * Sum all segment counts across all families in a cached hatch
 * @param {Hatch} h
 * @return {number} total segment count
 */
const totalSegments = (h) => h.cachedPattern.reduce((s, f) => s + f.segments.length, 0);

test('Hatch.buildPatternCache HONEY has 3 families each with dashes and segments', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.childEntities = makeSquare();
  h.buildPatternCache();

  expect(h.cachedPattern.length).toBe(3);
  for (const family of h.cachedPattern) {
    expect(family.dashes.length).toBeGreaterThan(0);
    expect(family.segments.length).toBeGreaterThan(0);
  }
});

test('Hatch.buildPatternCache HONEY scale 2 dashes are 2× scale 1 dashes', () => {
  const h1 = new Hatch({ patternName: 'HONEY', scale: 1 });
  h1.childEntities = makeSquare();
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.childEntities = makeSquare();
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
  h1.childEntities = makeSquare();
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.childEntities = makeSquare();
  h2.buildPatternCache();

  expect(totalSegments(h2)).toBeLessThan(totalSegments(h1));
});

test('Hatch.buildPatternCache ANSI31 scale 2 produces fewer segments than scale 1', () => {
  const h1 = new Hatch({ patternName: 'ANSI31', scale: 1 });
  h1.childEntities = makeSquare();
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'ANSI31', scale: 2 });
  h2.childEntities = makeSquare();
  h2.buildPatternCache();

  expect(h2.cachedPattern[0].segments.length).toBeLessThan(h1.cachedPattern[0].segments.length);
});

test('Hatch.buildPatternCache HONEY all dashPhase values are non-negative', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.childEntities = makeSquare();
  h.buildPatternCache();

  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      expect(seg.dashPhase).toBeGreaterThanOrEqual(0);
    }
  }
});

test('Hatch.buildPatternCache scale change invalidates and rebuilds cache with updated dashes', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.childEntities = makeSquare();
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
 * @return {BasePolyline} inner boundary polyline
 */
const makeInnerSquare = () => new BasePolyline({ points: [new Point(40, 40), new Point(60, 40), new Point(60, 60), new Point(40, 60)] });

test('Hatch.buildPatternCache ANSI31 nested boundary: no segment midpoint inside inner hole', () => {
  // Even-odd rule: a ray from inside the hole crosses 2 boundaries → even → not hatched
  const h = new Hatch({ patternName: 'ANSI31', scale: 1 });
  h.childEntities = [makeSquare()[0], makeInnerSquare()];
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
  outerOnly.childEntities = makeSquare();
  outerOnly.buildPatternCache();

  const withHole = new Hatch({ patternName: 'ANSI31', scale: 1 });
  withHole.childEntities = [makeSquare()[0], makeInnerSquare()];
  withHole.buildPatternCache();

  expect(withHole.cachedPattern[0].segments.length).toBeGreaterThan(outerOnly.cachedPattern[0].segments.length);
});

test('Hatch.buildPatternCache HONEY nested boundary: no segment midpoint inside inner hole', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.childEntities = [makeSquare()[0], makeInnerSquare()];
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
  outerOnly.childEntities = makeSquare();
  outerOnly.buildPatternCache();

  const withHole = new Hatch({ patternName: 'HONEY', scale: 1 });
  withHole.childEntities = [makeSquare()[0], makeInnerSquare()];
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
  h.childEntities = [makeCircleBoundary(50, 50, 40)];
  h.buildPatternCache();

  expect(h.cachedPattern.length).toBe(3);
  for (const family of h.cachedPattern) {
    expect(family.dashes.length).toBeGreaterThan(0);
    expect(family.segments.length).toBeGreaterThan(0);
  }
});

test('Hatch.buildPatternCache HONEY circle scale 2 dashes are 2× scale 1 dashes', () => {
  const h1 = new Hatch({ patternName: 'HONEY', scale: 1 });
  h1.childEntities = [makeCircleBoundary(50, 50, 40)];
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.childEntities = [makeCircleBoundary(50, 50, 40)];
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
  h1.childEntities = [makeCircleBoundary(50, 50, 40)];
  h1.buildPatternCache();

  const h2 = new Hatch({ patternName: 'HONEY', scale: 2 });
  h2.childEntities = [makeCircleBoundary(50, 50, 40)];
  h2.buildPatternCache();

  expect(totalSegments(h2)).toBeLessThan(totalSegments(h1));
});

test('Hatch.buildPatternCache HONEY circle all dashPhase values are non-negative', () => {
  const h = new Hatch({ patternName: 'HONEY', scale: 1 });
  h.childEntities = [makeCircleBoundary(50, 50, 40)];
  h.buildPatternCache();

  for (const family of h.cachedPattern) {
    for (const seg of family.segments) {
      expect(seg.dashPhase).toBeGreaterThanOrEqual(0);
    }
  }
});

test('Hatch.buildPatternCache ANSI31 outer square + inner circle hole: no segment midpoint inside circle', () => {
  const h = new Hatch({ patternName: 'ANSI31', scale: 1 });
  h.childEntities = [makeSquare()[0], makeCircleBoundary(50, 50, 15)];
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
  h.childEntities = [makeSquare()[0], makeCircleBoundary(50, 50, 15)];
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
  h.childEntities = [makeCircleBoundary(50, 50, 40), makeCircleBoundary(50, 50, 15)];
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
  h.childEntities = [makeCircleBoundary(50, 50, 40), makeCircleBoundary(50, 50, 15)];
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
