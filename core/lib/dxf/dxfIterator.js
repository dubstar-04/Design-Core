/**
This class is designed to iterate though an internal array of DXF groupcode and value pairs
Example DXF Entity:
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
  constructor() {
    this.currentIndex = 0;
    this.lines = [];
  }

  /**
   * Load a string object representing the dxf file
   * @param  {String} file
   */
  loadFile(file) {
    this.currentIndex = 0;
    this.lines = file.split('\n');

    // check there is data
    if (!this.lines.length) {
      throw Error('empty dxf data');
    }

    // remove empty indices from end of lines array
    while (!this.lines.at(-1)) {
      this.lines.pop();
    }

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
