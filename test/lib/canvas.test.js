import { Core } from '../../core/core/core.js';
import { Point } from '../../core/entities/point.js';
import { Matrix } from '../../core/lib/matrix.js';

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

  test('ACI 7 is not recoloured in SELECTED state', () => {
    core.settings.canvasbackgroundcolour = { r: 30, g: 30, b: 30 };
    const context = createMockContext();
    canvas.paintState = canvas.paintStates.SELECTED;
    canvas.setContext(aci7MockEntity, context);
    const sel = core.settings.selecteditemscolour;
    expect(context.strokeStyle).toBe(`rgb(${sel.r}, ${sel.g}, ${sel.b})`);
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
