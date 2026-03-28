import { Headers } from '../../core/lib/headers.js';
import { DXFFile } from '../../core/lib/dxf/dxfFile.js';
import { DesignCore } from '../../core/designCore.js';
import { Core } from '../../core/core/core.js';
import { jest } from '@jest/globals';

new Core();

// ─── Defaults ────────────────────────────────────────────────────────────────

test('Headers defaults', () => {
  const h = new Headers();
  expect(h.filletRadius).toBe(0);
  expect(h.trimMode).toBe(true);
  expect(h.textSize).toBe(2.5);
  expect(h.chamferDistanceA).toBe(0);
  expect(h.chamferDistanceB).toBe(0);
  expect(h.chamferLength).toBe(0);
  expect(h.chamferAngle).toBe(0);
  expect(h.dxfVersion).toBe('R2018');
});

// ─── filletRadius ─────────────────────────────────────────────────────────────

test('Headers.filletRadius accepts valid values', () => {
  const h = new Headers();
  h.filletRadius = 5;
  expect(h.filletRadius).toBe(5);
  h.filletRadius = 0;
  expect(h.filletRadius).toBe(0);
  h.filletRadius = '3.5'; // coerced from string
  expect(h.filletRadius).toBe(3.5);
});

test('Headers.filletRadius throws on negative value', () => {
  const h = new Headers();
  expect(() => {
    h.filletRadius = -1;
  }).toThrow();
});

test('Headers.filletRadius throws on non-numeric value', () => {
  const h = new Headers();
  expect(() => {
    h.filletRadius = 'abc';
  }).toThrow();
});

// ─── trimMode ─────────────────────────────────────────────────────────────────

test('Headers.trimMode accepts true and false', () => {
  const h = new Headers();
  h.trimMode = false;
  expect(h.trimMode).toBe(false);
  h.trimMode = true;
  expect(h.trimMode).toBe(true);
});

test('Headers.trimMode throws on non-boolean value', () => {
  const h = new Headers();
  expect(() => {
    h.trimMode = 1;
  }).toThrow();
  expect(() => {
    h.trimMode = 'true';
  }).toThrow();
});

// ─── textSize ─────────────────────────────────────────────────────────────────

test('Headers.textSize accepts positive values', () => {
  const h = new Headers();
  h.textSize = 10;
  expect(h.textSize).toBe(10);
  h.textSize = '1.5';
  expect(h.textSize).toBe(1.5);
});

test('Headers.textSize throws on zero or negative', () => {
  const h = new Headers();
  expect(() => {
    h.textSize = 0;
  }).toThrow();
  expect(() => {
    h.textSize = -1;
  }).toThrow();
});

// ─── chamfer properties ───────────────────────────────────────────────────────

test('Headers chamfer properties accept valid values', () => {
  const h = new Headers();
  h.chamferDistanceA = 2;
  expect(h.chamferDistanceA).toBe(2);
  h.chamferDistanceB = 3;
  expect(h.chamferDistanceB).toBe(3);
  h.chamferLength = 4;
  expect(h.chamferLength).toBe(4);
  h.chamferAngle = 45;
  expect(h.chamferAngle).toBe(45);
});

test('Headers chamfer properties throw on negative values', () => {
  const h = new Headers();
  expect(() => {
    h.chamferDistanceA = -1;
  }).toThrow();
  expect(() => {
    h.chamferDistanceB = -1;
  }).toThrow();
  expect(() => {
    h.chamferLength = -1;
  }).toThrow();
  expect(() => {
    h.chamferAngle = -1;
  }).toThrow();
});

// ─── dxfVersion ───────────────────────────────────────────────────────────────

test('Headers.dxfVersion accepts valid version keys', () => {
  const h = new Headers();
  h.dxfVersion = 'R12';
  expect(h.dxfVersion).toBe('R12');
  h.dxfVersion = 'R2000';
  expect(h.dxfVersion).toBe('R2000');
});

test('Headers.dxfVersion accepts DXF version strings and normalises to key', () => {
  const h = new Headers();
  h.dxfVersion = 'AC1009'; // DXF version string for R12
  expect(h.dxfVersion).toBe('R12');
});

test('Headers.dxfVersion throws on invalid version', () => {
  const h = new Headers();
  expect(() => {
    h.dxfVersion = 'R99';
  }).toThrow();
  expect(() => {
    h.dxfVersion = 'BADINPUT';
  }).toThrow();
});

// ─── load() ───────────────────────────────────────────────────────────────────

test('Headers.load updates values from parsed DXF header object', () => {
  const h = new Headers();
  h.load({
    $FILLETRAD: { 40: '7' },
    $TEXTSIZE: { 40: '4' },
    $CHAMFERA: { 40: '1' },
    $CHAMFERB: { 40: '2' },
    $CHAMFERC: { 40: '3' },
    $CHAMFERD: { 40: '45' },
    $TRIMMODE: { 70: '0' },
    $ACADVER: { 1: 'AC1009' },
  });
  expect(h.filletRadius).toBe(7);
  expect(h.textSize).toBe(4);
  expect(h.chamferDistanceA).toBe(1);
  expect(h.chamferDistanceB).toBe(2);
  expect(h.chamferLength).toBe(3);
  expect(h.chamferAngle).toBe(45);
  expect(h.trimMode).toBe(false);
  expect(h.dxfVersion).toBe('R12');
});

test('Headers.load preserves defaults when header object is empty', () => {
  const h = new Headers();
  h.load({});
  expect(h.filletRadius).toBe(0);
  expect(h.trimMode).toBe(true);
  expect(h.textSize).toBe(2.5);
  expect(h.dxfVersion).toBe('R2018');
});

test('Headers.load preserves defaults when called with undefined', () => {
  const h = new Headers();
  h.load(undefined);
  expect(h.filletRadius).toBe(0);
  expect(h.trimMode).toBe(true);
});

test('Headers.load TRIMMODE=1 sets trimMode to true', () => {
  const h = new Headers();
  h.trimMode = false;
  h.load({ $TRIMMODE: { 70: '1' } });
  expect(h.trimMode).toBe(true);
});

// ─── dxf() ────────────────────────────────────────────────────────────────────

test('Headers.dxf writes all expected header variables', () => {
  const h = new Headers();
  h.filletRadius = 3;
  h.trimMode = false;
  h.textSize = 5;
  h.dxfVersion = 'R12';

  DesignCore.Core.styleManager = { getCstyle: jest.fn(() => 'Standard') };
  DesignCore.Core.layerManager = { getCstyle: jest.fn(() => 'Layer0') };
  DesignCore.Core.dimStyleManager = { getCstyle: jest.fn(() => 'ISO-25') };
  DesignCore.Core.handleManager = { handseed: '1' };

  const file = new DXFFile('R12');
  h.dxf(file);

  expect(file.contents).toContain('9\n$ACADVER\n');
  expect(file.contents).toContain('9\n$FILLETRAD\n');
  expect(file.contents).toContain('40\n3\n');
  expect(file.contents).toContain('9\n$TRIMMODE\n');
  expect(file.contents).toContain('70\n0\n'); // trimMode=false
  expect(file.contents).toContain('9\n$TEXTSIZE\n');
  expect(file.contents).toContain('40\n5\n');
  expect(file.contents).toContain('9\n$CHAMFERA\n');
  expect(file.contents).toContain('9\n$CHAMFERB\n');
  expect(file.contents).toContain('9\n$CHAMFERC\n');
  expect(file.contents).toContain('9\n$CHAMFERD\n');
});

test('Headers.dxf writes TRIMMODE=1 when trimMode is true', () => {
  const h = new Headers();
  h.trimMode = true;

  DesignCore.Core.styleManager = { getCstyle: jest.fn(() => 'Standard') };
  DesignCore.Core.layerManager = { getCstyle: jest.fn(() => 'Layer0') };
  DesignCore.Core.dimStyleManager = { getCstyle: jest.fn(() => 'ISO-25') };
  DesignCore.Core.handleManager = { handseed: '1' };

  const file = new DXFFile('R12');
  h.dxf(file);

  expect(file.contents).toContain('70\n1\n');
});
