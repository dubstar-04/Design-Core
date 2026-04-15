import { Matrix } from './matrix.js';
import { Colour } from './colour.js';
import { Point } from '../entities/point.js';
import { Input } from './input.js';
import { Logging } from './logging.js';
import { RendererBase } from './renderers/rendererBase.js';

import { DesignCore } from '../designCore.js';

/** Canvas Class */
export class Canvas {
  #panCursorTimeout;
  #baseCursorState = 'DEFAULT';
  #lastPanCanvasPoint = new Point();
  #renderer = null;

  /** Create Canvas */
  constructor() {
    this.cvs = null;
    this.matrix = new Matrix();

    this.minScaleFactor = 0.05;
    this.maxScaleFactor = 300;

    this.width = 1;
    this.height = 1;

    this.flipped = false;

    this.cursorStates = Input.Cursor;

    this.cursorState = Input.Cursor.DEFAULT;
    this.#baseCursorState = Input.Cursor.DEFAULT;

    // function to call external pain command for the ui
    this.externalPaintCallbackFunction;
    this.externalCursorCallbackFunction;
  }

  /**
   * Get canvas scale
   * @return {number}
   */
  getScale() {
    return this.matrix.getScale();
  }

  /**
   * Set external paint callback
   * This is called when painting is required
   * @param {Object} callback
   */
  setExternalPaintCallbackFunction(callback) {
    // set the callback
    this.externalPaintCallbackFunction = callback;
  }

  /**
   * Set the renderer class to use for entity drawing.
   * Must be called once during UI initialisation before the first paint.
   * @param {Function} RendererClass - CanvasRenderer or CairoRenderer class
   */
  setRenderer(RendererClass) {
    this.#renderer = RendererClass;
  }

  /**
   * Set external cursor callback
   * Called when the cursor state changes.
   * Pass undefined or null to unregister the callback.
   * @param {Function|undefined|null} callback
   */
  setCursorCallbackFunction(callback) {
    this.externalCursorCallbackFunction = callback;
  }

  /**
   * Update the cursor state and notify the UI
   * @param {string} state - one of this.cursorStates
   */
  #setCursor(state) {
    if (this.cursorState === state) return;
    this.cursorState = state;
    this.externalCursorCallbackFunction?.(state);
  }

  /**
   * Set the cursor based on the input types requested by a command prompt.
   * If a cursorHint is provided it is used directly; otherwise the cursor is
   * derived from the cursor property of each type (first non-null wins),
   * falling back to DEFAULT.
   * @param {Array} types - array of Input.Type values
   * @param {string|null} cursorHint - optional override from PromptOptions.cursor
   */
  setCursorForInputTypes(types, cursorHint = null) {
    this.#baseCursorState = cursorHint ??
      types.map((t) => t.cursor).find(Boolean) ??
      Input.Cursor.DEFAULT;
    this.#setCursor(this.#baseCursorState);
  }

  /**
   * Handle mouse movement
   */
  mouseMoved() {
    if (DesignCore.Mouse.buttonTwoDown) {
      this.pan();
      return;
    }

    DesignCore.Scene.inputManager.mouseMoved();
  }

  /**
   * Handle mouse downs
   * @param {number} button
   */
  mouseDown(button) {
    switch (button) {
      case 0: // left button
        this.#lastPanCanvasPoint = DesignCore.Mouse.pointOnCanvas();
        break;
      case 1: // middle button
        this.#lastPanCanvasPoint = DesignCore.Mouse.pointOnCanvas();
        clearTimeout(this.#panCursorTimeout);
        this.#panCursorTimeout = setTimeout(() => this.#setCursor(Input.Cursor.GRABBING), 250);
        break;
      case 2: // right button
        break;
    }

    DesignCore.Scene.inputManager.mouseDown(button);
  };

  /**
   * Handle mouse up
   * @param {number} button
   */
  mouseUp(button) {
    switch (button) {
      case 0: // left button
        break;
      case 1: // middle button
        clearTimeout(this.#panCursorTimeout);
        this.requestPaint();
        this.#setCursor(this.#baseCursorState);
        break;
      case 2: // right button
        break;
    }

    DesignCore.Scene.inputManager.mouseUp(button);
  };

  /**
   * Handle double click
   * @param {number} button
   */
  doubleClick(button) {
    switch (button) {
      case 0: // left button
        break;
      case 1: // middle button
        this.zoomExtents();
        break;
      case 2: // right button
        break;
    }
  };

  /**
   * Pan the canvas
   */
  pan() {
    const current = DesignCore.Mouse.pointOnCanvas();
    const delta = DesignCore.Mouse.transformToScene(current)
        .subtract(DesignCore.Mouse.transformToScene(this.#lastPanCanvasPoint));
    this.#lastPanCanvasPoint = current;
    this.matrix.translate(delta.x, delta.y);
    this.requestPaint();
  }

  /**
   * Handle mouse wheel - Zoom
   * @param {number} delta
   */
  wheel(delta) {
    if (DesignCore.Mouse.buttonTwoDown) return;
    const scale = Math.pow(1 + Math.abs(delta), delta > 0 ? 1 : -1);
    if (scale < 1 && this.getScale() > this.minScaleFactor || scale > 1 && this.getScale() < this.maxScaleFactor) {
      this.zoom(scale);
    }
  };

  /**
   * Zoom the canvas
   * @param {number} scale
   */
  zoom(scale) {
    const zoomPoint = DesignCore.Mouse.pointOnScene();
    this.matrix.scale(scale, scale);
    this.matrix.translate((zoomPoint.x / scale) - zoomPoint.x, (zoomPoint.y / scale) - zoomPoint.y);
    this.requestPaint();
  }

  /**
   * Zoom to a window
   * @param {Point} pt1
   * @param {Point} pt2
   */
  zoomToWindow(pt1, pt2) {
    const xMin = Math.min(pt1.x, pt2.x);
    const yMin = Math.min(pt1.y, pt2.y);
    const xMax = Math.max(pt1.x, pt2.x);
    const yMax = Math.max(pt1.y, pt2.y);

    const width = xMax - xMin;
    const height = yMax - yMin;

    if (width === 0 || height === 0) {
      return;
    }

    const selectionCenter = new Point(xMin + width / 2, yMin + height / 2);
    const screenCenter = new Point(this.width / 2, this.height / 2);
    const translateDelta = DesignCore.Mouse.transformToScene(screenCenter).subtract(selectionCenter);
    const targetScale = Math.min((this.width / width), (this.height / height));
    const scaleDelta = targetScale / this.getScale() * 0.9;

    this.matrix.scale(scaleDelta, scaleDelta);
    this.matrix.translate((selectionCenter.x / scaleDelta) - selectionCenter.x, (selectionCenter.y / scaleDelta) - selectionCenter.y);
    this.matrix.translate(translateDelta.x / scaleDelta, translateDelta.y / scaleDelta);
    this.requestPaint();
  }

  /**
   * Set the zoom to include all scene items
   */
  zoomExtents() {
    const extents = DesignCore.Scene.boundingBox();

    if (extents) {
      this.zoomToWindow(new Point(extents.xMin, extents.yMin), new Point(extents.xMax, extents.yMax));
    }
  }

  /**
   * Request the canvas is painted
   */
  requestPaint() {
    // paint request is passed to an external paint function
    // This function then calls this.paint(), the canvas paint function
    // its done this way because some ui framework create and destroy the context on each paint
    if (this.externalPaintCallbackFunction) {
      this.externalPaintCallbackFunction();
    }
  }

  /**
   * Paint the canvas
   * @param {object} context
   * @param {number} width
   * @param {number} height
   */
  paint(context, width, height) {
    // This paint request is called by an external paint function
    // some ui framework create and destroy the context for every paint
    // context is not persistent and is not available outside this function

    // TODO: Should this be set external to the draw function and only called on resize of canvas?
    this.width = width;
    this.height = height;

    // TODO: Need to consider how to change the height when resizing the window
    // maybe something like translate the difference between the new and old height?
    if (this.flipped === false) {
      this.matrix.translate(0, -this.height);
      this.flipped = true;
    }

    const renderer = new this.#renderer(context);

    // set the transform for the context
    // this will set all the pan and zoom actions
    renderer.setTransform(this.matrix);
    renderer.setBackgroundColour(DesignCore.Settings.canvasbackgroundcolour);

    const pos = new Point();
    const origin = DesignCore.Mouse.transformToScene(pos);
    const scale = this.getScale();

    // Paint the scene background
    renderer.fillBackground(origin, width, height, scale);
    // Paint the grid
    this.paintGrid(renderer);

    const bg = renderer.getBackgroundColour();
    const hoverHaloColour = Colour.blend(DesignCore.Core.settings.accentcolour, bg, 0.5);
    const selectionHaloColour = Colour.blend(DesignCore.Core.settings.accentcolour, bg, 0.25);
    const selectionLineWidthDelta = 5;

    // Paint the primary scene items (layer-visibility filtered).
    // Hovered entity detected inline: renderer draws glow + entity in a single drawShape call.
    this.#paintEntities(
        DesignCore.Scene.entities, renderer, null,
        (entity) => DesignCore.LayerManager.getItemByName(entity.layer)?.isVisible,
        DesignCore.Scene.hoverEntities,
        { colour: hoverHaloColour, lineWidthDelta: selectionLineWidthDelta },
    );

    // Paint the temporary scene items
    this.#paintEntities(DesignCore.Scene.previewEntities, renderer);

    // Paint the selected scene items: single pass — renderer handles glow + entity internally.
    const selectedItems = DesignCore.Scene.selectionManager.selectedItems;
    this.#paintEntities(selectedItems, renderer, { colour: selectionHaloColour, lineWidthDelta: selectionLineWidthDelta });

    // Paint the auxiliary scene items
    // auxiliary items include things like the selection window, snap points etc
    // these items have their own draw routine
    renderer.setHighlight(false);
    const auxCount = DesignCore.Scene.auxiliaryEntities.count();
    for (let l = 0; l < auxCount; l++) {
      renderer.save();
      DesignCore.Scene.auxiliaryEntities.get(l).draw(renderer, scale);
      renderer.restore();
    }
  }

  /**
   * Recursively paint a single entity and any children it returns.
   * Container entities (Insert, BaseDimension) return an array of child items from draw().
   * Leaf entities return undefined. Renderer state is saved/restored around each entity.
   * @param {Object} entity - entity to paint
   * @param {Object} renderer - renderer instance
   * @param {Object|undefined} parent - enclosing insert/dimension for ByBlock colour resolution
   * @param {Object} overrides - rendering overrides passed to setContext
   */
  #paintEntity(entity, renderer, parent, overrides) {
    renderer.save();
    try {
      this.setContext(entity, renderer, parent, overrides);
      const children = entity.draw(renderer);
      if (children) {
        for (const item of children) {
          this.#paintEntity(item, renderer, entity, overrides);
        }
      }
    } catch (err) {
      Logging.instance.warn(`draw failed for entity type '${entity.type}': ${err}`);
    } finally {
      renderer.restore();
    }
  }

  /**
   * Draw a collection of entities, calling setContext before each draw.
   * Supports EntityManager instances (with .count()/.get()) and plain arrays.
   * @param {EntityManager|Array} entities
   * @param {Object} renderer - renderer instance
   * @param {Object|null} [overrides] - optional rendering overrides passed to setContext for all entities
   * @param {Object} [overrides.colour] - highlight glow colour (entity always draws in its natural colour)
   * @param {number} [overrides.lineWidthDelta] - glow extension in pixels (divided by scale); added to renderer highlight delta
   * @param {Function} [filter] - optional predicate; entity is skipped when it returns falsy
   * @param {EntityManager|null} [hoverCollection] - when provided, entities found in this set receive hoverOverrides
   * @param {Object|null} [hoverOverrides] - overrides applied to entities matched in hoverCollection
   */
  #paintEntities(entities, renderer, overrides = null, filter = undefined, hoverCollection = null, hoverOverrides = null) {
    const isManager = typeof entities.count === 'function';
    const count = isManager ? entities.count() : entities.length;
    for (let i = 0; i < count; i++) {
      const entity = isManager ? entities.get(i) : entities[i];
      if (filter && !filter(entity)) continue;
      const isHovered = hoverCollection !== null && hoverCollection.indexOf(entity) !== -1;
      this.#paintEntity(entity, renderer, undefined, isHovered ? hoverOverrides : (overrides ?? {}));
    }
  }

  /**
   * Set the scene context on the renderer before drawing an entity.
   * @param {Object} item - entity to draw
   * @param {Object} renderer - renderer instance
   * @param {Object} [block] - insert or dimension element for the current block, required for colour ByBlock
   * @param {Object} [overrides] - optional rendering overrides
   * @param {Object} [overrides.colour] - overrides all colour resolution (e.g. for halo/glow passes)
   * @param {number} [overrides.lineWidthDelta] - additional width in pixels (divided by scale) added to the entity's line width
   */
  setContext(item, renderer, block = undefined, overrides = {}) {
    const scale = this.getScale();
    let colour = item.getDrawColour();
    const lineType = item.getLineType();
    let lineWidth = item.lineWidth / scale;
    const bg = renderer.getBackgroundColour() ?? { r: 0, g: 0, b: 0 };

    if (block && item.entityColour.aci === 0) {
      colour = block.getDrawColour();
    }
    // ACI 7: white on dark background, black on light background
    if (this.#isAci7(item, block)) {
      colour = (bg.r + bg.g + bg.b) / 3 < 128 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    }

    if (overrides.colour !== undefined) {
      // Highlight pass: overrides.colour is the glow colour only — the entity
      // always draws in its natural resolved colour on the normal pass.
      // lineWidthDelta goes to the highlight delta so the glow extends beyond
      // the entity line; the entity's own lineWidth is unchanged.
      renderer.setHighlight(true, overrides.colour, (overrides.lineWidthDelta ?? 0) / scale);
    } else {
      renderer.setHighlight(false);
      lineWidth += (overrides.lineWidthDelta ?? 0) / scale;
    }

    renderer.setColour(colour);
    renderer.setLineWidth(lineWidth);
    renderer.setDash(lineType.getPattern(scale), 0);
  }

  /**
   * Resolve whether the effective draw colour for an item is ACI 7.
   * Follows ByLayer and ByBlock indirection.
   * @param {Object} item - entity to check
   * @param {Object} [block] - enclosing insert/dimension, or undefined
   * @return {boolean}
   */
  #isAci7(item, block) {
    let colour;
    if (item.entityColour.byBlock && block) {
      colour = block.entityColour.byLayer ?
        DesignCore.LayerManager.getItemByName(block.layer)?.layerColour :
        block.entityColour;
    } else if (item.entityColour.byLayer) {
      colour = DesignCore.LayerManager.getItemByName(item.layer)?.layerColour;
    } else {
      colour = item.entityColour;
    }
    return colour?.aci === 7 && !colour?.isTrueColour;
  }

  /**
   * Paint the background grid
   * @param {object} renderer
   */
  paintGrid(renderer) {
    const scale = this.getScale();

    // TODO: Move grid linewidth to settings?
    let lineWidth = 0.75;

    renderer.setColour(DesignCore.Settings.gridcolour);
    renderer.setLineWidth(lineWidth / scale);
    renderer.setDash([], 0);
    renderer.setHighlight(false);

    const extents = this.getSceneOffset();

    const xgridmin = extents.xmin;
    const xgridmax = extents.xmax;
    const ygridmin = extents.ymin;
    const ygridmax = extents.ymax;

    // Draw major gridlines through origin
    renderer.drawSegments([
      { x1: xgridmin, y1: 0, x2: xgridmax, y2: 0 },
      { x1: 0, y1: 0, x2: 0, y2: ygridmax },
      { x1: 0, y1: 0, x2: 0, y2: ygridmin },
    ], []);

    // only draw the grid if within scale limits
    if (scale < this.minScaleFactor || scale > this.maxScaleFactor) {
      return;
    }

    if (DesignCore.Settings['drawgrid']) {
      // set a feint linewidth for the grid
      lineWidth = lineWidth * 0.25;
      renderer.setLineWidth(lineWidth / scale);

      // Target ~60px between grid lines; snap to nearest 1/2/5 × 10^n interval
      const targetPx = 60;
      const rawInterval = targetPx / scale;
      const mag = Math.pow(10, Math.floor(Math.log10(rawInterval)));
      const norm = rawInterval / mag;
      const gridInterval = mag * (norm < 2 ? 1 : norm < 5 ? 2 : 5);

      const gridSegments = [];

      // Draw positive minor X gridlines
      for (let i = 0; i < xgridmax; i = i + gridInterval) {
        gridSegments.push({ x1: i, y1: ygridmin, x2: i, y2: ygridmax });
      }
      // Draw negative minor X gridlines
      for (let i = 0; i > xgridmin; i = i - gridInterval) {
        gridSegments.push({ x1: i, y1: ygridmin, x2: i, y2: ygridmax });
      }
      // Draw positive minor Y gridlines
      for (let i = 0; i < ygridmax; i = i + gridInterval) {
        gridSegments.push({ x1: xgridmin, y1: i, x2: xgridmax, y2: i });
      }
      // Draw negative minor Y gridlines
      for (let i = 0; i > ygridmin; i = i - gridInterval) {
        gridSegments.push({ x1: xgridmin, y1: i, x2: xgridmax, y2: i });
      }

      renderer.drawSegments(gridSegments, []);
    }
  }

  /**
   * Calculate the scene offset from the canvas size
   * i.e at 1:1 its the same as the canvas
   * @return {number}
   */
  getSceneOffset() {
    // Calculate the scene offset from the canvas size
    // i.e at 1:1 its the same as the canvas
    const width = this.width / this.getScale();
    const height = this.height / this.getScale();

    const xmin = -this.matrix.e / this.getScale();
    const xmax = xmin + width;
    const ymin = -height + this.matrix.f / this.getScale();
    const ymax = ymin + height;

    return {
      xmin: xmin,
      xmax: xmax,
      ymin: ymin,
      ymax: ymax,
    };
  }
}
