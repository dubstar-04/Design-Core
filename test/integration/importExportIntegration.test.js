import { Core } from '../../core/core/core.js';
import { DXF } from '../../core/lib/dxf/dxf.js';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Strip handle values from a DXF string so that comparison
 * is insensitive to handle allocation order.
 * Only group codes that contain hex handles are stripped.
 * Values are validated as hex before stripping.
 * @param {string} dxfString
 * @return {{stripped: string, invalidHandles: Array<{line: number, code: number, value: string}>}}
 */
function stripHandles(dxfString) {
  const lines = dxfString.split('\n');
  const invalidHandles = [];
  let inDimStyle = false;

  // DXF lines alternate: group code, value, group code, value...
  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (isNaN(code)) continue;

    const value = lines[i + 1].trim();

    // Track DIMSTYLE context - groupcode 5 is an arrowhead
    // block name in DIMSTYLE, not a handle (DIMSTYLE uses 105)
    if (code === 0) {
      inDimStyle = value === 'DIMSTYLE';
    }

    // Groupcode 5 = entity/table handle (except in DIMSTYLE)
    // Groupcode 105 = dimstyle handle
    // Groupcode 350 = dictionary entry handle
    // Groupcode 390 = plotStyleHandle
    const isHandleCode = (code === 5 && !inDimStyle) ||
                         code === 105 || code === 350 || code === 390;

    if (isHandleCode) {
      if (/^[0-9A-Fa-f]+$/.test(value)) {
        lines[i + 1] = '0';
      } else {
        invalidHandles.push({ line: i + 2, code, value });
      }
    }
  }

  return { stripped: lines.join('\n'), invalidHandles };
}

test('Test DXF round-trip: read reference and re-output matches', () => {
  const core = new Core();

  const referencePath = join(__dirname, 'exportIntegration.reference.dxf');
  const reference = readFileSync(referencePath, 'utf8');

  // Load the reference DXF
  const dxf = new DXF();
  dxf.loadDxf(reference);

  // Output a new DXF
  const output = core.saveFile('R2018');

  const strippedOutput = stripHandles(output);
  const strippedReference = stripHandles(reference);

  expect(strippedOutput.invalidHandles).toEqual([]);
  expect(strippedReference.invalidHandles).toEqual([]);
  expect(strippedOutput.stripped).toBe(strippedReference.stripped);
});

test('Test DXF output has no duplicate handles', () => {
  const core = new Core();

  const referencePath = join(__dirname, 'exportIntegration.reference.dxf');
  const reference = readFileSync(referencePath, 'utf8');

  // Load the reference DXF
  const dxf = new DXF();
  dxf.loadDxf(reference);

  // Output a new DXF
  const output = core.saveFile('R2018');
  const lines = output.split('\n');

  const handles = new Map();
  let inDimStyle = false;
  let isHandseed = false;

  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (isNaN(code)) continue;

    const value = lines[i + 1].trim();

    if (code === 0) {
      inDimStyle = value === 'DIMSTYLE';
    }

    // $HANDSEED uses groupcode 5 for its value, not as a handle
    if (code === 9 && value === '$HANDSEED') {
      isHandseed = true;
      continue;
    }

    // Only check groupcode 5 handles (entity/table handles)
    // Skip DIMSTYLE where code 5 is arrowhead block name
    // Skip $HANDSEED value
    if (code === 5 && !inDimStyle && !isHandseed && /^[0-9A-Fa-f]+$/.test(value)) {
      const lineNum = i + 2;
      if (handles.has(value)) {
        fail(`Duplicate handle ${value} at line ${lineNum} (first seen at line ${handles.get(value)})`);
      }
      handles.set(value, lineNum);
    }

    isHandseed = false;
  }

  expect(handles.size).toBeGreaterThan(0);
});
