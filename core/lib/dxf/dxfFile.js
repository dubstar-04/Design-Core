export class DXFFile {
  constructor() {
    this.contents = '';
    this.version = DXFFile.Version.R12;
    this.handleCounter = 10;
  }

  /**
   * Static enum of version numbers
   */
  static Version = {
    R2018: 'AC1032',
    R2013: 'AC1027',
    R2010: 'AC1024',
    R2007: 'AC1021',
    R2004: 'AC1018',
    R2000: 'AC1015',
    R12: 'AC1009',
  };

  /**
   * Reset the file
   */
  clearFile() {
    this.contents = '';
    this.handleCounter = 10;
  }

  /**
   * Returns the next available handle value
   * R12 handles are optional.
   * R13+ handles are mandatory.
   * The header variable $HANDSEED must be greater than the largest handle value
   * @returns handle value
   */
  nextHandle() {
    const handle = this.formatHandle(this.handleCounter);
    this.handleCounter++;
    return handle;
  }

  /**
   * Format a handle value
   * A handle is an arbitrary but unique hex value as string up to 16 hexadecimal digits (8 bytes).
   * @param {number} value
   * @returns handle hex value
   */
  formatHandle(value) {
    return value.toString(16).toUpperCase();
  }

  /**
   * Write the group code and value to file
   * @param {String} groupCode
   * @param {String} groupValue
   * @param {String} version - DXFFile.Version
   * @returns
   */
  writeGroupCode(groupCode, groupValue, version=DXFFile.Version.R12) {
    // return if the groupcode is required for a later version
    if (version > this.version) {
      return;
    }

    this.writeLine(groupCode);
    this.writeLine(groupValue);
  }

  /**
   * Write a new line to the contents
   * @param {String} value
   */
  writeLine(value) {
    this.contents = this.contents.concat(`${value}\n`);
  }
}
