import { Line } from '../entities/line.js';
import { Polyline } from '../entities/polyline.js';
import { Lwpolyline } from '../entities/lwpolyline.js';
import { Circle } from '../entities/circle.js';
import { Arc } from '../entities/arc.js';
import { Rectangle } from '../entities/rectangle.js';
// import {Ellipse} from '../entities/ellipse.js';
// import {Spline} from '../entities/spline.js';
import { Text } from '../entities/text.js';
import { Block } from '../tables/block.js';
import { Insert } from '../entities/insert.js';
import { Hatch } from '../entities/hatch.js';
/*
import { Dimension } from '../dimensions/dimension.js';
import { AlignedDimension } from '../dimensions/alignedDimension.js';
import { AngularDimension } from '../dimensions/angularDimension.js';
import { LinearDimension } from '../dimensions/linearDimension.js';
import { DiametricDimension } from '../dimensions/diametricDimension.js';
import { RadialDimension } from '../dimensions/radialDimension.js';
import { RotatedDimension } from '../dimensions/rotatedDimension.js';
*/

// import { Point } from "../entities/point.js"

import { MatchProp } from '../tools/matchProp.js';
import { Move } from '../tools/move.js';
import { Copy } from '../tools/copy.js';
import { Rotate } from '../tools/rotate.js';
import { Erase } from '../tools/erase.js';
import { Explode } from '../tools/explode.js';
import { Distance } from '../tools/distance.js';
import { Identify } from '../tools/identify.js';
import { Extend } from '../tools/extend.js';
import { Trim } from '../tools/trim.js';
import { Purge } from '../tools/purge.js';
import { Pan } from '../tools/pan.js';
import { Zoom } from '../tools/zoom.js';

// Clipboard tools
import { Copybase } from '../tools/copybase.js';
import { Copyclip } from '../tools/copyclip.js';
import { Pasteclip } from '../tools/pasteclip.js';

import { Utils } from './utils.js';
import { Strings } from './strings.js';
import { Logging } from './logging.js';

import { DesignCore } from '../designCore.js';


const classes = {
  Line,
  Polyline,
  Lwpolyline,
  Circle,
  Arc,
  Rectangle,
  // Ellipse,
  // Spline,
  Text,
  /*
  Dimension,
  AngularDimension,
  AlignedDimension,
  DiametricDimension,
  LinearDimension,
  RadialDimension,
  RotatedDimension,
  */
  Block,
  Insert,
  Hatch,
  MatchProp,
  Move,
  Copy,
  Rotate,
  Erase,
  Explode,
  Distance,
  Identify,
  Extend,
  Trim,
  Purge,

  Zoom,
  Pan,

  Copybase,
  Copyclip,
  Pasteclip,

};

/**
 * Command Manager Class
 * Registers a list of available commands
 * Creates new commands
 */
export class CommandManager {
  /** Create CommandManager */
  constructor() {
    // store a list of the available commands
    this.commands = [];

    for (const index in classes) {
      if (typeof classes[index].register === 'function') {
        // call static register method from each class
        this.registerCommand(classes[index].register());
      }
    }
  }

  /**
   * Register each of the available commands
   * @param {string} command
   */
  registerCommand(command) {
    this.commands.push(command);
  };

  /**
   * Return a list of available commands
   *  @return {Array} array of commands
   */
  getCommands() {
    return this.commands;
  }

  /**
   * Create a new instance of type using data
   * @param {string} type
   * @param {Array} data
   * @return {Object} instance of type
   */
  createNew(type, data) {
    let newItem;
    if (this.isCommand(type)) {
      newItem = new classes[this.getCommand(type)](data);
    } else {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND}: ${type}`);
      return;
    }

    return newItem;
  };

  /**
   * Check if input is valid command or shortcut
   * @param {string} input
   * @return {boolean} boolean
   */
  isCommandOrShortcut(input) {
    if (input === undefined) {
      return false;
    }

    if (this.isCommand(input)) {
      return true;
    }

    if (this.isShortcut(input)) {
      return true;
    }

    // no matching command found, try to get a fuzzy match
    // get a fuzzy match and notify but only if the user is typing a new command (not mid-command)
    if (DesignCore.Scene.inputManager.activeCommand === undefined) {
      const command = this.getFuzzyMatch(input);
      const shortcut = this.getShortcut(command);
      if (command !== undefined) {
        DesignCore.Core.notify(`${Strings.Message.RECOMMEND} ${command} (${shortcut})`);
      }
    }

    // no matching command found
    return false;
  }

  /**
   * Check if shortcut is valid
   * @param {string} shortcut
   * @return {boolean} boolean
   */
  isShortcut(shortcut) {
    if (shortcut === undefined || shortcut === null || typeof shortcut !== 'string') {
      return false;
    }

    const found = this.commands.some((el) => typeof(el.shortcut) !== 'undefined' && el.shortcut.toUpperCase() === shortcut.toUpperCase());
    return found;
  }

  /**
   * Check if command is valid
   * @param {string} command
   * @return {boolean} boolean
   */
  isCommand(command) {
    if (command === undefined || command === null || typeof command !== 'string') {
      return false;
    }

    const found = this.commands.some((el) => typeof (el.command) !== 'undefined' && el.command.toUpperCase() === command.toUpperCase());
    return found;
  }


  /**
  * Returns the command for a valid input
  * @param {string} input
  * @return {string} valid type
  */
  getCommand(input) {
    let command;

    if (this.isCommand(input)) {
      const found = this.commands.find((el) => typeof (el.command) !== 'undefined' && el.command.toUpperCase() === input.toUpperCase());
      command = found.command;
    } else if (this.isShortcut(input)) {
      const found = this.commands.find((el) => typeof (el.shortcut) !== 'undefined' && el.shortcut.toUpperCase() === input.toUpperCase());
      command = found.command;
    }

    if (command === undefined) {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND}: ${input}`);
    }

    return command;
  }


  /**
   * Returns the shortcut for a valid command
   * @param {string} command
   * @return {string} shortcut
   */
  getShortcut(command) {
    let shortcut;

    if (this.isCommand(command)) {
      const found = this.commands.find((el) => typeof (el.command) !== 'undefined' && el.command.toUpperCase() === command.toUpperCase());
      shortcut = found.shortcut;
    }

    return shortcut;
  }


  /**
   * Returns a fuzzy match to the input command
   * @param {string} input
   * @return {string} fuzzy matched command
   */
  getFuzzyMatch(input) {
    if (input === undefined || input === null || typeof input !== 'string') {
      return undefined;
    }

    let score = Infinity;
    let fuzzyMatch;
    for (let i = 0; i < this.commands.length; i++) {
      // convert the comparison command to uppercase and string to the input length
      const commandSubstring = this.commands[i].command.toUpperCase().substring(0, input.length);

      const newScore = Utils.getLevenshteinDistance(input.toUpperCase(), commandSubstring);
      if (newScore < score) {
        score = newScore;
        fuzzyMatch = this.commands[i].command;
      }
    }

    return fuzzyMatch;
  }
}
