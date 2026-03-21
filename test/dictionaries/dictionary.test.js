import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { Dictionary } from '../../core/dictionaries/dictionary.js';

test('Test Dictionary constructor defaults', () => {
  const dict = new Dictionary();
  expect(dict.name).toBe('');
  expect(dict.duplicateRecordCloning).toBe(1);
  expect(dict.entries).toEqual([]);
});

test('Test Dictionary constructor with name property', () => {
  const dict = new Dictionary({ name: 'ACAD_GROUP' });
  expect(dict.name).toBe('ACAD_GROUP');
});

test('Test Dictionary constructor with DXF group code', () => {
  const dict = new Dictionary({ 3: 'ACAD_GROUP' });
  expect(dict.name).toBe('ACAD_GROUP');
});

test('Test Dictionary constructor with entries', () => {
  const dict = new Dictionary({
    entries: [{ name: 'ACAD_GROUP', handle: 'D' }],
  });
  expect(dict.entries.length).toBe(1);
  expect(dict.entries[0].name).toBe('ACAD_GROUP');
  expect(dict.entries[0].handle).toBe('D');
});

test('Test Dictionary constructor with duplicateRecordCloning', () => {
  const dict = new Dictionary({ duplicateRecordCloning: 0 });
  expect(dict.duplicateRecordCloning).toBe(0);
});

test('Test Dictionary constructor with DXF group code 281', () => {
  const dict = new Dictionary({ 281: 0 });
  expect(dict.duplicateRecordCloning).toBe(0);
});

test('Test Dictionary.dxf with no entries', () => {
  const dict = new Dictionary({ name: 'ACAD_GROUP', handle: '1A' });
  const file = new DXFFile();
  dict.dxf(file);

  const dxfString = `0
DICTIONARY
5
1A
100
AcDbDictionary
281
1
`;

  expect(file.contents).toEqual(dxfString);
});

test('Test Dictionary.dxf with entries', () => {
  const dict = new Dictionary({
    handle: '1B',
    entries: [{ name: 'ACAD_GROUP', handle: 'D' }],
  });
  const file = new DXFFile();
  dict.dxf(file);

  const dxfString = `0
DICTIONARY
5
1B
100
AcDbDictionary
281
1
3
ACAD_GROUP
350
D
`;

  expect(file.contents).toEqual(dxfString);
});
