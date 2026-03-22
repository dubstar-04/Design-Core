import { Core } from '../../core/core/core.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';

const core = new Core();
const viewManager = core.viewManager;

test('Test ViewManager.getItems', () => {
  const items = viewManager.getItems();
  expect(items).toHaveLength(0);
});

test('Test ViewManager.itemCount', () => {
  expect(viewManager.itemCount()).toBe(0);
});

test('Test ViewManager.addItem', () => {
  viewManager.addItem({ name: 'TestView' });
  expect(viewManager.itemCount()).toBe(1);
  expect(viewManager.getItemByName('TestView')).toBeDefined();
});

test('Test ViewManager.deleteItem', () => {
  const count = viewManager.itemCount();
  const index = viewManager.getItemIndex('TestView');
  viewManager.deleteItem(index);
  expect(viewManager.itemCount()).toBe(count - 1);
});

test('Test ViewManager.dxf', () => {
  const file = new DXFFile();
  viewManager.dxf(file);

  const dxfString = `0
TABLE
2
VIEW
5
1F
100
AcDbSymbolTable
70
0
0
ENDTAB
`;

  expect(file.contents).toEqual(dxfString);
});
