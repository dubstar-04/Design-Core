import { RendererBase } from './rendererBase.js';
import { Colours } from '../colours.js';

/**
 * GJS Cairo renderer.
 * Wraps a GJS `cairo.Context` and implements the abstract Renderer interface
 * via direct method calls — no Proxy involved.
 *
 * Key Cairo-specific behaviour:
 *   - Bulge segments are decoded to cairo_arc / cairo_arc_negative calls.
 *   - Text highlight: cairo_text_path is not available in the current GNOME SDK
 *     version of GJS, so a highlight/halo is approximated by drawing the text at
 *     8 small offsets (half the current line width in each cardinal + diagonal
 *     direction).
 *   - Font size: Cairo's nominal font size does not match the drawn text height.
 *     drawText() uses a two-pass correction (measure 'A', scale by ratio) to
 *     make the rendered height match the design value.
 */
export class CairoRenderer extends RendererBase {
  #cr;
  #currentRGB = null; // last colour set via setColour(); used for alpha fills

  // Highlight state set by setHighlight()
  #isHighlighted = false;
  #highlightColour = null;
  #highlightLineWidthDelta = 0;

  /**
   * @param {Object} cr - GJS Cairo context
   */
  constructor(cr) {
    super();
    this.#cr = cr;
  }

  // --- Frame setup ---

  /** @inheritdoc */
  setTransform(matrix) {
    this.#cr.translate(matrix.e, matrix.f);
    this.#cr.scale(matrix.a, matrix.d);
  }

  /** @inheritdoc */
  fillBackground(origin, width, height, scale) {
    const rgb = Colours.rgbToScaledRGB(this.getBackgroundColour());
    this.#cr.setSourceRGB(rgb.r, rgb.g, rgb.b);
    const w = width / scale;
    const h = height / scale;
    this.#cr.moveTo(origin.x, origin.y);
    this.#cr.lineTo(origin.x, origin.y + h);
    this.#cr.lineTo(origin.x + w, origin.y + h);
    this.#cr.lineTo(origin.x + w, origin.y);
    this.#cr.lineTo(origin.x, origin.y);
    this.#cr.fill();
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
      this.#cr.save();
      const s = Colours.rgbToScaledRGB(this.#highlightColour);
      this.#cr.setSourceRGB(s.r, s.g, s.b);
      this.#cr.setLineWidth(this.#cr.getLineWidth() + this.#highlightLineWidthDelta);
      this.#cr.newPath();
      this.tracePath(points);
      if (options.closed) this.#cr.closePath();
      this.#cr.stroke();
      this.#cr.restore();
    }

    // Normal pass
    this.#cr.newPath();
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

    this.#applyFontWithCorrection(fontName, height);

    // Same Y-flip logic as CanvasRenderer — Cairo's matrix also has d=-1.
    // scale(1,-1) re-flips Y locally so text renders right side up.
    // Rotation is negated to compensate.

    // Highlight pass: 8-offset halo approximation (cairo_text_path not yet in GJS).
    if (this.#isHighlighted && this.#highlightColour) {
      const s = Colours.rgbToScaledRGB(this.#highlightColour);
      this.#cr.save();
      this.#cr.setSourceRGB(s.r, s.g, s.b);
      for (const ch of characters) {
        this.#cr.save();
        this.#cr.translate(ch.x, ch.y);
        this.#cr.scale(1, -1);
        if (ch.rotation) this.#cr.rotate(-ch.rotation);
        if (ch.upsideDownOffset) {
          this.#cr.translate(0, -ch.upsideDownOffset); this.#cr.scale(1, -1);
        }
        if (ch.backwardsOffset) {
          this.#cr.translate(ch.backwardsOffset, 0); this.#cr.scale(-1, 1);
        }
        this.#cr.moveTo(0, 0); // showText draws at the current point; reset to origin
        this.#drawTextHalo(ch.char);
        this.#cr.restore();
      }
      this.#cr.restore();
    }

    // Normal pass
    for (const ch of characters) {
      this.#cr.save();
      this.#cr.translate(ch.x, ch.y);
      this.#cr.scale(1, -1);
      if (ch.rotation) this.#cr.rotate(-ch.rotation);
      if (ch.upsideDownOffset) {
        this.#cr.translate(0, -ch.upsideDownOffset); this.#cr.scale(1, -1);
      }
      if (ch.backwardsOffset) {
        this.#cr.translate(ch.backwardsOffset, 0); this.#cr.scale(-1, 1);
      }
      this.#cr.moveTo(0, 0); // showText draws at the current point; reset to origin
      this.#cr.showText(ch.char);
      this.#cr.restore();
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
    this.#cr.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i];
      const next = points[i + 1];
      if (!p.bulge) {
        this.#cr.lineTo(next.x, next.y);
      } else {
        const center = p.bulgeCentrePoint(next);
        const radius = p.bulgeRadius(next);
        const startAngle = center.angle(p);
        const endAngle = center.angle(next);
        if (p.bulge > 0) {
          this.#cr.arc(center.x, center.y, radius, startAngle, endAngle);
        } else {
          this.#cr.arcNegative(center.x, center.y, radius, startAngle, endAngle);
        }
      }
    }
  }

  // --- Low-level path ---

  /** @inheritdoc */
  drawSegments(segments, dashes = []) {
    if (!segments.length) return;

    // Highlight pass: wide stroke in the highlight colour before the normal draw.
    if (this.#isHighlighted && this.#highlightColour) {
      this.#cr.save();
      const s = Colours.rgbToScaledRGB(this.#highlightColour);
      this.#cr.setSourceRGB(s.r, s.g, s.b);
      this.#cr.setLineWidth(this.#cr.getLineWidth() + this.#highlightLineWidthDelta);
      if (!dashes.length) {
        this.#cr.newPath();
        for (const seg of segments) {
          this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
        }
        this.#cr.stroke();
      } else {
        for (const seg of segments) {
          this.#cr.setDash(dashes, seg.dashPhase ?? 0);
          this.#cr.newPath();
          this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
          this.#cr.stroke();
        }
      }
      this.#cr.restore();
    }

    // Normal pass
    if (!dashes.length) {
      this.#cr.newPath();
      for (const seg of segments) {
        this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
      }
      this.#cr.stroke();
    } else {
      for (const seg of segments) {
        this.#cr.setDash(dashes, seg.dashPhase ?? 0);
        this.#cr.newPath();
        this.tracePath([{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]);
        this.#cr.stroke();
      }
    }
  }

  /** @inheritdoc */
  beginPath() {
    this.#cr.newPath();
  }

  /** @inheritdoc */
  stroke() {
    this.#cr.stroke();
  }

  /** @inheritdoc */
  closePath() {
    this.#cr.closePath();
  }

  // --- State ---

  /** @inheritdoc @param {{ r: number, g: number, b: number }} rgb */
  setColour(rgb) {
    this.#currentRGB = Colours.rgbToScaledRGB(this.applyStyle(rgb));
    this.#cr.setSourceRGB(this.#currentRGB.r, this.#currentRGB.g, this.#currentRGB.b);
  }

  /** @inheritdoc @param {number} width */
  setLineWidth(width) {
    this.#cr.setLineWidth(width);
  }

  /** @inheritdoc @param {number[]} array @param {number} [offset=0] */
  setDash(array, offset = 0) {
    this.#cr.setDash(array, offset);
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
    this.#cr.translate(x, y);
    if (rotation !== 0) this.#cr.rotate(rotation);
  }

  /** @inheritdoc */
  save() {
    this.#cr.save();
  }

  /** @inheritdoc */
  restore() {
    this.#cr.restore();
  }

  // --- Measurement ---

  /** @inheritdoc @param {string} str @param {string} [fontName] @param {number} [height] @return {Object} */
  measureText(str, fontName, height) {
    if (fontName !== undefined && height !== undefined) {
      this.#applyFontWithCorrection(fontName, height);
    }
    return this.#cr.textExtents(str);
  }

  /** @inheritdoc @param {string} character @return {number} */
  measureCharWidth(character) {
    return this.#cr.textExtents(character).x_advance;
  }

  /**
   * Get the current line width from the underlying Cairo context.
   * Retained for backward compatibility with text/arctext hover detection
   * until those entities are migrated to the new renderer interface.
   * @return {number}
   */
  getLineWidth() {
    return this.#cr.getLineWidth();
  }

  // --- Private helpers ---

  /**
   * Apply fill and/or stroke to the current path.
   * Uses fillPreserve when both fill and stroke are requested so the path
   * is not consumed by the fill() call.
   * Respects the fillRule option for both fill and clip operations.
   * Cairo's fill rule is a persistent state flag; the caller's save/restore
   * (applied by canvas.js around each entity) cleans it up automatically.
   * @param {Object} options
   */
  #applyFillAndStroke(options) {
    const { closed = false, stroke = true, fill = false, fillRule, clip = false, alpha = 1 } = options;

    if (closed) this.#cr.closePath();

    if (clip) {
      if (fillRule === 'evenodd') this.#cr.setFillRule(1); // Cairo.FillRule.EVEN_ODD
      this.#cr.clip();
      return;
    }

    if (fill) {
      if (fillRule === 'evenodd') this.#cr.setFillRule(1);
      if (alpha !== 1 && this.#currentRGB) {
        this.#cr.setSourceRGBA(this.#currentRGB.r, this.#currentRGB.g, this.#currentRGB.b, alpha);
        stroke ? this.#cr.fillPreserve() : this.#cr.fill();
        this.#cr.setSourceRGB(this.#currentRGB.r, this.#currentRGB.g, this.#currentRGB.b);
      } else {
        stroke ? this.#cr.fillPreserve() : this.#cr.fill();
      }
    }

    if (stroke) this.#cr.stroke();
  }

  /**
   * Set the Cairo font face and apply a two-pass size correction so that the
   * rendered glyph height matches the requested scene height.
   * Cairo's nominal font size != actual drawn glyph height, so we measure 'A'
   * at the nominal size and scale accordingly.
   * @param {string} fontName
   * @param {number} height
   */
  #applyFontWithCorrection(fontName, height) {
    this.#cr.selectFontFace(fontName, null, null); // SLANT_NORMAL, WEIGHT_NORMAL
    this.#cr.setFontSize(height);
    const extents = this.#cr.textExtents('A');
    if (extents.height > 0) {
      this.#cr.setFontSize(height * height / extents.height);
    }
  }

  /**
   * Approximate a text highlight halo by drawing the string at 8 small offsets
   * around the origin.  Each offset uses highlightLineWidthDelta (already
   * scaled to scene units) so the glow spread matches the shape glow width.
   * Replace with cr.textPath once GJS ships it.
   * @param {string} str
   */
  #drawTextHalo(str) {
    const d = this.#highlightLineWidthDelta / 2;
    for (const [dx, dy] of [
      [d, 0], [-d, 0], [0, d], [0, -d],
      [d, d], [-d, d], [d, -d], [-d, -d],
    ]) {
      this.#cr.moveTo(dx, dy);
      this.#cr.showText(str);
    }
  }
}

