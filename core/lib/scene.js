import { SelectionManager } from './selectionManager.js';
import { Logging } from './logging.js';
import { Strings } from './strings.js';
import { InputManager } from './inputManager.js';
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
    this.tempEntities = new EntityManager(false);
    this.auxiliaryEntities = new EntityManager(false);

    this.stateManager = new StateManager();

    // store the version of dxf that is currently being used
    this.dxfVersion = 'R2018';
  }

  /**
   * Sets the save state following scene changes
   */
  get isModified() {
    return this.stateManager.isModified;
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
}
