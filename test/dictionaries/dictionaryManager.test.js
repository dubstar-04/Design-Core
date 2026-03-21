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
25
100
AcDbDictionary
281
1
3
ACAD_GROUP
350
24
0
DICTIONARY
5
24
100
AcDbDictionary
281
1
`;

  expect(file.contents).toEqual(dxfString);
});
