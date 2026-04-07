import { Input, MouseDown, MouseUp } from '../../core/lib/inputManager.js';
import { Point } from '../../core/entities/point.js';
import { SingleSelection, SelectionSet } from '../../core/lib/selectionManager.js';
import { expect } from '@jest/globals';

// Stub classes that simulate what terser does in a production build:
// constructor.name is mangled to a single letter but static type is preserved.

/** Stub simulating a minified class resolved as Point. */
class MangledPoint {
  static type = 'Point';
}

/** Stub simulating a minified class resolved as SingleSelection. */
class MangledSingleSelection {
  static type = 'SingleSelection';
}

/** Stub simulating a minified class resolved as SelectionSet. */
class MangledSelectionSet {
  static type = 'SelectionSet';
}

/** Stub simulating a minified class resolved as MouseDown. */
class MangledMouseDown {
  static type = 'MouseDown';
}

/** Stub simulating a minified class resolved as MouseUp. */
class MangledMouseUp {
  static type = 'MouseUp';
}

/** Stub with no static type and an unrecognised constructor.name. */
class UnknownStub {}

// ─── Input.Type ───────────────────────────────────────────────────────────────

test('Input.Type contains all expected type entries', () => {
  const keys = Object.keys(Input.Type);
  expect(keys).toContain('POINT');
  expect(keys).toContain('SELECTIONSET');
  expect(keys).toContain('SINGLESELECTION');
  expect(keys).toContain('NUMBER');
  expect(keys).toContain('STRING');
  expect(keys).toContain('DYNAMIC');
  expect(keys).toContain('MOUSEDOWN');
  expect(keys).toContain('MOUSEUP');
});

// ─── Input.getType — undefined ────────────────────────────────────────────────

test('Input.getType returns undefined for undefined input', () => {
  expect(Input.getType(undefined)).toBeUndefined();
});

// ─── Input.getType — constructor.name path (dev / unminified) ─────────────────

test('Input.getType resolves Point via constructor.name', () => {
  expect(Input.getType(new Point(1, 2))).toBe(Input.Type.POINT);
});

test('Input.getType resolves SingleSelection via constructor.name', () => {
  expect(Input.getType(new SingleSelection(0, new Point(0, 0)))).toBe(Input.Type.SINGLESELECTION);
});

test('Input.getType resolves SelectionSet via constructor.name', () => {
  expect(Input.getType(new SelectionSet())).toBe(Input.Type.SELECTIONSET);
});

test('Input.getType resolves MouseDown via constructor.name', () => {
  expect(Input.getType(new MouseDown())).toBe(Input.Type.MOUSEDOWN);
});

test('Input.getType resolves MouseUp via constructor.name', () => {
  expect(Input.getType(new MouseUp())).toBe(Input.Type.MOUSEUP);
});

test('Input.getType resolves Number via constructor.name', () => {
  expect(Input.getType(42)).toBe(Input.Type.NUMBER);
});

test('Input.getType resolves String via constructor.name', () => {
  expect(Input.getType('hello')).toBe(Input.Type.STRING);
});

// ─── Input.getType — static type path (minified / production) ─────────────────

test('Input.getType resolves via static type when constructor.name is mangled (Point)', () => {
  expect(Input.getType(new MangledPoint())).toBe(Input.Type.POINT);
});

test('Input.getType resolves via static type when constructor.name is mangled (SingleSelection)', () => {
  expect(Input.getType(new MangledSingleSelection())).toBe(Input.Type.SINGLESELECTION);
});

test('Input.getType resolves via static type when constructor.name is mangled (SelectionSet)', () => {
  expect(Input.getType(new MangledSelectionSet())).toBe(Input.Type.SELECTIONSET);
});

test('Input.getType resolves via static type when constructor.name is mangled (MouseDown)', () => {
  expect(Input.getType(new MangledMouseDown())).toBe(Input.Type.MOUSEDOWN);
});

test('Input.getType resolves via static type when constructor.name is mangled (MouseUp)', () => {
  expect(Input.getType(new MangledMouseUp())).toBe(Input.Type.MOUSEUP);
});

// ─── Input.getType — no match ─────────────────────────────────────────────────

test('Input.getType returns undefined when neither static type nor constructor.name matches', () => {
  expect(Input.getType(new UnknownStub())).toBeUndefined();
});

test('Input.getType returns undefined for a plain object', () => {
  expect(Input.getType({})).toBeUndefined();
});
