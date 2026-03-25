import { DesignCore } from '../designCore.js';

/** Input Class */
export class Input {
  static Type = {
    POINT: 'Point',
    SELECTIONSET: 'SelectionSet',
    SINGLESELECTION: 'SingleSelection',
    NUMBER: 'Number',
    STRING: 'String',
    DYNAMIC: 'Dynamic', // convert numerical input to point data
    MOUSESTATECHANGE: 'MouseStateChange', // special type to handle mouse state input - returns point on scene when mouse events occur
  };

  /**
   * Return the Input.Type for value
   * @param {any} value
   * @return {Object}
   */
  static getType(value) {
    if (value === undefined) {
      return undefined;
    }

    const po = DesignCore.Scene.inputManager.promptOption;
    if (po && po.types.includes(Input.Type.DYNAMIC)) {
      // if dynamic input is accepted and value is a number
      if (!isNaN(value)) {
        return Input.Type.DYNAMIC;
      }
    }

    return value.constructor.name;
  }
}
