import { SelectionManager } from './selectionManager.js';
import { Logging } from './logging.js';
import { Strings } from './strings.js';
import { InputManager } from './inputManager.js';
import { DXFFile } from './dxf/dxfFile.js';
import { BoundingBox } from './boundingBox.js';
import { EntityManager } from './entityManager.js';

import { DesignCore } from '../designCore.js';
import { BlockManager } from '../tables/blockManager.js';
import { AddState, StateManager, UpdateState } from './stateManager.js';

/**
 * Scene Class
 * Holds all entity instances
 */
export class Scene {
  /** Create a scene */

  /** Create a Scene */
  constructor() {
    // initialise the scene variables
    this.saved = false;

    this.selectionManager = new SelectionManager();
    this.inputManager = new InputManager();
    this.blockManager = new BlockManager();

    this.entities = new EntityManager();
    this.tempEntities = new EntityManager();
    this.auxiliaryEntities = new EntityManager();

    this.stateManager = new StateManager();

    // store the version of dxf that is currently being used
    this.dxfVersion = 'R2018';
  }

  /**
   * Sets the save state following scene changes
   */
  saveRequired() {
    this.saved = false; // Changes have occured. A save may be required.
  }


  /** Clear the scene of all items */
  clear() {
    this.entities.clear();
    this.tempEntities.clear();
    this.auxiliaryEntities.clear();
  }

  /** Reset the scene */
  reset() {
    this.tempEntities.clear();
    this.auxiliaryEntities.clear();
    this.selectionManager.reset();
    DesignCore.Canvas.requestPaint();
  }

  /**
   * Get the scene bounding box
   * @return {BoundingBox} scene bounding box
   */
  boundingBox() {
    const boundingBox = BoundingBox.fromEntities(this.entities.getAll());
    return boundingBox;
  }

  /**
   * Create and add new items to the scene
   * @param {string} type - entity type
   * @param {Object} data - object of entity parameters
   * @param {number} index - integer of item to replace
   * @return {number} - index of created item
   */
  addItem(type, data, index) {
    // TODO: validate data is valid for type
    if (!data) {
      throw Error('Input data missing');
    }

    // check type is a valid command
    if (!DesignCore.CommandManager.isCommand(type)) {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND}: ${type}`);
      this.reset();
      return;
    }
    // Create a new item, send it the points array
    const item = DesignCore.CommandManager.createNew(type, data);

    if (typeof index === 'undefined') {
      // add item to the scene
      const stateChange = new AddState(item);
      this.commit([stateChange]);
      index = this.entities.count() - 1;
    } else {
      // replace item at index
      const existingItem = this.entities.get(index);
      const stateChange = new UpdateState(existingItem, data);
      this.commit([stateChange]);
    }

    // return the index of the added item
    return index;
  }

  /**
   * Commit state changes to the scene
   * @param {Array} stateChanges
   */
  commit(stateChanges) {
    this.stateManager.commit(this.entities, stateChanges);
  }

  /**
   * Undo the last action
   */
  undo() {
    if (this.stateManager.canUndo()) {
      this.stateManager.undo();
      DesignCore.Canvas.requestPaint();
    } else {
      DesignCore.Core.notify(Strings.Message.NOUNDO);
    }
  }

  /**
   * Redo the last undone action
   */
  redo() {
    if (this.stateManager.canRedo()) {
      this.stateManager.redo();
      DesignCore.Canvas.requestPaint();
    } else {
      DesignCore.Core.notify(Strings.Message.NOREDO);
    }
  }

  /**
   * Write the scene data to file in the dxf format
   * @param {DXFFile} file
   */
  dxf(file) {
    let width = 0;
    let height = 0;
    let viewCenterX = 0;
    let viewCenterY = 0;
    let ratio = 0;

    const extents = this.boundingBox();

    if (extents) {
      width = extents.xLength;
      height = extents.yLength;
      viewCenterX = extents.xMin + width / 2;
      viewCenterY = extents.yMin + height / 2;
      ratio = width / height;
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
    file.writeGroupCode('41', ratio); // Vport height/width ratio
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
