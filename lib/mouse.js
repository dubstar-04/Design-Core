import { Point } from '../entities/point.js'
import { Utils } from './utils.js'

export class Mouse { 
    constructor(designEngine){

	this.x = 0;
	this.y = 0;
	this.canvasX = 0;
	this.canvasY = 0;
	this.lastX = 1;
	this.lastY = 1;
	this.downX = 0;
	this.downY = 0;
	this.designEngine = designEngine;

}

inputAngle(){
	// return the angle between the last input point and the current position
	var previousPoint = this.designEngine.scene.lastSelectedPoint();
	if (previousPoint){
	var currentPoint = new Point(this.x, this.y);
	var angle = Utils.radians2degrees(previousPoint.angle(currentPoint))
	return angle;
	}

	return undefined;
}

inputLength(){
	// return the length between the last input point  and the current position
	var lastSelectedPoint = this.designEngine.scene.lastSelectedPoint()
	if(lastSelectedPoint){
	var len = Utils.distBetweenPoints(lastSelectedPoint.x, lastSelectedPoint.y, this.x, this.y);
	return len;
	}

	return undefined;
}

currentPoint(){
	var point = new Point(this.x, this.y);
	return point;
}

positionString(){
	// return a string showing the position of the mouse on the canvas

	var str = "X: " + this.x.toFixed(1) + " Y: " + this.y.toFixed(1); 
	
	// add the length to a previous when available
	if (this.inputLength()){
		str = str + ", Len: " + Math.round(this.inputLength());
	} 
	
	// add the angle from the previous point when available
	if (this.inputAngle()){
		str = str + ", Ang: " + Math.round(this.inputAngle());
	}

	return str;
}

mouseMoved(event) {

	var rect = cnvs.getBoundingClientRect();
	//console.log(rect.left, rect.top)
	//console.log(rect.bottom, rect.top)
	this.lastX = this.canvasX;
	this.lastY = this.canvasY;
	this.canvasX = event.clientX;
	this.canvasY = -event.clientY;

	this.x = ((this.canvasX - rect.left - this.designEngine.canvas.panX) / this.designEngine.canvas.scale);
	this.y = ((this.canvasY - rect.top - this.designEngine.canvas.panY) / this.designEngine.canvas.scale);

	this.designEngine.scene.mouseMoved(coordinatesLabel, [this.x, this.y])

	if (this.designEngine.canvas.panning) {
		this.designEngine.canvas.pan();
	}

	if (this.designEngine.scene.selectingActive) {
		this.designEngine.canvas.selecting();
	}

}

mouseDown(event){
	this.downX = this.x;
	this.downY = this.y;
	this.designEngine.canvas.mouseDown(event);
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
