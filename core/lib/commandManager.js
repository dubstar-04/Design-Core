import {Line} from '../entities/line.js';
import {Polyline} from '../entities/polyline.js';
import {Circle} from '../entities/circle.js';
import {Arc} from '../entities/arc.js';
import {Rectangle} from '../entities/rectangle.js';
import {FilledRectangle} from '../entities/filledRectangle.js';
import {Ellipse} from '../entities/ellipse.js';
import {Spline} from '../entities/spline.js';
import {Text} from '../entities/text.js';
import {Dimension} from '../entities/dimension.js';
import {Block} from '../entities/block.js';
import {Insert} from '../entities/insert.js';

// import { Point } from "../entities/point.js"

import {Move} from '../tools/move.js';
import {Copy} from '../tools/copy.js';

import {Rotate} from '../tools/rotate.js';
import {Erase} from '../tools/erase.js';

import {Distance} from '../tools/distance.js';
import {Identify} from '../tools/identify.js';

import {Extend} from '../tools/extend.js';
import {Trim} from '../tools/trim.js';


const classes = {
  Line,
  Polyline,
  Circle,
  Arc,
  Rectangle,
  FilledRectangle,
  Ellipse,
  Spline,
  Text,
  Dimension,
  Block,
  Insert,
  Move,
  Copy,
  Rotate,
  Erase,
  Distance,
  Identify,
  Extend,
  Trim,

};

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
   * @param {string} command
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
   * @param {string} type
   * @param {array} data
   * @returns instance of type
   */
  createNew = function(type, data) {
    let newItem;
    if (this.isCommand(type)) {
      newItem = new classes[type](data);
    } else {
      // TODO: return undefined or null and notify of error
      // console.log('commandManager.js - createNew: Command Not Recognised');
    }

    return newItem;
  };

  /**
   * Check if command is valid
   * @param {string} command
   * @returns boolean
   */
  isCommand(command) {
    if (typeof command !== 'undefined') {
      for (let i = 0; i < this.commands.length; i++) {
        if (this.commands[i].command.toUpperCase() === command.toUpperCase()) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Returns the command for a valid shortcut
   * @param {string} shortcut
   * @returns valid type
   */
  getCommandFromShortcut(shortcut) {
    let commandFromShortcut = shortcut;
    if (typeof shortcut !== 'undefined') {
      for (let i = 0; i < this.commands.length; i++) {
        if (typeof this.commands[i].shortcut !== 'undefined') {
          if (this.commands[i].shortcut.toUpperCase() === shortcut.toUpperCase()) {
            commandFromShortcut = this.commands[i].command;
          }
        }
  /**
   * Returns a fuzzy match to the input command
   * @param {string} input
   * @returns {string} fuzzy matched command
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
