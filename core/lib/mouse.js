import {Point} from '../entities/point.js';
import {Utils} from './utils.js';
import {Core} from '../core.js';

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
   * Calculates the angle between the last mouse point and current position
   * @returns
   */
  inputAngle() {
    const previousPoint = this.transformToScene(this.mouseDownCanvasPoint);
    if (previousPoint) {
      const angle = Utils.radians2degrees(previousPoint.angle(this.pointOnScene()));
      return angle;
    }

    return undefined;
  }

  /**
   * Calculates the distance between the last mouse point and current position
   * @returns
   */
  inputLength() {
    if (this.mouseDownCanvasPoint) {
      const lastScenePoint = this.transformToScene(this.mouseDownCanvasPoint);
      const len = lastScenePoint.distance(this.pointOnScene());
      return len;
    }

    return undefined;
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
    const scenePoint = Core.Canvas.matrix.invert().transformPoint(point.x, 0 - point.y + Core.Canvas.height);
    return scenePoint;
  }

  /**
   * Transforms the point location from scene to canvas space
   * @param {point} point
   * @returns
   */
  transformToCanvas(point) {
    const canvasPoint = Core.Canvas.matrix.transformPoint(point.x, point.y);
    canvasPoint.y = 0 - canvasPoint.y + Core.Canvas.height;
    return canvasPoint;
  }

  // TODO: This should be done outside of core in the ui.
  /**
   * Calculates the mouse position and angle string.
   * @returns
   */
  positionString() {
    // return a string showing the position of the mouse on the canvas

    const str = 'X: ' + this.pointOnScene().x.toFixed(1) + ' Y: ' + this.pointOnScene().y.toFixed(1);

    /*
    // add the length to a previous when available
      if (this.inputLength()) {
        str = str + ', Len: ' + Math.round(this.inputLength());
      }

      // add the angle from the previous point when available
      if (this.inputAngle()) {
        str = str + ', Ang: ' + Math.round(this.inputAngle());
      }
      */

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
    this.y = -y + Core.Canvas.height;

    if (Core.Settings.polar) {
      // if polar is enabled - get the closest points
      const polarSnap = Core.Scene.inputManager.snapping.polarSnap(this.transformToScene(this.mouseDownCanvasPoint));
      if (polarSnap) {
        this.setPosFromScenePoint(polarSnap);
      }
    } else if (Core.Settings.ortho) {
      // if ortho is enabled - get the nearest ortho point
      const orthoSnap = Core.Scene.inputManager.snapping.orthoSnap(this.transformToScene(this.mouseDownCanvasPoint));
      if (orthoSnap) {
        this.setPosFromScenePoint(orthoSnap);
      }
    }

    Core.Canvas.mouseMoved();
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
      Core.Canvas.mouseDown(button);
    }
  }

  /**
   * Timer function for recognising double clicks
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

    Core.Canvas.mouseUp(button);
  }

  /**
   * Handles double clicks
   * @param {number} button - 0 = left, 1 = wheel, 2 = right;
   */
  doubleClick(button) {
    Core.Canvas.doubleClick(button);
  }

  /**
   * Handles house wheel input for zoom action
   * @param {number} delta - +/- 1 for zoom in / out
   */
  wheel(delta) {
    Core.Canvas.wheel(delta);
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
