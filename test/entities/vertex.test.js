import { Vertex } from '../../core/entities/vertex.js';
import { Point } from '../../core/entities/point.js';
import { File } from '../test-helpers/test-helpers.js';

test('Test Vertex constructor defaults', () => {
  const vertex = new Vertex({ points: [new Point(0, 0)] });
  expect(vertex.points[0].x).toBe(0);
  expect(vertex.points[0].y).toBe(0);
  expect(vertex.points[0].bulge).toBe(0);
  expect(vertex.layer).toBe('0');
});

test('Test Vertex constructor with data', () => {
  const vertex = new Vertex({ points: [new Point(10, 20, 0.5)], layer: 'TestLayer' });
  expect(vertex.points[0].x).toBe(10);
  expect(vertex.points[0].y).toBe(20);
  expect(vertex.points[0].bulge).toBe(0.5);
  expect(vertex.layer).toBe('TestLayer');
});

test('Test Vertex constructor with DXF group codes', () => {
  const vertex = new Vertex({ points: [new Point(15, 25, 1)], 8: 'DXFLayer' });
  expect(vertex.points[0].x).toBe(15);
  expect(vertex.points[0].y).toBe(25);
  expect(vertex.points[0].bulge).toBe(1);
  expect(vertex.layer).toBe('DXFLayer');
});

test('Test Vertex.dxf', () => {
  const vertex = new Vertex({ points: [new Point(100, 200, 0.5)], layer: 'TestLayer' });
  const file = new File();
  vertex.dxf(file);

  const dxfString = `0
VERTEX
5
1
100
AcDbEntity
100
AcDbVertex
100
AcDb2dVertex
8
TestLayer
10
100
20
200
30
0.0
42
0.5
`;

  expect(file.contents).toEqual(dxfString);
});

test('Test Vertex.dxf with zero bulge', () => {
  const vertex = new Vertex({ points: [new Point(50, 75)] });
  const file = new File();
  vertex.dxf(file);

  const dxfString = `0
VERTEX
5
1
100
AcDbEntity
100
AcDbVertex
100
AcDb2dVertex
8
0
10
50
20
75
30
0.0
42
0
`;

  expect(file.contents).toEqual(dxfString);
});

test('Test Vertex created from existing vertex data', () => {
  const vertex = new Vertex({ points: [new Point(10, 20, 0.25)] });
  const newVertex = new Vertex(vertex);
  expect(newVertex.points[0].x).toBe(10);
  expect(newVertex.points[0].y).toBe(20);
  expect(newVertex.points[0].bulge).toBe(0.25);
});
