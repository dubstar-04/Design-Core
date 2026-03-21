import { SeqEnd } from '../../core/entities/seqend.js';
import { File } from '../test-helpers/test-helpers.js';

test('Test SeqEnd constructor defaults', () => {
  const seqend = new SeqEnd();
  expect(seqend.type).toBe('SeqEnd');
  expect(seqend.layer).toBe('0');
});

test('Test SeqEnd constructor with data', () => {
  const seqend = new SeqEnd({ handle: 'A', layer: 'TestLayer' });
  expect(seqend.handle).toBe('A');
  expect(seqend.layer).toBe('TestLayer');
});

test('Test SeqEnd.dxf', () => {
  const seqend = new SeqEnd({ handle: '1', layer: 'TestLayer' });
  const file = new File();
  seqend.dxf(file);

  const dxfString = `0
SEQEND
5
1
100
AcDbEntity
8
TestLayer
`;

  expect(file.contents).toEqual(dxfString);
});

test('Test SeqEnd created from existing data', () => {
  const seqend = new SeqEnd({ handle: '1', layer: 'TestLayer' });
  const newSeqEnd = new SeqEnd(seqend);
  const file = new File();
  newSeqEnd.dxf(file);

  const dxfString = `0
SEQEND
5
1
100
AcDbEntity
8
TestLayer
`;

  expect(file.contents).toEqual(dxfString);
});
