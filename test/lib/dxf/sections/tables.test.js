import {Tables} from '../../../../core/lib/dxf/sections/tables.js';
import {DxfIterator} from '../../../../core/lib/dxf/dxfIterator.js';

const tableData =
`0
TABLES
0
TABLE
  2
LAYER
 70
     1
  0
LAYER
  2
0
 70
     0
 62
     7
  6
CONTINUOUS
  0
ENDTAB
  0
TABLE
  2
STYLE
 70
     2
  0
STYLE
  2
STANDARD
 70
     0
 40
0.0
 41
1.0
 50
0.0
 71
     0
 42
2.5
  3
txt
  4

  0
STYLE
  2
ANNOTATIVE
 70
     0
 40
0.0
 41
1.0
 50
0.0
 71
     0
 42
2.5
  3
txt
  4

  0
ENDTAB
0
ENDSEC
0
EOF`;

const iterator = new DxfIterator();
iterator.loadFile(tableData);
const tables = new Tables();

test('Test Tables.read', () => {
  const readTables = tables.read(iterator);
  expect(readTables).toHaveLength(2);

  const layerTable = readTables[0];
  const styleTable = readTables[1];

  // check the table type
  expect(layerTable).toHaveProperty('0', 'TABLE');
  expect(styleTable).toHaveProperty('0', 'TABLE');

  // check the table type
  expect(layerTable).toHaveProperty('2', 'LAYER');
  expect(styleTable).toHaveProperty('2', 'STYLE');

  // check the table count
  expect(layerTable).toHaveProperty('70', 1);
  expect(styleTable).toHaveProperty('70', 2);

  // check the table children
  expect(layerTable).toHaveProperty('children');
  expect(layerTable.children).toHaveLength(1);
  expect(styleTable).toHaveProperty('children');
  expect(styleTable.children).toHaveLength(2);
});


test('Test Tables.addTable', () => {
  // table without data
  const tableEntity = {};
  const tableCount = tables.tables.length;
  tables.addTable(tableEntity);
  expect(tables.tables.length).toBe(tableCount);
});
