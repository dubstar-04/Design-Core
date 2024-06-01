import {Flags} from './flags.js';

/** Property Class */
export class Property {
  /** Create property */
  constructor() {}

  /**
   * Parse the input values and return a value
   * @param {Array} values - list of values
   * @param {Any} def - default value
   */
  static loadValue(values, def) {
    // return any value in values
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== undefined) {
        // check if the value is a flags object
        return (values[i] instanceof Flags) ? values[i].getFlagValue() : values[i];
      }
    };

    // no valid values, return the default value
    return def;
  }
}
