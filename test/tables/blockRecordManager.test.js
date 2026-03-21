import { Core } from '../../core/core/core.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';

const core = new Core();
const blockRecordManager = core.blockRecordManager;

test('Test BlockRecordManager.dxf', () => {
  const file = new DXFFile();
  blockRecordManager.dxf(file);

  const dxfString = `0
TABLE
2
BLOCK_RECORD
5
23
100
AcDbSymbolTable
70
2
0
BLOCK_RECORD
5
C
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
2
*Model_Space
340
0
0
BLOCK_RECORD
5
E
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
2
*Paper_Space
340
0
0
ENDTAB
`;

  expect(file.contents).toEqual(dxfString);
});

test('Test BlockRecordManager.dxf block count', () => {
  const file = new DXFFile();
  blockRecordManager.dxf(file);

  // default blocks: *Model_Space and *Paper_Space
  const lines = file.contents.split('\n');
  const seventyIndex = lines.indexOf('70');
  expect(lines[seventyIndex + 1]).toBe('2');
});
