import {Logging} from '../logging.js';

/** HandleManager Class */
export class HandleManager {
  /** Create HandleManager */
  constructor() {
    this.counter = 10;
    this.usedHandles = new Set();
  }

  /** Reset the handle counter */
  reset() {
    this.counter = 10;
    this.usedHandles.clear();
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
    this.usedHandles.add(handle);
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
   * Check the given handle value and ensure the counter is above it.
   * Call this when a handle is loaded from a file to keep the counter valid.
   * @param {string} handle - hex string
   */
  checkHandle(handle) {
    const normalised = handle.toUpperCase();
    if (this.usedHandles.has(normalised)) {
      Logging.instance.error(`Duplicate handle: ${normalised}`);
    }

    this.usedHandles.add(normalised);

    const value = parseInt(handle, 16);
    if (value >= this.counter) {
      this.counter = value + 1;
    }
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
