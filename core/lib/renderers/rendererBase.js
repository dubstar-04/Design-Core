/**
 * Abstract renderer base class.
 * Defines the interface all render targets must implement.
 *
 * State-setting methods (setColour, setLineWidth, setDash, setHighlight) are
 * called by canvas.js once per entity before entity.draw(renderer) is invoked.
 *
 * High-level drawing methods (drawShape, drawText, tracePath) are called by
 * entity draw() implementations.  Concrete renderers handle backend-specific
 * details such as bulge-to-arc decoding, highlight glow passes, and font size
 * correction.
 *
 * Transform helpers (applyTransform, save, restore) are called by canvas.js
 * when processing container entities (Insert, BaseDimension) that return a
 * child list from draw().
 */
export class RendererBase {
  // --- High-level drawing ---

  /**
   * Draw a shape described by a sequence of bulge-encoded points.
   * Handles the complete path lifecycle: new path, trace segments, stroke/fill.
   * When isHighlighted is set, a glow pass is prepended automatically.
   * @param {Object}   entity           - The entity being drawn (reserved for future caching).
   * @param {Array}    points           - Bulge-encoded Point array.  Each point's .bulge
   *                                     describes the segment to the next point:
   *                                     0 = straight line, +ve = CCW arc, -ve = CW arc.
   * @param {Object}   [options]
   * @param {boolean}  [options.closed=false]   - Call closePath before fill/stroke.
   * @param {boolean}  [options.stroke=true]    - Stroke the path.
   * @param {boolean}  [options.fill=false]     - Fill the path.
   * @param {string}   [options.fillRule]       - 'evenodd' or 'nonzero' (default).
   * @param {boolean}  [options.clip=false]     - Clip to path instead of fill/stroke.
   * @param {number}   [options.alpha=1]        - Fill opacity (0–1). Only applied to fill, not stroke.
   */
  drawShape(entity, points, options = {}) {
    throw new Error(`${this.constructor.name}: drawShape() not implemented`);
  }

  /**
   * Draw an array of positioned characters.
   * When isHighlighted is set, a glow pass is prepended automatically.
   * @param {Object}   entity     - The entity being drawn.
   * @param {Array}    characters - Array of { char, x, y, rotation } descriptors.
   * @param {string}   fontName   - Font family name.
   * @param {number}   height     - Desired text height in scene units.
   */
  drawText(entity, characters, fontName, height) {
    throw new Error(`${this.constructor.name}: drawText() not implemented`);
  }

  /**
   * Trace a path from bulge-encoded points WITHOUT starting a new path and
   * without stroking or filling.  The caller is responsible for starting the
   * path (e.g. via a preceding drawShape or a future beginPath call) so that
   * multiple tracePath calls can build up a compound path — needed by Hatch.
   * @param {Array} points - Bulge-encoded Point array.
   */
  tracePath(points) {
    throw new Error(`${this.constructor.name}: tracePath() not implemented`);
  }

  /**
   * Draw an array of disconnected line segments.
   * When dashes is empty, all segments are batched into a single stroke call.
   * When dashes is non-empty, each segment is stroked individually with its
   * own dash phase so that dash continuity is preserved across clipped boundaries.
   * @param {Array<{x1:number, y1:number, x2:number, y2:number, dashPhase?:number}>} segments
   * @param {number[]} [dashes=[]]
   */
  drawSegments(segments, dashes = []) {
    throw new Error(`${this.constructor.name}: drawSegments() not implemented`);
  }

  // --- Low-level path (used by Hatch compound clip paths) ---

  /** Start a new path, clearing any previous path. */
  beginPath() {
    throw new Error(`${this.constructor.name}: beginPath() not implemented`);
  }

  /** Stroke the current path with the current line style. */
  stroke() {
    throw new Error(`${this.constructor.name}: stroke() not implemented`);
  }

  /** Close the current sub-path by drawing a straight line back to its start point. */
  closePath() {
    throw new Error(`${this.constructor.name}: closePath() not implemented`);
  }

  // --- State (called by canvas.js setContext before each entity.draw()) ---

  /**
   * Set the current drawing colour.
   * @param {{ r: number, g: number, b: number }} rgb
   */
  setColour(rgb) {
    throw new Error(`${this.constructor.name}: setColour() not implemented`);
  }

  /**
   * Set the current line width (already scaled to scene units by canvas.js).
   * @param {number} width
   */
  setLineWidth(width) {
    throw new Error(`${this.constructor.name}: setLineWidth() not implemented`);
  }

  /**
   * Set the current dash pattern.
   * @param {number[]} array
   * @param {number}   [offset=0]
   */
  setDash(array, offset = 0) {
    throw new Error(`${this.constructor.name}: setDash() not implemented`);
  }

  /**
   * Configure the highlight (hover/selection glow) state for subsequent draws.
   * When isHighlighted is true, drawShape and drawText prepend a wide stroke
   * pass in highlightColour before the normal pass.
   * @param {boolean}                  isHighlighted
   * @param {{ r, g, b }|null}         [colour]
   * @param {number}                   [lineWidthDelta=0] - extra width in scene units (pre-scaled by canvas.js).
   */
  setHighlight(isHighlighted, colour = null, lineWidthDelta = 0) {
    throw new Error(`${this.constructor.name}: setHighlight() not implemented`);
  }

  // --- Frame setup (called once per paint by canvas.js) ---

  /**
   * Set the pan/zoom transform matrix on the underlying context.
   * Must be called once at the start of each paint, before any drawing.
   * @param {Matrix} matrix
   */
  setTransform(matrix) {
    throw new Error(`${this.constructor.name}: setTransform() not implemented`);
  }

  /**
   * Paint the scene background rectangle.
   * @param {{ r: number, g: number, b: number }} colour
   * @param {{ x: number, y: number }} origin - scene-space top-left corner
   * @param {number} width  - canvas pixel width
   * @param {number} height - canvas pixel height
   * @param {number} scale  - current scene scale
   */
  fillBackground(colour, origin, width, height, scale) {
    throw new Error(`${this.constructor.name}: fillBackground() not implemented`);
  }

  // --- Transform (called by canvas.js for container entities) ---

  /**
   * Translate and optionally rotate the current graphics state.
   * @param {Object} transform
   * @param {number} [transform.x=0]
   * @param {number} [transform.y=0]
   * @param {number} [transform.rotation=0]
   */
  applyTransform(transform) {
    throw new Error(`${this.constructor.name}: applyTransform() not implemented`);
  }

  /** Save the current graphics state onto the renderer's stack. */
  save() {
    throw new Error(`${this.constructor.name}: save() not implemented`);
  }

  /** Restore the most recently saved graphics state. */
  restore() {
    throw new Error(`${this.constructor.name}: restore() not implemented`);
  }

  // --- Measurement (used by text/arctext rendering) ---

  /**
   * Measure the rendered extent of a string.
   * If fontName and height are supplied the font is set before measuring,
   * so the result reflects the correct face and size.
   * @param {string} str
   * @param {string} [fontName]
   * @param {number} [height]
   */
  measureText(str, fontName, height) {
    throw new Error(`${this.constructor.name}: measureText() not implemented`);
  }

  /**
   * Measure the advance width of a single character.
   * @param {string} character
   */
  measureCharWidth(character) {
    throw new Error(`${this.constructor.name}: measureCharWidth() not implemented`);
  }
}
