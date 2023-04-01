import {Strings} from '../strings.js';

/**
This class is designed to iterate though an internal array of DXF groupcode and value pairs
Example DXF Entity Pairs:

 code:  0
 value: LWPOLYLINE  - Entity Type

 code:  8
 value: DEFPOINTS   - Layer name

 code:  6
 value: ByLayer     - Linetype name

 code:  70
 value: 0           - Flags

 code:  10
 value: 100.0       - x position

 code:  20
 value: 100.0       - y position
 */

export class DxfIterator {
  static _instance;

  constructor() {
    this.currentIndex = 0;
    this.lines = [];

    // instantiate as a singleton
    if (DxfIterator._instance === undefined) {
      DxfIterator._instance = this;
    }

    return DxfIterator._instance;
  }

  static get instance() {
    if (this._instance === undefined) {
      this._instance = new this();
    }
    return this._instance;
  }

  /**
   * Load a string object representing the dxf file
   * @param  {String} file
   */
  loadFile(file) {
    // check there is data
    if (file === undefined) {
      throw Error(Strings.Error.INVALIDFILE);
    }

    this.currentIndex = 0;
    this.lines = file.split('\n');

    // check there is at least one pair
    if (this.lines.length < 2) {
      throw Error(Strings.Error.INVALIDFILE);
    }

    // remove empty indices from end of lines array
    while (!this.lines.at(-1)) {
      this.lines.pop();
    }

    // check there is an even number of lines (data is grouped in pairs)
    if (this.lines.length % 2 !== 0) {
      throw Error(Strings.Error.INVALIDFILE);
    }

    // check the file is terminated with EOF
    const lastLine = this.formatted(this.lines.at(-1)).toUpperCase().trim();
    if (lastLine !== 'EOF') {
      throw Error(Strings.Error.INVALIDFILE);
    }
  }

  /**
   * Stop iteration and throw error
   * @param  {String} msg - error message
   */
  dxfError(msg) {
    throw Error(`${msg} - ${Strings.Strings.LINE}: ${this.currentIndex + 1}`);
  }


  /**
   * Format and return the current value
   */
  current() {
    const current = this.formatted(this.lines[this.currentIndex]);
    return current;
  }


  /**
   * Format the input value removing line breaks
   * @param  {String} value
   */
  formatted(value) {
    return value.replace(/(\r\n|\n|\r)/gm, '');
  }

  /**
   * Format and return the next value
   */
  nextValue() {
    if (this.currentIndex < this.lines.length - 1) {
      const next = this.formatted(this.lines[this.currentIndex + 1]);
      return next;
    }
  }

  /**
   * Format and return the previous value
   */
  prevValue() {
    if (this.currentIndex > 0) {
      const previous = this.formatted(this.lines[this.currentIndex - 1]);
      return previous;
    }
  }

  /**
   * Format and return the previous groupcode and value pair
   */
  prevPair() {
    if (this.currentIndex >= 2) {
      this.currentIndex = this.currentIndex - 2;
      return this.currentPair();
    }

    return;
  }

  /**
   * Format and return the current groupcode and value pair
   */
  currentPair() {
    return {code: this.current().trim(), value: this.nextValue()};
  }

  /**
   * Format and return the next groupcode and value pair
   */
  nextPair() {
    if (this.currentIndex < this.lines.length - 2) {
      this.currentIndex = this.currentIndex + 2;
      return this.currentPair();
    }

    return;
  }
}
