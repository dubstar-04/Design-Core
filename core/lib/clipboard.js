import { BoundingBox } from './boundingBox.js';
import { Point } from '../entities/point.js';

import { DesignCore } from '../designCore.js';
import { Logging } from './logging.js';
import { Strings } from './strings.js';

/** Clipboard Class */
export class Clipboard {
  // store the base point for pasting
  #basePoint = new Point();
  // store the entities being copied
  #Entities = [];
  /** Create Clipboard */
  constructor() {
    this.clipboardCallbackFunction; // set to external callback function
  }

  /**
   * Sets the commandline callback to an external function
   * @param {function} callback
   */
  setClipboardCallbackFunction(callback) {
    // set the call
    this.clipboardCallbackFunction = callback;
  }

  /**
   * Get the current base point
   * @return {Point} - base point
   */
  get BasePoint() {
    return this.#basePoint;
  }

  /**
   * Set a new base point and notify external clipboard
   * @param {Point} point - new base point
   */
  set BasePoint(point) {
    this.#basePoint = point;

    // call the callback function to update external clipboard
    if (this.clipboardCallbackFunction) {
      this.clipboardCallbackFunction();
    }
  }

  /**
   * Get the current entities in the clipboard
   * @return {Array} - entities array
   */
  get Entities() {
    return this.#Entities;
  }

  /**
   * Set new entities to the clipboard and notify external clipboard
   * @param {Array} entities - new entities array
   */
  set Entities(entities) {
    if (!Array.isArray(entities)) {
      return;
    }

    if (entities.length === 0) {
      this.#Entities = [];
      this.#basePoint = new Point();
      return;
    }

    this.#Entities = entities;
    // set basepoint to bottom left of selection bounding box
    const bbox = BoundingBox.fromEntities(entities);
    const basePoint = new Point(bbox.xMin, bbox.yMin);
    this.#basePoint = basePoint;

    // call the callback function to update external clipboard
    if (this.clipboardCallbackFunction) {
      this.clipboardCallbackFunction();
    }
  }

  /**
   * Parse clipboard data from JSON string
   * @param {string} json
   */
  parse(json) {
    // clear clipboard - temp debugging?
    this.#basePoint = new Point();
    this.#Entities = [];
    try {
      const clipBoardData = JSON.parse(json);
      const JsonBasePoint = clipBoardData.basePoint;
      const JsonEntities = clipBoardData.Entities;
      const entities = this.#parseEntities(JsonEntities);

      if (entities.length === 0) {
        throw Error('No valid entities in clipboard data');
      }

      this.#basePoint = new Point(JsonBasePoint.x, JsonBasePoint.y);
      this.#Entities = entities;
    } catch {
      Logging.instance.error(`${this.constructor.name} - ${Strings.Error.INVALIDCLIPBOARD}`);
    }
  }

  /**
   * parse json to entities
   * @param {Array} jsonEntities
   * @return {Array} - array of entities
   */
  #parseEntities(jsonEntities) {
    try {
      const entities = [];
      for (const jsonEntity of jsonEntities) {
        // create point object for points
        if (jsonEntity.type === 'Point') {
          const point = new Point(jsonEntity.x, jsonEntity.y, jsonEntity.bulge, jsonEntity.sequence);
          entities.push(point);
          continue;
        }

        // loop through properties to parse arrays of child objects
        for (const [key, value] of Object.entries(jsonEntity)) {
          if (Array.isArray(value)) {
            const values = this.#parseEntities(jsonEntity[key]);
            jsonEntity[key] = values;
          }
        }

        // check if the type is a valid entity
        if (DesignCore.CommandManager.isCommand(jsonEntity.type)) {
          const entity = DesignCore.CommandManager.createNew(jsonEntity.type, jsonEntity);
          entities.push(entity);
        }
      }
      return entities;
    } catch (err) {
      Logging.instance.error(`${this.constructor.name} - ${Strings.Error.INVALIDCLIPBOARD}: ${err}`);
      return [];
    }
  }

  /**
   * Convert clipboard data to JSON string
   * @return {string} - JSON string of clipboard data
   */
  stringify() {
    const clipboardData = { basePoint: undefined, Entities: undefined };
    const jsonEntities = [];

    // convert each entity to a simple object - this allows non-enumberable properties (like points) to be copied
    for (const ent of this.#Entities) {
      const jsonEntity = this.#simplify(ent);
      jsonEntities.push(jsonEntity);
    }

    clipboardData.basePoint = this.#basePoint;
    clipboardData.Entities = jsonEntities;

    const clipboardJson = JSON.stringify(clipboardData);
    return clipboardJson;
  }

  /**
   * Simplify an object by copying only its own properties
   * @param {Object} original
   * @return {Object} - simplified object
   */
  #simplify(original) {
    return Object.getOwnPropertyNames(original).reduce((simplified, property) => {
      const value = original[property];
      if (Array.isArray(value)) {
        simplified[property] = original[property].map((item) => this.#simplify(item));
        return simplified;
      }
      simplified[property] = original[property];
      return simplified;
    }, {});
  }

  /**
   * Check if clipboard has valid data
   * @return {boolean} - true if valid false if not
   */
  get isValid() {
    if (this.#Entities.length && this.#basePoint instanceof Point) {
      return true;
    }

    return false;
  }
}


