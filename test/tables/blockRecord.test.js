import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { BlockRecord } from '../../core/tables/blockRecord.js';

test('Test BlockRecord constructor defaults', () => {
  const record = new BlockRecord();
  expect(record.name).toBe('');
});

test('Test BlockRecord constructor with name property', () => {
  const record = new BlockRecord({ name: '*Model_Space' });
  expect(record.name).toBe('*Model_Space');
});

test('Test BlockRecord constructor with DXF group code', () => {
  const record = new BlockRecord({ 2: '*Paper_Space' });
  expect(record.name).toBe('*Paper_Space');
});

test('Test BlockRecord.dxf', () => {
  const record = new BlockRecord({ name: '*Model_Space' });
  const file = new DXFFile();
  record.dxf(file);

  const dxfString = `0
BLOCK_RECORD
5
A
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
2
*Model_Space
340
0
`;

  expect(file.contents).toEqual(dxfString);
});
