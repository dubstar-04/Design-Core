import { RendererBase } from './rendererBase.js';
import { Colours } from '../colours.js';

/**
 * HTML Canvas 2D renderer.
 * Wraps a CanvasRenderingContext2D and implements the RendererBase interface
 * via direct method calls — no Proxy involved.
 */
export class CanvasRenderer extends RendererBase {
  #ctx;

  // Highlight state set by setHighlight()
  #isHighlighted = false;
  #highlightColour = null;
  #highlightLineWidthDelta = 0;

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(ctx) {
    super();
    this.#ctx = ctx;
  }

  // --- Frame setup ---

  /** @inheritdoc */
  setTransform(matrix) {
    this.#ctx.setTransform(matrix);
  }

  /** @inheritdoc */
  fillBackground(origin, width, height, scale) {
    this.#ctx.fillStyle = Colours.rgbToString(this.getBackgroundColour());
    this.#ctx.fillRect(origin.x, origin.y, width / scale, height / scale);
  }

  // --- High-level drawing ---

  /**
   * @inheritdoc
   * @param {Array}  points
   * @param {Object} [options]
   */
  drawShape(points, options = {}) {
    if (points.length === 0) return;

    // Highlight pass: wide stroke in the highlight colour before the normal draw.
    if (this.#isHighlighted && this.#highlightColour) {
      this.#ctx.save();
      const s = Colours.rgbToString(this.#highlightColour);
      this.#ctx.strokeStyle = s;
      this.#ctx.fillStyle = s;
      this.#ctx.lineWidth = this.#ctx.lineWidth + this.#highlightLineWidthDelta;
      this.#ctx.beginPath();
      this.tracePath(points);
      if (options.closed) this.#ctx.closePath();
      this.#ctx.stroke();
      this.#ctx.restore();
    }

    // Normal pass
    this.#ctx.beginPath();
    this.tracePath(points);
    this.#applyFillAndStroke(options);
  }

  /**
   * @inheritdoc
   * @param {Array}  characters
   * @param {string} fontName
   * @param {number} height
   */
  drawText(characters, fontName, height) {
    if (!characters || characters.length === 0) return;

    this.#ctx.font = `${height}pt ${fontName}`;

    // The canvas matrix has d=-1 (Y inverted for scene coordinates).
    // Text glyphs rendered by fillText/strokeText appear upside down in that
    // space. Each character is therefore wrapped in scale(1,-1) to re-flip Y
    // locally, and the rotation is negated to compensate for the flip.
    // upsideDownOffset / backwardsOffset are optional and only set for Text
    // entities with the corresponding DXF flags.

    // Highlight pass
    if (this.#isHighlighted && this.#highlightColour) {
      const s = Colours.rgbToString(this.#highlightColour);
      this.#ctx.save();
      this.#ctx.strokeStyle = s;
      this.#ctx.lineWidth = this.#ctx.lineWidth + this.#highlightLineWidthDelta;
      for (const ch of characters) {
        this.#ctx.save();
        this.#ctx.translate(ch.x, ch.y);
        this.#ctx.scale(1, -1);
        if (ch.rotation) this.#ctx.rotate(-ch.rotation);
        if (ch.upsideDownOffset) {
          this.#ctx.translate(0, -ch.upsideDownOffset); this.#ctx.scale(1, -1);
        }
        if (ch.backwardsOffset) {
          this.#ctx.translate(ch.backwardsOffset, 0); this.#ctx.scale(-1, 1);
        }
        this.#ctx.strokeText(ch.char, 0, 0);
        this.#ctx.restore();
      }
      this.#ctx.restore();
    }

    // Normal pass
    for (const ch of characters) {
      this.#ctx.save();
      this.#ctx.translate(ch.x, ch.y);
      this.#ctx.scale(1, -1);
      if (ch.rotation) this.#ctx.rotate(-ch.rotation);
      if (ch.upsideDownOffset) {
        this.#ctx.translate(0, -ch.upsideDownOffset); this.#ctx.scale(1, -1);
      }
      if (ch.backwardsOffset) {
        this.#ctx.translate(ch.backwardsOffset, 0); this.#ctx.scale(-1, 1);
      }
      this.#ctx.fillText(ch.char, 0, 0);
      this.#ctx.restore();
    }
  }

  /**
   * Trace bulge-encoded points into the current path without starting a new
   * path and without stroking or filling.  Moves to the first point, then
   * traces each segment as a straight line (bulge=0) or an arc (bulge≠0).
   * Multiple tracePath calls accumulate sub-paths for compound operations
   * such as Hatch clipping.
   * @param {Array} points
   */
  tracePath(points) {
    if (points.length === 0) return;
    this.#ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i];
      const next = points[i + 1];
      if (!p.bulge) {
        this.#ctx.lineTo(next.x, next.y);
      } else {
        const center = p.bulgeCentrePoint(next);
        const radius = p.bulgeRadius(next);
        const startAngle = center.angle(p);
        const endAngle = center.angle(next);
        // Canvas arc: CCW = false (default), CW = true (anticlockwise flag inverted)
        this.#ctx.arc(center.x, center.y, radius, startAngle, endAngle, p.bulge < 0);
      }
    }
  }

  // --- Low-level path ---

  /** @inheritdoc */
  drawSegments(segments, dashes = []) {
    if (!segments.length) return;

    // Highlight pass: wide stroke in the highlight colour before the normal draw.
    if (this.#isHighlighted && this.#highlightColour) {
      this.#ctx.save();
      const s = Colours.rgbToString(this.#highlightColour);
      this.#ctx.strokeStyle = s;
      this.#ctx.fillStyle = s;
      this.#ctx.lineWidth = this.#ctx.lineWidth + this.#highlightLineWidthDelta;
      if (!dashes.length) {
        this.#ctx.beginPath();
        for (const seg of segments) {
          this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
        }
        this.#ctx.stroke();
      } else {
        for (const seg of segments) {
          this.#ctx.setLineDash(dashes);
          this.#ctx.lineDashOffset = seg.dashPhase ?? 0;
          this.#ctx.beginPath();
          this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
          this.#ctx.stroke();
        }
      }
      this.#ctx.restore();
    }

    // Normal pass
    if (!dashes.length) {
      this.#ctx.beginPath();
      for (const seg of segments) {
        this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
      }
      this.#ctx.stroke();
    } else {
      for (const seg of segments) {
        this.#ctx.setLineDash(dashes);
        this.#ctx.lineDashOffset = seg.dashPhase ?? 0;
        this.#ctx.beginPath();
        this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
        this.#ctx.stroke();
      }
    }
  }

  /** @inheritdoc */
  beginPath() {
    this.#ctx.beginPath();
  }

  /** @inheritdoc */
  stroke() {
    this.#ctx.stroke();
  }

  /** @inheritdoc */
  closePath() {
    this.#ctx.closePath();
  }

  // --- State ---

  /** @inheritdoc @param {{ r: number, g: number, b: number }} rgb */
  setColour(rgb) {
    const s = Colours.rgbToString(this.applyStyle(rgb));
    this.#ctx.strokeStyle = s;
    this.#ctx.fillStyle = s;
  }

  /** @inheritdoc @param {number} width */
  setLineWidth(width) {
    this.#ctx.lineWidth = width;
  }

  /** @inheritdoc @param {number[]} array @param {number} [offset=0] */
  setDash(array, offset = 0) {
    this.#ctx.setLineDash(array);
    this.#ctx.lineDashOffset = offset;
  }

  /** @inheritdoc @param {boolean} isHighlighted @param {Object} [colour] @param {number} [lineWidthDelta=0] */
  setHighlight(isHighlighted, colour = null, lineWidthDelta = 0) {
    this.#isHighlighted = isHighlighted;
    this.#highlightColour = colour;
    this.#highlightLineWidthDelta = lineWidthDelta;
  }

  // --- Transform ---

  /** @inheritdoc @param {Object} [transform] */
  applyTransform({ x = 0, y = 0, rotation = 0 } = {}) {
    this.#ctx.translate(x, y);
    if (rotation !== 0) this.#ctx.rotate(rotation);
  }

  /** @inheritdoc */
  save() {
    this.#ctx.save();
  }

  /** @inheritdoc */
  restore() {
    this.#ctx.restore();
  }

  // --- Measurement ---

  /** @inheritdoc @param {string} str @param {string} [fontName] @param {number} [height] @return {Object} */
  measureText(str, fontName, height) {
    if (fontName !== undefined && height !== undefined) {
      this.#ctx.font = `${height}pt ${fontName}`;
    }
    return this.#ctx.measureText(str);
  }

  /** @inheritdoc @param {string} character @return {number} */
  measureCharWidth(character) {
    return this.#ctx.measureText(character).width;
  }

  /**
   * Get the current line width from the underlying Canvas context.
   * Retained for backward compatibility with text/arctext hover detection
   * until those entities are migrated to the new renderer interface.
   * @return {number}
   */
  getLineWidth() {
    return this.#ctx.lineWidth;
  }

  // --- Private helpers ---

  /**
   * Apply fill and/or stroke to the current path.
   * Uses fillPreserve equivalent (fill then stroke on same path via beginPath
   * not being called between) when both are requested.
   * @param {Object} options
   */
  #applyFillAndStroke(options) {
    const { closed = false, stroke = true, fill = false, fillRule, clip = false, alpha = 1 } = options;

    if (closed) this.#ctx.closePath();

    if (clip) {
      this.#ctx.clip(fillRule === 'evenodd' ? 'evenodd' : 'nonzero');
      return;
    }

    if (fill) {
      if (alpha !== 1) {
        this.#ctx.save();
        this.#ctx.globalAlpha = alpha;
        this.#ctx.fill(fillRule === 'evenodd' ? 'evenodd' : 'nonzero');
        this.#ctx.restore();
      } else {
        this.#ctx.fill(fillRule === 'evenodd' ? 'evenodd' : 'nonzero');
      }
    }

    if (stroke) this.#ctx.stroke();
  }
}
