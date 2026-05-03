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
import { ArcAlignedText } from '../../core/entities/arctext.js';
import { Copy } from '../../core/tools/copy.js';
import { Move } from '../../core/tools/move.js';
import { Rotate } from '../../core/tools/rotate.js';
import { Erase } from '../../core/tools/erase.js';
import { MatchProp } from '../../core/tools/matchProp.js';
import { Trim } from '../../core/tools/trim.js';
import { Extend } from '../../core/tools/extend.js';
import { Mirror } from '../../core/tools/mirror.js';
import { Scale } from '../../core/tools/scale.js';
import { Offset } from '../../core/tools/offset.js';
import { Fillet } from '../../core/tools/fillet.js';
import { Chamfer } from '../../core/tools/chamfer.js';
import { SingleSelection } from '../../core/lib/selectionManager.js';

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let core;

// Width/height of each grid cell in DXF units.
// Entities for each command live within (col*CELL, row*CELL)→((col+1)*CELL,(row+1)*CELL).
//
// Grid layout (6 columns × 4 rows):
//   Row 0: Line | Circle | Arc | Polyline | Rectangle | Text
//   Row 1: Hatch | ArcText | Copy | Move | Mirror | Scale
//   Row 2: Rotate | Erase | Offset | Trim | Extend | Fillet
//   Row 3: Chamfer | MatchProp
const CELL = 200;

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
 * Execute an entity creation command with mocked user inputs.
 * Does NOT set activeCommand so actionCommand() routes through addItem().
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
 * Execute a tool command with mocked user inputs and pre-populated selection.
 * Sets activeCommand so actionCommand() calls tool.action().
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

  // =====================================================================
  // Phase 1: Showcase entities  (idx 0–7)
  // =====================================================================

  // col 0, row 0 — Line → idx 0
  await executeWithInputs(new Line(), [
    new Point(10, 50),
    new Point(90, 50),
  ]);

  // col 1, row 0 — Circle, centre (250,50) r=30 → idx 1
  await executeWithInputs(new Circle(), [
    new Point(250, 50),
    30,
  ]);

  // col 2, row 0 — Arc, centre (450,50), start (480,50), 270° CCW → idx 2
  await executeWithInputs(new Arc(), [
    new Point(450, 50),
    new Point(480, 50),
    270,
  ]);

  // col 3, row 0 — Polyline, open V-shape → idx 3
  await executeWithInputs(new Polyline(), [
    new Point(610, 80),
    new Point(650, 20),
    new Point(690, 80),
  ]);

  // col 4, row 0 — Rectangle (stored as closed Polyline) → idx 4
  await executeWithInputs(new Rectangle(), [
    new Point(820, 20),
    new Point(880, 80),
  ]);

  // col 5, row 0 — Text → idx 5
  await executeWithInputs(new Text(), [
    new Point(1010, 50),
    10,
    0,
    'Text',
  ]);

  // col 0, row 1 — Rectangle boundary for Hatch, in its own cell → idx 6
  await executeWithInputs(new Rectangle(), [
    new Point(20, 240),
    new Point(180, 360),
  ]);

  // col 0, row 1 — Hatch using the rectangle boundary (idx 6) → idx 7
  {
    const hatchBoundary = DesignCore.Scene.entities.get(6);
    const origSelectedEntities = DesignCore.Scene.selectionManager.selectedEntities;
    DesignCore.Scene.selectionManager.selectedEntities = [hatchBoundary];
    await executeWithInputs(new Hatch(), ['accept']);
    DesignCore.Scene.selectionManager.selectedEntities = origSelectedEntities;
  }

  // col 1, row 1 — Arc for ArcAlignedText, in its own cell → idx 8
  await executeWithInputs(new Arc(), [
    new Point(300, 300),
    new Point(350, 300),
    270,
  ]);

  // col 1, row 1 — ArcAlignedText on Arc (idx 8) → idx 9
  await executeWithInputs(new ArcAlignedText(), [
    new SingleSelection(8, new Point(350, 300)),
    10, // height (asked because style is STANDARD)
    'ArcText',
  ]);

  // =====================================================================
  // Phase 2: Dedicated geometry for each tool cell  (idx 10–25)
  // =====================================================================

  // col 2, row 1 — Copy source
  await executeWithInputs(new Line(), [new Point(410, 230), new Point(490, 230)]); // idx 10

  // col 3, row 1 — Move source
  await executeWithInputs(new Line(), [new Point(610, 230), new Point(690, 230)]); // idx 11

  // col 4, row 1 — Mirror source
  await executeWithInputs(new Line(), [new Point(810, 230), new Point(890, 230)]); // idx 12

  // col 5, row 1 — Scale source (circle)
  await executeWithInputs(new Circle(), [new Point(1050, 230), 20]); // idx 13

  // col 0, row 2 — Rotate source
  await executeWithInputs(new Line(), [new Point(10, 450), new Point(90, 450)]); // idx 14

  // col 1, row 2 — Erase target  (will be removed)
  await executeWithInputs(new Line(), [new Point(210, 450), new Point(290, 450)]); // idx 15

  // col 2, row 2 — Offset source
  await executeWithInputs(new Line(), [new Point(410, 450), new Point(490, 450)]); // idx 16

  // col 3, row 2 — Trim: horizontal boundary + vertical target that crosses it
  await executeWithInputs(new Line(), [new Point(620, 430), new Point(720, 430)]); // idx 17 (boundary)
  await executeWithInputs(new Line(), [new Point(670, 400), new Point(670, 470)]); // idx 18 (target; intersection at 670,430)

  // col 4, row 2 — Extend: vertical boundary + short horizontal target
  await executeWithInputs(new Line(), [new Point(820, 410), new Point(820, 490)]); // idx 19 (boundary at x=820)
  await executeWithInputs(new Line(), [new Point(840, 450), new Point(880, 450)]); // idx 20 (target; left end faces x=820)

  // col 5, row 2 — Fillet: two Lines sharing a right-angle corner at (1060,440)
  await executeWithInputs(new Line(), [new Point(1010, 440), new Point(1060, 440)]); // idx 21 (horizontal arm)
  await executeWithInputs(new Line(), [new Point(1060, 440), new Point(1060, 490)]); // idx 22 (vertical arm)

  // col 0, row 3 — Chamfer: two Lines sharing a right-angle corner at (60,620)
  await executeWithInputs(new Line(), [new Point(10, 620), new Point(60, 620)]); // idx 23 (horizontal arm)
  await executeWithInputs(new Line(), [new Point(60, 620), new Point(60, 670)]); // idx 24 (vertical arm)

  // col 1, row 3 — MatchProp source on a dedicated layer
  DesignCore.LayerManager.addItem({ name: 'TOOL_LAYER' });
  DesignCore.LayerManager.setCstyle('TOOL_LAYER');
  await executeWithInputs(new Line(), [new Point(210, 650), new Point(290, 650)]); // idx 25
  DesignCore.LayerManager.setCstyle('0');

  // =====================================================================
  // Phase 3: Tool operations
  //   Index-shifting removals (Trim, Erase) happen last.
  // =====================================================================

  // Copy: copy idx 10 downward → adds idx 26
  await executeToolWithInputs(new Copy(), [10], [
    new Point(410, 230), // base point
    new Point(410, 310), // destination (delta 0,+80)
  ]);

  // Move: shift idx 11 downward (UpdateState, no new entity)
  await executeToolWithInputs(new Move(), [11], [
    new Point(610, 230), // base point
    new Point(610, 310), // destination
  ]);

  // Mirror: mirror idx 12 about a horizontal axis at y=250; keep source → adds idx 27
  await executeToolWithInputs(new Mirror(), [12], [
    new Point(800, 250), // first mirror-axis point
    new Point(900, 250), // second mirror-axis point
    'No', // do not erase source
  ]);

  // Scale: scale idx 13 (circle) by ×2 from its centre (UpdateState)
  await executeToolWithInputs(new Scale(), [13], [
    new Point(1050, 230), // base point (= circle centre)
    2, // scale factor
  ]);

  // Rotate: rotate idx 14 by 90° CCW about its left endpoint (UpdateState)
  await executeToolWithInputs(new Rotate(), [14], [
    new Point(10, 450), // base point
    90, // angle in degrees
  ]);

  // Offset: offset idx 16 upward by 20 units; pre-selecting skips SINGLESELECTION prompt → adds idx 28
  await executeToolWithInputs(new Offset(), [16], [
    20, // offset distance
    new Point(450, 470), // side point (above the line at y=450)
  ]);

  // Extend: extend the left end of idx 20 to boundary idx 19 (at x=820)
  {
    const origPointOnScene = DesignCore.Mouse.pointOnScene.bind(DesignCore.Mouse);
    DesignCore.Mouse.pointOnScene = () => new Point(840, 450);
    await executeToolWithInputs(new Extend(), [19], [
      new SingleSelection(20, new Point(840, 450)),
    ]);
    DesignCore.Mouse.pointOnScene = origPointOnScene;
  }

  // MatchProp: copy properties from idx 25 (TOOL_LAYER) onto idx 0 (UpdateState)
  await executeToolWithInputs(new MatchProp(), [25], [
    { selectionSet: [0] },
  ]);

  // Fillet: radius=10, trimMode=true; fillet the corner of idx 21 & idx 22 → adds Arc (idx 29)
  DesignCore.Scene.headers.filletRadius = 10;
  DesignCore.Scene.headers.trimMode = true;
  await executeToolWithInputs(new Fillet(), [], [
    new SingleSelection(21, new Point(1035, 440)), // horizontal arm, away from corner
    new SingleSelection(22, new Point(1060, 465)), // vertical arm, away from corner
  ]);

  // Chamfer: distA=distB=10, distance mode, trimMode=true → adds Line (idx 30)
  DesignCore.Scene.headers.chamferDistanceA = 10;
  DesignCore.Scene.headers.chamferDistanceB = 10;
  DesignCore.Scene.headers.chamferMode = false;
  DesignCore.Scene.headers.trimMode = true;
  await executeToolWithInputs(new Chamfer(), [], [
    new SingleSelection(23, new Point(35, 620)), // horizontal arm, away from corner
    new SingleSelection(24, new Point(60, 645)), // vertical arm, away from corner
  ]);

  // Trim: remove the lower segment of idx 18 using boundary idx 17.
  // Mouse at (670,450) — between the intersection (670,430) and the bottom end (670,470).
  {
    const origPointOnScene = DesignCore.Mouse.pointOnScene.bind(DesignCore.Mouse);
    DesignCore.Mouse.pointOnScene = () => new Point(670, 450);
    await executeToolWithInputs(new Trim(), [17], [
      new SingleSelection(18, new Point(670, 450)),
    ]);
    DesignCore.Mouse.pointOnScene = origPointOnScene;
  }
  // → idx 18 removed; trimmed-remainder line added at end of entity list

  // Erase: remove the dedicated erase-target (idx 15).
  // idx 15 < 18, so the Trim removal above did not affect its index.
  await executeToolWithInputs(new Erase(), [15], []);

  // =====================================================================
  // Phase 4: Text labels — placed at the top of each grid cell
  // =====================================================================

  const addLabel = async (col, row, name) => {
    await executeWithInputs(new Text(), [
      new Point(col * CELL + 10, row * CELL + 15),
      8, // height
      0, // rotation
      name,
    ]);
  };

  // Row 0
  await addLabel(0, 0, 'Line');
  await addLabel(1, 0, 'Circle');
  await addLabel(2, 0, 'Arc');
  await addLabel(3, 0, 'Polyline');
  await addLabel(4, 0, 'Rectangle');
  await addLabel(5, 0, 'Text');

  // Row 1
  await addLabel(0, 1, 'Hatch');
  await addLabel(1, 1, 'ArcText');
  await addLabel(2, 1, 'Copy');
  await addLabel(3, 1, 'Move');
  await addLabel(4, 1, 'Mirror');
  await addLabel(5, 1, 'Scale');

  // Row 2
  await addLabel(0, 2, 'Rotate');
  await addLabel(1, 2, 'Erase');
  await addLabel(2, 2, 'Offset');
  await addLabel(3, 2, 'Trim');
  await addLabel(4, 2, 'Extend');
  await addLabel(5, 2, 'Fillet');

  // Row 3
  await addLabel(0, 3, 'Chamfer');
  await addLabel(1, 3, 'MatchProp');
});

let dxfOutput;

beforeAll(() => {
  dxfOutput = core.saveFile('R2018');
});

test('DXF output contains all entity types', () => {
  expect(dxfOutput).toContain('LINE');
  expect(dxfOutput).toContain('CIRCLE');
  expect(dxfOutput).toContain('ARC');
  expect(dxfOutput).toContain('LWPOLYLINE');
  expect(dxfOutput).toContain('TEXT');
  expect(dxfOutput).toContain('HATCH');
  expect(dxfOutput).toContain('ARCALIGNEDTEXT');
});

test('DXF output matches reference file', () => {
  const referencePath = join(__dirname, 'userInputIntegration.reference.dxf');
  if (!existsSync(referencePath)) {
    writeFileSync(referencePath, dxfOutput, 'utf8');
  }
  const reference = readFileSync(referencePath, 'utf8');

  expect(dxfOutput).toBe(reference);
});
