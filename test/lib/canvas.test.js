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

  test('middle mouseDown sets cursor to PAN after delay', () => {
    jest.useFakeTimers();
    canvas.mouseDown(1);
    expect(canvas.cursorState).toBe(canvas.cursorStates.DEFAULT); // not yet
    jest.advanceTimersByTime(250);
    expect(cursorState).toBe(canvas.cursorStates.PAN);
    expect(canvas.cursorState).toBe(canvas.cursorStates.PAN);
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
    canvas.mouseDown(1); // PAN (delayed)
    jest.advanceTimersByTime(250);
    canvas.mouseUp(1); // should restore to SELECTION, not DEFAULT
    expect(cursorState).toBe(canvas.cursorStates.SELECTION);
    expect(canvas.cursorState).toBe(canvas.cursorStates.SELECTION);
    jest.useRealTimers();
  });

  test('wheel restores cursor to SELECTION (not DEFAULT) when selection was active', () => {
    jest.useFakeTimers();
    canvas.setCursorForInputTypes([Input.Type.SELECTIONSET]); // cursor = SELECTION
    canvas.wheel(1); // cursor = ZOOM_IN
    expect(canvas.cursorState).toBe(canvas.cursorStates.ZOOM_IN);
    jest.advanceTimersByTime(300);
    expect(cursorState).toBe(canvas.cursorStates.SELECTION);
    expect(canvas.cursorState).toBe(canvas.cursorStates.SELECTION);
    jest.useRealTimers();
  });

  test('wheel in sets cursor to ZOOM_IN', () => {
    canvas.wheel(1);
    expect(cursorState).toBe(canvas.cursorStates.ZOOM_IN);
    expect(canvas.cursorState).toBe(canvas.cursorStates.ZOOM_IN);
  });

  test('wheel out sets cursor to ZOOM_OUT', () => {
    canvas.wheel(-1);
    expect(cursorState).toBe(canvas.cursorStates.ZOOM_OUT);
    expect(canvas.cursorState).toBe(canvas.cursorStates.ZOOM_OUT);
  });

  test('wheel is ignored while panning (middle button down)', () => {
    jest.useFakeTimers();
    const scaleBefore = canvas.getScale();
    core.mouse.mouseDown(1); // start pan — sets buttonTwoDown
    jest.advanceTimersByTime(250); // let PAN cursor set
    canvas.wheel(1);         // should be blocked
    expect(canvas.getScale()).toBe(scaleBefore);
    expect(canvas.cursorState).toBe(canvas.cursorStates.PAN);
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
    jest.advanceTimersByTime(250); // cursor becomes PAN — callCount = 1
    canvas.mouseDown(1);
    jest.advanceTimersByTime(250); // already PAN — no-op
    expect(callCount).toBe(1);
    jest.useRealTimers();
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
});
