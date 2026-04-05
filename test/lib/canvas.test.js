import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Matrix } from '../../core/lib/matrix.js';
import { Input } from '../../core/lib/input.js';
import { jest } from '@jest/globals';

const core = new Core();
const canvas = core.canvas;

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
  expect(canvas.panDelta).toBeDefined();
  expect(canvas.lastDelta).toBeDefined();
});

test('Test Canvas.getScale', () => {
  expect(canvas.getScale()).toBe(canvas.matrix.getScale());
});

test('Test Canvas.paintStates', () => {
  expect(canvas.paintStates.ENTITIES).toBe('ENTITIES');
  expect(canvas.paintStates.TEMPORARY).toBe('TEMPORARY');
  expect(canvas.paintStates.SELECTED).toBe('SELECTED');
  expect(canvas.paintStates.AUXILLARY).toBe('AUXILLARY');
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

test('Test Canvas.mouseUp resets pan state on middle button', () => {
  canvas.lastDelta = new Point(50, 50);
  canvas.mouseUp(1);
  expect(canvas.lastDelta.x).toBe(0);
  expect(canvas.lastDelta.y).toBe(0);
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

const aci7MockEntity = {
  getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
  getLineType: () => ({ getPattern: () => [] }),
  lineWidth: 1,
  entityColour: { aci: 7, byLayer: false, byBlock: false },
};

// An entity with a user-set true colour that happens to be {254,254,254} but is NOT ACI 7
const nearWhiteMockEntity = {
  getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
  getLineType: () => ({ getPattern: () => [] }),
  lineWidth: 1,
  entityColour: { aci: 3, byLayer: false, byBlock: false },
};

// An entity with a true colour whose aci fell back to 7 (non-ACI-table colour)
const trueColourFallbackAci7MockEntity = {
  getDrawColour: () => ({ r: 200, g: 100, b: 50 }),
  getLineType: () => ({ getPattern: () => [] }),
  lineWidth: 1,
  entityColour: { aci: 7, isTrueColour: true, byLayer: false, byBlock: false },
};

describe('Test Canvas.setContext ACI 7 background-dependent colour', () => {
  let originalBackground;

  beforeEach(() => {
    core.activate();
    originalBackground = core.settings.canvasbackgroundcolour;
    canvas.paintState = canvas.paintStates.ENTITIES;
  });

  afterEach(() => {
    core.settings.canvasbackgroundcolour = originalBackground;
  });

  test('ACI 7 is white on dark background', () => {
    const context = createMockContext();
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    canvas.setContext(aci7MockEntity, context);
    expect(context.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 is black on light background', () => {
    const context = createMockContext();
    core.settings.canvasbackgroundcolour = { r: 246, g: 245, b: 244 };
    canvas.setContext(aci7MockEntity, context);
    expect(context.strokeStyle).toBe('rgb(0, 0, 0)');
  });

  test('non-ACI-7 near-white colour is not recoloured', () => {
    const context = createMockContext();
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    canvas.setContext(nearWhiteMockEntity, context);
    expect(context.strokeStyle).toBe('rgb(254, 254, 254)');
  });

  test('true colour with fallback aci=7 is not recoloured', () => {
    const context = createMockContext();
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    canvas.setContext(trueColourFallbackAci7MockEntity, context);
    expect(context.strokeStyle).toBe('rgb(200, 100, 50)');
  });

  test('ACI 7 via ByLayer resolves white on dark background', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const context = createMockContext();
    const byLayerEntity = {
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 256, byLayer: true, byBlock: false },
      layer: '0',
    };
    canvas.setContext(byLayerEntity, context);
    expect(context.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 via ByBlock (direct) resolves white on dark background', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const context = createMockContext();
    const byBlockItem = {
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 0, byLayer: false, byBlock: true },
    };
    const block = {
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      entityColour: { aci: 7, byLayer: false, byBlock: false },
    };
    canvas.setContext(byBlockItem, context, block);
    expect(context.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 via ByBlock → ByLayer resolves white on dark background', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const context = createMockContext();
    const byBlockItem = {
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 0, byLayer: false, byBlock: true },
    };
    const block = {
      getDrawColour: () => ({ r: 254, g: 254, b: 254 }),
      entityColour: { aci: 256, byLayer: true, byBlock: false },
      layer: '0',
    };
    canvas.setContext(byBlockItem, context, block);
    expect(context.strokeStyle).toBe('rgb(255, 255, 255)');
  });

  test('ACI 7 is not recoloured in SELECTED state', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const context = createMockContext();
    canvas.paintState = canvas.paintStates.SELECTED;
    canvas.setContext(aci7MockEntity, context);
    const sel = core.settings.selecteditemscolour;
    expect(context.strokeStyle).toBe(`rgb(${sel.r}, ${sel.g}, ${sel.b})`);
  });
});

describe('Test Canvas.setContext ByBlock colour', () => {
  beforeEach(() => {
    core.activate();
    canvas.paintState = canvas.paintStates.ENTITIES;
  });

  const byBlockItem = {
    getDrawColour: () => ({ r: 0, g: 0, b: 0 }),
    getLineType: () => ({ getPattern: () => [] }),
    lineWidth: 1,
    entityColour: { aci: 0, byLayer: false, byBlock: true },
  };
  const block = {
    getDrawColour: () => ({ r: 255, g: 0, b: 0 }),
    entityColour: { aci: 1, byLayer: false, byBlock: false },
  };

  test('ByBlock item inherits draw colour from block', () => {
    const context = createMockContext();
    canvas.setContext(byBlockItem, context, block);
    expect(context.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(context.fillStyle).toBe('rgb(255, 0, 0)');
  });

  test('ByBlock colour is not applied in SELECTED state', () => {
    const context = createMockContext();
    canvas.paintState = canvas.paintStates.SELECTED;
    canvas.setContext(byBlockItem, context, block);
    const sel = core.settings.selecteditemscolour;
    expect(context.strokeStyle).toBe(`rgb(${sel.r}, ${sel.g}, ${sel.b})`);
  });

  test('non-ByBlock item with block keeps its own colour', () => {
    const context = createMockContext();
    const directItem = {
      getDrawColour: () => ({ r: 0, g: 255, b: 0 }),
      getLineType: () => ({ getPattern: () => [] }),
      lineWidth: 1,
      entityColour: { aci: 2, byLayer: false, byBlock: false },
    };
    canvas.setContext(directItem, context, block);
    expect(context.strokeStyle).toBe('rgb(0, 255, 0)');
  });
});

describe('Test Canvas.setContext paint states', () => {
  const redEntity = {
    getDrawColour: () => ({ r: 255, g: 0, b: 0 }),
    getLineType: () => ({ getPattern: () => [] }),
    lineWidth: 10,
    entityColour: { aci: 1, byLayer: false, byBlock: false },
  };

  beforeEach(() => {
    core.activate();
    canvas.matrix = new Matrix();
  });

  test('ENTITIES state uses entity colour and normal lineWidth', () => {
    const context = createMockContext();
    canvas.paintState = canvas.paintStates.ENTITIES;
    canvas.setContext(redEntity, context);
    expect(context.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(context.fillStyle).toBe('rgb(255, 0, 0)');
    expect(context.lineWidth).toBe(10 / canvas.getScale());
  });

  test('SELECTED state overrides colour with selecteditemscolour and doubles lineWidth', () => {
    const context = createMockContext();
    canvas.paintState = canvas.paintStates.SELECTED;
    canvas.setContext(redEntity, context);
    const sel = core.settings.selecteditemscolour;
    expect(context.strokeStyle).toBe(`rgb(${sel.r}, ${sel.g}, ${sel.b})`);
    expect(context.lineWidth).toBe(10 * 2 / canvas.getScale());
  });

  test('TEMPORARY state keeps entity colour and doubles lineWidth', () => {
    const context = createMockContext();
    canvas.paintState = canvas.paintStates.TEMPORARY;
    canvas.setContext(redEntity, context);
    expect(context.strokeStyle).toBe('rgb(255, 0, 0)');
    expect(context.lineWidth).toBe(10 * 2 / canvas.getScale());
  });

  test('setContext applies line type dash pattern to context', () => {
    const context = createMockContext();
    let appliedPattern = null;
    context.setLineDash = (pattern) => {
      appliedPattern = pattern;
    };
    const dashedEntity = {
      getDrawColour: () => ({ r: 255, g: 0, b: 0 }),
      getLineType: () => ({ getPattern: () => [5, 5] }),
      lineWidth: 1,
      entityColour: { aci: 1, byLayer: false, byBlock: false },
    };
    canvas.paintState = canvas.paintStates.ENTITIES;
    canvas.setContext(dashedEntity, context);
    expect(appliedPattern).toEqual([5, 5]);
  });
});

describe('Test Canvas.zoom', () => {
  beforeEach(() => {
    canvas.matrix = new Matrix();
  });

  test('zoom increases scale', () => {
    canvas.zoom(2);
    expect(canvas.getScale()).toBeGreaterThan(1);
  });

  test('zoom decreases scale', () => {
    canvas.zoom(0.5);
    expect(canvas.getScale()).toBeLessThan(1);
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

test('Test Canvas.paint resets paintState to undefined after painting', () => {
  core.activate();
  canvas.matrix = new Matrix();
  canvas.flipped = true;
  canvas.paint(createMockContext(), 800, 600);
  expect(canvas.paintState).toBeUndefined();
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
