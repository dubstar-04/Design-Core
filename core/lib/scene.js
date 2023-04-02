import {Point} from '../entities/point.js';
import {Snapping} from './snapping.js';
import {Selecting} from './selecting.js';

export class Scene {
  constructor(core) {
    // initialise the scene variables
    this.core = core;
    this.items = []; // Main array that stores all the geometry
    this.points = []; // Temporary Array to store the input points
    this.tempItems = []; // Temporary Array to store items while input is being gathered
    this.tempPoints = []; // Temporary Array to store points while input is being gathered

    this.selecting = new Selecting(core);

    this.activeCommand = undefined; // Store the name of the active command
    this.inputArray = []; // Temporary Array to store input values.
    this.saved = false;
  }

  reset() {
    // console.log(' scene.js - Reset: In Reset');
    this.points = []; // clear array
    this.minPoints = 0; // reset minimum required points
    this.activeCommand = undefined; // reset the active command
    this.tempItems = [];
    this.selecting.reset();

    this.core.commandLine.resetPrompt();
    this.inputArray = [];
    this.core.canvas.requestPaint();
  }


  /*
    centreVPORT(centre, width, height) {
        // console.log(centre.x, centre.y, width, height)
        if (height !== 0 && width !== 0) {
            var xmin = centre.x - width / 2
            var xmax = centre.x + width / 2
            var ymin = centre.y - height / 2
            var ymax = centre.y + height / 2

            this.core.canvas.centreInScene(xmin, xmax, ymin, ymax)
        }
    }
    */

  getExtents() {
    let xmin; let xmax; let ymin; let ymax;

    if (this.items.length === 0) {
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      const extremes = this.items[i].extremes();
      xmin = (xmin === undefined) ? extremes[0] : (extremes[0] < xmin) ? extremes[0] : xmin;
      xmax = (xmax === undefined) ? extremes[1] : (extremes[1] > xmax) ? extremes[1] : xmax;
      ymin = (ymin === undefined) ? extremes[2] : (extremes[2] < ymin) ? extremes[2] : ymin;
      ymax = (ymax === undefined) ? extremes[3] : (extremes[3] > ymax) ? extremes[3] : ymax;
    }

    // if all values are zero return undefined
    if (xmin === 0 && xmax === 0, ymin === 0, ymax === 0) {
      return;
    }

    return {
      xmin: xmin,
      xmax: xmax,
      ymin: ymin,
      ymax: ymax,
    };
  }


  saveRequired() {
    this.saved = false; // Changes have occured. A save may be required.
  }

  addToScene(type, data, end, index) {
    if (!data) {
      const colour = 'BYLAYER';
      data = {
        points: this.points,
        colour: colour,
        layer: this.core.layerManager.getCLayer(),
        input: this.inputArray,
      };
    }

    let item;
    if (this.activeCommand && this.activeCommand.family === 'Geometry' && !type) {
      // TODO: find a way to create a new type without window
      item = this.core.commandManager.createNew(this.activeCommand.type, data);
    } else {
      // check type is a valid command
      if (!this.core.commandManager.isCommand(type)) {
        console.log('UNSUPPORTED TYPE:', type);
        this.reset();
        return;
      }
      // Create a new item, send it the points array
      item = this.core.commandManager.createNew(type, data);
    }

    if (typeof index === 'undefined') {
      // add to end of array
      this.items.push(item); // add item to the scene
    } else {
      // replace item at index
      this.items.splice(index, 1, item);
    }
    if (end) {
      this.reset();
    }
  }


  drawSelectionWindow() {
    const selectionPoints = [];
    selectionPoints.push(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint));
    selectionPoints.push(this.core.mouse.pointOnScene());

    let selectColour;

    if (this.core.mouse.pointOnScene().y > this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y) {
      // Draw a rectangle on screen
      selectColour = '#FF0000';
    } else if (this.core.mouse.pointOnScene().y < this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint).y) {
      // Draw a rectangle on screen
      selectColour = '#0000FF';
    }

    const data = {
      points: selectionPoints,
      colour: selectColour,
    };

    const tempItem = this.core.commandManager.createNew('FilledRectangle', data); // Create a new item, send it the tempPoints array
    this.tempItems.push(tempItem); // Add it to the this.tempItems Array
    this.core.canvas.requestPaint();
  }

  // reload the selectedItems
  // This is required following changes to selected items
  reloadSelectedItems() {
    this.selectedItems = [];

    for (let i = 0; i < this.selectionSet.length; i++) {
      this.addToSelectedItems(this.selectionSet[i]);
    }

    this.core.canvas.requestPaint();
  }

  addHelperGeometry(type, points, colour) {
    const data = {
      points: points,
      colour: colour, // "#00BFFF"
    };

    const helper = this.core.commandManager.createNew(type, data);
    this.tempItems.push(helper); // Add it to the tempItems Array
  }

  lastSelectedPoint() {
    if (this.points.length !== 0) {
      const previousPoint = new Point();
      previousPoint.x = this.points[this.points.length - 1].x;
      previousPoint.y = this.points[this.points.length - 1].y;
      return previousPoint;
    }

    return undefined;
  }

  addSnapPoint(snapPoint) {
    // Draw a circle to highlight the snap.
    const CentrePoint = new Point(snapPoint.x, snapPoint.y);
    const radiusPoint = new Point(snapPoint.x, snapPoint.y + (5 / this.core.canvas.getScale()));
    const snapCirclePoints = [CentrePoint, radiusPoint];

    const data = {
      points: snapCirclePoints,
      colour: this.core.settings.snapcolour.toString(),
    };
    const item = this.core.commandManager.createNew('Circle', data);
    this.tempItems.push(item);

    // Move the mouse to the closest snap point so if the mouse if clicked the snap point is used.
    this.core.mouse.setPosFromScenePoint(snapPoint);
  }

  mouseDown(button) {
    switch (button) {
      case 0: // left button
        // TODO: Janky way to initiate commands - fix it
        this.core.designEngine.sceneControl('LeftClick', []);
        break;
      case 1: // middle button
        break;
      case 2: // right button
        this.core.designEngine.sceneControl('Enter', []);
        break;
    }
  };

  mouseUp(button) {
    switch (button) {
      case 0: // left button
        this.selecting.selecting(this.core);
        break;
      case 1: // middle button
        break;
      case 2: // right button
        break;
    }
  };

  mouseMoved() {
    this.tempItems = [];
    this.tempPoints = [];

    if (this.core.mouse.buttonOneDown) {
      this.drawSelectionWindow();
    }

    if (this.activeCommand !== undefined && this.activeCommand.family === 'Geometry' || this.selectionAccepted === true && this.activeCommand.movement !== 'Modify') {
      const snapPoint = Snapping.getSnapPoint(this);
      if (snapPoint) {
        this.addSnapPoint(snapPoint);
      }
      this.core.canvas.requestPaint();
    }

    // TODO: sort this mess out. This logic would be best in the design engine or at least tidied.
    // If there is an activecommand and the start point exists, draw the item on screen with every mouse move
    if (this.points.length !== 0) {
      this.tempPoints = this.points.slice(0); // copy points to tempPoints

      if (this.core.settings.polar) {
        // if polar is enabled - get the closest points
        const polarSnap = Snapping.polarSnap(this.lastSelectedPoint(), this.core);
        if (polarSnap) {
          this.core.mouse.setPosFromScenePoint(polarSnap);
        }
      } else if (this.core.settings.ortho) {
        // if ortho is enabled - get the nearest ortho point
        const orthoSnap = Snapping.orthoSnap(this.lastSelectedPoint(), this.core);
        if (orthoSnap) {
          this.core.mouse.setPosFromScenePoint(orthoSnap);
        }
      }

      // add the mouse position to temp points
      this.tempPoints.push(this.core.mouse.pointOnScene());

      if (this.activeCommand !== undefined && this.activeCommand.helper_geometry) {
        // Make a new array of points with the base point and the current mouse position.
        const helperPoints = [];
        helperPoints.push(this.tempPoints[0]);
        helperPoints.push(this.core.mouse.pointOnScene());

        this.addHelperGeometry('Line', helperPoints, this.core.settings.helpergeometrycolour.toString());
      }

      if (this.activeCommand !== undefined && this.activeCommand.showPreview && this.activeCommand.family === 'Geometry' && this.tempPoints.length >= this.activeCommand.minPoints) {
        this.addHelperGeometry(this.activeCommand.type, this.tempPoints, this.core.settings.helpergeometrycolour.toString());
        this.core.canvas.requestPaint(); // TODO: Improve requests to paint as it is called too often.
      }

      if (this.activeCommand !== undefined && this.activeCommand.showPreview && this.activeCommand.family === 'Tools' && this.selectionAccepted) {
        // console.log("preview")
        this.activeCommand.preview(this.core);
        this.core.canvas.requestPaint();
      }
    }
  }
}
