import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { BoundingBox } from '../../core/lib/boundingBox.js';
import { Matrix } from '../../core/lib/matrix.js';
import { Input } from '../../core/lib/input.js';
import { Colour } from '../../core/lib/colour.js';
import { PlotOptions } from '../../core/lib/plotOptions.js';
import { jest } from '@jest/globals';
import { MockRenderer } from '../test-helpers/test-helpers.js';

const core = new Core();
const canvas = core.canvas;

canvas.setRenderer(MockRenderer);

/** Add getProperty(name) to a mock entity so canvas.setContext/isAci7 can read properties. */
function withGetProperty(obj) {
  return { ...obj, getProperty(name) {
    return this[name];
  } };
}

/**
 * Create a mock canvas rendering context for testing
 * @return {object} mock context
 */
function createMockContext() {
  return {
    setTransform: () => {},
    translate: () => {},
    scale: () => {},
    fillStyle: '',
    fillRect: () => {},
    strokeStyle: '',
    lineWidth: 0,
    setLineDash: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
  };
}

test('Test Canvas constructor defaults', () => {
  expect(canvas.cvs).toBeNull();
  expect(canvas.width).toBe(1);
  expect(canvas.height).toBe(1);
  expect(canvas.minScaleFactor).toBe(0.05);
  expect(canvas.maxScaleFactor).toBe(300);
  expect(canvas.flipped).toBe(false);
});

test('Test Canvas.getScale', () => {
  expect(canvas.getScale()).toBe(canvas.matrix.getScale());
});

test('Test Canvas.setExternalPaintCallbackFunction', () => {
  let called = false;
  const callback = () => {
    called = true;
  };
  canvas.setExternalPaintCallbackFunction(callback);
  canvas.requestPaint();
  expect(called).toBe(true);
  canvas.setExternalPaintCallbackFunction(undefined);
});

test('Test Canvas.requestPaint does nothing without callback', () => {
  canvas.setExternalPaintCallbackFunction(undefined);
  expect(() => canvas.requestPaint()).not.toThrow();
});

test('Test Canvas.wheel zooms in', () => {
  const scaleBefore = canvas.getScale();
  canvas.wheel(1);
  expect(canvas.getScale()).toBeGreaterThan(scaleBefore);
});

test('Test Canvas.wheel zooms out', () => {
  const scaleBefore = canvas.getScale();
  canvas.wheel(-1);
  expect(canvas.getScale()).toBeLessThan(scaleBefore);
});

test('Test Canvas.wheel respects min scale limit', () => {
  canvas.matrix = new Matrix();
  // zoom out repeatedly
  for (let i = 0; i < 200; i++) {
    canvas.wheel(-1);
  }
  // scale should stop decreasing near the min limit
  const scaleBefore = canvas.getScale();
  canvas.wheel(-1);
  expect(canvas.getScale()).toBe(scaleBefore);
});

test('Test Canvas.wheel respects max scale limit', () => {
  canvas.matrix = new Matrix();
  // zoom in repeatedly
  for (let i = 0; i < 200; i++) {
    canvas.wheel(1);
  }
  // scale should stop increasing near the max limit
  const scaleBefore = canvas.getScale();
  canvas.wheel(1);
  expect(canvas.getScale()).toBe(scaleBefore);
});

test('Test Canvas.zoomToWindow', () => {
  canvas.matrix = new Matrix();

  canvas.width = 800;
  canvas.height = 600;
  canvas.zoomToWindow(new Point(0, 0), new Point(100, 100));

  const scale = canvas.getScale();
  expect(scale).toBeGreaterThan(1);
});

test('Test Canvas.zoomToWindow with zero-size window', () => {
  const scaleBefore = canvas.getScale();
  canvas.zoomToWindow(new Point(50, 50), new Point(50, 50));
  expect(canvas.getScale()).toBe(scaleBefore);
});

test('Test Canvas.paint sets width and height', () => {
  const context = createMockContext();
  canvas.matrix = new Matrix();
  canvas.flipped = false;
  canvas.paint(context, 1024, 768);
  expect(canvas.width).toBe(1024);
  expect(canvas.height).toBe(768);
  expect(canvas.flipped).toBe(true);
});

test('Test Canvas.paint flips only once', () => {
  const context = createMockContext();
  canvas.flipped = true;
  canvas.paint(context, 1024, 768);
  // matrix should not have additional flip translation
  expect(canvas.flipped).toBe(true);
});

test('Test Canvas.mouseUp calls requestPaint on middle button', () => {
  const paintSpy = jest.spyOn(canvas, 'requestPaint').mockImplementation(() => {});
  try {
    canvas.mouseUp(1);
    expect(paintSpy).toHaveBeenCalled();
  } finally {
    paintSpy.mockRestore();
  }
});

test('Test Canvas.getSceneOffset returns extents', () => {
  canvas.matrix = new Matrix();
  canvas.width = 800;
  canvas.height = 600;
  const offset = canvas.getSceneOffset();
  expect(offset).toHaveProperty('xmin');
  expect(offset).toHaveProperty('xmax');
  expect(offset).toHaveProperty('ymin');
  expect(offset).toHaveProperty('ymax');
  expect(offset.xmax).toBeGreaterThan(offset.xmin);
});

test('Test Canvas.zoomExtents with entities', () => {
  core.scene.addItem('Line', { points: [new Point(0, 0), new Point(500, 500)] });
  canvas.matrix = new Matrix();
  canvas.width = 800;
  canvas.height = 600;
  canvas.flipped = false;
  canvas.zoomExtents();
  expect(canvas.getScale()).not.toBe(1);
});

test('Test Canvas.zoomExtents with no entities', () => {
  const emptyCore = new Core();
  const emptyCanvas = emptyCore.canvas;
  emptyCanvas.matrix = new Matrix();
  const scaleBefore = emptyCanvas.getScale();
  emptyCanvas.zoomExtents();
  expect(emptyCanvas.getScale()).toBe(scaleBefore);
});

const aci7MockEntity = withGetProperty({
  getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
  getLineType: () => ({ getPattern: () => [] }),
  lineWidth: 1,
  entityColour: { aci: 7, byLayer: false, byBlock: false },
});

// An entity with ACI 3 whose draw colour happens to be near-white — NOT ACI 7, should not be recoloured
const nearWhiteMockEntity = withGetProperty({
  getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
  getLineType: () => ({ getPattern: () => [] }),
  lineWidth: 1,
  entityColour: { aci: 3, byLayer: false, byBlock: false },
});

// An entity with a true colour whose aci fell back to 7 (non-ACI-table colour)
const trueColourFallbackAci7MockEntity = withGetProperty({
  getDrawColour: () => ({ r: 200, g: 100, b: 50 }),
  getLineType: () => ({ getPattern: () => [] }),
  lineWidth: 1,
  entityColour: { aci: 7, isTrueColour: true, byLayer: false, byBlock: false },
});

describe('Test Canvas.setContext ACI 7 background-dependent colour', () => {
  let originalBackground;

  beforeEach(() => {
    core.activate();
    originalBackground = core.settings.canvasbackgroundcolour;
  });

  afterEach(() => {
    core.settings.canvasbackgroundcolour = originalBackground;
  });

  test('ACI 7 is white on dark background', () => {
    const renderer = new MockRenderer();
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    canvas.setContext(aci7MockEntity, renderer);
    expect(renderer.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 is black on light background', () => {
    const renderer = new MockRenderer();
    core.settings.canvasbackgroundcolour = { r: 246, g: 245, b: 244 };
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    canvas.setContext(aci7MockEntity, renderer);
    expect(renderer.strokeStyle).toBe('rgb(0, 0, 0)');
  });

  test('non-ACI-7 near-white colour is not recoloured', () => {
    const renderer = new MockRenderer();
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    canvas.setContext(nearWhiteMockEntity, renderer);
    expect(renderer.strokeStyle).toBe('rgb(254, 254, 254)');
  });

  test('true colour with fallback aci=7 is not recoloured', () => {
    const renderer = new MockRenderer();
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    canvas.setContext(trueColourFallbackAci7MockEntity, renderer);
    expect(renderer.strokeStyle).toBe('rgb(200, 100, 50)');
  });

  test('ACI 7 via ByLayer resolves white on dark background', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const renderer = new MockRenderer();
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    const byLayerEntity = withGetProperty({
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 256, byLayer: true, byBlock: false },
      layer: '0',
    });
    canvas.setContext(byLayerEntity, renderer);
    expect(renderer.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 via ByBlock (direct) resolves white on dark background', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const renderer = new MockRenderer();
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    const byBlockItem = withGetProperty({
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 0, byLayer: false, byBlock: true },
    });
    const block = withGetProperty({
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      entityColour: { aci: 7, byLayer: false, byBlock: false },
    });
    canvas.setContext(byBlockItem, renderer, block);
    expect(renderer.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 via ByBlock → ByLayer resolves white on dark background', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const renderer = new MockRenderer();
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    const byBlockItem = withGetProperty({
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 0, byLayer: false, byBlock: true },
    });
    const block = withGetProperty({
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      entityColour: { aci: 256, byLayer: true, byBlock: false },
      layer: '0',
    });
    canvas.setContext(byBlockItem, renderer, block);
    expect(renderer.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 is recoloured in SELECTED state', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const renderer = new MockRenderer();
    renderer.setBackgroundColour(core.settings.canvasbackgroundcolour);
    canvas.setContext(aci7MockEntity, renderer);
    // SELECTED pass uses no special flags — ACI 7 background-adaptive logic still applies
    expect(renderer.strokeStyle).toBe('rgb(255, 255, 255)');
  });
});

describe('Test Canvas.setContext ByBlock colour', () => {
  beforeEach(() => {
    core.activate();
  });

  const byBlockItem = withGetProperty({
    getDrawColour: () => ({ r: 0, g: 0, b: 0 }),
    getLineType: () => ({ getPattern: () => [] }),
    lineWidth: 1,
    entityColour: { aci: 0, byLayer: false, byBlock: true },
  });
  const block = withGetProperty({
    getDrawColour: () => ({ r: 255, g: 0, b: 0 }),
    entityColour: { aci: 1, byLayer: false, byBlock: false },
  });

  test('ByBlock item inherits draw colour from block', () => {
    const renderer = new MockRenderer();
    canvas.setContext(byBlockItem, renderer, block);
    expect(renderer.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(renderer.fillStyle).toBe('rgb(255, 0, 0)');
  });

  test('overrides.colour is the glow colour; ByBlock colour resolution still applies for normal draw', () => {
    const renderer = new MockRenderer();
    canvas.setContext(byBlockItem, renderer, block, { colour: { r: 0, g: 255, b: 0 } });
    // Entity still draws in its ByBlock-resolved colour
    expect(renderer.strokeStyle).toBe('rgb(255, 0, 0)');
    // overrides.colour goes into the highlight glow
    expect(renderer.isHighlighted).toBe(true);
    expect(renderer.highlightColour).toEqual({ r: 0, g: 255, b: 0 });
  });

  test('non-ByBlock item with block keeps its own colour', () => {
    const renderer = new MockRenderer();
    const directItem = withGetProperty({
      getDrawColour: () => ({ r: 0, g: 255, b: 0 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 2, byLayer: false, byBlock: false },
    });
    canvas.setContext(directItem, renderer, block);
    expect(renderer.strokeStyle).toBe('rgb(0, 255, 0)');
  });
});

describe('Test Canvas.setContext paint states', () => {
  const redEntity = withGetProperty({
    getDrawColour: () => ({ r: 255, g: 0, b: 0 }),
    getLineType: () => ({ getPattern: () => [] }),
    lineWidth: 10,
    entityColour: { aci: 1, byLayer: false, byBlock: false },
  });

  beforeEach(() => {
    core.activate();
    canvas.matrix = new Matrix();
  });

  test('default (no flags) uses entity colour and normal lineWidth', () => {
    const renderer = new MockRenderer();
    canvas.setContext(redEntity, renderer);
    expect(renderer.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(renderer.fillStyle).toBe('rgb(255, 0, 0)');
    expect(renderer.lineWidth).toBe(10 / canvas.getScale());
  });

  test('overrides.colour becomes the highlight glow colour; entity draws in its natural colour', () => {
    const renderer = new MockRenderer();
    const haloColour = Colour.blend(core.settings.accentcolour, core.settings.canvasbackgroundcolour, 0.5);
    canvas.setContext(redEntity, renderer, undefined, { colour: haloColour, lineWidthDelta: 4 });
    // Entity always draws in its own colour on the normal pass
    expect(renderer.strokeStyle).toBe('rgb(255, 0, 0)');
    // lineWidthDelta goes to the highlight delta, not to lineWidth
    expect(renderer.lineWidth).toBe(10 / canvas.getScale());
    expect(renderer.isHighlighted).toBe(true);
    expect(renderer.highlightColour).toEqual(haloColour);
    expect(renderer.highlightLineWidthDelta).toBeCloseTo(4 / canvas.getScale());
  });

  test('overrides.colour without lineWidthDelta sets highlight glow; entity draws in its own colour', () => {
    const renderer = new MockRenderer();
    canvas.setContext(redEntity, renderer, undefined, { colour: { r: 0, g: 255, b: 0 } });
    // Entity still draws in its own colour
    expect(renderer.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(renderer.lineWidth).toBe(10 / canvas.getScale());
    expect(renderer.isHighlighted).toBe(true);
    expect(renderer.highlightColour).toEqual({ r: 0, g: 255, b: 0 });
  });

  test('setContext applies line type dash pattern to renderer', () => {
    const renderer = new MockRenderer();
    const dashedEntity = withGetProperty({
      getDrawColour: () => ({ r: 255, g: 0, b: 0 }),
      getLineType: () => ({ getPattern: () => [5, 5] }),
      lineWidth: 1,
      entityColour: { aci: 1, byLayer: false, byBlock: false },
    });
    canvas.setContext(dashedEntity, renderer);
    expect(renderer.dashPattern).toEqual([5, 5]);
  });
});

describe('Test Canvas.zoom', () => {
  beforeEach(() => {
    core.activate();
    canvas.matrix = new Matrix();
    canvas.width = 800;
    canvas.height = 600;
    canvas.flipped = true;
  });

  test('zoom(2) doubles the scale', () => {
    const before = canvas.getScale();
    canvas.zoom(2);
    expect(canvas.getScale()).toBeCloseTo(before * 2, 10);
  });

  test('zoom(0.5) halves the scale', () => {
    const before = canvas.getScale();
    canvas.zoom(0.5);
    expect(canvas.getScale()).toBeCloseTo(before * 0.5, 10);
  });

  test('zoom(1) leaves scale unchanged', () => {
    const before = canvas.getScale();
    canvas.zoom(1);
    expect(canvas.getScale()).toBeCloseTo(before, 10);
  });

  test('zoom keeps the scene point under the cursor fixed (zoom-point invariant)', () => {
    // Position mouse at canvas (400, 300) — centre of the 800×600 viewport
    core.mouse.mouseMoved(400, 300);
    const sceneBefore = core.mouse.pointOnScene();

    canvas.zoom(2);

    // The scene point that was under the cursor should not have moved
    const sceneAfter = core.mouse.pointOnScene();
    expect(sceneAfter.x).toBeCloseTo(sceneBefore.x, 4);
    expect(sceneAfter.y).toBeCloseTo(sceneBefore.y, 4);
  });

  test('zoom-point invariant holds for an off-centre mouse position', () => {
    core.mouse.mouseMoved(200, 150);
    const sceneBefore = core.mouse.pointOnScene();

    canvas.zoom(3);

    const sceneAfter = core.mouse.pointOnScene();
    expect(sceneAfter.x).toBeCloseTo(sceneBefore.x, 4);
    expect(sceneAfter.y).toBeCloseTo(sceneBefore.y, 4);
  });

  test('zoom-point invariant holds when zooming out', () => {
    core.mouse.mouseMoved(600, 450);
    const sceneBefore = core.mouse.pointOnScene();

    canvas.zoom(0.5);

    const sceneAfter = core.mouse.pointOnScene();
    expect(sceneAfter.x).toBeCloseTo(sceneBefore.x, 4);
    expect(sceneAfter.y).toBeCloseTo(sceneBefore.y, 4);
  });

  test('successive zooms compound scale correctly', () => {
    canvas.zoom(2);
    canvas.zoom(3);
    expect(canvas.getScale()).toBeCloseTo(6, 10);
  });
});

test('Test Canvas.doubleClick left and right buttons do not throw', () => {
  expect(() => canvas.doubleClick(0)).not.toThrow();
  expect(() => canvas.doubleClick(2)).not.toThrow();
});

test('Test Canvas.doubleClick middle button triggers zoomExtents', () => {
  const testCore = new Core();
  testCore.activate();
  testCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(500, 500)] });
  testCore.canvas.width = 800;
  testCore.canvas.height = 600;
  testCore.canvas.matrix = new Matrix();
  testCore.canvas.doubleClick(1);
  expect(testCore.canvas.getScale()).not.toBe(1);
});

test('Test Canvas.zoomToWindow with inverted coordinate order', () => {
  core.activate();
  canvas.matrix = new Matrix();
  canvas.width = 800;
  canvas.height = 600;
  // pt1 > pt2 — Math.min/max should handle this the same as normal order
  canvas.zoomToWindow(new Point(100, 100), new Point(0, 0));
  expect(canvas.getScale()).toBeGreaterThan(1);
});

test('Test Canvas.getSceneOffset visible area shrinks when zoomed in', () => {
  core.activate();
  canvas.matrix = new Matrix();
  canvas.width = 800;
  canvas.height = 600;
  const before = canvas.getSceneOffset();
  const widthBefore = before.xmax - before.xmin;
  canvas.zoom(2);
  const after = canvas.getSceneOffset();
  const widthAfter = after.xmax - after.xmin;
  expect(widthAfter).toBeLessThan(widthBefore);
});

describe('Test Canvas cursor states', () => {
  let cursorState;

  beforeEach(() => {
    core.activate();
    canvas.matrix = new Matrix();
    canvas.setCursorForInputTypes([]); // reset to DEFAULT
    cursorState = canvas.cursorStates.DEFAULT;
    canvas.setCursorCallbackFunction((state) => {
      cursorState = state;
    });
  });

  afterEach(() => {
    canvas.setCursorCallbackFunction(undefined);
  });

  test('initial cursorState is DEFAULT', () => {
    expect(canvas.cursorState).toBe(canvas.cursorStates.DEFAULT);
  });

  test('middle mouseDown sets cursor to GRABBING after delay', () => {
    jest.useFakeTimers();
    canvas.mouseDown(1);
    expect(canvas.cursorState).toBe(canvas.cursorStates.DEFAULT); // not yet
    jest.advanceTimersByTime(250);
    expect(cursorState).toBe(canvas.cursorStates.GRABBING);
    expect(canvas.cursorState).toBe(canvas.cursorStates.GRABBING);
    jest.useRealTimers();
  });

  test('double-click on middle button does not flicker cursor to PAN', () => {
    canvas.mouseDown(1);
    canvas.mouseUp(1); // cancel pending PAN timeout
    // cursor should never have changed to PAN
    expect(canvas.cursorState).toBe(canvas.cursorStates.DEFAULT);
  });

  test('middle mouseUp restores cursor to base state (DEFAULT when idle)', () => {
    jest.useFakeTimers();
    canvas.mouseDown(1);
    jest.advanceTimersByTime(250); // let PAN cursor set
    canvas.mouseUp(1);
    expect(cursorState).toBe(canvas.cursorStates.DEFAULT);
    expect(canvas.cursorState).toBe(canvas.cursorStates.DEFAULT);
    jest.useRealTimers();
  });

  test('middle mouseUp restores cursor to SELECTION when selection was active', () => {
    jest.useFakeTimers();
    canvas.setCursorForInputTypes([Input.Type.SELECTIONSET]); // cursor = SELECTION
    canvas.mouseDown(1); // GRABBING (delayed)
    jest.advanceTimersByTime(250);
    canvas.mouseUp(1); // should restore to SELECTION, not DEFAULT
    expect(cursorState).toBe(canvas.cursorStates.SELECTION);
    expect(canvas.cursorState).toBe(canvas.cursorStates.SELECTION);
    jest.useRealTimers();
  });

  test('wheel is ignored while panning (middle button down)', () => {
    jest.useFakeTimers();
    const scaleBefore = canvas.getScale();
    core.mouse.mouseDown(1); // start pan — sets buttonTwoDown
    jest.advanceTimersByTime(250); // let GRABBING cursor set
    canvas.wheel(1); // should be blocked
    expect(canvas.getScale()).toBe(scaleBefore);
    expect(canvas.cursorState).toBe(canvas.cursorStates.GRABBING);
    core.mouse.mouseUp(1);
    jest.useRealTimers();
  });

  test('left and right mouseDown do not change cursor', () => {
    canvas.mouseDown(0);
    expect(cursorState).toBe(canvas.cursorStates.DEFAULT);
    canvas.mouseDown(2);
    expect(cursorState).toBe(canvas.cursorStates.DEFAULT);
  });

  test('callback is not fired when cursor state does not change', () => {
    jest.useFakeTimers();
    let callCount = 0;
    canvas.setCursorCallbackFunction(() => {
      callCount++;
    });
    canvas.mouseDown(1);
    jest.advanceTimersByTime(250); // cursor becomes GRABBING — callCount = 1
    canvas.mouseDown(1);
    jest.advanceTimersByTime(250); // already GRABBING — no-op
    expect(callCount).toBe(1);
    jest.useRealTimers();
  });

  test('setCursorForInputTypes uses cursor hint when provided', () => {
    canvas.setCursorForInputTypes([Input.Type.MOUSEDOWN], canvas.cursorStates.GRAB);
    expect(cursorState).toBe(canvas.cursorStates.GRAB);
    expect(canvas.cursorState).toBe(canvas.cursorStates.GRAB);
  });

  test('setCursorForInputTypes MOUSEDOWN with GRAB hint sets GRAB cursor', () => {
    canvas.setCursorForInputTypes([Input.Type.MOUSEDOWN], canvas.cursorStates.GRAB);
    expect(canvas.cursorState).toBe(canvas.cursorStates.GRAB);
  });

  test('setCursorForInputTypes MOUSEUP with GRABBING hint sets GRABBING cursor', () => {
    canvas.setCursorForInputTypes([Input.Type.MOUSEUP], canvas.cursorStates.GRABBING);
    expect(cursorState).toBe(canvas.cursorStates.GRABBING);
    expect(canvas.cursorState).toBe(canvas.cursorStates.GRABBING);
  });

  test('setCursorForInputTypes sets SELECTION for SelectionSet', () => {
    canvas.setCursorForInputTypes([Input.Type.SELECTIONSET]);
    expect(cursorState).toBe(canvas.cursorStates.SELECTION);
    expect(canvas.cursorState).toBe(canvas.cursorStates.SELECTION);
  });

  test('setCursorForInputTypes sets SELECTION for SingleSelection', () => {
    canvas.setCursorForInputTypes([Input.Type.SINGLESELECTION]);
    expect(cursorState).toBe(canvas.cursorStates.SELECTION);
  });

  test('setCursorForInputTypes sets DEFAULT for Point input', () => {
    canvas.setCursorForInputTypes([Input.Type.SELECTIONSET]); // set to SELECTION first
    canvas.setCursorForInputTypes([Input.Type.POINT]);
    expect(cursorState).toBe(canvas.cursorStates.DEFAULT);
  });

  test('setCursorForInputTypes resets to DEFAULT for empty types', () => {
    canvas.setCursorForInputTypes([Input.Type.SELECTIONSET]);
    canvas.setCursorForInputTypes([]);
    expect(cursorState).toBe(canvas.cursorStates.DEFAULT);
  });

  test('setCursorCallbackFunction can be unregistered with undefined', () => {
    canvas.setCursorForInputTypes([]); // ensure DEFAULT
    let called = false;
    canvas.setCursorCallbackFunction(() => {
      called = true;
    });
    canvas.setCursorForInputTypes([Input.Type.SELECTIONSET]); // fires callback
    expect(called).toBe(true);
    called = false;
    canvas.setCursorCallbackFunction(undefined);
    canvas.setCursorForInputTypes([]); // state changes but callback cleared
    expect(called).toBe(false);
  });

  test('mouseMoved does not throw when not panning', () => {
    expect(() => canvas.mouseMoved()).not.toThrow();
  });
});

// ─── Canvas.pan() ─────────────────────────────────────────────────────────────

describe('Test Canvas.pan', () => {
  beforeEach(() => {
    core.activate();
    canvas.matrix = new Matrix();
    canvas.width = 800;
    canvas.height = 600;
    canvas.flipped = true; // avoid flip side-effect in pan calls
  });

  test('pan translates matrix by the scene-space mouse movement', () => {
    // Simulate a left mouseDown at canvas (100, 300) — sets #lastPanCanvasPoint
    core.mouse.mouseMoved(100, 300);
    canvas.mouseDown(0);

    // Move mouse 50 pixels right, 20 pixels down in canvas space
    core.mouse.mouseMoved(150, 320);
    canvas.pan();

    // At scale=1 the canvas y-axis is inverted relative to scene:
    // canvas dy = +20 → scene dy = -20
    const e = canvas.matrix.e; // x translation
    const f = canvas.matrix.f; // y translation (raw matrix value)
    expect(e).toBeCloseTo(50, 5);
    // Moving the mouse 20 raw pixels down decreases Mouse.y by 20 (y = -raw + height).
    // transformToScene re-inverts, so scene delta.y = +20. matrix.translate(50, 20) → f += 20.
    expect(f).toBeCloseTo(20, 5);
  });

  test('second pan call accumulates correctly (incremental anchor advances)', () => {
    // mouseDown at (0, 0)
    core.mouse.mouseMoved(0, 0);
    canvas.mouseDown(0);

    // First move: +100 x, no y
    core.mouse.mouseMoved(100, 0);
    canvas.pan();

    // Second move: another +100 x — anchor advanced so delta is still +100, not +200
    core.mouse.mouseMoved(200, 0);
    canvas.pan();

    expect(canvas.matrix.e).toBeCloseTo(200, 5);
  });

  test('pan at 2× zoom applies correct scene-space delta', () => {
    canvas.zoom(2);
    const scaledE = canvas.matrix.e;

    core.mouse.mouseMoved(0, 300);
    canvas.mouseDown(0);

    // Move 100 canvas pixels right
    core.mouse.mouseMoved(100, 300);
    canvas.pan();

    // At any zoom level, dragging 100 canvas pixels right always changes matrix.e by 100:
    // scene_delta = 100 / scale, then matrix.translate(scene_delta) multiplies by scale → 100.
    // This gives a consistent 1:1 screen-space pan feel regardless of zoom.
    const deltaE = canvas.matrix.e - scaledE;
    expect(deltaE).toBeCloseTo(100, 4);
  });

  test('pan at 0.5× zoom applies correct scene-space delta', () => {
    canvas.zoom(0.5);
    const scaledE = canvas.matrix.e;

    core.mouse.mouseMoved(0, 300);
    canvas.mouseDown(0);

    // Move 100 canvas pixels right
    core.mouse.mouseMoved(100, 300);
    canvas.pan();

    // Same invariant: canvas_delta/scale * scale = canvas_delta → deltaE = 100.
    const deltaE = canvas.matrix.e - scaledE;
    expect(deltaE).toBeCloseTo(100, 4);
  });

  test('pan with no movement produces no translation', () => {
    core.mouse.mouseMoved(200, 200);
    canvas.mouseDown(0);
    const eBefore = canvas.matrix.e;
    const fBefore = canvas.matrix.f;

    canvas.pan(); // mouse hasn't moved

    expect(canvas.matrix.e).toBeCloseTo(eBefore, 10);
    expect(canvas.matrix.f).toBeCloseTo(fBefore, 10);
  });

  test('middle-button mouseDown also seeds the pan anchor correctly', () => {
    core.mouse.mouseMoved(50, 300);
    canvas.mouseDown(1); // middle button

    core.mouse.mouseMoved(150, 300); // +100 x
    canvas.pan();

    expect(canvas.matrix.e).toBeCloseTo(100, 5);
  });

  test('mouseDownCanvasPoint is not mutated by pan()', () => {
    core.mouse.mouseMoved(100, 300);
    canvas.mouseDown(0);
    const originalX = core.mouse.mouseDownCanvasPoint.x;
    const originalY = core.mouse.mouseDownCanvasPoint.y;

    core.mouse.mouseMoved(200, 400);
    canvas.pan();

    // pan() must not touch Mouse.mouseDownCanvasPoint
    expect(core.mouse.mouseDownCanvasPoint.x).toBe(originalX);
    expect(core.mouse.mouseDownCanvasPoint.y).toBe(originalY);
  });
});

// ─── Canvas.#paintEntity (via paint / previewEntities) ───────────────────────

describe('Test Canvas.#paintEntity', () => {
  /**
   * Create a mock canvas context that records save/restore calls
   * and allows overriding individual methods.
   * @param {Object} [overrides] - properties to merge into the context
   * @return {Object} spy context
   */
  function createSpyContext(overrides = {}) {
    let depth = 0;
    let maxDepth = 0;
    const saveRestoreLog = [];

    const ctx = {
      setTransform: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      fillStyle: '',
      fillRect: () => {},
      strokeStyle: '',
      lineWidth: 0,
      setLineDash: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      save() {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
        saveRestoreLog.push('save');
      },
      restore() {
        depth--;
        saveRestoreLog.push('restore');
      },
      get saveDepth() {
        return depth;
      },
      get maxSaveDepth() {
        return maxDepth;
      },
      get saveRestoreLog() {
        return saveRestoreLog;
      },
      ...overrides,
    };
    return ctx;
  }

  /**
   * Minimal mock entity that behaves as a leaf (draw returns undefined)
   * @param {Object} [colour] - draw colour
   * @return {Object} mock leaf entity
   */
  function makeLeaf(colour = { r: 255, g: 0, b: 0 }) {
    return withGetProperty({
      getDrawColour: () => colour,
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 1, byLayer: false, byBlock: false },
      draw: jest.fn(() => undefined),
    });
  }

  /**
   * Mock entity whose draw() applies a translate and returns an array of children
   * @param {Array} children
   * @return {Object} mock container entity
   */
  function makeContainer(children) {
    return withGetProperty({
      getDrawColour: () => ({ r: 0, g: 255, b: 0 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 2, byLayer: false, byBlock: false },
      draw: jest.fn((ctx) => {
        ctx.applyTransform({ x: 10, y: 10 });
        return children;
      }),
    });
  }

  let paintCore;
  let paintCanvas;

  beforeEach(() => {
    paintCore = new Core();
    paintCore.activate();
    paintCanvas = paintCore.canvas;
    paintCanvas.setRenderer(MockRenderer);
    paintCanvas.matrix = new Matrix();
    paintCanvas.flipped = true; // skip the one-time flip inside paint()
    paintCanvas.width = 800;
    paintCanvas.height = 600;
  });

  afterEach(() => {
    paintCore.scene.previewEntities.clear();
  });

  test('leaf entity: draw() is called once', () => {
    const leaf = makeLeaf();
    paintCore.scene.previewEntities.add(leaf);

    paintCanvas.paint(createSpyContext(), 800, 600);

    expect(leaf.draw).toHaveBeenCalledTimes(1);
  });

  test('leaf entity: save/restore wrap the draw() call', () => {
    const leaf = makeLeaf();
    paintCore.scene.previewEntities.add(leaf);

    const ctx = createSpyContext();
    paintCanvas.paint(ctx, 800, 600);

    // save and restore are balanced
    const saves = ctx.saveRestoreLog.filter((e) => e === 'save').length;
    const restores = ctx.saveRestoreLog.filter((e) => e === 'restore').length;
    expect(saves).toBe(restores);
    // Entity save appears before entity restore
    const firstEntitySave = ctx.saveRestoreLog.indexOf('save');
    const lastEntityRestore = ctx.saveRestoreLog.lastIndexOf('restore');
    expect(firstEntitySave).toBeLessThan(lastEntityRestore);
  });

  test('container entity: children draw() are each called once', () => {
    const child1 = makeLeaf({ r: 255, g: 0, b: 0 });
    const child2 = makeLeaf({ r: 0, g: 0, b: 255 });
    const container = makeContainer([child1, child2]);
    paintCore.scene.previewEntities.add(container);

    paintCanvas.paint(createSpyContext(), 800, 600);

    expect(container.draw).toHaveBeenCalledTimes(1);
    expect(child1.draw).toHaveBeenCalledTimes(1);
    expect(child2.draw).toHaveBeenCalledTimes(1);
  });

  test('container entity: save/restore are balanced including children', () => {
    const child = makeLeaf();
    const container = makeContainer([child]);
    paintCore.scene.previewEntities.add(container);

    const ctx = createSpyContext();
    paintCanvas.paint(ctx, 800, 600);

    const saves = ctx.saveRestoreLog.filter((e) => e === 'save').length;
    const restores = ctx.saveRestoreLog.filter((e) => e === 'restore').length;
    expect(saves).toBe(restores);
  });

  test('container with empty items array: no child draws occur', () => {
    const container = makeContainer([]);
    paintCore.scene.previewEntities.add(container);

    paintCanvas.paint(createSpyContext(), 800, 600);

    expect(container.draw).toHaveBeenCalledTimes(1);
  });

  test('overrides.colour sets highlight glow; leaf entity draws in its natural colour', () => {
    const leaf = makeLeaf({ r: 255, g: 0, b: 0 });
    const renderer = new MockRenderer();
    paintCanvas.setContext(leaf, renderer, undefined, { colour: { r: 0, g: 0, b: 255 } });
    // Entity draws in its natural colour, not the override
    expect(renderer.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(renderer.isHighlighted).toBe(true);
    expect(renderer.highlightColour).toEqual({ r: 0, g: 0, b: 255 });
  });

  test('overrides.colour sets highlight glow for children of a container', () => {
    const child = makeLeaf({ r: 255, g: 0, b: 0 });
    const overrideColour = { r: 0, g: 255, b: 0 };
    const renderer = new MockRenderer();

    // setContext is called for the child — verify the highlight glow colour flows through
    // and the entity draws in its own natural colour
    paintCanvas.setContext(child, renderer, undefined, { colour: overrideColour });
    expect(renderer.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(renderer.isHighlighted).toBe(true);
    expect(renderer.highlightColour).toEqual(overrideColour);
  });

  test('deeply nested container: all descendants have draw() called', () => {
    const grandchild = makeLeaf();
    const child = makeContainer([grandchild]);
    const root = makeContainer([child]);
    paintCore.scene.previewEntities.add(root);

    paintCanvas.paint(createSpyContext(), 800, 600);

    expect(root.draw).toHaveBeenCalledTimes(1);
    expect(child.draw).toHaveBeenCalledTimes(1);
    expect(grandchild.draw).toHaveBeenCalledTimes(1);
  });

  test('multiple leaf entities each get save/restore', () => {
    const leaf1 = makeLeaf();
    const leaf2 = makeLeaf();
    paintCore.scene.previewEntities.add(leaf1);
    paintCore.scene.previewEntities.add(leaf2);

    const ctx = createSpyContext();
    paintCanvas.paint(ctx, 800, 600);

    expect(leaf1.draw).toHaveBeenCalledTimes(1);
    expect(leaf2.draw).toHaveBeenCalledTimes(1);
    const saves = ctx.saveRestoreLog.filter((e) => e === 'save').length;
    const restores = ctx.saveRestoreLog.filter((e) => e === 'restore').length;
    expect(saves).toBe(restores);
  });

  test('restore() is called even when draw() throws', () => {
    const throwing = withGetProperty({
      getDrawColour: () => ({ r: 255, g: 0, b: 0 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 1, byLayer: false, byBlock: false },
      draw: jest.fn(() => {
        throw new Error('draw failure');
      }),
    });
    paintCore.scene.previewEntities.add(throwing);

    const ctx = createSpyContext();
    // broken entities are caught and logged — paint() must not throw
    expect(() => paintCanvas.paint(ctx, 800, 600)).not.toThrow();

    const saves = ctx.saveRestoreLog.filter((e) => e === 'save').length;
    const restores = ctx.saveRestoreLog.filter((e) => e === 'restore').length;
    expect(saves).toBe(restores);
  });
});

// ─── Canvas.buildExportMatrix ─────────────────────────────────────────────────

/**
 * Helper: create a BoundingBox from plain coordinates.
 * @param {number} xMin
 * @param {number} yMin
 * @param {number} xMax
 * @param {number} yMax
 * @return {BoundingBox}
 */
function makeBBox(xMin, yMin, xMax, yMax) {
  return new BoundingBox(new Point(xMin, yMin), new Point(xMax, yMax));
}

describe('Canvas.buildExportMatrix', () => {
  beforeEach(() => {
    core.activate();
    canvas.matrix = new Matrix();
  });

  test('returns null when scene width is zero', () => {
    const area = makeBBox(100, 0, 100, 200);
    expect(canvas.buildExportMatrix({ area, pageWidth: 595, pageHeight: 842 })).toBeNull();
  });

  test('returns null when scene height is zero', () => {
    const area = makeBBox(0, 50, 200, 50);
    expect(canvas.buildExportMatrix({ area, pageWidth: 595, pageHeight: 842 })).toBeNull();
  });

  test('a and d equal the computed scale (no Y-flip)', () => {
    const area = makeBBox(0, 0, 100, 100);
    const m = canvas.buildExportMatrix({ area, pageWidth: 595, pageHeight: 842 });
    expect(m.a).toBe(m.d);
    expect(m.a).toBeGreaterThan(0);
  });

  test('fit scale is limited by the narrower page axis', () => {
    // 200-wide × 100-tall scene on portrait A4 (595 × 842) with default margin 40
    // usable = 515 × 762; limiting axis = width → scale = 515/200 = 2.575
    const area = makeBBox(0, 0, 200, 100);
    const m = canvas.buildExportMatrix({ area, pageWidth: 595, pageHeight: 842 });
    expect(m.a).toBeCloseTo(515 / 200, 5);
  });

  test('explicit plotScale overrides fit calculation', () => {
    const area = makeBBox(0, 0, 100, 100);
    const m = canvas.buildExportMatrix({ area, pageWidth: 595, pageHeight: 842, plotScale: 2 });
    expect(m.a).toBe(2);
    expect(m.d).toBe(2);
  });

  test('scene origin (0,0) is centred on the page when area is square and page is square', () => {
    // 100×100 scene on 300×300 page, margin 0 → scale = 3, translateX = (300 - 300)/2 = 0
    const area = makeBBox(0, 0, 100, 100);
    const m = canvas.buildExportMatrix({ area, pageWidth: 300, pageHeight: 300, margin: 0 });
    expect(m.e).toBeCloseTo(0, 5);
    expect(m.f).toBeCloseTo(0, 5);
  });

  test('non-zero scene origin is properly offset', () => {
    // Scene from (50,50) to (150,150) on 300×300 page, no margin
    // scale = 3, translateX = (300 - 100*3)/2 - 50*3 = 0 - 150 = -150
    const area = makeBBox(50, 50, 150, 150);
    const m = canvas.buildExportMatrix({ area, pageWidth: 300, pageHeight: 300, margin: 0 });
    expect(m.e).toBeCloseTo(-150, 5);
    expect(m.f).toBeCloseTo(-150, 5);
  });

  test('custom margin is respected', () => {
    // 100×100 scene on 300×300 page, margin 50 → usable = 200×200, scale = 2
    const area = makeBBox(0, 0, 100, 100);
    const m = canvas.buildExportMatrix({ area, pageWidth: 300, pageHeight: 300, margin: 50 });
    expect(m.a).toBeCloseTo(2, 5);
    // translateX = 50 + (200 - 100*2)/2 - 0 = 50 + 0 = 50
    expect(m.e).toBeCloseTo(50, 5);
    expect(m.f).toBeCloseTo(50, 5);
  });
});

// ─── Canvas.exportTo ──────────────────────────────────────────────────────────

describe('Canvas.exportTo', () => {
  let exportCore;
  let exportCanvas;
  let renderer;

  beforeEach(() => {
    exportCore = new Core();
    exportCore.activate();
    exportCanvas = exportCore.canvas;
    exportCanvas.matrix = new Matrix();
    exportCanvas.width = 800;
    exportCanvas.height = 600;
    exportCanvas.flipped = true;
    renderer = new MockRenderer();
  });

  test('returns false when scene has no entities (no bounding box)', () => {
    const options = new PlotOptions(595, 842);
    // Empty scene → Scene.boundingBox() returns null/undefined
    expect(exportCanvas.exportTo(renderer, options)).toBe(false);
  });

  test('returns true when scene has entities', () => {
    exportCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(100, 100)] });
    const options = new PlotOptions(595, 842);
    expect(exportCanvas.exportTo(renderer, options)).toBe(true);
  });

  test('calls renderer.setTransform with a valid matrix', () => {
    exportCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(100, 100)] });
    let receivedMatrix;
    renderer.setTransform = (m) => {
      receivedMatrix = m;
    };
    const options = new PlotOptions(595, 842);
    exportCanvas.exportTo(renderer, options);
    expect(receivedMatrix).toBeDefined();
    expect(receivedMatrix.a).toBeGreaterThan(0);
    expect(receivedMatrix.d).toBeGreaterThan(0);
  });

  test('calls renderer.setBackgroundColour with white', () => {
    exportCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(100, 100)] });
    let bgColour;
    renderer.setBackgroundColour = (c) => {
      bgColour = c;
    };
    const options = new PlotOptions(595, 842);
    exportCanvas.exportTo(renderer, options);
    expect(bgColour).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('calls renderer.setStyle with the plotOptions style', () => {
    exportCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(100, 100)] });
    const options = new PlotOptions(595, 842);
    const spyCalls = [];
    renderer.setStyle = (fn) => {
      spyCalls.push(fn);
    };
    exportCanvas.exportTo(renderer, options);
    expect(spyCalls).toHaveLength(1);
  });

  test('EXTENTS uses Scene.boundingBox regardless of viewport', () => {
    exportCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(500, 500)] });
    // Pan far away so viewport does not contain the entity
    exportCanvas.matrix.translate(-10000, -10000);
    let receivedMatrix;
    renderer.setTransform = (m) => {
      receivedMatrix = m;
    };
    const options = new PlotOptions(595, 842);
    options.setOption('plotArea', PlotOptions.Area.EXTENTS);
    exportCanvas.exportTo(renderer, options);
    // Should have produced a valid matrix mapping the entity extents onto the page
    expect(receivedMatrix).toBeDefined();
    expect(receivedMatrix.a).toBeGreaterThan(0);
  });

  test('DISPLAY uses current viewport instead of entity extents', () => {
    exportCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(500, 500)] });
    let extentsMatrix;
    let displayMatrix;

    // Capture extents-mode matrix
    renderer.setTransform = (m) => {
      extentsMatrix = { ...m };
    };
    const extentsOptions = new PlotOptions(595, 842);
    extentsOptions.setOption('plotArea', PlotOptions.Area.EXTENTS);
    exportCanvas.exportTo(renderer, extentsOptions);

    // Zoom in to a small region so viewport differs from extents
    exportCanvas.zoom(10);

    renderer.setTransform = (m) => {
      displayMatrix = { ...m };
    };
    const displayOptions = new PlotOptions(595, 842);
    displayOptions.setOption('plotArea', PlotOptions.Area.DISPLAY);
    exportCanvas.exportTo(renderer, displayOptions);

    // Display scale will be larger (more zoomed in region mapped to same page)
    expect(displayMatrix.a).not.toBeCloseTo(extentsMatrix.a, 3);
  });

  test('explicit plotScale is forwarded to buildExportMatrix', () => {
    exportCore.scene.addItem('Line', { points: [new Point(0, 0), new Point(100, 100)] });
    let receivedMatrix;
    renderer.setTransform = (m) => {
      receivedMatrix = m;
    };
    const options = new PlotOptions(595, 842);
    options.setOption('plotScale', 0.5);
    exportCanvas.exportTo(renderer, options);
    expect(receivedMatrix.a).toBeCloseTo(0.5, 5);
  });
});
