/** Handle Class */
export class Handle {
  /** Create Handle */
  constructor() {
    this.counter = 10;
  }

  /** Reset the handle counter */
  reset() {
    this.counter = 10;
  }

  /**
   * Returns the next available handle value
   * R12 handles are optional.
   * R13+ handles are mandatory.
   * The header variable $HANDSEED must be greater than the largest handle value
   * @return {string} handle value
   */
  next() {
    const handle = this.format(this.counter);
    this.counter++;
    return handle;
  }

  /**
   * Get the handseed value
   * The handseed must be greater than the largest handle value
   * @return {string} handseed hex value
   */
  get handseed() {
    return this.format(this.counter);
  }

  /**
   * Set the handseed value
   * @param {string} value - hex string
   */
  set handseed(value) {
    this.counter = parseInt(value, 16);
  }

  /**
   * Format a handle value
   * A handle is an arbitrary but unique hex value as string up to 16 hexadecimal digits (8 bytes).
   * @param {number} value
   * @return {string} handle hex value
   */
  format(value) {
    return value.toString(16).toUpperCase();
  }
}
