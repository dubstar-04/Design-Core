import {Point} from '../entities/point.js';
import {Utils} from './utils.js';
import {DesignCore} from '../designCore.js';

export class Mouse {
  /**
   * Mouse Constructor
   */
  constructor() {
    this.x = 0;
    this.y = 0;
    this.buttonOneDown = false;
    this.buttonTwoDown = false;
    this.buttonThreeDown = false;
    this.mouseDownCanvasPoint = new Point();
    this.lastClick = 0; // Timer for double click
    this.lastButton = 0; // last button for double click check
  }

  /**
   * Returns the point on the design canvas
   * @returns
   */
  pointOnCanvas() {
    return new Point(this.x, this.y);
  }

  /**
   * Returns the point on the scene
   * @returns
   */
  pointOnScene() {
    return this.transformToScene(this.pointOnCanvas());
  }

  /**
   * Transforms the point location from canvas to scene space
   * @param {point} point
   * @returns
   */
  transformToScene(point) {
    const scenePoint = DesignCore.Canvas.matrix.invert().transformPoint(point.x, 0 - point.y +DesignCore.Canvas.height);
    return scenePoint;
  }

  /**
   * Transforms the point location from scene to canvas space
   * @param {point} point
   * @returns
   */
  transformToCanvas(point) {
    const canvasPoint = DesignCore.Canvas.matrix.transformPoint(point.x, point.y);
    canvasPoint.y = 0 - canvasPoint.y +DesignCore.Canvas.height;
    return canvasPoint;
  }

  // TODO: This should be done outside of core in the ui.
  /**
   * Calculates the mouse position and angle string.
   * @returns
   */
  positionString() {
    // return a string showing the position of the mouse on the canvas
    const str = `X: ${this.pointOnScene().x.toFixed(1)} Y: ${this.pointOnScene().y.toFixed(1)}`;
    return str;
  }

  /**
   * Sets the mouse position to x and y
   * @param {number} x
   * @param {number} y
   */
  mouseMoved(x, y) {
    // x: mouse x pos
    // y: mouse y pos

    this.x = x;
    // canvas are typically origin top left. CAD is typically origin bottom left.
    // move the origin down to the bottom and invert the y position
    this.y = -y + DesignCore.Canvas.height;

    if (DesignCore.Settings.polar) {
      // if polar is enabled - get the closest points
      const polarSnap = DesignCore.Scene.inputManager.snapping.polarSnap(this.buttonOneDownScenePoint);
      if (polarSnap) {
        this.setPosFromScenePoint(polarSnap);
      }
    } else if (DesignCore.Settings.ortho) {
      // if ortho is enabled - get the nearest ortho point
      const orthoSnap = DesignCore.Scene.inputManager.snapping.orthoSnap(this.buttonOneDownScenePoint);
      if (orthoSnap) {
        this.setPosFromScenePoint(orthoSnap);
      }
    }

    DesignCore.Canvas.mouseMoved();
  }

  /**
   * Handles mouse down
   * @param {number} button - 0 = left, 1 = wheel, 2 = right;
   */
  mouseDown(button) {
    this.mouseDownCanvasPoint = this.pointOnCanvas();

    switch (button) {
      case 0:
        this.buttonOneDown = true;
        break;
      case 1:
        this.buttonTwoDown = true;
        break;
      case 2:
        this.buttonThreeDown = true;
        break;
    }

    if (this.isDoubleClick(button) === false) {
      DesignCore.Canvas.mouseDown(button);
    }
  }

  /**
   * Timer function for recognizing double clicks
   * @param {*} button  - 0 = left, 1 = wheel, 2 = right;
   * @returns
   */
  isDoubleClick(button) {
    // measure time between clicks to check for double clicks in a generic way
    const doubleClickThreshold = 250;
    const thisClick = new Date().getTime();
    const delta = thisClick - this.lastClick;
    const isDoubleClick = delta < doubleClickThreshold;
    this.lastClick = thisClick;
    this.lastButton = button;

    if (button === this.lastButton && isDoubleClick) {
      this.doubleClick(button);
      return true;
    }

    return false;
  }

  /**
   * Handles mouse down
   * @param {number} button - 0 = left, 1 = wheel, 2 = right;
   */
  mouseUp(button) {
    switch (button) {
      case 0:
        this.buttonOneDown = false;
        break;
      case 1:
        this.buttonTwoDown = false;
        break;
      case 2:
        this.buttonThreeDown = false;
        break;
    }

    DesignCore.Canvas.mouseUp(button);
  }

  /**
   * Handles double clicks
   * @param {number} button - 0 = left, 1 = wheel, 2 = right;
   */
  doubleClick(button) {
    DesignCore.Canvas.doubleClick(button);
  }

  /**
   * Handles house wheel input for zoom action
   * @param {number} delta - +/- 1 for zoom in / out
   */
  wheel(delta) {
    DesignCore.Canvas.wheel(delta);
  }

  /**
   * set mouse position from scene coordinates
   * @param {point} point
   */
  setPosFromScenePoint(point) {
    const mousePos = this.transformToCanvas(point);
    this.x = mousePos.x;
    this.y = mousePos.y;
  }
}
