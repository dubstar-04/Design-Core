import {Snapping} from './snapping.js';
import {SelectionManager} from './selectionManager.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';
import {InputManager} from './inputManager.js';

export class Scene {
  constructor(core) {
    // initialise the scene variables
    this.core = core;
    this.saved = false;

    this.items = []; // Main array that stores all the geometry
    this.tempItems = []; // Temporary Array to store items while input is being gathered

    this.selectionManager = new SelectionManager(core);
    this.snapping = new Snapping();
    this.inputManager = new InputManager(core);
  }

  reset() {
    this.tempItems = [];

    this.selectionManager.reset();
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
    // TODO: validate data is valid for type
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
      index = this.items.length - 1;
    } else {
      // replace item at index
      this.items.splice(index, 1, item);
    }

    // return the index of the added item
    return index;
  }

  addToTempItems(type, data) {
    const helper = this.core.commandManager.createNew(type, data);
    this.tempItems.push(helper); // Add it to the tempItems Array
  }

  // TODO: get rid of this, maybe make a class for items, temp items, selectionItems...
  addHelperGeometry(type, points, colour) {
    const data = {
      points: points,
      colour: colour, // "#00BFFF"
    };

    const helper = this.core.commandManager.createNew(type, data);
    this.tempItems.push(helper); // Add it to the tempItems Array
  }
}
