import { Core } from '../../core/core/core.js';
import { DesignCore } from '../../core/designCore.js';
import { Point } from '../../core/entities/point.js';
import { Line } from '../../core/entities/line.js';
import { Circle } from '../../core/entities/circle.js';
import { Arc } from '../../core/entities/arc.js';
import { Text } from '../../core/entities/text.js';
import { Polyline } from '../../core/entities/polyline.js';
import { Hatch } from '../../core/entities/hatch.js';
import { Rectangle } from '../../core/entities/rectangle.js';
import { Copy } from '../../core/tools/copy.js';
import { Move } from '../../core/tools/move.js';
import { Rotate } from '../../core/tools/rotate.js';
import { Erase } from '../../core/tools/erase.js';
import { MatchProp } from '../../core/tools/matchProp.js';
import { Trim } from '../../core/tools/trim.js';
import { Extend } from '../../core/tools/extend.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let core;

/**
 * Create a mock for inputManager.requestInput that feeds
 * sequential inputs and rejects when exhausted (simulating Escape)
 * @param {Array} inputs - array of input values to return in order
 * @return {Function} mock requestInput function
 */
function mockRequestInput(inputs) {
  let callCount = 0;
  return async () => {
    if (callCount < inputs.length) {
      return inputs[callCount++];
    }
    throw new Error('cancelled');
  };
}

/**
 * Execute an entity command with mocked user inputs
 * @param {Object} command - the command instance to execute
 * @param {Array} inputs - array of input values to feed sequentially
 */
async function executeWithInputs(command, inputs) {
  const origRequestInput = DesignCore.Scene.inputManager.requestInput.bind(DesignCore.Scene.inputManager);
  DesignCore.Scene.inputManager.requestInput = mockRequestInput(inputs);
  await command.execute();
  DesignCore.Scene.inputManager.requestInput = origRequestInput;
}

/**
 * Execute a tool command with mocked user inputs and pre-populated selection
 * @param {Object} tool - the tool instance to execute
 * @param {Array} selectionIndices - entity indices to pre-select
 * @param {Array} inputs - array of input values to feed sequentially
 */
async function executeToolWithInputs(tool, selectionIndices, inputs) {
  DesignCore.Scene.selectionManager.reset();
  for (const idx of selectionIndices) {
    DesignCore.Scene.selectionManager.addToSelectionSet(idx);
  }

  // Set active command so actionCommand recognises Tool instances
  DesignCore.Scene.inputManager.activeCommand = tool;

  const origRequestInput = DesignCore.Scene.inputManager.requestInput.bind(DesignCore.Scene.inputManager);
  DesignCore.Scene.inputManager.requestInput = mockRequestInput(inputs);
  await tool.execute();
  DesignCore.Scene.inputManager.requestInput = origRequestInput;
}

beforeAll(async () => {
  core = new Core();

  // ---- Entity Creation ----

  // Line: two segments from (0,0) to (100,100) to (200,0)
  const line = new Line();
  await executeWithInputs(line, [
    new Point(0, 0),
    new Point(100, 100),
    new Point(200, 0),
  ]);
  // idx 0: Line (0,0)→(100,100)
  // idx 1: Line (100,100)→(200,0)

  // Circle: center (300, 300) radius 50
  const circle = new Circle();
  await executeWithInputs(circle, [
    new Point(300, 300),
    50,
  ]);
  // idx 2: Circle

  // Arc: center (500, 500), start point (530, 500), end angle 90 degrees
  const arc = new Arc();
  await executeWithInputs(arc, [
    new Point(500, 500),
    new Point(530, 500),
    90,
  ]);
  // idx 3: Arc

  // Polyline: (0, 200) -> (50, 200) -> (50, 250) -> (0, 250)
  const polyline = new Polyline();
  await executeWithInputs(polyline, [
    new Point(0, 200),
    new Point(50, 200),
    new Point(50, 250),
    new Point(0, 250),
  ]);
  // idx 4: Polyline

  // Text: position (10, 400), height 5, rotation 0, string "Hello"
  const text = new Text();
  await executeWithInputs(text, [
    new Point(10, 400),
    5,
    0,
    'Hello',
  ]);
  // idx 5: Text

  // Rectangle: corners (600, 0) and (700, 100) — creates a closed Polyline
  const rectangle = new Rectangle();
  await executeWithInputs(rectangle, [
    new Point(600, 0),
    new Point(700, 100),
  ]);
  // idx 6: Polyline (rectangle)

  // Hatch: uses the rectangle boundary as selection
  const rectangleEntity = DesignCore.Scene.entities.get(DesignCore.Scene.entities.count() - 1);
  const origSelectedItems = DesignCore.Scene.selectionManager.selectedItems;
  DesignCore.Scene.selectionManager.selectedItems = [rectangleEntity];

  const hatch = new Hatch();
  await executeWithInputs(hatch, [
    'accept',
  ]);
  DesignCore.Scene.selectionManager.selectedItems = origSelectedItems;
  // idx 7: Hatch

  // Additional lines for trim and extend geometry
  // Trim: horizontal boundary and vertical target that cross
  const trimBoundary = new Line();
  await executeWithInputs(trimBoundary, [
    new Point(800, 50),
    new Point(1000, 50),
  ]);
  // idx 8: Line (800,50)→(1000,50) - trim boundary

  const trimTarget = new Line();
  await executeWithInputs(trimTarget, [
    new Point(900, 0),
    new Point(900, 100),
  ]);
  // idx 9: Line (900,0)→(900,100) - trim target (intersects at 900,50)

  // Extend: boundary and short target that doesn't reach it
  const extendBoundary = new Line();
  await executeWithInputs(extendBoundary, [
    new Point(1100, 0),
    new Point(1100, 200),
  ]);
  // idx 10: Line (1100,0)→(1100,200) - extend boundary

  const extendTarget = new Line();
  await executeWithInputs(extendTarget, [
    new Point(1000, 100),
    new Point(1050, 100),
  ]);
  // idx 11: Line (1000,100)→(1050,100) - extend target

  // MatchProp source line on a different layer
  DesignCore.LayerManager.addItem({ name: 'TOOL_LAYER' });
  DesignCore.LayerManager.setCstyle('TOOL_LAYER');

  const matchSource = new Line();
  await executeWithInputs(matchSource, [
    new Point(800, 800),
    new Point(900, 900),
  ]);
  // idx 12: Line on TOOL_LAYER

  DesignCore.LayerManager.setCstyle('0');

  // ---- Tool Operations ----
  // Operations ordered so that index-shifting removals (Trim, Erase) happen last.

  // Copy: copy line[0] offset by (0, -100)
  await executeToolWithInputs(new Copy(), [0], [
    new Point(0, 0),
    new Point(0, -100),
  ]);
  // idx 13: copy of line[0]

  // Move: move the copied line by (400, 0)
  await executeToolWithInputs(new Move(), [13], [
    new Point(0, 0),
    new Point(400, 0),
  ]);

  // Rotate: rotate line[1] by 45 degrees around (100,100)
  await executeToolWithInputs(new Rotate(), [1], [
    new Point(100, 100),
    45,
  ]);

  // MatchProp: copy properties from TOOL_LAYER source (idx 12) to line[0]
  // Pre-select 1 item → used as source
  await executeToolWithInputs(new MatchProp(), [12], [
    { selectionSet: [0] },
  ]);
  // idx 0: layer changed to TOOL_LAYER

  // Extend: extend short line (idx 11) to boundary (idx 10)
  // Mouse near right end → extends from right end
  const origPointOnScene = DesignCore.Mouse.pointOnScene.bind(DesignCore.Mouse);
  DesignCore.Mouse.pointOnScene = () => new Point(1050, 100);

  await executeToolWithInputs(new Extend(), [10], [
    new SingleSelection(11, new Point(1050, 100)),
  ]);

  // Trim: trim vertical line (idx 9) using horizontal line (idx 8) as boundary
  // Mouse below intersection → removes bottom segment
  DesignCore.Mouse.pointOnScene = () => new Point(900, 25);

  await executeToolWithInputs(new Trim(), [8], [
    new SingleSelection(9, new Point(900, 25)),
  ]);
  // idx 9 removed, trimmed line added at end
  // indices 10+ shift down by 1: matchprop source (was 12) → now 11

  DesignCore.Mouse.pointOnScene = origPointOnScene;

  // Erase: remove the matchprop source line (now idx 11 after trim shift)
  await executeToolWithInputs(new Erase(), [11], []);
  // matchprop source line removed
});

let dxfOutput;

beforeAll(() => {
  dxfOutput = core.saveFile('R2018');
});

test('Test DXF output contains all entity types', () => {
  expect(dxfOutput).toContain('LINE');
  expect(dxfOutput).toContain('CIRCLE');
  expect(dxfOutput).toContain('ARC');
  expect(dxfOutput).toContain('POLYLINE');
  expect(dxfOutput).toContain('TEXT');
  expect(dxfOutput).toContain('HATCH');
});

test('Test DXF output matches reference file', () => {
  const referencePath = join(__dirname, 'userInputIntegration.reference.dxf');
  const reference = readFileSync(referencePath, 'utf8');

  expect(dxfOutput).toBe(reference);
});
