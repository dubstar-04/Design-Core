import { Utils } from './utils.js'
import { Colours } from './colours.js'
import { Point } from '../entities/point.js';

export class Canvas {
	constructor(core) {

		//this.canvas = document.getElementById('myCanvas');
		this.cvs = null;
		this.core = core;
		//this.context = null;
		this.scale = 1.0;
		//TODO: Move scale factors to settings?
		this.minScaleFactor = 0.05;
		this.maxScaleFactor = 300;

		this.width = 1;
		this.height = 1;
		this.panTotal = new Point();
		this.panDelta = new Point();
		this.zoomPoint = new Point();
		//this.alpha = 1.0;
		this.panning = false;
		this.zooming = false;
		this.flipped = false;
		this.offset = 0;

		//function to call external pain command for the ui
		this.externalPaintCallbackFunction;

	}

	setExternalPaintCallbackFunction(callback) {
		// set the callback
		this.externalPaintCallbackFunction = callback;
	}

	setCanvasWidget(cnvs) {
		this.cvs = cnvs;
	}

	mouseMoved() {

		if (this.core.mouse.buttonTwoDown) {
			this.core.canvas.pan();
		}

		this.core.scene.mouseMoved();
	}

	mouseDown(button) {
		switch (button) {
			case 0: //left button
				break;
			case 1: //middle button
				//TODO: Reenable cursor styles
				//ev.target.style.cursor = "move";
				break;
			case 2: //right button
				break;
		}

		this.core.scene.mouseDown(button);
	};

	mouseUp(button) {
		switch (button) {
			case 0: //left buttonbreak;
			case 1: //middle button
				this.panTotal = this.panTotal.add(this.panDelta);
				this.panDelta = new Point();
				this.requestPaint();
				//TODO: Reenable cursor styles
				//ev.target.style.cursor = "crosshair";
				break;
			case 2: //right button
				break;
		}

		this.core.scene.mouseUp(button);
	};

	doubleClick(button) {
		switch (button) {
			case 0: //left button
				// console.log("left dbl click")
				break;
			case 1: //middle button
				console.log("middle dbl click")
				this.zoomExtents()
				break;
			case 2: //right button
				// console.log("right dbl click")
				break;
		}
	};

	pan() {
		this.panDelta = this.core.mouse.pointOnScene().subtract(this.core.mouse.transformToScene(this.core.mouse.mouseDownPoint));
		this.requestPaint();
	}

	wheel(delta) {
		var scale = Math.pow(1 + Math.abs(delta), delta > 0 ? 1 : -1);
		if (scale < 1 && this.scale > this.minScaleFactor || scale > 1 && this.scale < this.maxScaleFactor) {
			this.zoom(scale);
		}
	};

	zoom(scale) {
		this.zoomPoint = this.core.mouse.pointOnScene();
		this.scale = this.scale * scale;
		this.zooming = true
		this.requestPaint();
	}
	/*
		zoomExtents() {
	
			if (this.core.scene.items.length) {
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
		*/

	flipY(context) {
		this.offset = this.height
		context.scale(1, -1)
		context.translate(0, -this.offset)
		this.panTotal.y -= this.offset
	}


/*
	unflipY() {

		this.panY += this.offset
		this.context.translate(0, this.offset)
		this.context.scale(1, -1)
	}
	*/


	requestPaint() {
		// paint request is passed to an external paint function
		// This function then calls this.paint(), the canvas paint function
		// its done this way because some ui framework create and destroy the context on each paint
		if (this.externalPaintCallbackFunction) {
			this.externalPaintCallbackFunction()
		}
	}

	paint(context, width, height) {
		// This paint request is called by an external paint function
		// some ui framework create and destroy the context for every paint
		// context is not persistent and is not availble outside this function

		//if (this.flipped === false) {
			//this.flipY(context);
			this.flipped = true;
		//}
		
		//TODO: Should this be set external to the draw function and old called on resize of canvas?
		this.width = width;
		this.height = height;

		//TODO: Convert this to use zoom at mouse
		var panTotalValue = this.panTotal.add(this.panDelta);
		var x = this.width / 2
		var y = this.height / 2

		// Zoom at mouse
		context.translate(x, y);
		context.scale(this.scale, this.scale)
		context.translate(-x, -y);

		// Pan
		context.translate(panTotalValue.x, panTotalValue.y);

		var pos = new Point();
		var origin = this.core.mouse.transformToScene(pos);

		try {// HTML
			//this.clear()
			context.fillStyle = this.core.settings.canvasBackgroundColour
			context.fillRect(origin.x, origin.x, width / this.scale, height / this.scale);
			//context.globalAlpha = this.cvs.alpha
		} catch { // Cairo
			var rgbColour = Colours.getRGBColour(this.core.settings.canvasBackgroundColour)
			console.log("Background Colour", this.core.settings.canvasBackgroundColour, rgbColour, this.scale)
			context.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
			context.rectangle(origin.x, origin.x, width / this.scale, height / this.scale);
			context.stroke();
			context.fill();
		}

		//this.paintGrid(context, width, height);

		var numOfEntities = this.core.scene.items.length
		var i = 0,
			j = 0,
			k = 0;

		if (this.panning || this.zooming) {
			//If Pan or Zoom is in progress, only draw a portion of the entities
			if (numOfEntities > 350) {
				i = (numOfEntities - 350)
			}
		}

		var i = 0,
			j = 0,
			k = 0;

		for (i; i < numOfEntities; i++) {
			this.core.scene.items[i].draw(context, this.scale, this.core);
		}

		for (j; j < this.core.scene.tempItems.length; j++) {
			this.core.scene.tempItems[j].draw(context, this.scale, this.core);
		}

		for (k; k < this.core.scene.selectedItems.length; k++) {
			this.core.scene.selectedItems[k].draw(context, this.scale, this.core);
		}
	}

	/*
	clear() {
		this.context.save();
		//this.context.setTransform(1, 0, 0, 1, 0, 0);
		//this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.restore();
	};
	*/

	paintGrid(context) {

		try { // HTML Canvas
			context.strokeStyle = this.core.settings.gridColour;
			context.lineWidth = this.lineWidth / this.scale;
			context.beginPath()
		} catch { // Cairo
			//TODO: Move grid linewidth to settings?
			context.setLineWidth(1.5 / this.scale);
			var rgbColour = Colours.getRGBColour(this.core.settings.gridColour)
			context.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
		}

		var extents = this.core.scene.getSceneExtents();

		//console.log("extents:", extents)

		//TODO: fix getSceneExtents
		var xgridmin = extents.xmin;
		var xgridmax = extents.xmax;
		var ygridmin = extents.ymin;
		var ygridmax = extents.ymax;

		context.moveTo(xgridmin, 0);
		context.lineTo(xgridmax, 0);
		context.moveTo(0, 0);
		context.lineTo(0, ygridmax);
		context.moveTo(0, 0);
		context.lineTo(0, ygridmin);
		context.stroke()

		if (this.core.settings["drawGrid"]) {

			try { // HTML Canvas
				context.lineWidth = 0.25 / this.scale;
				context.beginPath()
			} catch { // Cairo
				//TODO: Move grid linewidth to settings?
				context.setLineWidth(0.25 / this.scale);
			}

			//TODO: add setting for grid spacing
			var gridInterval = 100;

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
				context.moveTo(i, ygridmin);
				context.lineTo(i, ygridmax);
				context.stroke()
			}

			for (var i = 0; i > xgridmin; i = i - gridInterval) {
				context.moveTo(i, ygridmin);
				context.lineTo(i, ygridmax);
			}

			for (var i = 0; i < ygridmax; i = i + gridInterval) {
				context.moveTo(xgridmin, i);
				context.lineTo(xgridmax, i);
			}

			for (var i = 0; i > ygridmin; i = i - gridInterval) {
				context.moveTo(xgridmin, i);
				context.lineTo(xgridmax, i);

			}

			context.stroke()
		}
	}
}
