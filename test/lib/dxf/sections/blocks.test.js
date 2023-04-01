import {Blocks} from '../../../../core/lib/dxf/sections/blocks.js';
import {DxfIterator} from '../../../../core/lib/dxf/dxfIterator.js';

const blockData =
`2
BLOCKS
  0
BLOCK
  8
0
  2
$MODEL_SPACE
 70
     0
 10
0.0
 20
0.0
 30
0.0
  3
$MODEL_SPACE
  1

  0
ENDBLK
  8
0
  0
BLOCK
 67
     1
  8
0
  2
$PAPER_SPACE
 70
     0
 10
0.0
 20
0.0
 30
0.0
  3
$PAPER_SPACE
  1

  0
ENDBLK
  5
D5
 67
     1
  8
0
  0
ENDSEC
0
EOF`;

const iterator = new DxfIterator();
iterator.loadFile(blockData);
const blocks = new Blocks();

test('Test blocks.read', () => {
  const readblocks = blocks.read(iterator);
  expect(readblocks).toHaveLength(2);

  const layerTable = readblocks[0];
  const styleTable = readblocks[1];

  // check the table type
  expect(layerTable).toHaveProperty('0', 'BLOCK');
  expect(styleTable).toHaveProperty('0', 'BLOCK');

  // check the table type
  expect(layerTable).toHaveProperty('2', '$MODEL_SPACE');
  expect(layerTable).toHaveProperty('3', '$MODEL_SPACE');
  expect(styleTable).toHaveProperty('2', '$PAPER_SPACE');
  expect(styleTable).toHaveProperty('3', '$PAPER_SPACE');

  // check the table children
  expect(layerTable).toHaveProperty('children');
  expect(layerTable.children).toHaveLength(1);
  expect(styleTable).toHaveProperty('children');
  expect(styleTable.children).toHaveLength(1);
});


test('Test blocks.addTable', () => {
  // block without data
  const blockEntity = {};
  const blockCount = blocks.blocks.length;
  blocks.addBlock(blockEntity);
  expect(blocks.blocks.length).toBe(blockCount);
});
