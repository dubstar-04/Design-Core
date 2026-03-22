import {Objects} from '../../../../core/lib/dxf/sections/objects.js';
import {DxfIterator} from '../../../../core/lib/dxf/dxfIterator.js';

const objectData =
  `0
OBJECTS
0
DICTIONARY
5
27
100
AcDbDictionary
281
1
3
ACAD_GROUP
350
26
0
DICTIONARY
5
26
100
AcDbDictionary
281
1
0
ENDSEC
0
EOF`;

const iterator = new DxfIterator();
iterator.loadFile(objectData);
const objects = new Objects();

test('Test Objects.read', () => {
  const readObjects = objects.read(iterator);

  expect(readObjects).toHaveLength(2);

  const rootDictionary = readObjects[0];
  const acadGroup = readObjects[1];

  // check the object types
  expect(rootDictionary).toHaveProperty('0', 'DICTIONARY');
  expect(acadGroup).toHaveProperty('0', 'DICTIONARY');

  // check handles
  expect(rootDictionary).toHaveProperty('5', '27');
  expect(acadGroup).toHaveProperty('5', '26');

  // check AcDbDictionary subclass marker
  expect(rootDictionary).toHaveProperty('100', 'AcDbDictionary');
  expect(acadGroup).toHaveProperty('100', 'AcDbDictionary');

  // check duplicate record cloning
  expect(rootDictionary).toHaveProperty('281', 1);
  expect(acadGroup).toHaveProperty('281', 1);

  // check root dictionary entries
  expect(rootDictionary).toHaveProperty('3', 'ACAD_GROUP');
  expect(rootDictionary).toHaveProperty('350', '26');
});

test('Test Objects.read with multiple entries', () => {
  const multiEntryData =
    `0
OBJECTS
0
DICTIONARY
5
C
100
AcDbDictionary
281
1
3
ACAD_GROUP
350
D
3
ACAD_LAYOUT
350
1A
3
ACAD_PLOTSTYLENAME
350
E
0
DICTIONARY
5
D
100
AcDbDictionary
281
1
0
ENDSEC
0
EOF`;

  const iter = new DxfIterator();
  iter.loadFile(multiEntryData);
  const obj = new Objects();
  const result = obj.read(iter);

  expect(result).toHaveLength(2);

  const rootDict = result[0];

  // multiple group code 3 values should be arrayed
  expect(rootDict[3]).toEqual(['ACAD_GROUP', 'ACAD_LAYOUT', 'ACAD_PLOTSTYLENAME']);
  // multiple group code 350 values should be arrayed
  expect(rootDict[350]).toEqual(['D', '1A', 'E']);
});

test('Test Objects.read with empty section', () => {
  const emptyData =
    `0
OBJECTS
0
ENDSEC
0
EOF`;

  const iter = new DxfIterator();
  iter.loadFile(emptyData);
  const obj = new Objects();
  const result = obj.read(iter);

  expect(result).toHaveLength(0);
});
