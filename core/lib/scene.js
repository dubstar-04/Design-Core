import {Point} from '../entities/point.js';
import {Snapping} from './snapping.js';
import {SelectionManager} from './selectionManager.js';
import {SelectionWindow} from './selectionWindow.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';
import {InputManager} from './inputManager.js';

export class Scene {
  constructor(core) {
    // initialise the scene variables
    this.core = core;
    this.items = []; // Main array that stores all the geometry
    this.points = []; // Temporary Array to store the input points
    this.tempItems = []; // Temporary Array to store items while input is being gathered
    this.tempPoints = []; // Temporary Array to store points while input is being gathered
    this.selection = new Selection(core);
    this.saved = false;
    this.snapping = new Snapping();
    this.inputManager = new InputManager(core);
  }

  reset() {
    this.points = []; // clear array
    this.tempItems = [];
    this.selection.reset();
    this.core.commandLine.resetPrompt();
    this.snapping.active = false;
    this.core.canvas.requestPaint();
  }

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

  addToScene(type, data, index) {
    if (!data) {
      throw Error('Input data missing');
    }

    // check type is a valid command
    if (!this.core.commandManager.isCommand(type)) {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND}: ${type}`);
      this.reset();
      return;
    }
    // Create a new item, send it the points array
    const item = this.core.commandManager.createNew(type, data);

    if (typeof index === 'undefined') {
      // add to end of array
      this.items.push(item); // add item to the scene
    } else {
      // replace item at index
      this.items.splice(index, 1, item);
    }
  }


  drawSelectionWindow() {
    const selectionPoints = [];
    selectionPoints.push(this.core.mouse.transformToScene(this.core.mouse.mouseDownCanvasPoint));
    selectionPoints.push(this.core.mouse.pointOnScene());

    const data = {
      points: selectionPoints,
    };

    this.tempItems.push(new SelectionWindow(data));
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

  // TODO: Move this to selectionManager
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

  // TODO: Move this somewhere it makes more sense. inputManager? Canvas?
  mouseMoved() {
    this.tempItems = [];
    this.tempPoints = [];

    if (this.core.mouse.buttonOneDown) {
      this.drawSelectionWindow();
    }

    if (this.snapping.active) {
      const snapPoint = this.snapping.getSnapPoint(this);
      if (snapPoint) {
        this.addSnapPoint(snapPoint);
      }
      this.core.canvas.requestPaint();
    }
  }
}
