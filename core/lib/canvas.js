import {Matrix} from './matrix.js';
import {Colours} from './colours.js';
import {Point} from '../entities/point.js';

import {DesignCore} from '../designCore.js';

export class Canvas {
  constructor() {
    this.cvs = null;
    this.matrix = new Matrix();

    this.minScaleFactor = 0.05;
    this.maxScaleFactor = 300;

    this.width = 1;
    this.height = 1;

    this.panDelta = new Point();
    this.lastDelta = new Point();
    this.flipped = false;

    this.paintState;

    this.paintStates = {
      ENTITIES: 'ENTITIES',
      TEMPORARY: 'TEMPORARY',
      SELECTED: 'SELECTED',
      AUXILLARY: 'AUXILLARY',
    };

    // function to call external pain command for the ui
    this.externalPaintCallbackFunction;
  }

  getScale() {
    return this.matrix.getScale();
  }

  setExternalPaintCallbackFunction(callback) {
    // set the callback
    this.externalPaintCallbackFunction = callback;
  }

  setCanvasWidget(cnvs) {
    this.cvs = cnvs;
  }

  mouseMoved() {
    if (DesignCore.Mouse.buttonTwoDown) {
      this.pan();
    }

    DesignCore.Scene.inputManager.mouseMoved();
  }

  mouseDown(button) {
    switch (button) {
      case 0: // left button
        break;
      case 1: // middle button
        // TODO: Reenable cursor styles
        // ev.target.style.cursor = "move";
        break;
      case 2: // right button
        break;
    }

    DesignCore.Scene.inputManager.mouseDown(button);
  };

  mouseUp(button) {
    switch (button) {
      case 0: // left buttonbreak;
      case 1: // middle button
        this.lastDelta = new Point();
        this.requestPaint();
        // TODO: Reenable cursor styles
        // ev.target.style.cursor = "crosshair";
        break;
      case 2: // right button
        break;
    }

    DesignCore.Scene.inputManager.mouseUp(button);
  };

  doubleClick(button) {
    switch (button) {
      case 0: // left button
        break;
      case 1: // middle button
        this.zoomExtents();
        break;
      case 2: // right button
        break;
    }
  };

  pan() {
    // pandelta: mouse drag distance in scene scale
    this.panDelta = DesignCore.Mouse.pointOnScene().subtract(DesignCore.Mouse.transformToScene(DesignCore.Mouse.mouseDownCanvasPoint));
    // delta difference between last delta calculation and current mouse position
    const delta = this.panDelta.subtract(this.lastDelta);
    // set the last delta value
    this.lastDelta = this.panDelta;
    // add translation to the matrix object
    this.matrix.translate(delta.x, delta.y);
    this.requestPaint();
  }

  wheel(delta) {
    const scale = Math.pow(1 + Math.abs(delta), delta > 0 ? 1 : -1);
    if (scale < 1 && this.getScale() > this.minScaleFactor || scale > 1 && this.getScale() < this.maxScaleFactor) {
      this.zoom(scale);
    }
  };

  zoom(scale) {
    const zoomPoint = DesignCore.Mouse.pointOnScene();
    this.matrix.scale(scale, scale);
    this.matrix.translate((zoomPoint.x / scale) - zoomPoint.x, (zoomPoint.y / scale) - zoomPoint.y);
    this.requestPaint();
  }

  zoomExtents() {
    const extents = DesignCore.Scene.boundingBox();

    if (extents) {
      // calculate the center of all items
      const selectionCenter = new Point(extents.xMin + (extents.xLength / 2), extents.yMin + (extents.yLength / 2));
      // get the center of the screen transformed to a scene position
      const screenCenter = new Point(this.width / 2, this.height / 2);
      // calculate the translation delta required to center on screen
      const translateDelta = DesignCore.Mouse.transformToScene(screenCenter).subtract(selectionCenter);
      // calculate the scale required to fill the screen
      const targetScale = Math.min((this.width / extents.xLength), (this.height / extents.yLength));
      // calculate the scale delta required to fill 90% of the screen
      const scaleDelta = targetScale / this.getScale() * 0.9;
      // apply scale
      this.matrix.scale(scaleDelta, scaleDelta);
      // translate to counteract the scale
      this.matrix.translate((selectionCenter.x / scaleDelta) - selectionCenter.x, (selectionCenter.y / scaleDelta) - selectionCenter.y);
      // translate to the center of the screen
      this.matrix.translate(translateDelta.x / scaleDelta, translateDelta.y / scaleDelta);
      // request paint to update
      this.requestPaint();
    }
  }

  requestPaint() {
    // paint request is passed to an external paint function
    // This function then calls this.paint(), the canvas paint function
    // its done this way because some ui framework create and destroy the context on each paint
    if (this.externalPaintCallbackFunction) {
      this.externalPaintCallbackFunction();
    }
  }

  paint(context, width, height) {
    // This paint request is called by an external paint function
    // some ui framework create and destroy the context for every paint
    // context is not persistent and is not available outside this function

    // TODO: Should this be set external to the draw function and only called on resize of canvas?
    this.width = width;
    this.height = height;

    // TODO: Need to consider how to change the height when resizing the window
    // maybe something like translate the difference between the new and old height?
    if (this.flipped === false) {
      this.matrix.translate(0, -this.height);
      this.flipped = true;
    }

    // set the tranform for the context
    // this will set all the pan and zoom actions
    try {
      context.setTransform(this.matrix);
    } catch {
    // context.setMatrix(this.matrix)
      context.translate(this.matrix.e, this.matrix.f);
      context.scale(this.matrix.a, this.matrix.d);
    }

    const pos = new Point();
    const origin = DesignCore.Mouse.transformToScene(pos);

    // Paint the scene background
    try {// HTML
      // this.clear()
      context.fillStyle = DesignCore.Settings.canvasbackgroundcolour;
      context.fillRect(origin.x, origin.y, width / this.getScale(), height / this.getScale());
      // context.globalAlpha = this.cvs.alpha
    } catch { // Cairo
      const rgbColour = Colours.rgbToScaledRGB(DesignCore.Settings.canvasbackgroundcolour);
      context.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      const scaled = new Point(width, height);
      const sc = DesignCore.Mouse.transformToScene(scaled);
      context.moveTo(origin.x, origin.y);
      context.lineTo(origin.x, sc.y);
      context.lineTo(sc.x, sc.y);
      context.lineTo(sc.x, origin.y);
      context.lineTo(origin.x, origin.y);
      context.fill();
    }

    this.paintGrid(context, width, height);

    // Paint the primary scene items
    this.paintState = this.paintStates.ENTITIES;
    for (let i = 0; i < DesignCore.Scene.items.length; i++) {
      const layer = DesignCore.LayerManager.getStyleByName(DesignCore.Scene.items[i].layer);

      if (!layer.isVisible) {
        continue;
      }

      this.setContext(DesignCore.Scene.items[i], context);
      DesignCore.Scene.items[i].draw(context, this.getScale());
    }

    // Paint the temporary scene items
    this.paintState = this.paintStates.TEMPORARY;
    for (let j = 0; j < DesignCore.Scene.tempItems.length; j++) {
      this.setContext(DesignCore.Scene.tempItems[j], context);
      DesignCore.Scene.tempItems[j].draw(context, this.getScale());
    }

    // Paint the selected scene items
    this.paintState = this.paintStates.SELECTED;
    for (let k = 0; k < DesignCore.Scene.selectionManager.selectedItems.length; k++) {
      this.setContext(DesignCore.Scene.selectionManager.selectedItems[k], context);
      DesignCore.Scene.selectionManager.selectedItems[k].draw(context, this.getScale());
    }

    // Paint the auxiliary scene items
    // auxiliary items include things like the selection window, snap points etc
    // these items have their own draw routine
    this.paintState = this.paintStates.AUXILLARY;
    for (let l = 0; l < DesignCore.Scene.auxiliaryItems.length; l++) {
      DesignCore.Scene.auxiliaryItems[l].draw(context, this.getScale());
    }

    this.paintState = undefined;
  }

  /**
   * Set the scene context
   * @param {entity} item
   * @param {object} context - scene painting context from ui
   * @param {object} block - insert element for the current block, required for colour ByBlock
   */
  setContext(item, context, block = undefined) {
    let colour = item.getDrawColour();
    const lineType = item.getLineType();
    let lineWidth = item.lineWidth / this.getScale();

    if (this.paintState === this.paintStates.SELECTED) {
      // Set Context for selected items
      colour = DesignCore.Core.settings.selecteditemscolour;
      lineWidth = (item.lineWidth * 2) / this.getScale();
    } else if (this.paintState === this.paintStates.TEMPORARY) {
      // Set context for temp items
      lineWidth = (item.lineWidth * 2) / this.getScale();
    }

    if (block && this.paintState != this.paintStates.SELECTED) {
      // set colour for items with colour byblock
      if (item.entityColour.aci === 0) {
        colour = block.getDrawColour();
      }
    }

    try { // HTML Canvas
      context.strokeStyle = Colours.rgbToString(colour);
      context.fillStyle = Colours.rgbToString(colour);
      context.lineWidth = lineWidth;
      context.setLineDash(lineType.getPattern(this.getScale()));
      context.beginPath();
    } catch { // Cairo
      const rgbColour = Colours.rgbToScaledRGB(colour);
      context.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
      context.setDash(lineType.getPattern(this.getScale()), 1);
      context.setLineWidth(lineWidth);
    }
  }

  paintGrid(context) {
    // TODO: Move grid linewidth to settings?
    let lineWidth = 0.75;

    try { // HTML Canvas
      context.strokeStyle = Colours.rgbToString(DesignCore.Settings.gridcolour);
      context.lineWidth = lineWidth / this.getScale();
      context.beginPath();
    } catch { // Cairo
      context.setLineWidth(lineWidth / this.getScale());
      const rgbColour = Colours.rgbToScaledRGB(DesignCore.Settings.gridcolour);
      context.setSourceRGB(rgbColour.r, rgbColour.g, rgbColour.b);
    }

    const extents = this.getSceneOffset();

    const xgridmin = extents.xmin;
    const xgridmax = extents.xmax;
    const ygridmin = extents.ymin;
    const ygridmax = extents.ymax;

    // Draw major gridlines through origin
    context.moveTo(xgridmin, 0);
    context.lineTo(xgridmax, 0);
    context.moveTo(0, 0);
    context.lineTo(0, ygridmax);
    context.moveTo(0, 0);
    context.lineTo(0, ygridmin);
    context.stroke();

    if (DesignCore.Settings['drawgrid']) {
      // set a feint linewidth for the grid
      lineWidth = lineWidth * 0.25;

      try { // HTML Canvas
        context.lineWidth = lineWidth / this.getScale();
        context.beginPath();
      } catch { // Cairo
        context.setLineWidth(lineWidth / this.getScale());
      }

      // TODO: add setting for grid spacing
      let gridInterval = 100;

      // define the grid spacing based on zoom level
      if (this.getScale() > 50) {
        gridInterval = 1;
      } else if (this.getScale() > 5) {
        gridInterval = 10;
      } else if (this.getScale() < 0.6) {
        gridInterval = 1000;
      } else {
        gridInterval = 100;
      }

      // Draw positive minor X gridlines
      for (let i = 0; i < xgridmax; i = i + gridInterval) {
        context.moveTo(i, ygridmin);
        context.lineTo(i, ygridmax);
      }
      // Draw negative minor X gridlines
      for (let i = 0; i > xgridmin; i = i - gridInterval) {
        context.moveTo(i, ygridmin);
        context.lineTo(i, ygridmax);
      }
      // Draw positive minor Y gridlines
      for (let i = 0; i < ygridmax; i = i + gridInterval) {
        context.moveTo(xgridmin, i);
        context.lineTo(xgridmax, i);
      }
      // Draw negative minor Y gridlines
      for (let i = 0; i > ygridmin; i = i - gridInterval) {
        context.moveTo(xgridmin, i);
        context.lineTo(xgridmax, i);
      }

      context.stroke();
    }
  }

  getSceneOffset() {
    // Calculate the scene offset from the canvas size
    // i.e at 1:1 its the same as the canvas
    const width = this.width / this.getScale();
    const height = this.height / this.getScale();

    const xmin = -this.matrix.e / this.getScale();
    const xmax = xmin + width;
    const ymin = -height + this.matrix.f / this.getScale();
    const ymax = ymin + height;

    return {
      xmin: xmin,
      xmax: xmax,
      ymin: ymin,
      ymax: ymax,
    };
  }
}
