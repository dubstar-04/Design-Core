import { Core } from '../../core/core/core.js';
import { DXF } from '../../core/lib/dxf/dxf.js';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('Test DXF round-trip: read reference and re-output matches', () => {
  const core = new Core();

  const referencePath = join(__dirname, 'exportIntegration.reference.dxf');
  const reference = readFileSync(referencePath, 'utf8');

  // Load the reference DXF
  const dxf = new DXF();
  dxf.loadDxf(reference);

  // Output a new DXF
  const output = core.saveFile('R2018');
  expect(output).toBe(reference);
});
