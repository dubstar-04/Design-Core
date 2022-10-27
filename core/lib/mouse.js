import {Point} from '../entities/point.js';
import {Utils} from './utils.js';

export class Mouse {
  constructor(core) {
    this.x = 0;
    this.y = 0;
    this.buttonOneDown = false;
    this.buttonTwoDown = false;
    this.buttonThreeDown = false;
    this.core = core;
    this.mouseDownCanvasPoint = new Point();
    this.lastClick = 0; // Timer for double click
    this.lastButton = 0; // last button for double click check
  }

  inputAngle() {
    // return the angle between the last input point and the current position
    const previousPoint = this.core.scene.lastSelectedPoint();
    if (previousPoint) {
      const angle = Utils.radians2degrees(previousPoint.angle(this.pointOnScene()));
      return angle;
    }

    return undefined;
  }

  inputLength() {
    // return the length between the last input point  and the current position
    if (this.core.scene.lastSelectedPoint()) {
      const len = Utils.distBetweenPoints(this.core.scene.lastSelectedPoint().x, this.core.scene.lastSelectedPoint().y, this.pointOnScene().x, this.pointOnScene().y);
      return len;
    }

    return undefined;
  }

  pointOnCanvas() {
    return new Point(this.x, this.y);
  }

  pointOnScene() {
    return this.transformToScene(this.pointOnCanvas());
  }

  transformToScene(point) {
    // transform point from canvas coordinates to scene coordinates
    const scenePoint = this.core.canvas.matrix.invert().transformPoint(point.x, 0 - point.y + this.core.canvas.height);
    return scenePoint;
  }

  transformToCanvas(point) {
    // transform point from canvas coordinates to scene coordinates
    const canvasPoint = this.core.canvas.matrix.transformPoint(point.x, point.y);
    canvasPoint.y = 0 - canvasPoint.y + this.core.canvas.height;
    return canvasPoint;
  }

  positionString() {
    // return a string showing the position of the mouse on the canvas

    let str = 'X: ' + this.pointOnScene().x.toFixed(1) + ' Y: ' + this.pointOnScene().y.toFixed(1);

    // add the length to a previous when available
    if (this.inputLength()) {
      str = str + ', Len: ' + Math.round(this.inputLength());
    }

    // add the angle from the previous point when available
    if (this.inputAngle()) {
      str = str + ', Ang: ' + Math.round(this.inputAngle());
    }

    return str;
  }

  mouseMoved(x, y) {
    // x: mouse x pos
    // y: mouse y pos

    this.x = x;
    // canvas are typically origin top left. CAD is typically origin bottom left.
    // move the origin down to the bottom and invert the y position
    this.y = -y + this.core.canvas.height;
    this.core.canvas.mouseMoved();
  }

  mouseDown(button) {
    // button: 0 = left, 1 = wheel, 2 = right;
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
      this.core.canvas.mouseDown(button);
    }
  }

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

  mouseUp(button) {
    // button: 0 = left, 1 = wheel, 2 = right;

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

    this.core.canvas.mouseUp(button);
  }

  doubleClick(button) {
    this.core.canvas.doubleClick(button);
  }

  wheel(delta) {
    // delta = +/- 1 for zoom in / out
    this.core.canvas.wheel(delta);
  }

  setX(x) {
    this.x = x;
  }

  setY(y) {
    this.y = y;
  }

  setPosFromScenePoint(point) {
    // convert point to canvas coordinates and set mouse position
    const mousePos = this.transformToCanvas(point);
    this.x = mousePos.x;
    this.y = mousePos.y;
  }

  setPos(point) {
    // set mouse position to point
    this.x = point.x;
    this.y = point.y;
  }
}
