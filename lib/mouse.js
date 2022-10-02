import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

export class Mouse {
	constructor(core) {

		this.x = 0;
		this.y = 0;
		this.canvasX = 0;
		this.canvasY = 0;
		this.lastX = 1;
		this.lastY = 1;
		this.downX = 0;
		this.downY = 0;
		this.core = core;

	}

	inputAngle() {
		// return the angle between the last input point and the current position
		var previousPoint = this.core.scene.lastSelectedPoint();
		if (previousPoint) {
			var currentPoint = new Point(this.x, this.y);
			var angle = Utils.radians2degrees(previousPoint.angle(currentPoint))
			return angle;
		}

		return undefined;
	}

	inputLength() {
		// return the length between the last input point  and the current position
		var lastSelectedPoint = this.core.scene.lastSelectedPoint()
		if (lastSelectedPoint) {
			var len = Utils.distBetweenPoints(lastSelectedPoint.x, lastSelectedPoint.y, this.x, this.y);
			return len;
		}

		return undefined;
	}

	currentPoint() {
		var point = new Point(this.x, this.y);
		return point;
	}

	positionString() {
		// return a string showing the position of the mouse on the canvas

		var str = "X: " + this.x.toFixed(1) + " Y: " + this.y.toFixed(1);

		// add the length to a previous when available
		if (this.inputLength()) {
			str = str + ", Len: " + Math.round(this.inputLength());
		}

		// add the angle from the previous point when available
		if (this.inputAngle()) {
			str = str + ", Ang: " + Math.round(this.inputAngle());
		}

		return str;
	}

	mouseMoved(x, y) {
		// x: mouse x pos
		// y: mouse y pos
		this.lastX = this.canvasX;
		this.lastY = this.canvasY;
		this.canvasX = x;
		this.canvasY = y;

		this.x = ((this.canvasX - this.core.canvas.panX) / this.core.canvas.scale);
		this.y = ((this.canvasY - this.core.canvas.panY) / this.core.canvas.scale);

		this.core.scene.mouseMoved();

		if (this.core.canvas.panning) {
			this.core.canvas.pan();
		}

		if (this.core.scene.selectingActive) {
			this.core.canvas.selecting();
		}

	}

	mouseDown(button) {
		// button: 1 = left, 2 = wheel, 3 = right;
		this.downX = this.x;
		this.downY = this.y;
		this.core.canvas.mouseDown(button);
	}

	mouseUp(button){
		// button: 1 = left, 2 = wheel, 3 = right;
		this.core.canvas.mouseUp(button);
	}

	doubleClick(button){
		this.core.canvas.doubleClick(button);
	}

	wheel(delta){
		// delta = +/- 1 for zoom in / out
		this.core.canvas.wheel(delta);
	}

	getCanvasX() {
		return this.canvasX;
	}

	getcanvasY() {
		return this.canvasY;
	}

	getLastX() {
		return this.lastX;
	}

	getLastY() {
		return this.lastY;
	}

	getX() {
		return this.x;
	}

	getY() {
		return this.y;
	}

	setX(x) {
		this.x = x;
	}

	setY(y) {
		this.y = y;
	}

	setPos(newPoint) {
		this.x = newPoint.x;
		this.y = newPoint.y;
	}
}
