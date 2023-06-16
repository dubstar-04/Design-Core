import {DXFFile} from '../../../core/lib/dxf/dxfFile.js';

const file = new DXFFile();

test('Test DXFFile.constructor', () => {
  // default version is R2018
  expect(file.version).toBe('AC1032');

  // Create R12 version File
  const R12File = new DXFFile('R12');
  expect(R12File.version).toBe('AC1009');
});

test('Test DXFFile.writeGroupCode', () => {
  file.writeGroupCode('groupCode', 'groupValue');

  const output = 'groupCode\ngroupValue\n';

  expect(file.contents).toEqual(output);
});

test('Test DXFFile.clearFile', () => {
  file.clearFile();
  expect(file.contents).toBe('');
});

test('Test DXFFile.validDxfVersion', () => {
  expect(DXFFile.validDxfVersion('AC1009')).toEqual(true);
  expect(DXFFile.validDxfVersion('AC1015')).toEqual(true);
  expect(DXFFile.validDxfVersion('AC1018')).toEqual(true);
  expect(DXFFile.validDxfVersion('AC1021')).toEqual(true);
  expect(DXFFile.validDxfVersion('AC1024')).toEqual(true);
  expect(DXFFile.validDxfVersion('AC1027')).toEqual(true);
  expect(DXFFile.validDxfVersion('AC1032')).toEqual(true);

  expect(DXFFile.validDxfVersion('')).toEqual(false);
  expect(DXFFile.validDxfVersion('ABC')).toEqual(false);
  expect(DXFFile.validDxfVersion()).toEqual(false);
});

test('Test DXFFile.validDxfKey', () => {
  expect(DXFFile.validDxfKey('R12')).toEqual(true);
  expect(DXFFile.validDxfKey('R2000')).toEqual(true);
  expect(DXFFile.validDxfKey('R2004')).toEqual(true);
  expect(DXFFile.validDxfKey('R2007')).toEqual(true);
  expect(DXFFile.validDxfKey('R2010')).toEqual(true);
  expect(DXFFile.validDxfKey('R2013')).toEqual(true);
  expect(DXFFile.validDxfKey('R2018')).toEqual(true);

  expect(DXFFile.validDxfKey('AC1009')).toEqual(false);
  expect(DXFFile.validDxfKey('ABC')).toEqual(false);
  expect(DXFFile.validDxfKey()).toEqual(false);
});

test('Test DXFFile.getVersionKey', () => {
  expect(DXFFile.getVersionKey('AC1009')).toBe('R12');
  expect(DXFFile.getVersionKey('AC1015')).toBe('R2000');
  expect(DXFFile.getVersionKey('AC1018')).toBe('R2004');
  expect(DXFFile.getVersionKey('AC1021')).toBe('R2007');
  expect(DXFFile.getVersionKey('AC1024')).toBe('R2010');
  expect(DXFFile.getVersionKey('AC1027')).toBe('R2013');
  expect(DXFFile.getVersionKey('AC1032')).toBe('R2018');

  expect(() => {
    DXFFile.getVersionKey('');
  }).toThrow();

  expect(() => {
    DXFFile.getVersionKey();
  }).toThrow();

  expect(() => {
    DXFFile.getVersionKey('invalid');
  }).toThrow();
});
