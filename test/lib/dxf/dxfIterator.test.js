import {DxfIterator} from '../../../core/lib/dxf/dxfIterator.js';

const iterator = new DxfIterator();
const string = '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n0\nEOF';
iterator.loadFile(string);

test('Test DxfIterator.instance', () => {
  const secondIterator = new DxfIterator();
  expect(iterator).toEqual(secondIterator);

  const thirdIterator = DxfIterator.instance;
  expect(iterator).toEqual(thirdIterator);
});

test('Test DxfIterator.loadFile', () => {
  expect(iterator.lines.length).toBe(12);

  // no string
  expect(() => {
    iterator.loadFile(); ;
  }).toThrow();

  // empty string
  expect(() => {
    iterator.loadFile(''); ;
  }).toThrow();

  // unmatched pairs
  expect(() => {
    iterator.loadFile('1\n2\n3\n4\nEOF'); ;
  }).toThrow();

  // missing EOF value
  expect(() => {
    iterator.loadFile('1\n2\n3\n4\n'); ;
  }).toThrow();
});

test('Test DxfIterator.dxfError', () => {
  expect(() => {
    section.dxfError('Test');
  }).toThrow();
});

test('Test DxfIterator.current', () => {
  const current = iterator.current();
  expect(current).toBe('1');
});

test('Test DxfIterator.nextValue', () => {
  const nextValue = iterator.nextValue();
  expect(nextValue).toBe('2');
});

test('Test DxfIterator.prevValue', () => {
  iterator.currentIndex = 1;
  const prevValue = iterator.prevValue();
  expect(prevValue).toBe('1');

  iterator.currentIndex = 0;
  const undefinedPrevValue = iterator.prevValue();
  expect(undefinedPrevValue).toBeUndefined();
});

test('Test DxfIterator.currentPair', () => {
  const currentPair = iterator.currentPair();
  expect(currentPair.code).toBe('1');
  expect(currentPair.value).toBe('2');
});

test('Test DxfIterator.nextPair', () => {
  iterator.currentIndex = iterator.lines.length - 1;
  const undefinedNextPair = iterator.nextPair();
  expect(undefinedNextPair).toBeUndefined();

  iterator.currentIndex = 0;
  const nextPair = iterator.nextPair();
  expect(nextPair.code).toBe('3');
  expect(nextPair.value).toBe('4');
});

test('Test DxfIterator.prevPair', () => {
  const prevPair = iterator.prevPair();
  expect(prevPair.code).toBe('1');
  expect(prevPair.value).toBe('2');

  const undefinedPrevPair = iterator.prevPair();
  expect(undefinedPrevPair).toBeUndefined();
});
