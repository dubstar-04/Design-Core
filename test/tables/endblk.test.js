import { EndBlock } from '../../core/tables/endblk.js';
import { File } from '../test-helpers/test-helpers.js';

test('Test EndBlock constructor defaults', () => {
  const endblk = new EndBlock();
  expect(endblk.layer).toBe('0');
});

test('Test EndBlock constructor with layer', () => {
  const endblk = new EndBlock({ 8: 'TestLayer' });
  expect(endblk.layer).toBe('TestLayer');
});

test('Test EndBlock.dxf', () => {
  const endblk = new EndBlock({ handle: '1' });
  const file = new File();
  endblk.dxf(file);

  const dxfString = `0
ENDBLK
5
1
100
AcDbEntity
100
AcDbBlockEnd
`;

  expect(file.contents).toEqual(dxfString);
});
