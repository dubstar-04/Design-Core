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
    this.inputManager = new InputManager(core);
  }

  /**
   * Reset the scene
   */
  reset() {
    this.tempItems = [];
    this.selectionManager.reset();
    this.core.canvas.requestPaint();
  }

  /**
   * Get the scene bounding rect
   * @returns scene bounding rect
   */
  boundingRect() {
    let xmin; let xmax; let ymin; let ymax;

    if (this.items.length === 0) {
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      const extremes = this.items[i].boundingBox();
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

  /**
   * Sets the save state following scene changes
   */
  saveRequired() {
    this.saved = false; // Changes have occured. A save may be required.
  }

  /**
   * Create and add new items to the scene
   * @param {string} type - entity type
   * @param {object} data - object of entity parameters
   * @param {number} index - integer of item to replace
   * @returns - index of created item
   */
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

  /**
   * Add items to the scenes tempItems
   * @param {object} item
   */
  addToTempItems(item) {
    this.tempItems.push(item); // Add it to the tempItems Array
  }

  /**
   * Create a new temp item and add to scenes tempItems
   * @param {string} type - entity type
   * @param {object} data - object of entity parameters
   */
  createTempItem(type, data) {
    const helper = this.core.commandManager.createNew(type, data);
    this.addToTempItems(helper);
  }
}
