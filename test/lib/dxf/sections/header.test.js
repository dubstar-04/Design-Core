import { Header } from '../../../../core/lib/dxf/sections/header.js';
import { DxfIterator } from '../../../../core/lib/dxf/dxfIterator.js';

const headerData =
  `2
HEADER
  9
$ACADVER
  1
AC1009
  9
$INSBASE
 10
0.0
 20
0.0
 30
0.0
  9
$EXTMIN
 10
100
 20
100
 30
100
  9
$EXTMAX
 10
300
 20
300
 30
0.0
9
$TEXTSTYLE
  7
Standard
  9
$CLAYER
  8
0
  0
ENDSEC
0
EOF`;

const iterator = new DxfIterator();
iterator.loadFile(headerData);
const header = new Header();
header.read(iterator);

test('Test Header.read', () => {
  expect(Object.keys(header)).toHaveLength(6);
  // check the entity type
  expect(header).toHaveProperty('$ACADVER');
  expect(header['$ACADVER']).toHaveProperty('1', 'AC1009');

  expect(header).toHaveProperty('$INSBASE');
  expect(header['$INSBASE']).toHaveProperty('points');
  expect(header['$INSBASE'].points[0]).toHaveProperty('x', 0);
  expect(header['$INSBASE'].points[0]).toHaveProperty('y', 0);
  expect(header['$INSBASE'].points[0]).toHaveProperty('z', 0);

  expect(header).toHaveProperty('$EXTMIN');
  expect(header['$EXTMIN']).toHaveProperty('points');
  expect(header['$EXTMIN'].points[0]).toHaveProperty('x', 100);
  expect(header['$EXTMIN'].points[0]).toHaveProperty('y', 100);
  expect(header['$EXTMIN'].points[0]).toHaveProperty('z', 100);

  expect(header).toHaveProperty('$TEXTSTYLE');
  expect(header['$TEXTSTYLE']).toHaveProperty('7', 'Standard');

  expect(header).toHaveProperty('$CLAYER');
  expect(header['$CLAYER']).toHaveProperty('8', '0');
});
