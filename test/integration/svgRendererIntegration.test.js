import { SvgRenderer } from '../../core/lib/renderers/svgRenderer.js';
import { buildHatchGrid, PAGE_W, PAGE_H, PATTERNS } from '../test-helpers/hatchGridRenderer.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Build SVG ────────────────────────────────────────────────────────────────

let svgOutput;

beforeAll(() => {
  const renderer = new SvgRenderer(PAGE_W, PAGE_H);
  buildHatchGrid(renderer);
  svgOutput = renderer.getOutput();
});

// ─── Sanity checks ────────────────────────────────────────────────────────────

test('SVG output starts with XML declaration', () => {
  expect(svgOutput.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});

test('SVG output ends with </svg>', () => {
  expect(svgOutput.trim().endsWith('</svg>')).toBe(true);
});

test('SVG output contains all hatch pattern names as labels', () => {
  for (const name of PATTERNS) {
    expect(svgOutput).toContain(name);
  }
});

test('SVG output contains expected SVG elements', () => {
  expect(svgOutput).toContain('<path');
  expect(svgOutput).toContain('<text');
});

test('SVG output has balanced group tags', () => {
  const opens = (svgOutput.match(/<g[\s>]/g) ?? []).length;
  const closes = (svgOutput.match(/<\/g>/g) ?? []).length;
  expect(opens).toBe(closes);
});

// ─── Reference file comparison ────────────────────────────────────────────────
//
// First run: reference file does not exist → written automatically.
// Open svgRendererIntegration.reference.svg in a browser to visually verify,
// then commit it.  Subsequent runs: output must be byte-for-byte identical.
// To regenerate intentionally: delete the reference file and rerun npm test.

test('SVG output matches reference file', () => {
  const referencePath = join(__dirname, 'svgRendererIntegration.reference.svg');
  if (!existsSync(referencePath)) {
    writeFileSync(referencePath, svgOutput, 'utf8');
  }
  const reference = readFileSync(referencePath, 'utf8');
  expect(svgOutput).toBe(reference);
});
