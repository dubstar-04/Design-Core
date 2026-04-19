/**
 * Shared hatch pattern grid renderer.
 *
 * Draws a full hatch-pattern reference sheet onto any RendererBase-compatible
 * renderer: a 10-column grid of all 82 hatch patterns (alternating square and
 * circle boundaries), pattern name labels, a 5 mm border rectangle, and a
 * title.  Used by both the PDF and SVG integration tests so the visual output
 * stays identical across renderer implementations.
 *
 * Usage:
 *   const renderer = new SomeRenderer(PAGE_W, PAGE_H);
 *   buildHatchGrid(renderer);
 *   const output = renderer.getOutput();
 */

import { Core } from '../../core/core/core.js';
import { Hatch } from '../../core/entities/hatch.js';
import { BasePolyline } from '../../core/entities/basePolyline.js';
import { Point } from '../../core/entities/point.js';
import { Text } from '../../core/entities/text.js';

// ─── Page & grid constants ────────────────────────────────────────────────────

export const PAGE_W = 1190; // landscape A3
export const PAGE_H = 842;
export const MARGIN = 5 * 72 / 25.4; // 5 mm in points ≈ 14.17

export const COLS = 10;
export const CELL_W = 115;
export const CELL_H = 85;
export const SHAPE_R = 32; // half-side of square / radius of circle (64 pt total)
export const LABEL_FONT = 6;
export const TITLE_FONT = 14;

// ─── All hatch patterns ───────────────────────────────────────────────────────

export const PATTERNS = [
  'SOLID',
  'ANGLE', 'ANSI31', 'ANSI32', 'ANSI33', 'ANSI34', 'ANSI35', 'ANSI36', 'ANSI37', 'ANSI38',
  'AR-B816', 'AR-B816C', 'AR-B88', 'AR-BRELM', 'AR-BRSTD', 'AR-CONC',
  'AR-HBONE', 'AR-PARQ1', 'AR-RROOF', 'AR-RSHKE', 'AR-SAND',
  'BOX', 'BRASS', 'BRICK', 'BRSTONE', 'CLAY', 'CORK', 'CROSS',
  'DASH', 'DOLMIT', 'DOTS', 'EARTH', 'ESCHER', 'FLEX',
  'GOST_GLASS', 'GOST_WOOD', 'GOST_GROUND', 'GRASS', 'GRATE', 'GRAVEL',
  'HEX', 'HONEY', 'HOUND', 'INSUL',
  'ACAD_ISO02W100', 'ACAD_ISO03W100', 'ACAD_ISO04W100', 'ACAD_ISO05W100',
  'ACAD_ISO06W100', 'ACAD_ISO07W100', 'ACAD_ISO08W100', 'ACAD_ISO09W100',
  'ACAD_ISO10W100', 'ACAD_ISO11W100', 'ACAD_ISO12W100', 'ACAD_ISO13W100',
  'ACAD_ISO14W100', 'ACAD_ISO15W100',
  'JIS_LC_20', 'JIS_LC_20A', 'JIS_LC_8', 'JIS_LC_8A',
  'JIS_RC_10', 'JIS_RC_15', 'JIS_RC_18', 'JIS_RC_30', 'JIS_STN_1E', 'JIS_WOOD',
  'LINE', 'MUDST', 'NET', 'NET3', 'PLAST', 'PLASTI',
  'SACNCR', 'SQUARE', 'STARS', 'STEEL', 'SWAMP', 'TRANS', 'TRIANG', 'ZIGZAG',
];

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Return n evenly-spaced {x, y} points around a circle.
 * Used to draw a visible circle outline via straight-line segments
 * (renderers that lack native arc support use chord approximation).
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} [n=32]
 * @return {{x: number, y: number}[]}
 */
function circleOutlinePoints(cx, cy, r, n = 32) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 2 * Math.PI;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Draw the hatch pattern reference sheet onto `renderer`.
 *
 * Sets up an identity transform then draws:
 *  - A 5 mm border rectangle
 *  - A "Hatch Pattern Reference" title
 *  - A 10-column grid of all 82 hatch patterns, alternating square and circle
 *    boundaries, with pattern name labels beneath each shape
 *
 * `new Core()` is called internally because Hatch.draw() requires
 * DesignCore.Scene.selectionManager to be present.
 *
 * @param {object} renderer
 */
export function buildHatchGrid(renderer) {
  // Required so that Hatch.draw() can access DesignCore.Scene.selectionManager
  new Core();

  // Identity transform — draw directly in page coordinates (Y-up, 1 unit = 1 pt)
  renderer.setTransform({ a: 1, d: 1, e: 0, f: 0 });

  // Border rectangle inset 5 mm from each edge
  renderer.setColour({ r: 0, g: 0, b: 0 });
  renderer.setLineWidth(1);
  renderer.setDash([], 0);
  renderer.drawShape([
    { x: MARGIN, y: MARGIN },
    { x: PAGE_W - MARGIN, y: MARGIN },
    { x: PAGE_W - MARGIN, y: PAGE_H - MARGIN },
    { x: MARGIN, y: PAGE_H - MARGIN },
  ], { closed: true, stroke: true });

  // Title
  const title = 'Hatch Pattern Reference';
  const titleX = PAGE_W / 2 - Text.getApproximateWidth(title, TITLE_FONT) / 2;
  const titleY = PAGE_H - MARGIN - TITLE_FONT - 2;
  renderer.setColour({ r: 0, g: 0, b: 0 });
  renderer.setLineWidth(0.5);
  renderer.drawText([{ char: title, x: titleX, y: titleY, rotation: 0 }], 'Helvetica', TITLE_FONT);

  // Grid — centred horizontally, starting below the title
  const xGrid = (PAGE_W - COLS * CELL_W) / 2;
  const yGridTop = titleY - TITLE_FONT - 8;

  PATTERNS.forEach((name, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const cellX = xGrid + col * CELL_W;
    const cellYTop = yGridTop - row * CELL_H;

    // Shape centre: 4 pt top padding + SHAPE_R inside the cell
    const cx = cellX + CELL_W / 2;
    const cy = cellYTop - 4 - SHAPE_R;

    // Alternate square (even index) and circle (odd index) boundaries
    let hatchBoundary;
    let outlinePoints;

    if (i % 2 === 0) {
      hatchBoundary = new BasePolyline({ points: [
        new Point(cx - SHAPE_R, cy - SHAPE_R),
        new Point(cx + SHAPE_R, cy - SHAPE_R),
        new Point(cx + SHAPE_R, cy + SHAPE_R),
        new Point(cx - SHAPE_R, cy + SHAPE_R),
      ] });
      outlinePoints = hatchBoundary.toPolylinePoints();
    } else {
      // Two exact semicircle arcs (bulge = 1) for clipping; polygon for visible outline
      hatchBoundary = new BasePolyline({ points: [
        new Point(cx + SHAPE_R, cy, 1),
        new Point(cx - SHAPE_R, cy, 1),
      ] });
      outlinePoints = circleOutlinePoints(cx, cy, SHAPE_R);
    }

    // AR-* patterns have large inter-line spacing; scale down so lines are visible
    const scale = name.startsWith('AR-') ? 0.1 : 1;
    const hatch = new Hatch({ patternName: name, scale });
    hatch.childEntities = [hatchBoundary];
    hatch.buildPatternCache();

    // Draw hatch fill
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(0.25);
    renderer.setDash([], 0);
    hatch.draw(renderer);

    // Draw boundary outline on top
    renderer.setColour({ r: 0, g: 0, b: 0 });
    renderer.setLineWidth(0.5);
    renderer.setDash([], 0);
    renderer.drawShape(outlinePoints, { closed: true, stroke: true });

    // Pattern name label, centred below the shape
    const labelY = cellYTop - 4 - SHAPE_R * 2 - LABEL_FONT - 2;
    const labelX = cellX + (CELL_W - Text.getApproximateWidth(name, LABEL_FONT)) / 2;
    renderer.setColour({ r: 60, g: 60, b: 60 });
    renderer.setLineWidth(0.25);
    renderer.drawText([{ char: name, x: labelX, y: labelY, rotation: 0 }], 'Helvetica', LABEL_FONT);
  });
}
