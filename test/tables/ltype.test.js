import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { LType } from '../../core/tables/ltype.js';

const file = new DXFFile();
const R12File = new DXFFile('R12');

const continuousLType = new LType({ 'name': 'CONTINUOUS', 'description': 'Solid Line ________________________________________' });
const dashedLType = new LType({ 'name': 'DASHED', 'pattern': [12.7, -6.35], 'description': 'Dashed __ __ __ __ __ __ __ __ __ __ __ __ __ _' });


const continuousDxf = `0
LTYPE
5
A
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
CONTINUOUS
70
0
3
Solid Line ________________________________________
72
65
73
0
40
0
`;

const continuousDxfR12 = `0
LTYPE
2
CONTINUOUS
70
0
3
Solid Line ________________________________________
72
65
73
0
40
0
`;

const dashedDxf = `0
LTYPE
5
A
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
DASHED
70
0
3
Dashed __ __ __ __ __ __ __ __ __ __ __ __ __ _
72
65
73
2
40
19.049999999999997
49
12.7
74
0
49
-6.35
74
0
`;

const dashedDxfR12 = `0
LTYPE
2
DASHED
70
0
3
Dashed __ __ __ __ __ __ __ __ __ __ __ __ __ _
72
65
73
2
40
19.049999999999997
49
12.7
49
-6.35
`;


test('Test LType.dxf', () => {
  // write the ltype to file
  continuousLType.dxf(file);
  expect(file.contents).toEqual(continuousDxf);

  // write the ltype to file
  continuousLType.dxf(R12File);
  expect(R12File.contents).toEqual(continuousDxfR12);

  file.clearFile();
  R12File.clearFile();

  // write the ltype to file
  dashedLType.dxf(file);
  expect(file.contents).toEqual(dashedDxf);

  // write the ltype to file
  dashedLType.dxf(R12File);
  expect(R12File.contents).toEqual(dashedDxfR12);
});

test('Test LType.getPattern', () => {
  const patternOneLType = new LType({ 'name': 'Pattern One', 'pattern': [10, 10] });
  const patternTwoLType = new LType({ 'name': 'Pattern Two', 'pattern': [10, -10] });
  const patternThreeLType = new LType({ 'name': 'Pattern Three', 'pattern': [10, 0, -1] });
  // Scale 1
  expect(patternOneLType.getPattern(1)).toEqual([11, 11]);
  expect(patternTwoLType.getPattern(1)).toEqual([11, 11]);
  expect(patternThreeLType.getPattern(1)).toEqual([11, 1, 2]);

  // scale 2
  expect(patternOneLType.getPattern(2)).toEqual([5.5, 5.5]);
  expect(patternTwoLType.getPattern(2)).toEqual([5.5, 5.5]);
  expect(patternThreeLType.getPattern(2)).toEqual([5.5, 0.5, 1]);

  // scale 0.5
  expect(patternOneLType.getPattern(0.5)).toEqual([22, 22]);
  expect(patternTwoLType.getPattern(0.5)).toEqual([22, 22]);
  expect(patternThreeLType.getPattern(0.5)).toEqual([22, 2, 4]);
});
