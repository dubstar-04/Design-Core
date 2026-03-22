import { Core } from '../../core/core/core.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';

const core = new Core();
const appIdManager = core.appIdManager;

test('Test AppIDManager.getItems', () => {
  const items = appIdManager.getItems();
  expect(items).toHaveLength(1);
  expect(items[0]).toHaveProperty('name', 'ACAD');
});

test('Test AppIDManager.itemCount', () => {
  expect(appIdManager.itemCount()).toBe(1);
});

test('Test AppIDManager.addItem', () => {
  const count = appIdManager.itemCount();
  appIdManager.addItem({ name: 'TestApp' });
  expect(appIdManager.itemCount()).toBe(count + 1);
});

test('Test AppIDManager.deleteItem indelible', () => {
  const count = appIdManager.itemCount();
  const index = appIdManager.getItemIndex('ACAD');
  appIdManager.deleteItem(index);
  // ACAD is indelible and cannot be deleted
  expect(appIdManager.itemCount()).toBe(count);
});

test('Test AppIDManager.deleteItem', () => {
  const count = appIdManager.itemCount();
  const index = appIdManager.getItemIndex('TestApp');
  appIdManager.deleteItem(index);
  expect(appIdManager.itemCount()).toBe(count - 1);
});

test('Test AppIDManager.itemExists', () => {
  expect(appIdManager.itemExists('ACAD')).toBe(true);
  expect(appIdManager.itemExists('NonExistent')).toBe(false);
});

test('Test AppIDManager.dxf', () => {
  const file = new DXFFile();
  appIdManager.dxf(file);

  const dxfString = `0
TABLE
2
APPID
5
23
100
AcDbSymbolTable
0
APPID
5
24
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
2
ACAD
70
0
0
ENDTAB
`;

  expect(file.contents).toEqual(dxfString);
});
