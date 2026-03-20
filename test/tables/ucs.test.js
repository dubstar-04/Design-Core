import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { UCS } from '../../core/tables/ucs.js';

test('Test UCS constructor defaults', () => {
  const ucs = new UCS();
  expect(ucs.name).toBe('');
});

test('Test UCS constructor with name property', () => {
  const ucs = new UCS({ name: 'TestUCS' });
  expect(ucs.name).toBe('TestUCS');
});

test('Test UCS constructor with DXF group code', () => {
  const ucs = new UCS({ 2: 'DXFUcs' });
  expect(ucs.name).toBe('DXFUcs');
});

test('Test UCS.dxf', () => {
  const ucs = new UCS({ name: 'TestUCS' });
  const file = new DXFFile();
  ucs.dxf(file);

  const dxfString = `0
UCS
5
A
100
AcDbSymbolTableRecord
100
AcDbUCSTableRecord
2
TestUCS
`;

  expect(file.contents).toEqual(dxfString);
});
