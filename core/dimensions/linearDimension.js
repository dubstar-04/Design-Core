
import { RotatedDimension } from './rotatedDimension.js';

/**
 * Linear Dimension Entity Class
 * This is a proxy command to the Rotated Dimension
 */
export class LinearDimension {
  /**
   * Create an Linear Dimension
   * @param {Array} data
   */
  constructor(data) {
    const dimension = new RotatedDimension(data);
    return dimension;
  }

  /**
   * Register the command
   * @return {Object}
   * command = name of the command
   * shortcut = shortcut for the command
   * type = type to group command in toolbars (omitted if not shown)
   */
  static register() {
    const command = { command: 'LinearDimension', shortcut: 'DIMLIN' };
    return command;
  }
}
