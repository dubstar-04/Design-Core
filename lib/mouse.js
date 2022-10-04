import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

export class Mouse {
	constructor(core) {

		this.x = 0;
		this.y = 0;
		this.buttonOneDown = false;
		this.buttonTwoDown = false;
		this.buttonThreeDown = false;
		this.core = core;
		this.mouseDownPoint = new Point();
		this.lastClick = 0; //Timer for double click
		this.lastButton = 0; //last button for double click check
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

	pointOnCanvas() {
		return new Point(this.x, this.y);
	}

	pointOnScene() {
		return this.transformToScene(this.pointOnCanvas())
	}

	transformToScene(point) {

		/* Procedure:
			1. Get the size of the scaled canvas
			2. subtract the scaled size from the original size
			3. divide the different from step two by half - this gives the offset to 0,0
			4. subtract the offset from the original point and scale
			5. subtract the pan distance
		*/

		var panTotalValue = this.core.canvas.panTotal.add(this.core.canvas.panDelta);

		//TODO: Convert this to use zoom at mouse
		var xposscale = (this.core.canvas.width - (this.core.canvas.width * this.core.canvas.scale)) / 2
		var yposscale = (this.core.canvas.height - (this.core.canvas.height * this.core.canvas.scale)) / 2

		var xpos = ((point.x - xposscale) / this.core.canvas.scale) - panTotalValue.x
		var ypos = ((point.y - yposscale) / this.core.canvas.scale) - panTotalValue.y

		return new Point(xpos, ypos);

	}

	positionString() {
		// return a string showing the position of the mouse on the canvas

		var str = "X: " + this.pointOnScene().x.toFixed(1) + " Y: " + this.pointOnScene().y.toFixed(1);

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

		this.x = x;
		this.y = y;

		this.core.canvas.mouseMoved();

	}

	mouseDown(button) {
		// button: 0 = left, 1 = wheel, 2 = right;
		this.mouseDownPoint.x = this.x;
		this.mouseDownPoint.y = this.y;

		switch (button) {
			case 0:
				this.buttonOneDown = true
				break;
			case 1:
				this.buttonTwoDown = true
				break;
			case 2:
				this.buttonThreeDown = true
				break;
		}

		if (this.isDoubleClick(button) === false) {
			this.core.canvas.mouseDown(button);
		}

	}

	isDoubleClick(button) {
		// measure time between clicks to check for double clicks in a generic way
		var doubleClickThreshold = 250;
		var thisClick = new Date().getTime();
		var delta = thisClick - this.lastClick
		var isDoubleClick = delta < doubleClickThreshold;
		this.lastClick = thisClick;
		this.lastButton = button;

		if (button === this.lastButton && isDoubleClick) {
			this.doubleClick(button)
			return true
		}

		return false
	}

	mouseUp(button) {
		// button: 0 = left, 1 = wheel, 2 = right;

		switch (button) {
			case 0:
				this.buttonOneDown = false
				break;
			case 1:
				this.buttonTwoDown = false
				break;
			case 2:
				this.buttonThreeDown = false
				break;
		}

		this.core.canvas.mouseUp(button);
	}

	doubleClick(button) {
		console.log("double Clicked button:", button)
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

	setPos(newPoint) {
		this.x = newPoint.x;
		this.y = newPoint.y;
	}
}
