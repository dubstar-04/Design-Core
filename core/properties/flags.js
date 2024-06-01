/** Flags Class */
export class Flags {
  /** Create Flags */
  constructor() {
    /* flags - bit-coded values
    | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
      0     0    0    1    0   0   1   1
    */
    this.flags = 0;
  }

  /**
   * Set the flag value
   * @param {Number} flagValue
   */
  setFlagValue(flagValue) {
    const value = Number(flagValue);
    if (isNaN(value) === false) {
      this.flags = value;
    }
  }

  /**
 * Get the flag value
 * @return {Number} flags value
 */
  getFlagValue() {
    return this.flags;
  }

  /**
   * Get the backwards value
   * @param {Number} flagValue
   * @return {Boolean} true if flags contains the flagValue
   */
  hasFlag(flagValue) {
    // check if the flagValue is bitmasked in flags
    // Bitwise AND (&) returns a value where each number has a 1 in the respective bit
    /* Example
      this.flags = 7 (01011)
      flagValue = 3 (0011)
      bits:       16 | 8 | 4 | 2 | 1
      flags:      0  | 0 | 1 | 1 | 1
      flagValue:  0  | 0 | 0 | 1 | 1
      result:     0  | 0 | 0 | 1 | 1
      decimal:  3
    */
    return Boolean((this.flags & flagValue) === flagValue);
  }

  /**
   * Set the flag value
   * @param {Number} flagValue
   */
  addValue(flagValue) {
    this.flags = (this.flags | Number(flagValue));
  }

  /**
 * Remove the flag value
 * @param {Number} flagValue
 */
  removeValue(flagValue) {
    this.flags = (this.flags ^ (this.flags & flagValue));
  }
}
