import { VPort } from '../../core/tables/vport.js';
import { File } from '../test-helpers/test-helpers.js';

test('Test VPort constructor defaults', () => {
  const vport = new VPort();
  expect(vport.name).toBe('*ACTIVE');
  expect(vport.viewCenterX).toBe(0);
  expect(vport.viewCenterY).toBe(0);
  expect(vport.height).toBe(0);
  expect(vport.ratio).toBe(0);
});

test('Test VPort constructor with data', () => {
  const vport = new VPort({ name: 'TestVPort', viewCenterX: 10, viewCenterY: 20, height: 100, ratio: 1.5 });
  expect(vport.name).toBe('TestVPort');
  expect(vport.viewCenterX).toBe(10);
  expect(vport.viewCenterY).toBe(20);
  expect(vport.height).toBe(100);
  expect(vport.ratio).toBe(1.5);
});

test('Test VPort constructor with DXF group codes', () => {
  const vport = new VPort({ 2: 'DXFVPort', 12: 5, 22: 15, 40: 200, 41: 2.0 });
  expect(vport.name).toBe('DXFVPort');
  expect(vport.viewCenterX).toBe(5);
  expect(vport.viewCenterY).toBe(15);
  expect(vport.height).toBe(200);
  expect(vport.ratio).toBe(2.0);
});

test('Test VPort.dxf', () => {
  const vport = new VPort({ handle: '1', name: '*ACTIVE', viewCenterX: 50, viewCenterY: 100, height: 200, ratio: 1.5 });
  const file = new File();
  vport.dxf(file);

  const dxfString = `0
VPORT
5
1
100
AcDbSymbolTableRecord
100
AcDbViewportTableRecord
2
*ACTIVE
70
0
10
0.0
20
0.0
11
1.0
21
1.0
12
50
22
100
13
0.0
23
0.0
14
10.0
24
10.0
15
10.0
25
10.0
16
0.0
26
0.0
36
1.0
17
0.0
27
0.0
37
0.0
40
200
41
1.5
42
50.0
43
0.0
44
0.0
50
0.0
51
0.0
71
0.0
72
1000
73
1
74
3
75
0
76
1
77
0
78
0
`;

  expect(file.contents).toEqual(dxfString);
});
