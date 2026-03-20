import { Core } from '../../core/core/core.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';

const core = new Core();
const dictionaryManager = core.dictionaryManager;

test('Test DictionaryManager.dxf', () => {
  const file = new DXFFile();
  dictionaryManager.dxf(file);

  const dxfString = `0
DICTIONARY
5
A
100
AcDbDictionary
281
1
3
ACAD_GROUP
350
D
0
DICTIONARY
5
B
100
AcDbDictionary
281
1
`;

  expect(file.contents).toEqual(dxfString);
});
