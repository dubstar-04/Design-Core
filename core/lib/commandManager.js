import {Line} from '../entities/line.js';
import {Polyline} from '../entities/polyline.js';
import {Lwpolyline} from '../entities/lwpolyline.js';
import {Circle} from '../entities/circle.js';
import {Arc} from '../entities/arc.js';
import {Rectangle} from '../entities/rectangle.js';
// import {Ellipse} from '../entities/ellipse.js';
// import {Spline} from '../entities/spline.js';
import {Text} from '../entities/text.js';
// import {Dimension} from '../entities/dimension.js';
// import {AlignedDimension} from '../entities/alignedDimension.js';
// import {AngularDimension} from '../entities/angularDimension.js';
// import {DiametricDimension} from '../entities/diametricDimension.js';
// import {RadialDimension} from '../entities/radialDimension.js';
// import {BaseDimension} from '../entities/basedimension.js';
import {Block} from '../tables/block.js';
import {Insert} from '../entities/insert.js';
import {Hatch} from '../entities/hatch.js';

// import { Point } from "../entities/point.js"

import {Move} from '../tools/move.js';
import {Copy} from '../tools/copy.js';
import {Rotate} from '../tools/rotate.js';
import {Erase} from '../tools/erase.js';
import {Explode} from '../tools/explode.js';
import {Distance} from '../tools/distance.js';
import {Identify} from '../tools/identify.js';
import {Extend} from '../tools/extend.js';
import {Trim} from '../tools/trim.js';
import {Purge} from '../tools/purge.js';

import {Utils} from './utils.js';
import {Strings} from './strings.js';
import {Logging} from './logging.js';

import {DesignCore} from '../designCore.js';

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
  // Dimension,
  // AngularDimension,
  // AlignedDimension,
  // DiametricDimension,
  // RadialDimension,
  Block,
  Insert,
  Hatch,
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

};

/**
 * Command Manager Class
 * Registers a list of available commands
 * Creates new commands
 */
export class CommandManager {
  /**
   * CommandManager constructor
   */
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
   * @param {String} command
   */
  registerCommand(command) {
    this.commands.push(command);
  };

  /**
   * Return a list of available commands
   *  @returns array of commands
   */
  getCommands() {
    return this.commands;
  }

  /**
   * Create a new instance of type using data
   * @param {String} type
   * @param {Array} data
   * @returns instance of type
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
   * @param {String} input
   * @returns boolean
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

    // no matching command found
    // get a fuzzy match and notify
    const command = this.getFuzzyMatch(input);
    const shortcut = this.getShortcut(command);
    DesignCore.Core.notify(`${Strings.Message.RECOMMEND} ${command} (${shortcut})`);
    return false;
  }

  /**
   * Check if shortcut is valid
   * @param {String} shortcut
   * @returns boolean
   */
  isShortcut(shortcut) {
    const found = this.commands.some((el) => typeof(el.shortcut) !== 'undefined' && el.shortcut.toUpperCase() === shortcut.toUpperCase());
    return found;
  }

  /**
   * Check if command is valid
   * @param {String} command
   * @returns boolean
   */
  isCommand(command) {
    if (command === undefined || command === null) {
      return false;
    }

    const found = this.commands.some((el) => typeof(el.command) !== 'undefined' && el.command.toUpperCase() === command.toUpperCase());
    return found;
  }


  /**
  * Returns the command for a valid input
  * @param {String} input
  * @returns valid type
  */
  getCommand(input) {
    let command;

    if (this.isCommand(input)) {
      const found = this.commands.find((el) => typeof(el.command) !== 'undefined' && el.command.toUpperCase() === input.toUpperCase());
      command = found.command;
    } else if (this.isShortcut(input)) {
      const found = this.commands.find((el) => typeof(el.shortcut) !== 'undefined' && el.shortcut.toUpperCase() === input.toUpperCase());
      command = found.command;
    }

    if (command === undefined) {
      Logging.instance.warn(`${Strings.Message.UNKNOWNCOMMAND}: ${input}`);
    }

    return command;
  }


  /**
   * Returns the shortcut for a valid command
   * @param {String} command
   * @returns {String} shortcut
   */
  getShortcut(command) {
    let shortcut;

    if (this.isCommand(command)) {
      const found = this.commands.find((el) => typeof(el.command) !== 'undefined' && el.command.toUpperCase() === command.toUpperCase());
      shortcut = found.shortcut;
    }

    return shortcut;
  }


  /**
   * Returns a fuzzy match to the input command
   * @param {String} input
   * @returns {String} fuzzy matched command
   */
  getFuzzyMatch(input) {
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
