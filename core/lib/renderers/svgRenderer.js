import { RendererBase } from './rendererBase.js';
import { Text } from '../../entities/text.js';

/**
 * Pure-JS SVG renderer.
 * Implements the RendererBase interface by accumulating SVG elements in memory.
 * Call getOutput() to retrieve a complete SVG document string.
 *
 * Design notes:
 *  - Zero dependencies: uses only standard SVG elements and string concatenation.
 *  - Y-flip: a root <g transform="translate(0,H) scale(1,-1)"> converts scene
 *    Y-up coordinates to SVG Y-down.  All geometry is drawn in scene Y-up space.
 *  - Arc segments use the native SVG A command (not chord approximation).
 *  - Text characters receive a local scale(1,-1) to un-flip the glyph.
 *  - setTransform() is a direct passthrough: the caller must supply a matrix
 *    with d = +scale (no Y-flip), matching the PDF renderer convention.
 *  - setHighlight() is a no-op — SVG export shows final geometry only.
 */
export class SvgRenderer extends RendererBase {
  #pageWidth;
  #pageHeight;

  /** @type {string[]} */
  #elements = [];

  // Current drawing state
  #currentColour = { r: 0, g: 0, b: 0 };
  #currentLineWidth = 1;
  #currentDash = [];
  #currentDashOffset = 0;

  // Low-level path accumulation (used by beginPath / tracePath / stroke / closePath)
  #currentPath = null;


  /**
   * @param {number} pageWidth  - page width in user units (points)
   * @param {number} pageHeight - page height in user units (points)
   */
  constructor(pageWidth, pageHeight) {
    super();
    this.#pageWidth = pageWidth;
    this.#pageHeight = pageHeight;
  }

  // --- Frame setup ---

  /** @inheritdoc */
  setTransform(matrix) {
    const { a, d, e, f } = matrix;
    this.#emit(`<g transform="matrix(${this.#fmt(a)} 0 0 ${this.#fmt(d)} ${this.#fmt(e)} ${this.#fmt(f)})">`);
  }

  /** @inheritdoc */
  fillBackground() {
    // No-op: background colour is set via setBackgroundColour() and emitted in getOutput()
  }

  // --- High-level drawing ---

  /** @inheritdoc */
  drawShape(points, options = {}) {
    if (!points.length) return;
    const pathD = this.#buildPathD(points, options.closed);

    const doStroke = options.stroke !== false;
    const doFill = options.fill === true;
    const doClip = options.clip === true;

    if (doClip) return; // clip is a screen-only operation; no-op in SVG export

    const strokeAttrs = doStroke ?
      `stroke="${this.#colourStr()}" stroke-width="${this.#fmt(this.#currentLineWidth)}"${this.#dashAttrs()}` :
      'stroke="none"';

    let fillAttrs = doFill ? `fill="${this.#colourStr()}"` : 'fill="none"';
    if (doFill && options.fillRule) fillAttrs += ` fill-rule="${options.fillRule}"`;
    if (doFill && options.alpha !== undefined && options.alpha !== 1) {
      fillAttrs += ` fill-opacity="${options.alpha}"`;
    }

    this.#emit(`<path d="${pathD}" ${strokeAttrs} ${fillAttrs}/>`);
  }

  /** @inheritdoc */
  drawText(characters, fontName, height) {
    if (!characters || !characters.length) return;
    const colour = this.#colourStr();
    for (const ch of characters) {
      const deg = (ch.rotation ?? 0) * 180 / Math.PI;
      // translate to position in scene Y-up, then scale(1,-1) to un-flip the glyph
      // (the parent Y-flip group inverts it), then rotate (negated: scale(1,-1) inverts
      // rotation direction so -deg in this context = +ch.rotation CCW in scene).
      // TODO: handle ch.upsideDownOffset and ch.backwardsOffset for mirrored text variants.
      const transform = `translate(${this.#fmt(ch.x)},${this.#fmt(ch.y)}) scale(1,-1) rotate(${this.#fmt(-deg)})`;
      this.#emit(`<text transform="${transform}" font-family="${fontName}" font-size="${this.#fmt(height)}" fill="${colour}" stroke="none">${this.#escapeXml(ch.char)}</text>`);
    }
  }

  /** @inheritdoc */
  tracePath(points) {
    const d = this.#buildPathD(points, false);
    this.#currentPath = this.#currentPath !== null ? `${this.#currentPath} ${d}` : d;
  }

  /** @inheritdoc */
  drawSegments(segments, dashes = []) {
    if (!segments.length) return;
    const colour = this.#colourStr();
    const sw = this.#fmt(this.#currentLineWidth);

    if (!dashes.length) {
      // Solid: batch all segments into one path element
      let d = '';
      for (const seg of segments) {
        d += `M ${this.#fmt(seg.x1)} ${this.#fmt(seg.y1)} L ${this.#fmt(seg.x2)} ${this.#fmt(seg.y2)} `;
      }
      this.#emit(`<path d="${d.trim()}" stroke="${colour}" stroke-width="${sw}" fill="none"/>`);
    } else {
      // Dashed: one path per segment with its own dashPhase to preserve dash continuity
      const dashStr = dashes.map((v) => this.#fmt(v)).join(',');
      for (const seg of segments) {
        const phase = this.#fmt(seg.dashPhase ?? 0);
        this.#emit(`<path d="M ${this.#fmt(seg.x1)} ${this.#fmt(seg.y1)} L ${this.#fmt(seg.x2)} ${this.#fmt(seg.y2)}" stroke="${colour}" stroke-width="${sw}" stroke-dasharray="${dashStr}" stroke-dashoffset="${phase}" fill="none"/>`);
      }
    }
  }

  // --- Low-level path ---

  /** @inheritdoc */
  beginPath() {
    this.#currentPath = null;
  }

  /** @inheritdoc */
  closePath() {
    if (this.#currentPath !== null) this.#currentPath += ' Z';
  }

  /** @inheritdoc */
  stroke() {
    if (this.#currentPath === null) return;
    const colour = this.#colourStr();
    const sw = this.#fmt(this.#currentLineWidth);
    this.#emit(`<path d="${this.#currentPath}" stroke="${colour}" stroke-width="${sw}"${this.#dashAttrs()} fill="none"/>`);
    this.#currentPath = null;
  }

  /** @inheritdoc */
  applyPath(options = {}) {
    if (this.#currentPath === null) return;
    const { stroke = true, fill = false, fillRule, alpha = 1 } = options;
    const strokeAttrs = stroke ?
      `stroke="${this.#colourStr()}" stroke-width="${this.#fmt(this.#currentLineWidth)}"${this.#dashAttrs()}` :
      'stroke="none"';
    let fillAttrs = fill ? `fill="${this.#colourStr()}"` : 'fill="none"';
    if (fill && fillRule) fillAttrs += ` fill-rule="${fillRule}"`;
    if (fill && alpha !== 1) fillAttrs += ` fill-opacity="${this.#fmt(alpha)}"`;
    this.#emit(`<path d="${this.#currentPath}" ${strokeAttrs} ${fillAttrs}/>`);
    this.#currentPath = null;
  }

  // --- State ---

  /** @inheritdoc */
  setColour(rgb) {
    this.#currentColour = this.applyStyle(rgb);
  }

  /** @inheritdoc */
  setLineWidth(width) {
    this.#currentLineWidth = width;
  }

  /** @inheritdoc */
  setDash(array, offset = 0) {
    this.#currentDash = array;
    this.#currentDashOffset = offset;
  }

  /** @inheritdoc */
  setHighlight() {
    // No-op: SVG export does not render hover/selection highlights.
  }

  // --- Transform ---

  /** @inheritdoc */
  applyTransform({ x = 0, y = 0, rotation = 0 } = {}) {
    const deg = rotation * 180 / Math.PI;
    const transform = `translate(${this.#fmt(x)},${this.#fmt(y)}) rotate(${this.#fmt(deg)})`;
    // Retroactively apply the transform to the innermost plain <g> (emitted by save()).
    // This mirrors canvas/cairo semantics where applyTransform modifies the current
    // graphics state rather than opening a new save/restore scope.
    for (let i = this.#elements.length - 1; i >= 0; i--) {
      if (this.#elements[i] === '<g>') {
        this.#elements[i] = `<g transform="${transform}">`;
        return;
      }
    }
    // Fallback: no plain <g> found — open a new one (shouldn't happen in normal usage)
    this.#emit(`<g transform="${transform}">`);
  }

  /** @inheritdoc */
  save() {
    this.#emit('<g>');
  }

  /** @inheritdoc */
  restore() {
    this.#emit('</g>');
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

  // --- SVG output ---

  /**
   * Serialise the accumulated elements into a complete SVG document string.
   * Write to disk via `fs.writeFileSync(path, output, 'utf8')` (Node) or
   * `Gio.File.replace_contents(new TextEncoder().encode(output), ...)` (GJS).
   * @return {string}
   */
  getOutput() {
    // Count unclosed <g> groups in #elements so getOutput() can close them.
    let openGroups = 0;
    for (const el of this.#elements) {
      if (/^<g[\s>]/.test(el)) openGroups++;
      else if (el === '</g>') openGroups--;
    }

    const parts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.#pageWidth}" height="${this.#pageHeight}" viewBox="0 0 ${this.#pageWidth} ${this.#pageHeight}">`,
    ];

    // Background rect emitted before Y-flip group (already in SVG Y-down coords)
    const bg = this.getBackgroundColour();
    if (bg) {
      const { r, g, b } = bg;
      parts.push(`<rect x="0" y="0" width="${this.#pageWidth}" height="${this.#pageHeight}" fill="rgb(${r},${g},${b})" stroke="none"/>`);
    }

    // Y-flip group: converts Y-up scene coordinates to SVG Y-down
    parts.push(`<g transform="translate(0,${this.#pageHeight}) scale(1,-1)">`);
    parts.push(...this.#elements);

    // Close any groups that were opened during drawing but not explicitly closed
    for (let i = 0; i < openGroups; i++) parts.push('</g>');

    parts.push('</g>'); // close Y-flip group
    parts.push('</svg>');

    return parts.join('\n');
  }

  // --- Private helpers ---

  /**
   * Build an SVG path `d` string from bulge-encoded points.
   * Straight segments use L; arc segments use the native A command.
   * @param {Array}   points
   * @param {boolean} [closed=false]
   * @return {string}
   */
  #buildPathD(points, closed = false) {
    if (!points.length) return '';
    let d = `M ${this.#fmt(points[0].x)} ${this.#fmt(points[0].y)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i];
      const next = points[i + 1];
      if (!p.bulge) {
        d += ` L ${this.#fmt(next.x)} ${this.#fmt(next.y)}`;
      } else {
        const radius = p.bulgeRadius(next);
        const largeArc = Math.abs(p.bulge) > 1 ? 1 : 0;
        // Inside the Y-up local coordinate system (Y-flip group):
        // sweep=1 (positive-angle direction = CCW in Y-up) corresponds to bulge > 0.
        const sweep = p.bulge > 0 ? 1 : 0;
        d += ` A ${this.#fmt(radius)} ${this.#fmt(radius)} 0 ${largeArc} ${sweep} ${this.#fmt(next.x)} ${this.#fmt(next.y)}`;
      }
    }
    if (closed) d += ' Z';
    return d;
  }

  /** @return {string} Current colour as an SVG rgb() string. */
  #colourStr() {
    const { r, g, b } = this.#currentColour;
    return `rgb(${r},${g},${b})`;
  }

  /** @return {string} Current dash state as SVG stroke-dasharray/offset attributes, or ''. */
  #dashAttrs() {
    if (!this.#currentDash.length) return '';
    const dashStr = this.#currentDash.map((v) => this.#fmt(v)).join(',');
    return ` stroke-dasharray="${dashStr}" stroke-dashoffset="${this.#fmt(this.#currentDashOffset)}"`;
  }

  /**
   * Format a number for SVG: integers emit as-is; floats use up to 4 decimal
   * places with trailing zeros stripped.
   * @param {number} n
   * @return {string}
   */
  #fmt(n) {
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(4).replace(/\.?0+$/, '');
  }

  /**
   * Escape a string for safe use as SVG text content.
   * @param {string|number} value
   * @return {string}
   */
  #escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
  }

  /**
   * Append a raw string to the element list.
   * @param {string} str
   */
  #emit(str) {
    this.#elements.push(str);
  }
}
