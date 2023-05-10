import {SelectionManager} from './selectionManager.js';
import {Logging} from './logging.js';
import {Strings} from './strings.js';
import {InputManager} from './inputManager.js';
import {DXFFile} from './dxf/dxfFile.js';

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

  dxf(file) {
    let width = 0;
    let height = 0;
    let viewCenterX = 0;
    let viewCenterY = 0;

    const extents = this.boundingRect();

    if (extents) {
      width = extents.xmax - extents.xmin;
      height = extents.ymax - extents.ymin;
      viewCenterX = extents.xmin + width / 2;
      viewCenterY = extents.ymin + height / 2;
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
