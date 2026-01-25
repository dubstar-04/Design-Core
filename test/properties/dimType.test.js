import { DimType } from '../../core/properties/dimType';

test('DimType - constructor sets default and custom dimType', () => {
  expect(new DimType().dimType).toBe(0);
  expect(new DimType(3).dimType).toBe(3);
});

test('DimType - isValidDimensionType returns true for valid, false for invalid', () => {
  expect(DimType.isValidDimensionType(0)).toBe(true);
  expect(DimType.isValidDimensionType(6)).toBe(true);
  expect(DimType.isValidDimensionType(32)).toBe(true); // block ref
  expect(DimType.isValidDimensionType(64)).toBe(true);
  expect(DimType.isValidDimensionType(70)).toBe(true);
  expect(DimType.isValidDimensionType(99)).toBe(true); // 32 + 64 + 3
  expect(DimType.isValidDimensionType(128)).toBe(true);

  expect(DimType.isValidDimensionType(-1)).toBe(false);
  expect(DimType.isValidDimensionType(9)).toBe(false);
  expect(DimType.isValidDimensionType(999)).toBe(false);
});

test('DimType - getBaseType returns correct base type', () => {
  expect(DimType.getBaseType(0)).toBe(0);
  expect(DimType.getBaseType(32)).toBe(0);
  expect(DimType.getBaseType(34)).toBe(2);
  expect(DimType.getBaseType(36)).toBe(4);
  expect(DimType.getBaseType(39)).toBe(7); // 7 is invalid but still returned as base type
  expect(DimType.getBaseType(70)).toBe(6);
  expect(DimType.getBaseType(64)).toBe(0);
  expect(DimType.getBaseType(65)).toBe(1);
  expect(DimType.getBaseType(128)).toBe(0);
});

test('DimType - getDimType returns correct dimType for various values', () => {
  // getDimType should return the input value as-is for valid values
  expect(new DimType(0).getDimType()).toBe(0);
  expect(new DimType(3).getDimType()).toBe(3);
  expect(new DimType(32).getDimType()).toBe(32);
  expect(new DimType(70).getDimType()).toBe(70);
  expect(new DimType(128).getDimType()).toBe(128);
  expect(new DimType(99).getDimType()).toBe(99);

  // For invalid or undefined input, should return default (likely 0)
  expect(new DimType(undefined).getDimType()).toBe(0);
  expect(new DimType(null).getDimType()).toBe(0);
  expect(new DimType(NaN).getDimType()).toBe(0);
});

test('DimType - hasBlockReference detects block reference bit', () => {
  expect(new DimType(32).hasBlockReference()).toBe(true);
  expect(new DimType(38).hasBlockReference()).toBe(true); // 6 + 32
  expect(new DimType(2).hasBlockReference()).toBe(false);
});

test('DimType - hasUserPositionedText detects user positioned text bit', () => {
  expect(new DimType(128).hasUserPositionedText()).toBe(true);
  expect(new DimType(129).hasUserPositionedText()).toBe(true);
  expect(new DimType(134).hasUserPositionedText()).toBe(true);
  expect(new DimType(2).hasUserPositionedText()).toBe(false);
});


