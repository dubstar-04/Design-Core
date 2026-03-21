import { Core } from '../../core/core/core.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';

const core = new Core();
const ucsManager = core.ucsManager;

test('Test UCSManager.getItems', () => {
  const items = ucsManager.getItems();
  expect(items).toHaveLength(0);
});

test('Test UCSManager.itemCount', () => {
  expect(ucsManager.itemCount()).toBe(0);
});

test('Test UCSManager.addItem', () => {
  ucsManager.addItem({ name: 'TestUCS' });
  expect(ucsManager.itemCount()).toBe(1);
  expect(ucsManager.getItemByName('TestUCS')).toBeDefined();
});

test('Test UCSManager.deleteItem', () => {
  const count = ucsManager.itemCount();
  const index = ucsManager.getItemIndex('TestUCS');
  ucsManager.deleteItem(index);
  expect(ucsManager.itemCount()).toBe(count - 1);
});

test('Test UCSManager.dxf', () => {
  const file = new DXFFile();
  ucsManager.dxf(file);

  const dxfString = `0
TABLE
2
UCS
5
20
100
AcDbSymbolTable
0
ENDTAB
`;

  expect(file.contents).toEqual(dxfString);
});
