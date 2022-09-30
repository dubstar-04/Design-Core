import { Utils } from './utils.js'

export class Canvas {
	constructor(core) {

		//this.canvas = document.getElementById('myCanvas');
		this.cvs = null;
		this.core = core;
		this.context = null;
		this.scale = 1.0;
		this.minScaleFactor = 0.05;
		this.maxScaleFactor = 300;
		this.panX = 0;
		this.panY = 0;
		this.alpha = 1.0;
		this.panning = false;
		this.zooming = false;
		this.mouseX = 0;
		this.mouseY = 0;
		this.flipped = false;
		this.offset = 0;
		this.lastClick = 0;

		//this.resizeCanvas();
		//this.requestPaint();

	}

	setCanvasWidget(cnvs) {
		this.cvs = cnvs;
		this.context = this.cvs.getContext('2d');
	}

	canvasSize() {
		return {
			width: this.cvs.width,
			height: this.cvs.height
		};
	};

	resizeCanvas() {

		if (this.flipped) {
			this.unflipY()
			this.flipped = false;
			this.scale = 1.0
			this.panX -= this.panX
			this.panY -= this.panY
		}

		this.context.canvas.width = window.innerWidth;
		this.context.canvas.height = window.innerHeight;

		if (this.flipped === false) {
			this.flipY()
			this.flipped = true;
		}

		this.requestPaint();
	};

	mouseDown(ev) {

		var button = ev.button;
		ev.preventDefault();

		switch (button) {
			case 0: //left button
				var data = [];
				core.designEngine.sceneControl("LeftClick", data);
				//this.core.mouse.downX =this.core.mouse.x;
				//this.core.mouse.downY =this.core.mouse.y;
				this.core.scene.selectingActive = true;
				break;
			case 1: //middle button
				this.panning = true;
				ev.target.style.cursor = "move";
				var doubleClickThreshold = 250;
				var thisClick = new Date().getTime();
				var delta = thisClick - this.lastClick
				var isDoubleClick = delta < doubleClickThreshold;
				// console.log(delta, doubleClickThreshold, isDoubleClick)
				this.lastClick = thisClick;
				if (isDoubleClick) {
					// console.log("DoubleClick")
					this.zoomExtents()
				}
				break;
			case 2: //right button
				// console.log("right click")
				//var data = true;
				//core.designEngine.sceneControl("RightClick", data);
				break;
			//default:
			//    default code block
		}
	};

	mouseup(ev) {

		var button = ev.button;
		ev.preventDefault();

		switch (button) {
			case 0: //left button
				// console.log("left click")
				this.core.scene.selectingActive = false;
				this.core.scene.selecting([this.core.mouse.downX, this.core.mouse.downY, this.core.mouse.x, this.core.mouse.y], "");
				break;
			case 1: //middle button
				// console.log("middle click")
				this.panning = false;
				this.requestPaint();
				ev.target.style.cursor = "crosshair";
				break;
			case 2: //right button
				// console.log("right click")
				break;
			//default:
			//    default code block
		}
	};

	dblclick(ev) {

		var button = ev.button;
		ev.preventDefault();

		switch (button) {
			case 0: //left button
				// console.log("left dbl click")
				break;
			case 1: //middle button
				// console.log("middle dbl click")
				break;
			case 2: //right button
				// console.log("right dbl click")
				break;
			//default:
			//    default code block
		}
	};

	pan() {
		if (this.panning) {
			var deltaX = this.core.mouse.canvasX - this.core.mouse.lastX;
			var deltaY = (this.core.mouse.canvasY - this.core.mouse.lastY);
			this.context.translate(deltaX / this.scale, deltaY / this.scale);
			this.panX += deltaX;
			this.panY += deltaY;
			// console.log("panX: ", this.panX, " panY: ", this.panY, "scale", this.scale);
			this.requestPaint();
		}
	}

	selecting() {

		if (this.core.scene.selectingActive) {
			if (Utils.distBetweenPoints(this.core.mouse.downX, this.core.mouse.downY, this.core.mouse.x, this.core.mouse.y) > 5) {

				// console.log("Selecting..........")

				if (this.core.mouse.y > this.core.mouse.downY) {
					//Draw a rectangle on screen
					this.core.scene.selecting([this.core.mouse.downX, this.core.mouse.downY, this.core.mouse.x, this.core.mouse.y], "#FF0000");
				} else if (this.core.mouse.y < this.core.mouse.downY) {
					//Draw a rectangle on screen
					this.core.scene.selecting([this.core.mouse.downX, this.core.mouse.downY, this.core.mouse.x, this.core.mouse.y], "#0000FF");
				}
			}
		}
	}

	/* UNUSED - RIGHTCLICK IS HANDLED ON DESIGN,HTML
	on_right_click(ev) {
	ev.preventDefault();
	};
	 */

	wheel(event) {
		var delta = event.detail ? event.detail / 3 * (-120) : event.wheelDelta //event.detail; //.wheelDelta;
		// console.log(delta);

		var scale = Math.pow(1 + Math.abs(delta / 120) / 2, delta > 0 ? 1 : -1);
		// console.log(scale, " this.scale ", this.scale)
		if (scale < 1 && this.scale > this.minScaleFactor || scale > 1 && this.scale < this.maxScaleFactor) {
			// console.log("Zoom");
			this.zoom(scale);
		} else {
			// console.log("no zoomy")
		}
	};

	zoom(scale) {

		// Convert pinch coordinates to canvas coordinates
		var x = (this.core.mouse.canvasX - this.panX) / this.scale;
		var y = (this.core.mouse.canvasY - this.panY) / this.scale;

		// Zoom at mouse pointer
		this.context.translate(x, y);
		this.context.scale(scale, scale)
		this.scale = this.scale * scale;
		this.context.translate(-(x), -(y));
		this.panX += ((x / scale) - x) * this.scale;
		this.panY += ((y / scale) - y) * this.scale;

		// console.log("Panned: ", this.panX, this.panY)
		// console.log("Scaled Canvas: " + this.scale);
		//this.zooming = true;
		this.requestPaint();
		//redrawTimer.restart();

	}

	zoomExtents() {

		if (this.core.scene.items.length) {
			// console.log("zoom all ")
			var extents = this.getExtents()
			this.centreInScene(extents.xmin, extents.xmax, extents.ymin, extents.ymax)
		}
	}

	getExtents() {
		var xmin,
			xmax,
			ymin,
			ymax;

		for (var i = 0; i < this.core.scene.items.length; i++) {
			var extremes = this.core.scene.items[i].extremes();
			xmin = (xmin === undefined) ? extremes[0] : (extremes[0] < xmin) ? extremes[0] : xmin;
			xmax = (xmax === undefined) ? extremes[1] : (extremes[1] > xmax) ? extremes[1] : xmax;
			ymin = (ymin === undefined) ? extremes[2] : (extremes[2] < ymin) ? extremes[2] : ymin;
			ymax = (ymax === undefined) ? extremes[3] : (extremes[3] > ymax) ? extremes[3] : ymax;
		}
		return {
			xmin: xmin,
			xmax: xmax,
			ymin: ymin,
			ymax: ymax
		};
	}

	centreInScene(xmin, xmax, ymin, ymax) {
		// console.log("DesignCanvas - centreInScene")
		// console.log("Extents: ", xmin, xmax, ymin, ymax)
		var centerX = ((xmin + ((xmax - xmin) / 2))) + this.panX / this.scale;
		var centerY = ((ymin + ((ymax - ymin) / 2))) + (this.panY + this.offset) / this.scale;

		// console.log(this.panX, this.panY, this.scale)

		// console.log("Center: ", centerX, centerY, (this.panY + this.offset) / this.scale)

		var translateX = ((this.cvs.width / 2 / this.scale) - centerX);
		var translateY = ((this.cvs.height / 2 / this.scale) - centerY);

		// console.log("Translate: ", translateX, translateY)

		this.context.translate(translateX, translateY);

		this.panX += (translateX * this.scale);
		this.panY += (translateY * this.scale);

		centerX = ((this.cvs.width / 2) - this.panX) / this.scale;
		centerY = ((this.cvs.height / 2) - (this.panY + this.offset)) / this.scale;

		var targetScale = Math.min((this.cvs.width / (xmax - xmin)), (this.cvs.height / (ymax - ymin)));

		// console.log("Target Scale to fit: " + targetScale + " Current Scale: " + this.scale)

		var requiredScale = (targetScale / this.scale) * 0.80; //scale to 80% of the exteme coordinates

		// console.log("Required Scale to fit: " + requiredScale)

		// Zoom at scene centre
		this.context.translate(centerX, centerY);
		this.context.scale(requiredScale, requiredScale)
		this.scale *= requiredScale;
		// console.log("New Scale: " + this.scale)

		this.context.translate(-centerX, -centerY);

		this.panX += ((centerX / requiredScale) - centerX) * this.scale;
		this.panY += ((centerY / requiredScale) - centerY) * this.scale;

		this.requestPaint();
	}

	flipY() {

		this.offset = this.context.canvas.height
		this.context.scale(1, -1)
		this.context.translate(0, -this.offset)
		this.panY -= this.offset
	}

	unflipY() {

		this.panY += this.offset
		this.context.translate(0, this.offset)
		this.context.scale(1, -1)
	}

	requestPaint() {

		this.clear()
		this.context.fillStyle = settings.canvasBackgroundColour
		//this.context.clearRect(0, 0 + window.innerHeight, window.innerWidth, -window.innerHeight);
		this.context.fillRect(0 - this.panX / this.scale, 0 - this.panY / this.scale, window.innerWidth / this.scale, -window.innerHeight / this.scale);
		//this.context.fillRect(0, 0, this.context.canvas.width/ this.scale, -this.context.canvas.height/ this.scale);
		this.context.globalAlpha = this.cvs.alpha

		//Get the number of entities and decide how many to draw
		var numOfEntities = this.core.scene.items.length
		var i = 0,
			j = 0,
			k = 0;

		if (this.panning || this.zooming) {
			//If Pan or Zoom is in progress, only draw a portion of the entities
			if (numOfEntities > 350) {
				i = (numOfEntities - 350)
			}
		} else {
			//Dont paint the grid if pan or zoom is in progress
			//this.paintGrid();
		}
		this.paintGrid();

		//Draw the scene
		for (i; i < numOfEntities; i++) {
			this.core.scene.items[i].draw(this.context, this.scale, this.core);
		}

		for (j; j < this.core.scene.tempItems.length; j++) {
			this.core.scene.tempItems[j].draw(this.context, this.scale, this.core);
		}

		for (k; k < this.core.scene.selectedItems.length; k++) {
			this.core.scene.selectedItems[k].draw(this.context, this.scale, this.core);
		}
	}

	clear() {
		this.context.save();
		this.context.setTransform(1, 0, 0, 1, 0, 0);
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.restore();

	};

	paintGrid() {

		var extents = this.core.scene.getSceneExtents();

		var xgridmin = extents.xmin;
		var xgridmax = extents.xmax;
		var ygridmin = extents.ymin;
		var ygridmax = extents.ymax;

		// console.log("Xpan: ", this.panX, " Ypan: ", this.panY, " Scale: ", this.scale)

		this.context.strokeStyle = settings.gridColour;

		this.context.lineWidth = 1.5 / this.scale;
		this.context.beginPath()
		this.context.moveTo(xgridmin, 0);
		this.context.lineTo(xgridmax, 0);
		this.context.moveTo(0, 0);
		this.context.lineTo(0, ygridmax);
		this.context.moveTo(0, 0);
		this.context.lineTo(0, ygridmin);
		this.context.stroke()

		if (settings["drawGrid"]) {

			this.context.lineWidth = 0.25 / this.scale;

			var gridInterval = 100;

			/*if (this.scale > 300) {
				gridInterval = 0.1;
			} else */
			if (this.scale > 50) {
				gridInterval = 1
			} else if (this.scale > 5) {
				gridInterval = 10
			} else if (this.scale < 0.6) {
				gridInterval = 1000
			} else {
				gridInterval = 100;
			}

			for (var i = 0; i < xgridmax; i = i + gridInterval) {
				this.context.beginPath()
				this.context.moveTo(i, ygridmin);
				this.context.lineTo(i, ygridmax);
				this.context.stroke()

				//Draw scale
				/*
				this.unflipY()
				var datumTextHeight = 25 / this.scale;
				var textOffset = 5 / this.scale;
				this.context.font = datumTextHeight.toString() + "px Arial";
				this.context.strokeText(i,i+textOffset,0+this.cvs.height+datumTextHeight+textOffset);
				this.flipY()
				*/
			}

			for (var i = 0; i > xgridmin; i = i - gridInterval) {
				this.context.beginPath()
				this.context.moveTo(i, ygridmin);
				this.context.lineTo(i, ygridmax);
				this.context.stroke()
			}

			for (var i = 0; i < ygridmax; i = i + gridInterval) {
				this.context.beginPath()
				this.context.moveTo(xgridmin, i);
				this.context.lineTo(xgridmax, i);
				this.context.stroke()
			}

			for (var i = 0; i > ygridmin; i = i - gridInterval) {
				this.context.beginPath()
				this.context.moveTo(xgridmin, i);
				this.context.lineTo(xgridmax, i);
				this.context.stroke()
			}

		}
	}
}
