import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { View } from '../../core/tables/view.js';

test('Test View constructor defaults', () => {
  const view = new View();
  expect(view.name).toBe('');
});

test('Test View constructor with name property', () => {
  const view = new View({ name: 'TestView' });
  expect(view.name).toBe('TestView');
});

test('Test View constructor with DXF group code', () => {
  const view = new View({ 2: 'DXFView' });
  expect(view.name).toBe('DXFView');
});

test('Test View.dxf', () => {
  const view = new View({ name: 'TestView' });
  const file = new DXFFile();
  view.dxf(file);

  const dxfString = `0
VIEW
5
A
100
AcDbSymbolTableRecord
100
AcDbViewTableRecord
2
TestView
`;

  expect(file.contents).toEqual(dxfString);
});
