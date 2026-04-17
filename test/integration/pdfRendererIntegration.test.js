import { PdfRenderer } from '../../core/lib/renderers/pdfRenderer.js';
import { buildHatchGrid, PAGE_W, PAGE_H, PATTERNS } from '../test-helpers/hatchGridRenderer.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Build PDF ────────────────────────────────────────────────────────────────

let pdfOutput;

beforeAll(() => {
  const renderer = new PdfRenderer(PAGE_W, PAGE_H);
  buildHatchGrid(renderer);
  pdfOutput = renderer.getOutput();
});

// ─── Sanity checks ────────────────────────────────────────────────────────────

test('PDF output starts with PDF header', () => {
  expect(pdfOutput.startsWith('%PDF-1.4')).toBe(true);
});

test('PDF output ends with %%EOF', () => {
  expect(pdfOutput.endsWith('%%EOF')).toBe(true);
});

test('PDF output contains all hatch pattern names as labels', () => {
  for (const name of PATTERNS) {
    expect(pdfOutput).toContain(`(${name})`);
  }
});

test('PDF output contains expected content operators', () => {
  const streamStart = pdfOutput.indexOf('stream\n') + 'stream\n'.length;
  const streamEnd = pdfOutput.indexOf('\nendstream');
  const stream = pdfOutput.slice(streamStart, streamEnd);
  expect(stream).toContain('m'); // moveto
  expect(stream).toContain('l'); // lineto
  expect(stream).toContain('S'); // stroke
  expect(stream).toContain('BT'); // begin text
  expect(stream).toContain('ET'); // end text
});

// ─── Reference file comparison ────────────────────────────────────────────────
//
// First run: reference file does not exist → written automatically.
// Open pdfRendererIntegration.reference.pdf in a viewer to visually verify,
// then commit it.  Subsequent runs: output must be byte-for-byte identical.
// To regenerate intentionally: delete the reference file and rerun npm test.

test('PDF output matches reference file', () => {
  const referencePath = join(__dirname, 'pdfRendererIntegration.reference.pdf');
  if (!existsSync(referencePath)) {
    writeFileSync(referencePath, pdfOutput, 'utf8');
  }
  const reference = readFileSync(referencePath, 'utf8');
  expect(pdfOutput).toBe(reference);
});
