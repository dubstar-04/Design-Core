import { RendererBase } from './rendererBase.js';
import { Text } from '../../entities/text.js';

/**
 * Pure-JS PDF renderer.
 * Implements the RendererBase interface by accumulating a PDF content stream
 * in memory.  Call getOutput() to retrieve the complete PDF document as a string.
 *
 * Design notes:
 *  - Zero dependencies: uses only standard PDF operators and string concatenation.
 *  - Uses /Helvetica (standard Type1 font) — no font embedding required.
 *  - Text measurement delegates to Text.getApproximateWidth (Helvetica AFM widths).
 *  - Arc segments are approximated as straight chords (TODO: arc → cubic Bézier).
 *  - No highlight/selection rendering — PDF export shows final drawing geometry only.
 *  - setTransform() is a direct passthrough: the caller (export command) must supply
 *    a PDF-space Matrix with d = +scale (no Y-flip), so no sign adjustment is needed.
 *
 * // Draw a black line from (100, 100) to (400, 400) on an A4 page (595×842 pt):
 * //
 * //   Content stream:
 * //     0 0 0 RG          % stroke colour: black (RGB)
 * //     0 0 0 rg          % fill colour: black (RGB)
 * //     1 w               % line width: 1pt
 * //     1 0 0 1 0 0 cm    % identity CTM (no transform)
 * //     100 100 m         % moveto start point
 * //     400 400 l         % lineto end point
 * //     S                 % stroke path
 * //
 * const r = new PdfRenderer(595, 842);
 * r.setColour({ r: 0, g: 0, b: 0 });
 * r.setLineWidth(1);
 * r.drawShape([{ x: 100, y: 100 }, { x: 400, y: 400 }]);
 * const pdf = r.getOutput();
 */
export class PdfRenderer extends RendererBase {
  #pageWidth;
  #pageHeight;

  /** @type {string[]} */
  #stream = [];

  /**
   * @param {number} pageWidth  - page width in PDF user units (points)
   * @param {number} pageHeight - page height in PDF user units (points)
   */
  constructor(pageWidth, pageHeight) {
    super();
    this.#pageWidth = pageWidth;
    this.#pageHeight = pageHeight;
  }

  // --- Frame setup ---

  /** @inheritdoc */
  setTransform(matrix) {
    // Direct passthrough: the export command supplies a PDF-space matrix with
    // d = +scale (no Y-flip), so no sign adjustment is needed here.
    const { a, d, e, f } = matrix;
    this.#emit(`${this.#fmt(a)} 0 0 ${this.#fmt(d)} ${this.#fmt(e)} ${this.#fmt(f)} cm`);
  }

  /** @inheritdoc */
  fillBackground() {
    // No-op: PDF export does not render a background fill.
  }

  // --- High-level drawing ---

  /** @inheritdoc */
  drawShape(points, options = {}) {
    if (!points.length) return;
    this.tracePath(points);
    this.#applyOptions(options);
  }

  /** @inheritdoc */
  drawText(characters, fontName, height) {
    if (!characters || !characters.length) return;
    for (const ch of characters) {
      const r = ch.rotation ?? 0;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      this.#emit('q');
      // Combined rotate+translate matrix: cos sin -sin cos x y cm.
      // ch.x/ch.y are scene-space coordinates; rotation is CCW positive
      // (no sign compensation needed — global CTM has d = +scale, no Y-flip).
      // TODO: handle ch.upsideDownOffset and ch.backwardsOffset for mirrored text variants.
      this.#emit(`${this.#fmt(cos)} ${this.#fmt(sin)} ${this.#fmt(-sin)} ${this.#fmt(cos)} ${this.#fmt(ch.x)} ${this.#fmt(ch.y)} cm`);
      this.#emit(`BT /F1 ${this.#fmt(height)} Tf 0 0 Td (${this.#escapePdfString(ch.char)}) Tj ET`);
      this.#emit('Q');
    }
  }

  /** @inheritdoc */
  tracePath(points) {
    if (!points.length) return;
    this.#emit(`${this.#fmt(points[0].x)} ${this.#fmt(points[0].y)} m`);
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i];
      const next = points[i + 1];
      if (!p.bulge) {
        this.#emit(`${this.#fmt(next.x)} ${this.#fmt(next.y)} l`);
      } else {
        // TODO: arc → cubic Bézier approximation using p.bulgeCentrePoint / p.bulgeRadius.
        // Emit chord as straight line for now.
        this.#emit(`${this.#fmt(next.x)} ${this.#fmt(next.y)} l`);
      }
    }
  }

  /** @inheritdoc */
  drawSegments(segments, dashes = []) {
    if (!segments.length) return;
    if (!dashes.length) {
      // Solid: batch all segments into a single stroked path.
      for (const seg of segments) {
        this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
      }
      this.#emit('S');
    } else {
      // Dashed: stroke each segment individually to preserve dash phase continuity.
      for (const seg of segments) {
        const dashStr = dashes.map((v) => this.#fmt(v)).join(' ');
        this.#emit(`[${dashStr}] ${this.#fmt(seg.dashPhase ?? 0)} d`);
        this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
        this.#emit('S');
      }
    }
  }

  // --- Low-level path ---

  /** @inheritdoc */
  beginPath() {
    // No-op: PDF paths start implicitly with the first `m` (moveto) operator.
  }

  /** @inheritdoc */
  closePath() {
    this.#emit('h');
  }

  /** @inheritdoc */
  stroke() {
    this.#emit('S');
  }

  // --- State ---

  /** @inheritdoc */
  setColour(rgb) {
    const { r, g, b } = this.applyStyle(rgb);
    const rf = this.#fmt(r / 255);
    const gf = this.#fmt(g / 255);
    const bf = this.#fmt(b / 255);
    this.#emit(`${rf} ${gf} ${bf} RG`);
    this.#emit(`${rf} ${gf} ${bf} rg`);
  }

  /** @inheritdoc */
  setLineWidth(width) {
    this.#emit(`${this.#fmt(width)} w`);
  }

  /** @inheritdoc */
  setDash(array, offset = 0) {
    if (!array.length) {
      this.#emit('[] 0 d');
    } else {
      const vals = array.map((v) => this.#fmt(v)).join(' ');
      this.#emit(`[${vals}] ${this.#fmt(offset)} d`);
    }
  }

  /** @inheritdoc */
  setHighlight() {
    // No-op: PDF export does not render hover/selection highlights.
  }

  // --- Transform ---

  /** @inheritdoc */
  applyTransform({ x = 0, y = 0, rotation = 0 } = {}) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    this.#emit(`${this.#fmt(cos)} ${this.#fmt(sin)} ${this.#fmt(-sin)} ${this.#fmt(cos)} ${this.#fmt(x)} ${this.#fmt(y)} cm`);
  }

  /** @inheritdoc */
  save() {
    this.#emit('q');
  }

  /** @inheritdoc */
  restore() {
    this.#emit('Q');
  }

  // --- Measurement ---

  /** @inheritdoc */
  measureText(str, fontName, height) {
    return { width: Text.getApproximateWidth(str, height) };
  }

  /** @inheritdoc */
  measureCharWidth(character) {
    return Text.getApproximateWidth(character, 1);
  }

  // --- PDF output ---

  /**
   * Serialise the accumulated content stream into a complete PDF document string.
   * Write to disk via `fs.writeFileSync(path, output, 'utf8')` (Node) or
   * `Gio.File.replace_contents(new TextEncoder().encode(output), ...)` (GJS).
   * @return {string}
   */
  getOutput() {
    const contentStream = this.#stream.join('\n');
    const streamBytes = contentStream.length; // ASCII content: char count = byte count

    const objects = [];

    // 1: Catalog
    objects.push('<< /Type /Catalog /Pages 2 0 R >>');

    // 2: Pages
    objects.push('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');

    // 3: Page
    objects.push(`<< /Type /Page /Parent 2 0 R` +
        ` /MediaBox [0 0 ${this.#pageWidth} ${this.#pageHeight}]` +
        ` /Contents 4 0 R` +
        ` /Resources << /Font << /F1 5 0 R >> >> >>`);

    // 4: Content stream
    objects.push(`<< /Length ${streamBytes} >>\nstream\n${contentStream}\nendstream`);

    // 5: Font (Helvetica — standard Type1, always available in PDF readers)
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

    // Assemble body and record xref byte offsets
    let body = '%PDF-1.4\n';
    /** @type {number[]} */
    const offsets = [];
    for (let i = 0; i < objects.length; i++) {
      offsets.push(body.length);
      body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    // Cross-reference table (each entry is exactly 20 bytes: 10+SP+5+SP+1+SP+LF)
    const xrefOffset = body.length;
    let xref = `xref\n0 ${objects.length + 1}\n`;
    xref += '0000000000 65535 f \n';
    for (const offset of offsets) {
      xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }

    const trailer =
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;

    return body + xref + trailer;
  }

  // --- Private helpers ---

  /**
   * Append an operator line to the content stream.
   * @param {string} line
   */
  #emit(line) {
    this.#stream.push(line);
  }

  /**
   * Apply fill/stroke/close operators to the current path based on drawShape options.
   * @param {Object} options
   */
  #applyOptions(options) {
    const { closed = false, stroke = true, fill = false, clip = false } = options;
    if (closed) this.#emit('h');
    if (clip) return; // clip is a screen-only operation; no-op in PDF
    if (fill && stroke) {
      this.#emit('B');
    } else if (fill) {
      this.#emit('f');
    } else if (stroke) {
      this.#emit('S');
    }
  }

  /**
   * Format a number for PDF output.
   * Integers are emitted without a decimal point.
   * Floats are rounded to 4 decimal places with trailing zeros stripped.
   * Non-finite values (NaN, Infinity) emit '0' to prevent invalid PDF.
   * @param {number} n
   * @return {string}
   */
  #fmt(n) {
    if (!Number.isFinite(n)) return '0';
    if (Number.isInteger(n)) return String(n);
    return parseFloat(n.toFixed(4)).toString();
  }

  /**
   * Escape special characters for use inside a PDF string literal ( ... ).
   * @param {string} str
   * @return {string}
   */
  #escapePdfString(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
  }
}
