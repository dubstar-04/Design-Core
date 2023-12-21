import {SelectionManager} from './selectionManager.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';
import {InputManager} from './inputManager.js';
import {DXFFile} from './dxf/dxfFile.js';
import {BoundingBox} from './boundingBox.js';
import {Point} from '../entities/point.js';

import {Core} from '../core.js';

export class Scene {
  constructor() {
    // initialise the scene variables
    this.saved = false;

    this.items = []; // Main array that stores all the geometry
    this.tempItems = []; // Temporary Array to store items while input is being gathered
    this.auxiliaryItems = []; // Auxiliary items such as the selection window and snap points

    this.selectionManager = new SelectionManager();
    this.inputManager = new InputManager();

    // store the version of dxf that is currently being used
    this.dxfVersion = 'R2018';
  }

  /**
   * Reset the scene
   */
  reset() {
    this.tempItems = [];
    this.auxiliaryItems = [];
    this.selectionManager.reset();
    Core.Canvas.requestPaint();
  }

  /**
   * Get the scene bounding box
   * @returns scene bounding box
   */
  boundingBox() {
    let xmin; let xmax; let ymin; let ymax;

    if (this.items.length === 0) {
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      const itemBoundingBox = this.items[i].boundingBox();

      xmin = Math.min(xmin || Infinity, itemBoundingBox.xMin);
      xmax = Math.max(xmax || -Infinity, itemBoundingBox.xMax);
      ymin = Math.min(ymin || Infinity, itemBoundingBox.yMin);
      ymax = Math.max(ymax || -Infinity, itemBoundingBox.yMax);
    }

    // if all values are zero return undefined
    if (xmin === 0 && xmax === 0, ymin === 0, ymax === 0) {
      return;
    }

    return new BoundingBox(new Point(xmin, ymin), new Point(xmax, ymax));
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
  addItem(type, data, index) {
    // TODO: validate data is valid for type
    if (!data) {
      throw Error('Input data missing');
    }

    // check type is a valid command
    if (!Core.CommandManager.isCommand(type)) {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND}: ${type}`);
      this.reset();
      return;
    }
    // Create a new item, send it the points array
    const item = Core.CommandManager.createNew(type, data);

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
   * Find items in scene
   * @param {string} type - entity type
   * @param {string} prop - object of entity parameters
   * @param {any} value - value of the property
   * @returns - index of items
   */
  findItem(type, prop, value) {
    const filteredItems = [];

    this.items.forEach((item, index) => {
      if (item.type.toUpperCase() === type.toUpperCase() && item.hasOwnProperty(prop) && item[prop] === value) {
        filteredItems.push(index);
      }
    });

    return filteredItems;
  }

  /**
   * Get Item
   * @param {number} type - items index
   * @returns - item
   */
  getItem(index) {
    return this.items[index];
  }

  /**
   * Remove Item
   * @param {number} type - items index
   * @returns - success status
   */
  removeItem(index) {
    const count = this.items.length;
    this.items.splice(index, 1);

    if (this.items.length < count) {
      return true;
    }

    return false;
  }

  /**
   * Add items to the scenes tempItems
   * @param {object} item
   */
  addToTempItems(item) {
    this.tempItems.push(item); // Add it to the tempItems Array
  }

  /**
   * Add items to the scenes auxiliary items
   * @param {object} item
   */
  addToAuxiliaryItems(item) {
    this.auxiliaryItems.push(item); // Add it to the auxiliary Array
  }

  /**
   * Create a new temp item and add to scenes tempItems
   * @param {string} type - entity type
   * @param {object} data - object of entity parameters
   */
  createTempItem(type, data) {
    const helper = Core.CommandManager.createNew(type, data);
    this.addToTempItems(helper);
  }

  dxf(file) {
    let width = 0;
    let height = 0;
    let viewCenterX = 0;
    let viewCenterY = 0;

    const extents = this.boundingBox();

    if (extents) {
      width = extents.xLength;
      height = extents.yLength;
      viewCenterX = extents.xMin + width / 2;
      viewCenterY = extents.yMin + height / 2;
    }

    file.writeGroupCode('0', 'TABLE');
    file.writeGroupCode('2', 'VPORT'); // Table Name
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbSymbolTable', DXFFile.Version.R2000);
    file.writeGroupCode('70', '1'); // Number of entries in table
    file.writeGroupCode('0', 'VPORT');
    file.writeGroupCode('5', file.nextHandle(), DXFFile.Version.R2000); // Handle
    file.writeGroupCode('100', 'AcDbSymbolTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('100', 'AcDbViewportTableRecord', DXFFile.Version.R2000);
    file.writeGroupCode('2', '*ACTIVE');
    file.writeGroupCode('70', '0'); // vport flags
    file.writeGroupCode('10', '0.0'); // lower left corner x pos
    file.writeGroupCode('20', '0.0'); // lower left corner y pos
    file.writeGroupCode('11', '1.0'); // upper right corner x pos
    file.writeGroupCode('21', '1.0'); // upper right corner y pos
    file.writeGroupCode('12', viewCenterX); // view centre x pos
    file.writeGroupCode('22', viewCenterY); // view centre y pos
    file.writeGroupCode('13', '0.0'); // snap base point x
    file.writeGroupCode('23', '0.0'); // snap base point y
    file.writeGroupCode('14', '10.0'); // snap spacing x
    file.writeGroupCode('24', '10.0'); // snap spacing y
    file.writeGroupCode('15', '10.0'); // grid spacing x
    file.writeGroupCode('25', '10.0'); // grid spacing y
    file.writeGroupCode('16', '0.0'); // view direction (x) from target point
    file.writeGroupCode('26', '0.0'); // view direction (y) from target point
    file.writeGroupCode('36', '1.0'); // view direction (z) from target point
    file.writeGroupCode('17', '0.0'); // view target point x
    file.writeGroupCode('27', '0.0'); // view target point y
    file.writeGroupCode('37', '0.0'); // view target point z
    file.writeGroupCode('40', height); // VPort Height
    file.writeGroupCode('41', width / height); // Vport height/width ratio
    file.writeGroupCode('42', '50.0'); // Lens Length
    file.writeGroupCode('43', '0.0');// Front Clipping Plane
    file.writeGroupCode('44', '0.0'); // Back Clipping Plane
    file.writeGroupCode('50', '0.0'); // Snap Rotation Angle
    file.writeGroupCode('51', '0.0'); // View Twist Angle
    file.writeGroupCode('71', '0.0'); // Viewmode (System constiable)
    file.writeGroupCode('72', '1000'); // Circle sides
    file.writeGroupCode('73', '1'); // fast zoom setting
    file.writeGroupCode('74', '3');// UCSICON Setting
    file.writeGroupCode('75', '0'); // snap on/off
    file.writeGroupCode('76', '1'); // grid on/off
    file.writeGroupCode('77', '0'); // snap style
    file.writeGroupCode('78', '0'); // snap isopair
    file.writeGroupCode('0', 'ENDTAB');
  }
}
