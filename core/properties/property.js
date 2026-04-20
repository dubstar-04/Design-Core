import { Flags } from './flags.js';

/** Property Class */
export class Property {
  /** Create property */
  constructor() { }

  /**
   * Property type constants
   * Used to describe the type of a property value for UI rendering and validation.
   * - NUMBER: numeric value (integer or float)
   * - STRING: text value
   * - BOOLEAN: true/false toggle
   * - LIST: selection from a named set (layer, lineType, hatch pattern, etc.)
   * - COLOUR: RGB colour object
   * - LABEL: read-only display value (no editing)
   */
  static Type = {
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    BOOLEAN: 'BOOLEAN',
    LIST: 'LIST',
    COLOUR: 'COLOUR',
    LABEL: 'LABEL',
  };

  /**
   * Parse the input values and return a value
   * @param {Array} values - list of values
   * @param {any} def - default value
   * @return {any}
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
