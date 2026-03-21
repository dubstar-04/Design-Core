import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { AppID } from '../../core/tables/appId.js';

test('Test AppID constructor defaults', () => {
  const appId = new AppID();
  expect(appId.name).toBe('');
  expect(appId.flags).toBe(0);
});

test('Test AppID constructor with name property', () => {
  const appId = new AppID({ name: 'ACAD' });
  expect(appId.name).toBe('ACAD');
});

test('Test AppID constructor with DXF group codes', () => {
  const appId = new AppID({ 2: 'ACAD', 70: 0 });
  expect(appId.name).toBe('ACAD');
  expect(appId.flags).toBe(0);
});

test('Test AppID constructor with flags', () => {
  const appId = new AppID({ name: 'TestApp', flags: 1 });
  expect(appId.flags).toBe(1);
});

test('Test AppID.dxf', () => {
  const appId = new AppID({ handle: 'A', name: 'ACAD' });
  const file = new DXFFile();
  appId.dxf(file);

  const dxfString = `0
APPID
5
A
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
2
ACAD
70
0
`;

  expect(file.contents).toEqual(dxfString);
});
