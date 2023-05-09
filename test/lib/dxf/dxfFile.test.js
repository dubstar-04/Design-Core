import {DXFFile} from '../../../core/lib/dxf/dxfFile.js';

const file = new DXFFile();

test('Test DXFFile.writeGroupCode', () => {
  file.writeGroupCode('groupCode', 'groupValue');

  const output = 'groupCode\ngroupValue\n';

  expect(file.contents).toEqual(output);
});

test('Test DXFFile.clearFile', () => {
  file.clearFile();
  expect(file.contents).toBe('');
});

