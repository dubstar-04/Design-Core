
/**
 *  Mock File class for testing
 */
export class File {
  /**
   * Mock File class constructor
   */
  constructor() {
    this.contents = '';
  }

  /**
   * Mock function to write group code and value
   * @param {number} groupCode
   * @param {any} groupValue
   */
  writeGroupCode(groupCode, groupValue) {
    this.contents = this.contents.concat(`${groupCode}\n${groupValue}\n`);
  }
}

/**
 * Run an async test with a mock inputManager, restoring the original afterwards.
 * @param {object} scene - DesignCore.Scene
 * @param {Array} inputs - sequential values returned by requestInput
 * @param {Function} testFn - async function to run with the mock active
 * @param {object} [options] - optional configuration
 * @param {object} [options.extraMethods] - additional methods to add to the mock inputManager
 * @param {Array} [options.selectedItems] - sequential values returned by entities.get
 */
export async function withMockInput(scene, inputs, testFn, options = {}) {
  const { extraMethods = {}, selectedItems } = options;
  const origInputManager = scene.inputManager;
  let callCount = 0;

  scene.inputManager = {
    requestInput: async () => {
      if (callCount < inputs.length) {
        return inputs[callCount++];
      }
    },
    executeCommand: () => {},
    reset: () => {},
    ...extraMethods,
  };

  let origGetItem;
  if (selectedItems) {
    origGetItem = scene.entities.get;
    let selectedItemsCallCount = 0;
    scene.entities.get = () => {
      return selectedItems[selectedItemsCallCount++];
    };
  }

  try {
    await testFn();
  } finally {
    scene.inputManager = origInputManager;
    if (selectedItems) {
      scene.entities.get = origGetItem;
    }
  }
}

/**
 * A minimal RendererBase-compatible mock for use in unit tests.
 *
 * Tracks colour, line width and dash state so tests can assert on them.
 * Optionally accepts a spy context object; when provided, `save`, `restore`
 * and `applyTransform` delegate to it so tests can verify save/restore
 * balance and transform calls via the context's own spies.
 *
 * @example
 * const renderer = new MockRenderer();
 * entity.draw(renderer);
 * expect(renderer.strokeStyle).toBe('rgb(255,0,0)');
 *
 * @example
 * const ctx = createSpyContext();
 * const renderer = new MockRenderer(ctx);
 * canvas.paint(ctx, 800, 600);
 * expect(ctx.saveDepth).toBe(0); // all saves balanced
 */
export class MockRenderer {
  /**
   * @param {object|null} [ctx=null] - optional spy context to delegate save/restore to
   */
  constructor(ctx = null) {
    this._ctx = ctx;
    this.strokeStyle = '';
    this.fillStyle = '';
    this.lineWidth = 0;
    this.dashPattern = null;
  }

  /** @param {{ r: number, g: number, b: number }} rgb */
  setColour(rgb) {
    this.strokeStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    this.fillStyle = this.strokeStyle;
    if (this._ctx) {
      this._ctx.strokeStyle = this.strokeStyle;
      this._ctx.fillStyle = this.fillStyle;
    }
  }

  /** @param {number} w */
  setLineWidth(w) {
    this.lineWidth = w;
    if (this._ctx) this._ctx.lineWidth = w;
  }

  /** @param {number[]} pattern */
  setDash(pattern) {
    this.dashPattern = pattern;
  }

  /** @param {object} matrix */
  setTransform(matrix) {}

  /** @param {Function} styleTransform */
  setStyle(styleTransform) {
    this._styleTransform = styleTransform;
  }

  /** @param {{ r: number, g: number, b: number }|null} colour */
  setBackgroundColour(colour) {
    this._backgroundColour = colour;
  }

  /** @return {{ r: number, g: number, b: number }|null} */
  /**
   * @return {object|null}
   */
  getBackgroundColour() {
    return this._backgroundColour ?? null;
  }

  /** */
  fillBackground() {}

  /**
   * @param {Array} points
   * @param {object} [options]
   */
  drawShape(points, options) {}

  /**
   * @param {Array} characters
   * @param {string} fontName
   * @param {number} height
   */
  drawText(characters, fontName, height) {}

  /** Save current drawing state. */
  save() {
    if (this._ctx) this._ctx.save();
  }

  /** Restore previously saved drawing state. */
  restore() {
    if (this._ctx) this._ctx.restore();
  }

  /**
   * @param {object} [transform]
   * @param {number} [transform.x=0]
   * @param {number} [transform.y=0]
   */
  applyTransform({ x = 0, y = 0 } = {}) {
    if (this._ctx) this._ctx.translate(x, y);
  }

  /**
   * @param {boolean} [isHighlighted=false]
   * @param {object|null} [colour=null]
   * @param {number} [lineWidthDelta=0]
   */
  setHighlight(isHighlighted = false, colour = null, lineWidthDelta = 0) {
    this.isHighlighted = isHighlighted;
    this.highlightColour = colour;
    this.highlightLineWidthDelta = lineWidthDelta;
  }

  /** @return {number} */
  measureText() {
    return 0;
  }

  /** @return {number} */
  measureCharWidth() {
    return 0;
  }

  /**
   * @param {Array} [segments]
   * @param {Array} [dashes]
   */
  drawSegments(segments, dashes) {}

  /** @param {Array} [points] */
  tracePath(points) {}

  /** Start a new path. */
  beginPath() {}

  /** Stroke the current path. */
  stroke() {}

  /** Close the current path. */
  closePath() {}
}

